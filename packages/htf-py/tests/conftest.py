"""
Pytest fixtures and shared test utilities for htf tests.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import pytest

from htf.coordinator import HierarConstraintCoordinator, SimpleHTFCoordinator
from htf.features import SingleFieldStatsFeature
from htf.timeframe import FeatureModule, TimeframeConfig


@pytest.fixture
def basic_config() -> TimeframeConfig:
    """Basic TimeframeConfig for testing."""
    return TimeframeConfig(name="test_tf", window_size=5, max_buffer=100, role="LTF")


@pytest.fixture
def htf_config() -> TimeframeConfig:
    """HTF role TimeframeConfig for testing."""
    return TimeframeConfig(name="htf_tf", window_size=10, max_buffer=100, role="HTF")


@pytest.fixture
def sample_records() -> list[dict[str, Any]]:
    """Sample records for testing."""
    return [
        {"ts": 1, "value": 10, "temp": 20.0},
        {"ts": 2, "value": 20, "temp": 21.5},
        {"ts": 3, "value": 15, "temp": 19.0},
        {"ts": 4, "value": 25, "temp": 22.0},
        {"ts": 5, "value": 30, "temp": 23.5},
        {"ts": 6, "value": 18, "temp": 20.5},
        {"ts": 7, "value": 35, "temp": 24.0},
        {"ts": 8, "value": 22, "temp": 21.0},
        {"ts": 9, "value": 28, "temp": 22.5},
        {"ts": 10, "value": 40, "temp": 25.0},
    ]


@pytest.fixture
def numeric_sequence() -> list[dict[str, float]]:
    """Numeric sequence for signal testing."""
    return [{"val": float(i)} for i in range(1, 21)]


@pytest.fixture
def binary_signal_sequence() -> list[dict[str, int]]:
    """Binary signal sequence for run-length testing."""
    # Pattern: 0,0,1,1,1,0,1,1,1,1,0,0,0,1,1,0
    return [
        {"sig": 0},
        {"sig": 0},
        {"sig": 1},
        {"sig": 1},
        {"sig": 1},
        {"sig": 0},
        {"sig": 1},
        {"sig": 1},
        {"sig": 1},
        {"sig": 1},
        {"sig": 0},
        {"sig": 0},
        {"sig": 0},
        {"sig": 1},
        {"sig": 1},
        {"sig": 0},
    ]


@pytest.fixture
def simple_feature_module() -> SingleFieldStatsFeature:
    """Simple feature module for testing."""
    return SingleFieldStatsFeature(field_name="value", prefix="val")


@pytest.fixture
def simple_htf_coordinator() -> SimpleHTFCoordinator:
    """Simple HTF coordinator for testing."""
    return SimpleHTFCoordinator()


@pytest.fixture
def hierar_coordinator() -> HierarConstraintCoordinator:
    """Hierarchical constraint coordinator for testing."""
    return HierarConstraintCoordinator(order=["htf", "mtf", "ltf"])


class MockFeatureModule(FeatureModule):
    """Mock feature module that returns configurable features."""

    def __init__(self, features: dict[str, Any] = None):
        super().__init__()
        self._features = features or {}

    def compute(self, window: Sequence[Any]) -> dict[str, Any]:
        result = dict(self._features)
        result["window_size"] = len(window)
        if window:
            result["last_record"] = dict(window[-1])
        return result


class MockSignalFunction:
    """Mock signal function for testing."""

    def __init__(self, return_value: Any = 0):
        self.return_value = return_value
        self.call_count = 0
        self.last_features = None

    def __call__(self, features: dict[str, Any]) -> Any:
        self.call_count += 1
        self.last_features = features
        return self.return_value


@pytest.fixture
def mock_feature_module():
    """Factory for mock feature modules."""

    def _create(features: dict[str, Any] = None):
        return MockFeatureModule(features)

    return _create


@pytest.fixture
def mock_signal_function():
    """Factory for mock signal functions."""

    def _create(return_value: Any = 0):
        return MockSignalFunction(return_value)

    return _create
