"""
Tests for interval and window-based signals.
"""

from __future__ import annotations

import pytest

from htf.signals import (
    SignalIntervalBetweenMarkers,
    SignalNthTargetWithinWindowAfterTrigger,
)


class TestSignalIntervalBetweenMarkers:
    """Tests for SignalIntervalBetweenMarkers signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end", max_length=10)
        assert sig.start_signal_key == "start"
        assert sig.end_signal_key == "end"
        assert sig.max_length == 10

    def test_default_max_length(self):
        """Test default max_length is None."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end")
        assert sig.max_length is None

    def test_invalid_max_length(self):
        """Test max_length must be > 0 when provided."""
        with pytest.raises(ValueError, match="max_length must be > 0"):
            SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end", max_length=0)

    def test_start_opens_interval(self):
        """Test start signal opens an interval."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end")

        result = sig({"start": 1, "end": 0})

        assert result == 1
        assert sig.active is True
        assert sig.current_length == 1

    def test_no_signal_before_start(self):
        """Test no signal before interval starts."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end")

        result = sig({"start": 0, "end": 0})

        assert result == 0
        assert sig.active is False

    def test_end_closes_interval(self):
        """Test end signal closes an interval."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end")

        sig({"start": 1, "end": 0})
        sig({"start": 0, "end": 0})
        result = sig({"start": 0, "end": 1})

        assert result == 1  # Signal is 1 on the closing step
        assert sig.active is False

    def test_interval_tracking(self):
        """Test interval is recorded after closing."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end")

        sig({"start": 1, "end": 0})  # step 0, start
        sig({"start": 0, "end": 0})  # step 1
        sig({"start": 0, "end": 0})  # step 2
        sig({"start": 0, "end": 1})  # step 3, end

        assert len(sig.intervals) == 1
        assert sig.intervals[0]["start_index"] == 0
        assert sig.intervals[0]["end_index"] == 3
        assert sig.intervals[0]["length"] == 4
        assert sig.intervals[0]["closed_by"] == "end_signal"

    def test_max_length_closes_interval(self):
        """Test max_length automatically closes interval."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end", max_length=3)

        sig({"start": 1, "end": 0})  # length=1
        sig({"start": 0, "end": 0})  # length=2
        sig({"start": 0, "end": 0})  # length=3, closes

        assert sig.active is False
        assert len(sig.intervals) == 1
        assert sig.intervals[0]["closed_by"] == "max_length"

    def test_start_and_end_same_step(self):
        """Test start and end on same step."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end")

        result = sig({"start": 1, "end": 1})

        assert result == 1
        assert sig.active is False
        assert len(sig.intervals) == 1
        assert sig.intervals[0]["length"] == 1

    def test_multiple_intervals(self):
        """Test tracking multiple intervals."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end")

        # First interval
        sig({"start": 1, "end": 0})
        sig({"start": 0, "end": 1})

        # Second interval
        sig({"start": 1, "end": 0})
        sig({"start": 0, "end": 0})
        sig({"start": 0, "end": 1})

        assert len(sig.intervals) == 2
        assert sig.intervals[0]["length"] == 2
        assert sig.intervals[1]["length"] == 3

    def test_last_interval_length(self):
        """Test last_interval_length is updated."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end")

        sig({"start": 1, "end": 0})
        sig({"start": 0, "end": 0})
        sig({"start": 0, "end": 1})

        assert sig.last_interval_length == 3
        assert sig.last_interval_closed_by == "end_signal"

    def test_reset(self):
        """Test reset clears all state."""
        sig = SignalIntervalBetweenMarkers(start_signal_key="start", end_signal_key="end")

        sig({"start": 1, "end": 0})
        sig({"start": 0, "end": 1})

        sig.reset()

        assert sig.active is False
        assert sig.current_length == 0
        assert sig.current_start_index is None
        assert sig.last_interval_length is None
        assert len(sig.intervals) == 0
        assert sig.step_index == 0


