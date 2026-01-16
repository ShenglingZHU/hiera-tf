"""
Tests for htf.coordinator module.
"""

from __future__ import annotations

import pytest

from htf.coordinator import (
    HierarConstraintCoordinator,
    MultiScaleCoordinator,
    SimpleHTFCoordinator,
    TimeframeState,
)


class TestTimeframeState:
    """Tests for TimeframeState dataclass."""

    def test_initialization(self):
        """Test basic initialization."""
        state = TimeframeState(name="test", role="LTF", features={"val": 10}, signal=1)
        assert state.name == "test"
        assert state.role == "LTF"
        assert state.features == {"val": 10}
        assert state.signal == 1


class TestMultiScaleCoordinator:
    """Tests for MultiScaleCoordinator base class."""

    def test_update_not_implemented(self):
        """Test update raises NotImplementedError."""
        coord = MultiScaleCoordinator()

        with pytest.raises(NotImplementedError):
            coord.update({}, {})


class TestSimpleHTFCoordinator:
    """Tests for SimpleHTFCoordinator."""

    def test_initialization(self):
        """Test basic initialization."""
        coord = SimpleHTFCoordinator()
        assert isinstance(coord, MultiScaleCoordinator)

    def test_no_htf_states(self):
        """Test with no HTF states - all LTF should pass."""
        coord = SimpleHTFCoordinator()

        states = {
            "ltf1": TimeframeState(name="ltf1", role="LTF", features={}, signal=1),
            "ltf2": TimeframeState(name="ltf2", role="LTF", features={}, signal=1),
        }

        result = coord.update(states, {})

        assert result["htf_allow"] is True
        assert result["ltf_raw"]["ltf1"] == 1
        assert result["ltf_gated"]["ltf1"] == 1

    def test_all_htf_pass(self):
        """Test when all HTF states are truthy."""
        coord = SimpleHTFCoordinator()

        states = {
            "htf1": TimeframeState(name="htf1", role="HTF", features={}, signal=1),
            "htf2": TimeframeState(name="htf2", role="HTF", features={}, signal=1),
            "ltf1": TimeframeState(name="ltf1", role="LTF", features={}, signal=1),
        }

        result = coord.update(states, {})

        assert result["htf_allow"] is True
        assert result["ltf_gated"]["ltf1"] == 1

    def test_one_htf_fails(self):
        """Test when one HTF state is falsy - gates LTF."""
        coord = SimpleHTFCoordinator()

        states = {
            "htf1": TimeframeState(name="htf1", role="HTF", features={}, signal=1),
            "htf2": TimeframeState(name="htf2", role="HTF", features={}, signal=0),
            "ltf1": TimeframeState(name="ltf1", role="LTF", features={}, signal=1),
        }

        result = coord.update(states, {})

        assert result["htf_allow"] is False
        assert result["ltf_raw"]["ltf1"] == 1
        assert result["ltf_gated"]["ltf1"] == 0

    def test_ltf_raw_preserved(self):
        """Test LTF raw signals are always preserved."""
        coord = SimpleHTFCoordinator()

        states = {
            "htf1": TimeframeState(name="htf1", role="HTF", features={}, signal=0),
            "ltf1": TimeframeState(name="ltf1", role="LTF", features={}, signal=1),
            "ltf2": TimeframeState(name="ltf2", role="LTF", features={}, signal=0),
        }

        result = coord.update(states, {})

        assert result["ltf_raw"]["ltf1"] == 1
        assert result["ltf_raw"]["ltf2"] == 0

    def test_empty_states(self):
        """Test with empty states."""
        coord = SimpleHTFCoordinator()

        result = coord.update({}, {})

        assert result["htf_allow"] is True
        assert result["ltf_raw"] == {}
        assert result["ltf_gated"] == {}


