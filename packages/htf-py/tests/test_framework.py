"""
Tests for htf.framework module.
"""

from __future__ import annotations

from htf.coordinator import SimpleHTFCoordinator, TimeframeState
from htf.features import SingleFieldStatsFeature
from htf.framework import HTFFramework
from htf.timeframe import TimeframeConfig, TimeframeView


class TestHTFFramework:
    """Tests for HTFFramework."""

    def test_initialization(self):
        """Test basic initialization."""
        config = TimeframeConfig(name="test", window_size=5)
        view = TimeframeView(config=config)
        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"test": view}, coordinator=coord)

        assert "test" in framework.timeframes
        assert framework.coordinator is coord
        assert framework.last_output == {}

    def test_reset(self):
        """Test reset clears all timeframes and output."""
        config = TimeframeConfig(name="test", window_size=5)
        view = TimeframeView(config=config)
        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"test": view}, coordinator=coord)

        # Add some data
        framework.on_new_record({"val": 10})
        assert view.buffer_size == 1

        # Reset
        framework.reset()

        assert view.buffer_size == 0
        assert framework.last_output == {}

    def test_on_new_record_pushes_to_timeframes(self):
        """Test on_new_record pushes record to all timeframes."""
        config1 = TimeframeConfig(name="tf1", window_size=5)
        config2 = TimeframeConfig(name="tf2", window_size=5)
        view1 = TimeframeView(config=config1)
        view2 = TimeframeView(config=config2)
        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"tf1": view1, "tf2": view2}, coordinator=coord)

        framework.on_new_record({"val": 10})

        assert view1.buffer_size == 1
        assert view2.buffer_size == 1

    def test_on_new_record_returns_output(self):
        """Test on_new_record returns states and coordination."""
        config = TimeframeConfig(name="test", window_size=5, role="LTF")
        view = TimeframeView(config=config)
        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"test": view}, coordinator=coord)

        result = framework.on_new_record({"val": 10})

        assert "states" in result
        assert "coordination" in result
        assert "test" in result["states"]

    def test_states_contain_timeframe_info(self):
        """Test states contain proper TimeframeState info."""
        config = TimeframeConfig(name="test_tf", window_size=5, role="HTF")
        view = TimeframeView(config=config)
        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"test_tf": view}, coordinator=coord)

        result = framework.on_new_record({"val": 10})

        state = result["states"]["test_tf"]
        assert isinstance(state, TimeframeState)
        assert state.name == "test_tf"
        assert state.role == "HTF"

    def test_coordination_result(self):
        """Test coordinator.update is called with states."""
        config_htf = TimeframeConfig(name="htf", window_size=5, role="HTF")
        config_ltf = TimeframeConfig(name="ltf", window_size=5, role="LTF")

        # HTF signal always 1
        def htf_signal(features):
            return 1

        # LTF signal always 1
        def ltf_signal(features):
            return 1

        view_htf = TimeframeView(config=config_htf, signal_fn=htf_signal)
        view_ltf = TimeframeView(config=config_ltf, signal_fn=ltf_signal)
        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"htf": view_htf, "ltf": view_ltf}, coordinator=coord)

        result = framework.on_new_record({"val": 10})

        assert result["coordination"]["htf_allow"] is True
        assert result["coordination"]["ltf_gated"]["ltf"] == 1

    def test_last_output_updated(self):
        """Test last_output is updated after on_new_record."""
        config = TimeframeConfig(name="test", window_size=5)
        view = TimeframeView(config=config)
        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"test": view}, coordinator=coord)

        result = framework.on_new_record({"val": 10})

        assert framework.last_output == result

    def test_multiple_records(self):
        """Test processing multiple records."""
        config = TimeframeConfig(name="test", window_size=3)
        feature = SingleFieldStatsFeature(field_name="val", prefix="v")
        view = TimeframeView(config=config, feature_module=feature)
        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"test": view}, coordinator=coord)

        for i in range(5):
            framework.on_new_record({"val": i * 10})

        # Should have 5 records in buffer
        assert view.buffer_size == 5

        # Features should reflect window
        assert "v_count" in view.features

    def test_signal_propagation(self):
        """Test signal values propagate to coordination."""
        config_htf = TimeframeConfig(name="htf", window_size=5, role="HTF")
        config_ltf = TimeframeConfig(name="ltf", window_size=5, role="LTF")

        # HTF signal returns 0 (blocking)
        view_htf = TimeframeView(config=config_htf, signal_fn=lambda f: 0)
        view_ltf = TimeframeView(config=config_ltf, signal_fn=lambda f: 1)
        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"htf": view_htf, "ltf": view_ltf}, coordinator=coord)

        result = framework.on_new_record({"val": 10})

        # HTF blocks, so LTF should be gated to 0
        assert result["coordination"]["htf_allow"] is False
        assert result["coordination"]["ltf_gated"]["ltf"] == 0

    def test_empty_timeframes(self):
        """Test with no timeframes."""
        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={}, coordinator=coord)

        result = framework.on_new_record({"val": 10})

        assert result["states"] == {}
        assert result["coordination"]["htf_allow"] is True


