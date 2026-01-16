"""
Tests for htf.timeframe module.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any, Dict

import pytest

from htf.timeframe import FeatureModule, TimeframeConfig, TimeframeView


class TestTimeframeConfig:
    """Tests for TimeframeConfig."""

    def test_basic_initialization(self):
        """Test basic initialization with valid parameters."""
        config = TimeframeConfig(name="test", window_size=10, max_buffer=100, role="LTF")
        assert config.name == "test"
        assert config.window_size == 10
        assert config.max_buffer == 100
        assert config.role == "LTF"

    def test_default_values(self):
        """Test default values for optional parameters."""
        config = TimeframeConfig(name="test", window_size=5)
        assert config.max_buffer == 1024
        assert config.role == "LTF"

    def test_role_uppercase_conversion(self):
        """Test that role is converted to uppercase."""
        config = TimeframeConfig(name="test", window_size=5, role="htf")
        assert config.role == "HTF"

        config2 = TimeframeConfig(name="test", window_size=5, role="ltf")
        assert config2.role == "LTF"

    def test_invalid_window_size_zero(self):
        """Test that window_size=0 raises ValueError."""
        with pytest.raises(ValueError, match="window_size must be > 0"):
            TimeframeConfig(name="test", window_size=0)

    def test_invalid_window_size_negative(self):
        """Test that negative window_size raises ValueError."""
        with pytest.raises(ValueError, match="window_size must be > 0"):
            TimeframeConfig(name="test", window_size=-5)

    def test_invalid_max_buffer_zero(self):
        """Test that max_buffer=0 raises ValueError."""
        with pytest.raises(ValueError, match="max_buffer must be > 0"):
            TimeframeConfig(name="test", window_size=5, max_buffer=0)

    def test_invalid_max_buffer_negative(self):
        """Test that negative max_buffer raises ValueError."""
        with pytest.raises(ValueError, match="max_buffer must be > 0"):
            TimeframeConfig(name="test", window_size=5, max_buffer=-10)


class TestFeatureModule:
    """Tests for FeatureModule base class."""

    def test_compute_not_implemented(self):
        """Test that compute raises NotImplementedError."""
        module = FeatureModule()
        with pytest.raises(NotImplementedError):
            module.compute([])

    def test_update_calls_compute(self):
        """Test that update calls compute and stores result."""

        class TestModule(FeatureModule):
            def compute(self, window: Sequence[Any]) -> Dict[str, Any]:
                return {"count": len(window)}

        module = TestModule()
        result = module.update([1, 2, 3])
        assert result == {"count": 3}
        assert module.last_features == {"count": 3}

    def test_initial_last_features_empty(self):
        """Test that last_features is initially empty."""
        module = FeatureModule()
        assert module.last_features == {}


class TestTimeframeView:
    """Tests for TimeframeView."""

    def test_initialization(self, basic_config):
        """Test basic initialization."""
        view = TimeframeView(config=basic_config)
        assert view.name == "test_tf"
        assert view.role == "LTF"
        assert view.buffer_size == 0
        assert view.features == {}
        assert view.signal is None

    def test_name_and_role_properties(self, basic_config, htf_config):
        """Test name and role properties."""
        view1 = TimeframeView(config=basic_config)
        assert view1.name == "test_tf"
        assert view1.role == "LTF"

        view2 = TimeframeView(config=htf_config)
        assert view2.name == "htf_tf"
        assert view2.role == "HTF"

    def test_buffer_management(self, basic_config, sample_records):
        """Test buffer correctly stores records."""
        view = TimeframeView(config=basic_config)

        for i, record in enumerate(sample_records[:5]):
            view.on_new_record(record)
            assert view.buffer_size == i + 1

    def test_buffer_trimming(self):
        """Test buffer trims to max_buffer."""
        config = TimeframeConfig(name="test", window_size=3, max_buffer=5)
        view = TimeframeView(config=config)

        for i in range(10):
            view.on_new_record({"val": i})

        assert view.buffer_size == 5
        # Should keep the last 5 records
        assert view.buffer[0]["val"] == 5
        assert view.buffer[-1]["val"] == 9

    def test_is_warm_property(self, basic_config):
        """Test is_warm property."""
        view = TimeframeView(config=basic_config)  # window_size=5

        for i in range(4):
            view.on_new_record({"val": i})
            assert view.is_warm is False

        view.on_new_record({"val": 4})
        assert view.is_warm is True

    def test_reset(self, basic_config, sample_records):
        """Test reset clears buffer and state."""
        view = TimeframeView(config=basic_config)

        for record in sample_records[:5]:
            view.on_new_record(record)

        assert view.buffer_size == 5

        view.reset()

        assert view.buffer_size == 0
        assert view.features == {}
        assert view.signal is None

    def test_default_features_from_last_record(self, basic_config):
        """Test default features when no feature_module or feature_fn."""
        view = TimeframeView(config=basic_config)

        view.on_new_record({"val": 10, "name": "test"})

        assert view.features == {"val": 10, "name": "test"}

    def test_feature_module_integration(self, basic_config, simple_feature_module):
        """Test feature module is called correctly."""
        view = TimeframeView(config=basic_config, feature_module=simple_feature_module)

        view.on_new_record({"value": 10})
        view.on_new_record({"value": 20})
        view.on_new_record({"value": 30})

        assert "val_count" in view.features
        assert view.features["val_count"] == 3

    def test_feature_function_integration(self, basic_config):
        """Test custom feature function is called correctly."""

        def custom_feature_fn(window):
            return {"sum": sum(r.get("val", 0) for r in window)}

        view = TimeframeView(config=basic_config, feature_fn=custom_feature_fn)

        view.on_new_record({"val": 5})
        view.on_new_record({"val": 10})

        assert view.features == {"sum": 15}

    def test_signal_function_integration(self, basic_config):
        """Test signal function is called with features."""

        def signal_fn(features):
            return 1 if features.get("val", 0) > 10 else 0

        view = TimeframeView(config=basic_config, signal_fn=signal_fn)

        view.on_new_record({"val": 5})
        assert view.signal == 0

        view.on_new_record({"val": 20})
        assert view.signal == 1

    def test_on_new_record_returns_signal(self, basic_config):
        """Test on_new_record returns current signal."""

        def signal_fn(features):
            return features.get("val", 0)

        view = TimeframeView(config=basic_config, signal_fn=signal_fn)

        result = view.on_new_record({"val": 42})
        assert result == 42

    def test_window_extraction(self):
        """Test window extraction respects window_size."""
        config = TimeframeConfig(name="test", window_size=3, max_buffer=10)

        sums = []

        def feature_fn(window):
            s = sum(r.get("val", 0) for r in window)
            sums.append(s)
            return {"sum": s}

        view = TimeframeView(config=config, feature_fn=feature_fn)

        for i in range(5):
            view.on_new_record({"val": i + 1})

        # Window should only include last 3 records: 3, 4, 5
        assert view.features["sum"] == 12  # 3+4+5

    def test_record_shallow_copy(self, basic_config):
        """Test records are shallow copied into buffer."""
        view = TimeframeView(config=basic_config)

        original = {"val": 10}
        view.on_new_record(original)

        # Modifying original should not affect buffer
        original["val"] = 999
        assert view.buffer[0]["val"] == 10


class TestTimeframeViewExport:
    """Tests for TimeframeView export methods."""

    def test_export_buffer_as_dataframe(self, basic_config, sample_records):
        """Test export_buffer_as_dataframe returns DataFrame."""
        pytest.importorskip("pandas")
        import pandas as pd

        view = TimeframeView(config=basic_config)
        for record in sample_records[:5]:
            view.on_new_record(record)

        df = view.export_buffer_as_dataframe()

        assert isinstance(df, pd.DataFrame)
        assert len(df) == 5
        assert "ts" in df.columns
        assert "value" in df.columns

    def test_export_buffer_empty(self, basic_config):
        """Test export_buffer_as_dataframe with empty buffer."""
        pytest.importorskip("pandas")
        import pandas as pd

        view = TimeframeView(config=basic_config)
        df = view.export_buffer_as_dataframe()

        assert isinstance(df, pd.DataFrame)
        assert len(df) == 0
