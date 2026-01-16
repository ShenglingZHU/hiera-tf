"""
Integration tests for hiera-tf Python implementation.
"""

from __future__ import annotations

import pytest

from htf import (
    HierarConstraintCoordinator,
    HTFFramework,
    SignalEMAFastSlowComparison,
    SignalRunLengthReached,
    SimpleHTFCoordinator,
    SingleFieldStatsFeature,
    TimeframeConfig,
    TimeframeView,
    ValueVsRollingPercentile,
)


class TestBasicWorkflow:
    """Test basic end-to-end workflows."""

    def test_simple_timeframe_processing(self):
        """Test simple timeframe with basic features."""
        config = TimeframeConfig(name="test", window_size=5)
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        view = TimeframeView(config=config, feature_module=feature)

        # Process records
        for i in range(10):
            view.on_new_record({"value": i * 10})

        # Verify
        assert view.buffer_size == 10
        assert view.is_warm is True
        assert view.features["val_count"] == 5  # window_size

    def test_signal_generation(self):
        """Test signal generation from features."""
        config = TimeframeConfig(name="test", window_size=5)
        signal = ValueVsRollingPercentile(value_key="value", window_size=10, percentile=50, min_history=3)

        view = TimeframeView(config=config, signal_fn=signal)

        signals = []
        for i in range(20):
            view.on_new_record({"value": i if i < 10 else i * 2})
            signals.append(view.signal)

        # Should have some 1s when values spike above percentile
        assert any(s == 1 for s in signals[10:])

    def test_run_length_detection(self):
        """Test run-length signal detection."""
        config = TimeframeConfig(name="test", window_size=10)
        signal = SignalRunLengthReached(signal_key="base_signal", min_run_length=3)

        def feature_and_signal(window):
            if not window:
                return {}
            last = window[-1]
            features = dict(last)
            features["run_signal"] = signal(features)
            return features

        view = TimeframeView(config=config, feature_fn=feature_and_signal)

        # Pattern: 0, 0, 1, 1, 1, 1, 0
        pattern = [0, 0, 1, 1, 1, 1, 0]

        results = []
        for p in pattern:
            view.on_new_record({"base_signal": p})
            results.append(view.features.get("run_signal", 0))

        # Run of 4 should trigger at position 4 (0-indexed)
        # Steps: 0(0), 1(0), 2(run=1), 3(run=2), 4(run=3, active!), 5(run=4), 6(interrupt)
        assert results[4] == 1  # First activation
        assert results[5] == 1  # Continues


class TestMultiTimeframeCoordination:
    """Test multi-timeframe coordination scenarios."""

    def test_htf_ltf_gating(self):
        """Test HTF gates LTF signals."""
        # HTF: Signal based on EMA comparison
        htf_config = TimeframeConfig(name="htf", window_size=10, role="HTF")
        htf_signal = SignalEMAFastSlowComparison(value_key="value", ema_period_1=3, ema_period_2=7, prefer="fast")
        htf_view = TimeframeView(config=htf_config, signal_fn=htf_signal)

        # LTF: Always produces signal
        ltf_config = TimeframeConfig(name="ltf", window_size=5, role="LTF")
        ltf_view = TimeframeView(config=ltf_config, signal_fn=lambda f: 1)

        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"htf": htf_view, "ltf": ltf_view}, coordinator=coord)

        # Uptrend - HTF should allow
        uptrend = [10, 15, 20, 25, 30, 35, 40]
        for v in uptrend:
            result = framework.on_new_record({"value": v})

        # In uptrend, fast > slow, so HTF allows
        assert result["coordination"]["htf_allow"] is True
        assert result["coordination"]["ltf_gated"]["ltf"] == 1

    def test_hierarchical_coordination(self):
        """Test hierarchical constraint coordination."""
        # Three-level hierarchy
        configs = {
            "high": TimeframeConfig(name="high", window_size=5, role="HTF"),
            "mid": TimeframeConfig(name="mid", window_size=5, role="MTF"),
            "low": TimeframeConfig(name="low", window_size=5, role="LTF"),
        }

        views = {
            "high": TimeframeView(config=configs["high"], signal_fn=lambda f: 1),
            "mid": TimeframeView(config=configs["mid"], signal_fn=lambda f: 0),  # Blocks
            "low": TimeframeView(config=configs["low"], signal_fn=lambda f: 1),
        }

        coord = HierarConstraintCoordinator(order=["high", "mid", "low"])

        framework = HTFFramework(timeframes=views, coordinator=coord)

        result = framework.on_new_record({"value": 10})

        # High passes, mid blocks, low blocked by mid
        assert result["coordination"]["allow_map"]["high"] is True
        assert result["coordination"]["allow_map"]["mid"] is True  # high passes
        assert result["coordination"]["allow_map"]["low"] is False  # mid blocks
        assert result["coordination"]["gated_map"]["low"] == 0


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_empty_data(self):
        """Test handling of empty data."""
        config = TimeframeConfig(name="test", window_size=5)
        view = TimeframeView(config=config)

        assert view.buffer_size == 0
        assert view.is_warm is False
        assert view.features == {}

    def test_single_record(self):
        """Test with single record."""
        config = TimeframeConfig(name="test", window_size=5)
        feature = SingleFieldStatsFeature(field_name="val", prefix="v")
        view = TimeframeView(config=config, feature_module=feature)

        view.on_new_record({"val": 100})

        assert view.features["v_count"] == 1
        assert view.features["v_mean"] == 100

    def test_missing_values(self):
        """Test handling of missing values in records."""
        config = TimeframeConfig(name="test", window_size=5)
        feature = SingleFieldStatsFeature(field_name="val", prefix="v")
        view = TimeframeView(config=config, feature_module=feature)

        view.on_new_record({"val": 10})
        view.on_new_record({"other": 20})  # Missing 'val'
        view.on_new_record({"val": 30})

        assert view.features["v_count"] == 2

    def test_signal_reset(self):
        """Test signal state reset."""
        signal = SignalRunLengthReached(signal_key="sig", min_run_length=3)

        # Build up run
        signal({"sig": 1})
        signal({"sig": 1})
        signal({"sig": 1})

        assert signal.active is True

        # Reset
        signal.reset()

        assert signal.active is False
        assert signal.current_run == 0


class TestDataTypes:
    """Test handling of various data types."""

    def test_integer_values(self):
        """Test with integer values."""
        config = TimeframeConfig(name="test", window_size=5)
        feature = SingleFieldStatsFeature(field_name="val", prefix="v")
        view = TimeframeView(config=config, feature_module=feature)

        for i in range(5):
            view.on_new_record({"val": i + 1})

        assert view.features["v_mean"] == 3.0

    def test_float_values(self):
        """Test with float values."""
        config = TimeframeConfig(name="test", window_size=5)
        feature = SingleFieldStatsFeature(field_name="val", prefix="v")
        view = TimeframeView(config=config, feature_module=feature)

        for i in range(5):
            view.on_new_record({"val": i + 0.5})

        assert view.features["v_mean"] == pytest.approx(2.5)

    def test_mixed_types(self):
        """Test with mixed value types."""
        config = TimeframeConfig(name="test", window_size=10)
        feature = SingleFieldStatsFeature(field_name="val", prefix="v")
        view = TimeframeView(config=config, feature_module=feature)

        view.on_new_record({"val": 10})
        view.on_new_record({"val": "string"})
        view.on_new_record({"val": None})
        view.on_new_record({"val": True})
        view.on_new_record({"val": 20})

        # Only numeric non-boolean values counted
        assert view.features["v_count"] == 2
        assert view.features["v_mean"] == 15.0
