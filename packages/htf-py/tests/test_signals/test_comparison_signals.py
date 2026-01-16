"""
Tests for comparison-based signals.
"""

from __future__ import annotations

import pytest

from htf.signals import (
    SignalValueVsLastSignalRunStatistic,
    SignalValueVsLastTargetForBase,
    SignalValueVsLastTrueReference,
    SignalValueVsPrevious,
)


class TestSignalValueVsLastTrueReference:
    """Tests for SignalValueVsLastTrueReference signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalValueVsLastTrueReference(value_key="val", reference_signal_key="ref", comparison="lt")
        assert sig.value_key == "val"
        assert sig.reference_signal_key == "ref"
        assert sig.comparison == "lt"

    def test_invalid_comparison(self):
        """Test invalid comparison raises ValueError."""
        with pytest.raises(ValueError, match="comparison must be 'lt' or 'gt'"):
            SignalValueVsLastTrueReference(value_key="val", reference_signal_key="ref", comparison="eq")

    def test_comparison_normalization(self):
        """Test comparison is normalized to lowercase."""
        sig = SignalValueVsLastTrueReference(value_key="val", reference_signal_key="ref", comparison="LT")
        assert sig.comparison == "lt"

    def test_no_trigger_before_reference(self):
        """Test no trigger before first reference point."""
        sig = SignalValueVsLastTrueReference(value_key="val", reference_signal_key="ref", comparison="lt")

        # No reference yet
        result = sig({"val": 10, "ref": 0})
        assert result == 0
        assert sig.last_reference_value is None

    def test_reference_updates_anchor(self):
        """Test reference signal updates anchor value."""
        sig = SignalValueVsLastTrueReference(value_key="val", reference_signal_key="ref", comparison="lt")

        # Reference fires
        result = sig({"val": 100, "ref": 1})
        assert result == 0  # No trigger on reference step
        assert sig.last_reference_value == 100

    def test_trigger_lt_comparison(self):
        """Test trigger with lt comparison."""
        sig = SignalValueVsLastTrueReference(value_key="val", reference_signal_key="ref", comparison="lt")

        sig({"val": 100, "ref": 1})  # Set anchor at 100

        result = sig({"val": 50, "ref": 0})  # 50 < 100
        assert result == 1

    def test_no_trigger_lt_when_greater(self):
        """Test no trigger with lt comparison when value >= anchor."""
        sig = SignalValueVsLastTrueReference(value_key="val", reference_signal_key="ref", comparison="lt")

        sig({"val": 100, "ref": 1})

        result = sig({"val": 150, "ref": 0})  # 150 > 100
        assert result == 0

    def test_trigger_gt_comparison(self):
        """Test trigger with gt comparison."""
        sig = SignalValueVsLastTrueReference(value_key="val", reference_signal_key="ref", comparison="gt")

        sig({"val": 100, "ref": 1})

        result = sig({"val": 150, "ref": 0})  # 150 > 100
        assert result == 1

    def test_reset(self):
        """Test reset clears anchor."""
        sig = SignalValueVsLastTrueReference(value_key="val", reference_signal_key="ref")

        sig({"val": 100, "ref": 1})

        sig.reset()

        assert sig.last_reference_value is None


class TestSignalValueVsLastTargetForBase:
    """Tests for SignalValueVsLastTargetForBase signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalValueVsLastTargetForBase(
            value_key="val", base_signal_key="base", target_signal_key="target", comparison="lt"
        )
        assert sig.value_key == "val"
        assert sig.base_signal_key == "base"
        assert sig.target_signal_key == "target"
        assert sig.comparison == "lt"

    def test_invalid_comparison(self):
        """Test invalid comparison raises ValueError."""
        with pytest.raises(ValueError, match="comparison must be 'lt' or 'gt'"):
            SignalValueVsLastTargetForBase(
                value_key="val", base_signal_key="base", target_signal_key="target", comparison="eq"
            )

    def test_target_updates_anchor(self):
        """Test target signal updates anchor value."""
        sig = SignalValueVsLastTargetForBase(value_key="val", base_signal_key="base", target_signal_key="target")

        sig({"val": 100, "base": 0, "target": 1})
        assert sig.last_target_value == 100

    def test_trigger_when_base_active(self):
        """Test trigger when base is active and condition met."""
        sig = SignalValueVsLastTargetForBase(
            value_key="val", base_signal_key="base", target_signal_key="target", comparison="lt"
        )

        sig({"val": 100, "base": 0, "target": 1})  # Set anchor

        result = sig({"val": 50, "base": 1, "target": 0})  # 50 < 100
        assert result == 1

    def test_no_trigger_when_base_inactive(self):
        """Test no trigger when base is inactive."""
        sig = SignalValueVsLastTargetForBase(
            value_key="val", base_signal_key="base", target_signal_key="target", comparison="lt"
        )

        sig({"val": 100, "base": 0, "target": 1})

        result = sig({"val": 50, "base": 0, "target": 0})  # base inactive
        assert result == 0

    def test_both_base_and_target_active(self):
        """Test when both base and target are active."""
        sig = SignalValueVsLastTargetForBase(
            value_key="val", base_signal_key="base", target_signal_key="target", comparison="lt"
        )

        sig({"val": 100, "base": 0, "target": 1})  # Set initial anchor

        # Both active - anchor updates, no signal
        result = sig({"val": 50, "base": 1, "target": 1})
        assert result == 0
        assert sig.last_target_value == 50

    def test_reset(self):
        """Test reset clears anchor."""
        sig = SignalValueVsLastTargetForBase(value_key="val", base_signal_key="base", target_signal_key="target")

        sig({"val": 100, "base": 0, "target": 1})

        sig.reset()

        assert sig.last_target_value is None


