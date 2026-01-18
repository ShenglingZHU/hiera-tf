"""
Tests for percentile-based signals.
"""

from __future__ import annotations

import pytest

from htf.signals import (
    ValueVsRollingPercentile,
    ValueVsRollingPercentileWithThreshold,
    compute_percentile,
)


class TestComputePercentile:
    """Tests for compute_percentile helper function."""

    def test_empty_list(self):
        """Test with empty list returns None."""
        assert compute_percentile([], 50) is None

    def test_single_value(self):
        """Test with single value."""
        assert compute_percentile([10], 50) == 10
        assert compute_percentile([10], 0) == 10
        assert compute_percentile([10], 100) == 10

    def test_median_odd_count(self):
        """Test median with odd count."""
        assert compute_percentile([1, 2, 3, 4, 5], 50) == 3

    def test_median_even_count(self):
        """Test median with even count (interpolation)."""
        result = compute_percentile([1, 2, 3, 4], 50)
        assert result == pytest.approx(2.5)

    def test_percentile_0(self):
        """Test 0th percentile returns minimum."""
        assert compute_percentile([5, 1, 9, 3], 0) == 1

    def test_percentile_100(self):
        """Test 100th percentile returns maximum."""
        assert compute_percentile([5, 1, 9, 3], 100) == 9

    def test_percentile_25(self):
        """Test 25th percentile."""
        # Sorted: [1, 2, 3, 4, 5]
        result = compute_percentile([1, 2, 3, 4, 5], 25)
        assert result == pytest.approx(2.0)

    def test_percentile_75(self):
        """Test 75th percentile."""
        # Sorted: [1, 2, 3, 4, 5]
        result = compute_percentile([1, 2, 3, 4, 5], 75)
        assert result == pytest.approx(4.0)

    def test_filters_boolean(self):
        """Test that boolean values are filtered."""
        # True/False should be ignored
        result = compute_percentile([1, True, 3, False, 5], 50)
        assert result == 3

    def test_unsorted_input(self):
        """Test with unsorted input."""
        result = compute_percentile([5, 1, 4, 2, 3], 50)
        assert result == 3