class TestSignalNthTargetWithinWindowAfterTrigger:
    """Tests for SignalNthTargetWithinWindowAfterTrigger signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalNthTargetWithinWindowAfterTrigger(
            trigger_signal_key="trigger", target_signal_key="target", window_length=5, target_index=2
        )
        assert sig.trigger_signal_key == "trigger"
        assert sig.target_signal_key == "target"
        assert sig.window_length == 5
        assert sig.target_index == 2

    def test_invalid_window_length(self):
        """Test window_length must be > 0."""
        with pytest.raises(ValueError, match="window_length must be > 0"):
            SignalNthTargetWithinWindowAfterTrigger(
                trigger_signal_key="trigger", target_signal_key="target", window_length=0, target_index=1
            )

    def test_invalid_target_index(self):
        """Test target_index must be >= 1."""
        with pytest.raises(ValueError, match="target_index must be >= 1"):
            SignalNthTargetWithinWindowAfterTrigger(
                trigger_signal_key="trigger", target_signal_key="target", window_length=5, target_index=0
            )

    def test_trigger_opens_window(self):
        """Test trigger opens a search window."""
        sig = SignalNthTargetWithinWindowAfterTrigger(
            trigger_signal_key="trigger", target_signal_key="target", window_length=5, target_index=1
        )

        sig({"trigger": 1, "target": 0})

        assert len(sig.active_windows) == 1

    def test_nth_target_triggers(self):
        """Test signal triggers on Nth target."""
        sig = SignalNthTargetWithinWindowAfterTrigger(
            trigger_signal_key="trigger", target_signal_key="target", window_length=10, target_index=2
        )

        sig({"trigger": 1, "target": 0})  # Open window
        sig({"trigger": 0, "target": 1})  # First target
        result = sig({"trigger": 0, "target": 1})  # Second target - should trigger

        assert result == 1
        assert sig.last_search_success is True

    def test_first_target_triggers(self):
        """Test with target_index=1."""
        sig = SignalNthTargetWithinWindowAfterTrigger(
            trigger_signal_key="trigger", target_signal_key="target", window_length=10, target_index=1
        )

        sig({"trigger": 1, "target": 0})
        result = sig({"trigger": 0, "target": 1})

        assert result == 1

    def test_window_expires(self):
        """Test window expiration without finding target."""
        sig = SignalNthTargetWithinWindowAfterTrigger(
            trigger_signal_key="trigger", target_signal_key="target", window_length=3, target_index=1
        )

        sig({"trigger": 1, "target": 0})  # Open window
        sig({"trigger": 0, "target": 0})  # No target
        sig({"trigger": 0, "target": 0})  # No target
        sig({"trigger": 0, "target": 0})  # Window expires

        assert sig.last_search_success is False
        assert len(sig.active_windows) == 0

    def test_overlapping_windows(self):
        """Test multiple overlapping windows."""
        sig = SignalNthTargetWithinWindowAfterTrigger(
            trigger_signal_key="trigger", target_signal_key="target", window_length=5, target_index=1
        )

        sig({"trigger": 1, "target": 0})  # First window
        sig({"trigger": 1, "target": 0})  # Second window

        assert len(sig.active_windows) == 2

        result = sig({"trigger": 0, "target": 1})  # Both windows see target

        assert result == 1

    def test_no_trigger_without_window(self):
        """Test no trigger without active window."""
        sig = SignalNthTargetWithinWindowAfterTrigger(
            trigger_signal_key="trigger", target_signal_key="target", window_length=5, target_index=1
        )

        result = sig({"trigger": 0, "target": 1})

        assert result == 0

    def test_reset(self):
        """Test reset clears all state."""
        sig = SignalNthTargetWithinWindowAfterTrigger(
            trigger_signal_key="trigger", target_signal_key="target", window_length=5, target_index=1
        )

        sig({"trigger": 1, "target": 0})
        sig({"trigger": 0, "target": 1})

        sig.reset()

        assert len(sig.active_windows) == 0
        assert sig.last_search_success is None
        assert sig.step_index == 0
