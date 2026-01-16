"""
Tests for composite signals.
"""

from __future__ import annotations

import pytest

from htf.signals import (
    SignalExternalFlag,
    SignalIntersection,
)


class TestSignalIntersection:
    """Tests for SignalIntersection signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalIntersection(signal_keys=["a", "b", "c"])
        assert sig.signal_keys == ["a", "b", "c"]

    def test_minimum_keys_required(self):
        """Test at least 2 keys are required."""
        with pytest.raises(ValueError, match="signal_keys must contain at least 2 keys"):
            SignalIntersection(signal_keys=["a"])

    def test_empty_keys_list(self):
        """Test empty keys list raises error."""
        with pytest.raises(ValueError, match="signal_keys must contain at least 2 keys"):
            SignalIntersection(signal_keys=[])

    def test_unique_keys_required(self):
        """Test keys must be unique."""
        with pytest.raises(ValueError, match="signal_keys must be unique"):
            SignalIntersection(signal_keys=["a", "b", "a"])

    def test_all_true_returns_1(self):
        """Test returns 1 when all signals are truthy."""
        sig = SignalIntersection(signal_keys=["a", "b", "c"])

        result = sig({"a": 1, "b": 1, "c": 1})

        assert result == 1

    def test_any_false_returns_0(self):
        """Test returns 0 when any signal is falsy."""
        sig = SignalIntersection(signal_keys=["a", "b", "c"])

        result = sig({"a": 1, "b": 0, "c": 1})

        assert result == 0

    def test_all_false_returns_0(self):
        """Test returns 0 when all signals are falsy."""
        sig = SignalIntersection(signal_keys=["a", "b", "c"])

        result = sig({"a": 0, "b": 0, "c": 0})

        assert result == 0

    def test_missing_key_is_falsy(self):
        """Test missing key is treated as falsy."""
        sig = SignalIntersection(signal_keys=["a", "b"])

        result = sig({"a": 1})  # b is missing

        assert result == 0

    def test_truthy_values(self):
        """Test various truthy values."""
        sig = SignalIntersection(signal_keys=["a", "b", "c"])

        result = sig({"a": True, "b": 1, "c": "yes"})

        assert result == 1

    def test_two_keys(self):
        """Test with minimum two keys."""
        sig = SignalIntersection(signal_keys=["x", "y"])

        assert sig({"x": 1, "y": 1}) == 1
        assert sig({"x": 1, "y": 0}) == 0
        assert sig({"x": 0, "y": 1}) == 0
        assert sig({"x": 0, "y": 0}) == 0

    def test_reset_is_noop(self):
        """Test reset does nothing (stateless signal)."""
        sig = SignalIntersection(signal_keys=["a", "b"])

        # Should not raise
        sig.reset()


class TestSignalExternalFlag:
    """Tests for SignalExternalFlag signal."""

    def test_initialization(self):
        """Test basic initialization."""
        sig = SignalExternalFlag(signal_key="flag", true_value=1)
        assert sig.signal_key == "flag"
        assert sig.true_value == 1

    def test_default_true_value(self):
        """Test default true_value is 1."""
        sig = SignalExternalFlag(signal_key="flag")
        assert sig.true_value == 1

    def test_returns_1_when_matches(self):
        """Test returns 1 when value matches true_value."""
        sig = SignalExternalFlag(signal_key="flag", true_value=1)

        result = sig({"flag": 1})

        assert result == 1

    def test_returns_0_when_not_matches(self):
        """Test returns 0 when value doesn't match true_value."""
        sig = SignalExternalFlag(signal_key="flag", true_value=1)

        result = sig({"flag": 0})

        assert result == 0

    def test_custom_true_value_string(self):
        """Test with custom string true_value."""
        sig = SignalExternalFlag(signal_key="status", true_value="active")

        assert sig({"status": "active"}) == 1
        assert sig({"status": "inactive"}) == 0

    def test_custom_true_value_bool(self):
        """Test with boolean true_value."""
        sig = SignalExternalFlag(signal_key="enabled", true_value=True)

        assert sig({"enabled": True}) == 1
        assert sig({"enabled": False}) == 0

    def test_missing_key_returns_0(self):
        """Test missing key returns 0."""
        sig = SignalExternalFlag(signal_key="flag", true_value=1)

        result = sig({"other": 1})

        assert result == 0

    def test_none_value(self):
        """Test None value doesn't match (unless true_value is None)."""
        sig = SignalExternalFlag(signal_key="flag", true_value=1)

        assert sig({"flag": None}) == 0

        sig2 = SignalExternalFlag(signal_key="flag", true_value=None)
        assert sig2({"flag": None}) == 1

    def test_truthy_equivalence(self):
        """Test truthy equivalence behavior."""
        sig = SignalExternalFlag(signal_key="flag", true_value=1)

        # True is treated as equivalent to 1 due to Python's truthy comparison
        # This matches the actual implementation behavior
        assert sig({"flag": True}) == 1
        assert sig({"flag": 1}) == 1
        assert sig({"flag": 0}) == 0
        assert sig({"flag": False}) == 0

    def test_reset_is_noop(self):
        """Test reset does nothing (stateless signal)."""
        sig = SignalExternalFlag(signal_key="flag")

        # Should not raise
        sig.reset()