class TestValueVsRollingPercentile:
    """Tests for ValueVsRollingPercentile signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = ValueVsRollingPercentile(value_key="val", window_size=10, percentile=50.0, min_history=3)
        assert sig.value_key == "val"
        assert sig.window_size == 10
        assert sig.percentile == 50.0
        assert sig.min_history == 3
        assert sig.comparison == "gt"

    def test_invalid_comparison(self):
        """Test that invalid comparison raises ValueError."""
        with pytest.raises(ValueError, match="comparison must be 'gt' or 'lt'"):
            ValueVsRollingPercentile(value_key="val", window_size=10, comparison="invalid")

    def test_comparison_normalization(self):
        """Test comparison is normalized to lowercase."""
        sig = ValueVsRollingPercentile(value_key="val", window_size=10, comparison="GT")
        assert sig.comparison == "gt"

        sig2 = ValueVsRollingPercentile(value_key="val", window_size=10, comparison="LT")
        assert sig2.comparison == "lt"

    def test_min_history_not_met(self):
        """Test signal is 0 when history is insufficient."""
        sig = ValueVsRollingPercentile(value_key="val", window_size=10, min_history=5)

        # Push 4 values - not enough history
        for i in range(4):
            result = sig({"val": i})
            assert result == 0

    def test_signal_trigger_gt(self):
        """Test signal triggers on gt comparison."""
        sig = ValueVsRollingPercentile(value_key="val", window_size=10, percentile=50, min_history=3, comparison="gt")

        # Build history: 1, 2, 3
        sig({"val": 1})
        sig({"val": 2})
        sig({"val": 3})

        # Now value 10 should trigger (10 > median of [1,2,3] = 2)
        result = sig({"val": 10})
        assert result == 1

    def test_signal_no_trigger_gt(self):
        """Test signal does not trigger when value <= percentile."""
        sig = ValueVsRollingPercentile(value_key="val", window_size=10, percentile=50, min_history=3, comparison="gt")

        sig({"val": 1})
        sig({"val": 2})
        sig({"val": 3})

        # Value 1 should not trigger (1 <= median of [1,2,3] = 2)
        result = sig({"val": 1})
        assert result == 0

    def test_signal_trigger_lt(self):
        """Test signal triggers on lt comparison."""
        sig = ValueVsRollingPercentile(value_key="val", window_size=10, percentile=50, min_history=3, comparison="lt")

        sig({"val": 10})
        sig({"val": 20})
        sig({"val": 30})

        # Value 5 should trigger (5 < median of [10,20,30] = 20)
        result = sig({"val": 5})
        assert result == 1

    def test_window_size_trimming(self):
        """Test that history is trimmed to window_size."""
        sig = ValueVsRollingPercentile(value_key="val", window_size=3, min_history=1)

        # Push more than window_size values
        for i in range(10):
            sig({"val": i})

        assert len(sig.history) == 3

    def test_include_current_false(self):
        """Test include_current=False excludes current value."""
        sig = ValueVsRollingPercentile(
            value_key="val", window_size=10, percentile=50, min_history=3, include_current=False
        )

        sig({"val": 1})
        sig({"val": 2})
        sig({"val": 3})

        # After pushing 3 values, history should be [1, 2, 3]
        # Push a 4th value and check threshold is based on previous history only
        result = sig({"val": 100})

        # Percentile computed from [1,2,3] only, not including current value 100
        # 50th percentile of [1,2,3] is 2
        assert sig.last_threshold is not None
        assert sig.last_threshold == 2, f"Expected threshold 2 (median of [1,2,3]), got {sig.last_threshold}"
        # Value 100 > threshold 2, so should trigger
        assert result == 1

    def test_include_current_true(self):
        """Test include_current=True includes current value."""
        sig = ValueVsRollingPercentile(
            value_key="val", window_size=10, percentile=50, min_history=3, include_current=True
        )

        sig({"val": 1})
        sig({"val": 2})
        sig({"val": 3})

        # Current value should be included in percentile calculation
        result = sig({"val": 100})
        # Percentile computed from [1,2,3,100]
        # 50th percentile of [1,2,3,100] - with include_current=True, threshold is higher
        assert sig.last_threshold is not None
        # With 100 included, the threshold will be between 2 and 3 (median of 4 elements)
        assert sig.last_threshold > 2, (
            f"Expected threshold > 2 when including current value 100, got {sig.last_threshold}"
        )
        assert result == 1

    def test_non_numeric_value_ignored(self):
        """Test non-numeric values are ignored."""
        sig = ValueVsRollingPercentile(value_key="val", window_size=10, min_history=1)

        sig({"val": 10})
        sig({"val": "not a number"})
        sig({"val": None})

        # Only numeric values should be in history
        assert len(sig.history) == 1

    def test_missing_key(self):
        """Test missing value_key is handled."""
        sig = ValueVsRollingPercentile(value_key="val", window_size=10, min_history=1)

        result = sig({"other": 10})
        assert result == 0

    def test_reset(self):
        """Test reset clears history."""
        sig = ValueVsRollingPercentile(value_key="val", window_size=10, min_history=1)

        sig({"val": 1})
        sig({"val": 2})
        sig({"val": 3})

        sig.reset()

        assert len(sig.history) == 0
        assert sig.last_threshold is None


class TestValueVsRollingPercentileWithThreshold:
    """Tests for ValueVsRollingPercentileWithThreshold signal."""

    def test_inherits_behavior(self):
        """Test it inherits from ValueVsRollingPercentile."""
        sig = ValueVsRollingPercentileWithThreshold(value_key="val", window_size=10, percentile=50, min_history=3)

        assert isinstance(sig, ValueVsRollingPercentile)

    def test_last_threshold_recorded(self):
        """Test last_threshold is recorded after each call."""
        sig = ValueVsRollingPercentileWithThreshold(value_key="val", window_size=10, percentile=50, min_history=3)

        sig({"val": 1})
        sig({"val": 2})
        sig({"val": 3})

        sig({"val": 10})

        assert sig.last_threshold is not None
        assert sig.last_threshold == pytest.approx(2.0)

    def test_last_threshold_none_before_min_history(self):
        """Test last_threshold is None before min_history is met."""
        sig = ValueVsRollingPercentileWithThreshold(value_key="val", window_size=10, percentile=50, min_history=5)

        sig({"val": 1})
        sig({"val": 2})

        assert sig.last_threshold is None
