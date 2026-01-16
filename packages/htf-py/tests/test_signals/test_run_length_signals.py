"""
Tests for run-length based signals.
"""

from __future__ import annotations

import pytest

from htf.signals import (
    SignalRunInterrupted,
    SignalRunLengthReached,
    SignalRunLengthReachedHistoryPercentile,
    SignalRunLengthVsHistoryPercentile,
)


class TestSignalRunLengthReached:
    """Tests for SignalRunLengthReached signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalRunLengthReached(signal_key="sig", target_value=1, min_run_length=3, post_run_extension=2)
        assert sig.signal_key == "sig"
        assert sig.target_value == 1
        assert sig.min_run_length == 3
        assert sig.post_run_extension == 2

    def test_default_values(self):
        """Test default values."""
        sig = SignalRunLengthReached(signal_key="sig")
        assert sig.target_value == 1
        assert sig.min_run_length == 3
        assert sig.post_run_extension == 0

    def test_run_not_reached(self):
        """Test signal is 0 before min_run_length is reached."""
        sig = SignalRunLengthReached(signal_key="sig", min_run_length=3)

        assert sig({"sig": 1}) == 0  # run=1
        assert sig({"sig": 1}) == 0  # run=2
        assert sig.current_run == 2
        assert sig.active is False

    def test_run_reached(self):
        """Test signal activates when min_run_length is reached."""
        sig = SignalRunLengthReached(signal_key="sig", min_run_length=3)

        sig({"sig": 1})  # run=1
        sig({"sig": 1})  # run=2
        result = sig({"sig": 1})  # run=3, should activate

        assert result == 1
        assert sig.active is True

    def test_run_continues_after_activation(self):
        """Test signal stays active during continued run."""
        sig = SignalRunLengthReached(signal_key="sig", min_run_length=3)

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})  # activates

        assert sig({"sig": 1}) == 1  # continues
        assert sig({"sig": 1}) == 1  # continues

    def test_run_interrupted(self):
        """Test signal deactivates when run is interrupted."""
        sig = SignalRunLengthReached(signal_key="sig", min_run_length=3)

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})  # activates

        result = sig({"sig": 0})  # interrupts

        assert result == 0
        assert sig.current_run == 0
        assert sig.active is False

    def test_post_run_extension(self):
        """Test post_run_extension keeps signal active after interruption."""
        sig = SignalRunLengthReached(signal_key="sig", min_run_length=3, post_run_extension=2)

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})  # activates

        # Interrupt the run
        assert sig({"sig": 0}) == 1  # extension step 1
        assert sig({"sig": 0}) == 1  # extension step 2
        assert sig({"sig": 0}) == 0  # extension exhausted

    def test_reset(self):
        """Test reset clears state."""
        sig = SignalRunLengthReached(signal_key="sig", min_run_length=3)

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})

        sig.reset()

        assert sig.current_run == 0
        assert sig.active is False
        assert sig.tail_remaining == 0

    def test_different_target_value(self):
        """Test with different target_value."""
        sig = SignalRunLengthReached(signal_key="sig", target_value=True, min_run_length=2)

        sig({"sig": True})
        result = sig({"sig": True})

        assert result == 1

    def test_interrupted_before_min_run_length(self):
        """Test interruption before min_run_length has no extension."""
        sig = SignalRunLengthReached(signal_key="sig", min_run_length=5, post_run_extension=3)

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})  # only 3, not activated

        result = sig({"sig": 0})  # interrupt before activation

        assert result == 0
        assert sig.tail_remaining == 0


class TestSignalRunLengthReachedHistoryPercentile:
    """Tests for SignalRunLengthReachedHistoryPercentile signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalRunLengthReachedHistoryPercentile(
            signal_key="sig", history_window=100, percentile=90.0, min_history_runs=5
        )
        assert sig.signal_key == "sig"
        assert sig.history_window == 100
        assert sig.percentile == 90.0
        assert sig.min_history_runs == 5

    def test_invalid_history_window(self):
        """Test history_window validation."""
        with pytest.raises(ValueError, match="history_window must be > 0"):
            SignalRunLengthReachedHistoryPercentile(signal_key="sig", history_window=0)

    def test_invalid_percentile(self):
        """Test percentile validation."""
        with pytest.raises(ValueError, match="percentile must be between 0 and 100"):
            SignalRunLengthReachedHistoryPercentile(signal_key="sig", percentile=150)

    def test_invalid_min_history_runs(self):
        """Test min_history_runs validation."""
        with pytest.raises(ValueError, match="min_history_runs must be >= 1"):
            SignalRunLengthReachedHistoryPercentile(signal_key="sig", min_history_runs=0)

    def test_min_history_runs_exceeds_window(self):
        """Test min_history_runs cannot exceed history_window."""
        with pytest.raises(ValueError, match="min_history_runs cannot exceed history_window"):
            SignalRunLengthReachedHistoryPercentile(signal_key="sig", history_window=5, min_history_runs=10)

    def test_no_trigger_without_history(self):
        """Test no trigger when history is insufficient."""
        sig = SignalRunLengthReachedHistoryPercentile(
            signal_key="sig", history_window=100, percentile=50, min_history_runs=3
        )

        # First run of length 5 - no history yet
        for _ in range(10):
            result = sig({"sig": 1})
            assert result == 0

        sig({"sig": 0})  # end run

    def test_threshold_computed_from_history(self):
        """Test threshold is computed from historical runs."""
        sig = SignalRunLengthReachedHistoryPercentile(
            signal_key="sig", history_window=100, percentile=50, min_history_runs=2
        )

        # Create some history: runs of length 3, 4
        for _ in range(3):
            sig({"sig": 1})
        sig({"sig": 0})

        for _ in range(4):
            sig({"sig": 1})
        sig({"sig": 0})

        # Now we have history, threshold should be ~3.5
        # A new run of length 4 should trigger
        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})
        result = sig({"sig": 1})

        assert result == 1

    def test_run_trace_recorded(self):
        """Test run_trace records completed runs."""
        sig = SignalRunLengthReachedHistoryPercentile(signal_key="sig", min_history_runs=1)

        # Complete a run of length 3
        for _ in range(3):
            sig({"sig": 1})
        sig({"sig": 0})

        assert len(sig.run_trace) == 1
        assert sig.run_trace[0]["run_length"] == 3

    def test_reset(self):
        """Test reset clears all state."""
        sig = SignalRunLengthReachedHistoryPercentile(signal_key="sig")

        for _ in range(5):
            sig({"sig": 1})
        sig({"sig": 0})

        sig.reset()

        assert sig.current_run == 0
        assert len(sig.history_runs) == 0
        assert sig.current_threshold is None
        assert sig.active is False


