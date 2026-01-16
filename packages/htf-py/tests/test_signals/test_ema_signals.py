"""
Tests for EMA-based signals.
"""

from __future__ import annotations

import pytest

from htf.signals import (
    SignalEMADiffVsHistoryPercentile,
    SignalEMAFastSlowComparison,
)


class TestSignalEMAFastSlowComparison:
    """Tests for SignalEMAFastSlowComparison signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalEMAFastSlowComparison(value_key="val", ema_period_1=5, ema_period_2=10, prefer="fast")
        assert sig.value_key == "val"
        assert sig.ema_period_1 == 5
        assert sig.ema_period_2 == 10
        assert sig.prefer == "fast"

    def test_invalid_ema_period_zero(self):
        """Test EMA period must be > 0."""
        with pytest.raises(ValueError, match="EMA periods must be > 0"):
            SignalEMAFastSlowComparison(value_key="val", ema_period_1=0, ema_period_2=10)

    def test_invalid_ema_period_negative(self):
        """Test EMA period must be > 0."""
        with pytest.raises(ValueError, match="EMA periods must be > 0"):
            SignalEMAFastSlowComparison(value_key="val", ema_period_1=-5, ema_period_2=10)

    def test_equal_ema_periods(self):
        """Test EMA periods must differ."""
        with pytest.raises(ValueError, match="ema_period_1 and ema_period_2 must differ"):
            SignalEMAFastSlowComparison(value_key="val", ema_period_1=10, ema_period_2=10)

    def test_invalid_prefer(self):
        """Test prefer must be 'fast' or 'slow'."""
        with pytest.raises(ValueError, match="prefer must be 'fast' or 'slow'"):
            SignalEMAFastSlowComparison(value_key="val", ema_period_1=5, ema_period_2=10, prefer="invalid")

    def test_prefer_normalization(self):
        """Test prefer is normalized to lowercase."""
        sig = SignalEMAFastSlowComparison(value_key="val", ema_period_1=5, ema_period_2=10, prefer="FAST")
        assert sig.prefer == "fast"

    def test_ema_update_formula(self):
        """Test EMA update formula: alpha = 2/(period+1)."""
        sig = SignalEMAFastSlowComparison(
            value_key="val",
            ema_period_1=4,  # alpha = 2/5 = 0.4
            ema_period_2=9,  # alpha = 2/10 = 0.2
        )

        # First value initializes EMA
        sig({"val": 10})
        assert sig.ema_1 == 10
        assert sig.ema_2 == 10

        # Second value
        sig({"val": 20})
        # ema_1 = 20 * 0.4 + 10 * 0.6 = 8 + 6 = 14
        # ema_2 = 20 * 0.2 + 10 * 0.8 = 4 + 8 = 12
        assert sig.ema_1 == pytest.approx(14.0)
        assert sig.ema_2 == pytest.approx(12.0)

    def test_trigger_prefer_fast(self):
        """Test trigger when prefer='fast' and fast > slow."""
        sig = SignalEMAFastSlowComparison(
            value_key="val",
            ema_period_1=2,  # fast
            ema_period_2=10,  # slow
            prefer="fast",
        )

        # Rising values - fast EMA should lead
        for v in [10, 20, 30, 40, 50]:
            sig({"val": v})

        # Fast should be > slow in uptrend
        fast, slow = sig._get_fast_slow_ema()
        assert fast > slow

        result = sig({"val": 60})
        assert result == 1

    def test_trigger_prefer_slow(self):
        """Test trigger when prefer='slow' and slow > fast."""
        sig = SignalEMAFastSlowComparison(
            value_key="val",
            ema_period_1=2,  # fast
            ema_period_2=10,  # slow
            prefer="slow",
        )

        # Falling values after establishing baseline - slow should be > fast
        for v in [50, 50, 50, 50, 50]:
            sig({"val": v})

        for v in [40, 30, 20, 10]:
            result = sig({"val": v})

        # After falling, slow > fast - verify precondition is met
        fast, slow = sig._get_fast_slow_ema()
        assert slow > fast, f"Test precondition failed: expected slow ({slow}) > fast ({fast}) after falling values"
        # Now verify the signal triggers correctly when slow > fast with prefer='slow'
        assert result == 1

    def test_non_numeric_ignored(self):
        """Test non-numeric values are ignored."""
        sig = SignalEMAFastSlowComparison(value_key="val", ema_period_1=5, ema_period_2=10)

        sig({"val": 10})
        result = sig({"val": "not a number"})

        assert result == 0
        assert sig.ema_1 == 10  # unchanged

    def test_reset(self):
        """Test reset clears EMAs."""
        sig = SignalEMAFastSlowComparison(value_key="val", ema_period_1=5, ema_period_2=10)

        sig({"val": 10})
        sig({"val": 20})

        sig.reset()

        assert sig.ema_1 is None
        assert sig.ema_2 is None

    def test_fast_slow_identification(self):
        """Test fast/slow EMA identification regardless of parameter order."""
        # period_1 < period_2
        sig1 = SignalEMAFastSlowComparison(value_key="val", ema_period_1=5, ema_period_2=10)
        assert sig1.fast_period == 5
        assert sig1.slow_period == 10

        # period_1 > period_2
        sig2 = SignalEMAFastSlowComparison(value_key="val", ema_period_1=10, ema_period_2=5)
        assert sig2.fast_period == 5
        assert sig2.slow_period == 10


class TestSignalEMADiffVsHistoryPercentile:
    """Tests for SignalEMADiffVsHistoryPercentile signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalEMADiffVsHistoryPercentile(
            value_key="val", ema_period_1=5, ema_period_2=10, history_window=100, percentile=90.0, min_history=10
        )
        assert sig.value_key == "val"
        assert sig.ema_period_1 == 5
        assert sig.ema_period_2 == 10
        assert sig.history_window == 100
        assert sig.percentile == 90.0
        assert sig.min_history == 10

    def test_invalid_ema_periods(self):
        """Test EMA periods must be > 0."""
        with pytest.raises(ValueError, match="EMA periods must be > 0"):
            SignalEMADiffVsHistoryPercentile(value_key="val", ema_period_1=0, ema_period_2=10, history_window=100)

    def test_invalid_history_window(self):
        """Test history_window must be > 0."""
        with pytest.raises(ValueError, match="history_window must be > 0"):
            SignalEMADiffVsHistoryPercentile(value_key="val", ema_period_1=5, ema_period_2=10, history_window=0)

    def test_invalid_percentile(self):
        """Test percentile must be between 0 and 100."""
        with pytest.raises(ValueError, match="percentile must be between 0 and 100"):
            SignalEMADiffVsHistoryPercentile(
                value_key="val", ema_period_1=5, ema_period_2=10, history_window=100, percentile=150
            )

    def test_invalid_min_history(self):
        """Test min_history must be >= 1."""
        with pytest.raises(ValueError, match="min_history must be >= 1"):
            SignalEMADiffVsHistoryPercentile(
                value_key="val", ema_period_1=5, ema_period_2=10, history_window=100, min_history=0
            )

    def test_min_history_exceeds_window(self):
        """Test min_history cannot exceed history_window."""
        with pytest.raises(ValueError, match="min_history cannot exceed history_window"):
            SignalEMADiffVsHistoryPercentile(
                value_key="val", ema_period_1=5, ema_period_2=10, history_window=5, min_history=10
            )

    def test_invalid_comparison(self):
        """Test comparison must be 'gt' or 'lt'."""
        with pytest.raises(ValueError, match="comparison must be 'gt' or 'lt'"):
            SignalEMADiffVsHistoryPercentile(
                value_key="val", ema_period_1=5, ema_period_2=10, history_window=100, comparison="eq"
            )

    def test_no_trigger_before_min_history(self):
        """Test no trigger before min_history is met."""
        sig = SignalEMADiffVsHistoryPercentile(
            value_key="val", ema_period_1=2, ema_period_2=5, history_window=100, min_history=10
        )

        # Only 5 values
        for i in range(5):
            result = sig({"val": i * 10})
            assert result == 0

    def test_abs_diff_computed(self):
        """Test absolute difference is computed correctly."""
        sig = SignalEMADiffVsHistoryPercentile(
            value_key="val", ema_period_1=2, ema_period_2=5, history_window=100, min_history=1
        )

        sig({"val": 10})
        sig({"val": 20})

        # abs_diff should be |ema_1 - ema_2|
        assert sig.last_abs_diff is not None
        assert sig.last_abs_diff >= 0

    def test_trigger_gt_comparison(self):
        """Test trigger with gt comparison."""
        sig = SignalEMADiffVsHistoryPercentile(
            value_key="val",
            ema_period_1=2,
            ema_period_2=10,
            history_window=100,
            percentile=50,
            min_history=5,
            comparison="gt",
        )

        # Build history with small differences
        for i in range(10):
            sig({"val": 10 + i * 0.1})

        # Large jump should create large diff
        result = sig({"val": 1000})

        # Should trigger since diff > percentile of history
        # With a jump from ~11 to 1000, the EMA diff will be very large compared to history
        assert result == 1, "Large value jump should trigger gt comparison signal"
        assert sig.last_abs_diff is not None
        assert sig.last_threshold is not None
        assert sig.last_abs_diff > sig.last_threshold, "abs_diff should exceed threshold for trigger"

    def test_trace_recorded(self):
        """Test trace records each step."""
        sig = SignalEMADiffVsHistoryPercentile(
            value_key="val", ema_period_1=2, ema_period_2=5, history_window=100, min_history=1
        )

        sig({"val": 10})
        sig({"val": 20})
        sig({"val": 30})

        assert len(sig.trace) == 3
        assert "ema_1" in sig.trace[0]
        assert "ema_2" in sig.trace[0]
        assert "abs_diff" in sig.trace[0]
        assert "threshold" in sig.trace[0]

    def test_history_window_trimming(self):
        """Test abs_diff_history is trimmed to history_window."""
        sig = SignalEMADiffVsHistoryPercentile(
            value_key="val", ema_period_1=2, ema_period_2=5, history_window=5, min_history=1
        )

        for i in range(20):
            sig({"val": i * 10})

        assert len(sig.abs_diff_history) == 5

    def test_reset(self):
        """Test reset clears all state."""
        sig = SignalEMADiffVsHistoryPercentile(
            value_key="val", ema_period_1=2, ema_period_2=5, history_window=100, min_history=1
        )

        for i in range(10):
            sig({"val": i * 10})

        sig.reset()

        assert sig.ema_1 is None
        assert sig.ema_2 is None
        assert sig.last_abs_diff is None
        assert sig.last_threshold is None
        assert len(sig.abs_diff_history) == 0
        assert len(sig.trace) == 0