class TestHTFFrameworkIntegration:
    """Integration tests for HTFFramework."""

    def test_end_to_end_workflow(self):
        """Test end-to-end workflow with features and signals."""
        from htf.signals import SignalValueVsPrevious

        # Setup HTF
        htf_config = TimeframeConfig(name="htf", window_size=5, role="HTF")
        htf_signal = SignalValueVsPrevious(value_key="val", comparison="gt")
        htf_view = TimeframeView(config=htf_config, signal_fn=htf_signal)

        # Setup LTF
        ltf_config = TimeframeConfig(name="ltf", window_size=3, role="LTF")
        ltf_feature = SingleFieldStatsFeature(field_name="val", prefix="v")
        ltf_view = TimeframeView(
            config=ltf_config, feature_module=ltf_feature, signal_fn=lambda f: 1 if f.get("v_mean", 0) > 15 else 0
        )

        coord = SimpleHTFCoordinator()

        framework = HTFFramework(timeframes={"htf": htf_view, "ltf": ltf_view}, coordinator=coord)

        # Process data
        values = [10, 20, 15, 25, 30, 20, 35]
        results = []
        all_results = []
        for v in values:
            result = framework.on_new_record({"val": v})
            results.append(result["coordination"])
            all_results.append(result)

        # Verify length
        assert len(results) == len(values)

        # Verify coordination structure is correct
        for coord_result in results:
            assert "htf_allow" in coord_result
            assert "ltf_raw" in coord_result
            assert "ltf_gated" in coord_result

        # Verify feature computation is working
        # After processing all values, LTF should have computed features
        final_result = all_results[-1]
        assert "states" in final_result
        assert "ltf" in final_result["states"]
        ltf_state = final_result["states"]["ltf"]
        # ltf_state is a TimeframeState dataclass with features attribute
        assert hasattr(ltf_state, "features"), "LTF state should have features attribute"
        assert ltf_state.features is not None
        # LTF feature should contain v_mean from SingleFieldStatsFeature
        assert "v_mean" in ltf_state.features, "LTF should compute v_mean feature"

        # Verify HTF gating logic
        # When HTF signal is 0 (val not > previous), ltf_gated should be 0
        # When HTF signal is 1 (val > previous), ltf_gated should match ltf_raw
        for coord_result in results:
            if not coord_result["htf_allow"]:
                # When HTF doesn't allow, LTF signals should be gated to 0
                for gated_val in coord_result["ltf_gated"].values():
                    assert gated_val == 0, "LTF signal should be gated to 0 when htf_allow=False"
            else:
                # When HTF allows, gated should equal raw
                for name in coord_result["ltf_raw"]:
                    assert coord_result["ltf_gated"][name] == coord_result["ltf_raw"][name]