class TestSignalRunInterrupted:
    """Tests for SignalRunInterrupted signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalRunInterrupted(signal_key="sig", min_run_length=3, post_run_extension=2)
        assert sig.signal_key == "sig"
        assert sig.min_run_length == 3
        assert sig.post_run_extension == 2

    def test_no_trigger_during_run(self):
        """Test signal is 0 during an active run."""
        sig = SignalRunInterrupted(signal_key="sig", min_run_length=3)

        assert sig({"sig": 1}) == 0
        assert sig({"sig": 1}) == 0
        assert sig({"sig": 1}) == 0
        assert sig({"sig": 1}) == 0

    def test_trigger_on_interruption(self):
        """Test signal triggers when run is interrupted."""
        sig = SignalRunInterrupted(signal_key="sig", min_run_length=3)

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})  # run=3

        result = sig({"sig": 0})  # interruption

        assert result == 1

    def test_no_trigger_before_min_run(self):
        """Test no trigger if run was shorter than min_run_length."""
        sig = SignalRunInterrupted(signal_key="sig", min_run_length=5)

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})  # only 3

        result = sig({"sig": 0})

        assert result == 0

    def test_post_run_extension(self):
        """Test post_run_extension extends signal after interruption."""
        sig = SignalRunInterrupted(signal_key="sig", min_run_length=3, post_run_extension=2)

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})

        assert sig({"sig": 0}) == 1  # interruption trigger
        assert sig({"sig": 0}) == 1  # extension step 1
        assert sig({"sig": 0}) == 1  # extension step 2
        assert sig({"sig": 0}) == 0  # extension exhausted

    def test_reset(self):
        """Test reset clears state."""
        sig = SignalRunInterrupted(signal_key="sig", min_run_length=3)

        sig({"sig": 1})
        sig({"sig": 1})

        sig.reset()

        assert sig.current_run == 0
        assert sig.tail_remaining == 0


class TestSignalRunLengthVsHistoryPercentile:
    """Tests for SignalRunLengthVsHistoryPercentile signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalRunLengthVsHistoryPercentile(
            signal_key="sig", history_window=100, percentile=90.0, min_history_runs=5
        )
        assert sig.signal_key == "sig"
        assert sig.history_window == 100
        assert sig.percentile == 90.0
        assert sig.min_history_runs == 5

    def test_no_trigger_without_history(self):
        """Test no trigger when history is insufficient."""
        sig = SignalRunLengthVsHistoryPercentile(signal_key="sig", min_history_runs=5)

        # Only 2 completed runs in history
        for _ in range(3):
            sig({"sig": 1})
        sig({"sig": 0})

        for _ in range(4):
            sig({"sig": 1})
        sig({"sig": 0})

        # Start new run
        for _ in range(10):
            result = sig({"sig": 1})
            assert result == 0  # not enough history

    def test_trigger_when_exceeds_percentile(self):
        """Test trigger when run exceeds history percentile."""
        sig = SignalRunLengthVsHistoryPercentile(
            signal_key="sig", history_window=100, percentile=50, min_history_runs=2
        )

        # Create history: runs of 2, 3
        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 0})

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 0})

        # New run - should trigger when exceeding ~2.5
        sig({"sig": 1})
        sig({"sig": 1})
        result = sig({"sig": 1})  # run=3, exceeds 2.5

        assert result == 1

    def test_stays_active_during_long_run(self):
        """Test signal stays active once triggered."""
        sig = SignalRunLengthVsHistoryPercentile(signal_key="sig", percentile=50, min_history_runs=2)

        # History
        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 0})

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 0})

        # New run
        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 1})  # triggers

        assert sig({"sig": 1}) == 1
        assert sig({"sig": 1}) == 1

    def test_reset(self):
        """Test reset clears state."""
        sig = SignalRunLengthVsHistoryPercentile(signal_key="sig")

        sig({"sig": 1})
        sig({"sig": 1})
        sig({"sig": 0})

        sig.reset()

        assert sig.current_run == 0
        assert len(sig.history_runs) == 0
        assert sig.active is False