class TestSignalValueVsPrevious:
    """Tests for SignalValueVsPrevious signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalValueVsPrevious(value_key="val", comparison="gt")
        assert sig.value_key == "val"
        assert sig.comparison == "gt"

    def test_default_comparison(self):
        """Test default comparison is gt."""
        sig = SignalValueVsPrevious(value_key="val")
        assert sig.comparison == "gt"

    def test_invalid_comparison(self):
        """Test invalid comparison raises ValueError."""
        with pytest.raises(ValueError, match="comparison must be 'gt' or 'lt'"):
            SignalValueVsPrevious(value_key="val", comparison="eq")

    def test_no_trigger_first_step(self):
        """Test no trigger on first step (no previous value)."""
        sig = SignalValueVsPrevious(value_key="val")

        result = sig({"val": 100})
        assert result == 0
        assert sig.previous_value == 100

    def test_trigger_gt(self):
        """Test trigger with gt comparison."""
        sig = SignalValueVsPrevious(value_key="val", comparison="gt")

        sig({"val": 10})
        result = sig({"val": 20})  # 20 > 10

        assert result == 1

    def test_no_trigger_gt_when_less(self):
        """Test no trigger with gt when value <= previous."""
        sig = SignalValueVsPrevious(value_key="val", comparison="gt")

        sig({"val": 20})
        result = sig({"val": 10})  # 10 < 20

        assert result == 0

    def test_trigger_lt(self):
        """Test trigger with lt comparison."""
        sig = SignalValueVsPrevious(value_key="val", comparison="lt")

        sig({"val": 20})
        result = sig({"val": 10})  # 10 < 20

        assert result == 1

    def test_sequence(self):
        """Test with a sequence of values."""
        sig = SignalValueVsPrevious(value_key="val", comparison="gt")

        results = []
        for v in [10, 15, 12, 20, 18]:
            results.append(sig({"val": v}))

        # 10: no prev -> 0
        # 15 > 10 -> 1
        # 12 < 15 -> 0
        # 20 > 12 -> 1
        # 18 < 20 -> 0
        assert results == [0, 1, 0, 1, 0]

    def test_reset(self):
        """Test reset clears previous value."""
        sig = SignalValueVsPrevious(value_key="val")

        sig({"val": 100})

        sig.reset()

        assert sig.previous_value is None


class TestSignalValueVsLastSignalRunStatistic:
    """Tests for SignalValueVsLastSignalRunStatistic signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalValueVsLastSignalRunStatistic(value_key="val", signal_key="sig", statistic="mean", comparison="gt")
        assert sig.value_key == "val"
        assert sig.signal_key == "sig"
        assert sig.statistic == "mean"
        assert sig.comparison == "gt"

    def test_invalid_statistic(self):
        """Test invalid statistic raises ValueError."""
        with pytest.raises(ValueError, match="statistic must be one of"):
            SignalValueVsLastSignalRunStatistic(value_key="val", signal_key="sig", statistic="invalid")

    def test_invalid_comparison(self):
        """Test invalid comparison raises ValueError."""
        with pytest.raises(ValueError, match="comparison must be 'gt' or 'lt'"):
            SignalValueVsLastSignalRunStatistic(value_key="val", signal_key="sig", comparison="eq")

    def test_valid_statistics(self):
        """Test all valid statistic values."""
        for stat in ["mean", "min", "max", "median", "percentile"]:
            sig = SignalValueVsLastSignalRunStatistic(value_key="val", signal_key="sig", statistic=stat)
            assert sig.statistic == stat

    def test_no_trigger_before_completed_run(self):
        """Test no trigger before a run completes."""
        sig = SignalValueVsLastSignalRunStatistic(value_key="val", signal_key="sig", statistic="mean")

        # During run
        result = sig({"val": 10, "sig": 1})
        assert result == 0
        assert sig.last_statistic is None

    def test_statistic_computed_after_run(self):
        """Test statistic is computed when run ends."""
        sig = SignalValueVsLastSignalRunStatistic(value_key="val", signal_key="sig", statistic="mean")

        # Run with values 10, 20, 30
        sig({"val": 10, "sig": 1})
        sig({"val": 20, "sig": 1})
        sig({"val": 30, "sig": 1})

        # End run
        sig({"val": 25, "sig": 0})

        assert sig.last_statistic == 20.0  # mean of 10, 20, 30

    def test_trigger_after_run_completes(self):
        """Test trigger after a run completes."""
        sig = SignalValueVsLastSignalRunStatistic(value_key="val", signal_key="sig", statistic="mean", comparison="gt")

        # First run
        sig({"val": 10, "sig": 1})
        sig({"val": 20, "sig": 1})
        sig({"val": 0, "sig": 0})  # End run, mean=15

        # Now test triggers
        result = sig({"val": 20, "sig": 0})  # 20 > 15
        assert result == 1

        result = sig({"val": 10, "sig": 0})  # 10 < 15
        assert result == 0

    def test_min_statistic(self):
        """Test min statistic."""
        sig = SignalValueVsLastSignalRunStatistic(value_key="val", signal_key="sig", statistic="min")

        sig({"val": 30, "sig": 1})
        sig({"val": 10, "sig": 1})
        sig({"val": 20, "sig": 1})
        sig({"val": 0, "sig": 0})

        assert sig.last_statistic == 10

    def test_max_statistic(self):
        """Test max statistic."""
        sig = SignalValueVsLastSignalRunStatistic(value_key="val", signal_key="sig", statistic="max")

        sig({"val": 30, "sig": 1})
        sig({"val": 10, "sig": 1})
        sig({"val": 20, "sig": 1})
        sig({"val": 0, "sig": 0})

        assert sig.last_statistic == 30

    def test_reset(self):
        """Test reset clears state."""
        sig = SignalValueVsLastSignalRunStatistic(value_key="val", signal_key="sig")

        sig({"val": 10, "sig": 1})
        sig({"val": 0, "sig": 0})

        sig.reset()

        assert len(sig.current_run_values) == 0
        assert sig.in_run is False
        assert sig.last_statistic is None