class TestHierarConstraintCoordinator:
    """Tests for HierarConstraintCoordinator."""

    def test_initialization(self):
        """Test basic initialization."""
        coord = HierarConstraintCoordinator(order=["htf", "mtf", "ltf"])
        assert coord.order == ["htf", "mtf", "ltf"]

    def test_initialization_no_order(self):
        """Test initialization without order."""
        coord = HierarConstraintCoordinator()
        assert coord.order == []

    def test_order_from_states(self):
        """Test order is inferred from states if not provided."""
        coord = HierarConstraintCoordinator()

        states = {
            "a": TimeframeState(name="a", role="HTF", features={}, signal=1),
            "b": TimeframeState(name="b", role="MTF", features={}, signal=1),
            "c": TimeframeState(name="c", role="LTF", features={}, signal=1),
        }

        result = coord.update(states, {})

        # All should be in result
        assert "a" in result["raw_map"]
        assert "b" in result["raw_map"]
        assert "c" in result["raw_map"]

    def test_hierarchical_gating(self):
        """Test hierarchical gating - parent failure blocks children."""
        coord = HierarConstraintCoordinator(order=["parent", "child1", "child2"])

        states = {
            "parent": TimeframeState(name="parent", role="HTF", features={}, signal=0),
            "child1": TimeframeState(name="child1", role="LTF", features={}, signal=1),
            "child2": TimeframeState(name="child2", role="LTF", features={}, signal=1),
        }

        result = coord.update(states, {})

        assert result["allow_map"]["parent"] is True  # First has no parent
        assert result["allow_map"]["child1"] is False  # Blocked by parent
        assert result["allow_map"]["child2"] is False  # Blocked by parent

        assert result["gated_map"]["parent"] == 0
        assert result["gated_map"]["child1"] == 0
        assert result["gated_map"]["child2"] == 0

    def test_hierarchical_allow(self):
        """Test hierarchical allowing - all parents pass."""
        coord = HierarConstraintCoordinator(order=["parent", "child"])

        states = {
            "parent": TimeframeState(name="parent", role="HTF", features={}, signal=1),
            "child": TimeframeState(name="child", role="LTF", features={}, signal=1),
        }

        result = coord.update(states, {})

        assert result["allow_map"]["parent"] is True
        assert result["allow_map"]["child"] is True
        assert result["gated_map"]["child"] == 1

    def test_raw_map_preserved(self):
        """Test raw_map preserves original signals."""
        coord = HierarConstraintCoordinator(order=["a", "b"])

        states = {
            "a": TimeframeState(name="a", role="HTF", features={}, signal=0),
            "b": TimeframeState(name="b", role="LTF", features={}, signal=1),
        }

        result = coord.update(states, {})

        assert result["raw_map"]["a"] == 0
        assert result["raw_map"]["b"] == 1

    def test_missing_state_in_order(self):
        """Test handling of state missing from order."""
        coord = HierarConstraintCoordinator(order=["a", "b", "missing"])

        states = {
            "a": TimeframeState(name="a", role="HTF", features={}, signal=1),
            "b": TimeframeState(name="b", role="LTF", features={}, signal=1),
        }

        result = coord.update(states, {})

        # Missing state should be skipped
        assert "missing" not in result["raw_map"]

    def test_multi_level_hierarchy(self):
        """Test multi-level hierarchy."""
        coord = HierarConstraintCoordinator(order=["level1", "level2", "level3"])

        states = {
            "level1": TimeframeState(name="level1", role="HTF", features={}, signal=1),
            "level2": TimeframeState(name="level2", role="MTF", features={}, signal=0),
            "level3": TimeframeState(name="level3", role="LTF", features={}, signal=1),
        }

        result = coord.update(states, {})

        assert result["allow_map"]["level1"] is True
        assert result["allow_map"]["level2"] is True  # level1 passes
        assert result["allow_map"]["level3"] is False  # level2 fails

        assert result["gated_map"]["level1"] == 1
        assert result["gated_map"]["level2"] == 0
        assert result["gated_map"]["level3"] == 0


class TestHierarConstraintCoordinatorBuildMasks:
    """Tests for HierarConstraintCoordinator.build_gate_masks_from_series."""

    def test_empty_series_list(self):
        """Test with empty series list."""
        coord = HierarConstraintCoordinator()

        result = coord.build_gate_masks_from_series([])

        assert result == {}

    def test_single_series_all_true(self):
        """Test single series with no constraints."""
        coord = HierarConstraintCoordinator()

        series = [
            {
                "id": "s1",
                "timestamps": [1, 2, 3],
                "downward_flags": None,
            }
        ]

        result = coord.build_gate_masks_from_series(series)

        assert result["s1"] == [True, True, True]

    def test_parent_constrains_child(self):
        """Test parent flags constrain child."""
        coord = HierarConstraintCoordinator()

        series = [
            {
                "id": "parent",
                "timestamps": [1, 2, 3, 4, 5],
                "downward_flags": [True, True, False, False, True],
            },
            {
                "id": "child",
                "timestamps": [1, 2, 3, 4, 5],
            },
        ]

        result = coord.build_gate_masks_from_series(series)

        # Parent has no constraints (first in order)
        assert result["parent"] == [True, True, True, True, True]
        # Child is constrained by parent's downward_flags
        assert result["child"] == [True, True, False, False, True]

    def test_window_mapping(self):
        """Test window mapping to finer timestamps."""
        coord = HierarConstraintCoordinator()

        series = [
            {
                "id": "coarse",
                "timestamps": [0, 10, 20],
                "downward_flags": [True, False, True],
            },
            {
                "id": "fine",
                "timestamps": [0, 5, 10, 15, 20, 25],
            },
        ]

        result = coord.build_gate_masks_from_series(series)

        # Coarse series has no parent constraints, should all be True
        assert result["coarse"] == [True, True, True]

        # Fine series should be constrained by coarse windows
        # Window [0, 10) -> True, [10, 20) -> False, [20, ...] -> True
        # Fine timestamps: 0 (True), 5 (True - in first window), 10 (False), 15 (False), 20 (True), 25 (True)
        assert "fine" in result
        assert len(result["fine"]) == 6
        # Timestamp 0 is in window [0,0] which is True
        assert result["fine"][0] is True
        # Timestamp 10 is in window [10,10] which is False
        assert result["fine"][2] is False
        # Timestamp 20 is in window [20,20] which is True
        assert result["fine"][4] is True
