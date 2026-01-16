"""
Tests for htf.features module.
"""

from __future__ import annotations

import pytest

from htf.features import LastRecordEchoFeature, SingleFieldStatsFeature


class TestSingleFieldStatsFeature:
    """Tests for SingleFieldStatsFeature."""

    def test_basic_initialization(self):
        """Test basic initialization."""
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        assert feature.field_name == "value"
        assert feature.prefix == "val"

    def test_empty_window(self):
        """Test compute with empty window."""
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        result = feature.compute([])

        assert result["val_count"] == 0
        assert result["val_mean"] is None
        assert result["val_min"] is None
        assert result["val_max"] is None

    def test_single_record(self):
        """Test compute with single record."""
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        result = feature.compute([{"value": 10.0}])

        assert result["val_count"] == 1
        assert result["val_mean"] == 10.0
        assert result["val_min"] == 10.0
        assert result["val_max"] == 10.0

    def test_multiple_records(self):
        """Test compute with multiple records."""
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        records = [
            {"value": 10},
            {"value": 20},
            {"value": 30},
            {"value": 40},
            {"value": 50},
        ]
        result = feature.compute(records)

        assert result["val_count"] == 5
        assert result["val_mean"] == 30.0
        assert result["val_min"] == 10
        assert result["val_max"] == 50

    def test_filters_non_numeric_values(self):
        """Test that non-numeric values are filtered out."""
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        records = [
            {"value": 10},
            {"value": "not a number"},
            {"value": 30},
            {"value": None},
            {"value": 50},
        ]
        result = feature.compute(records)

        assert result["val_count"] == 3
        assert result["val_mean"] == 30.0  # (10+30+50)/3
        assert result["val_min"] == 10
        assert result["val_max"] == 50

    def test_filters_boolean_values(self):
        """Test that boolean values are filtered out."""
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        records = [
            {"value": 10},
            {"value": True},
            {"value": 20},
            {"value": False},
            {"value": 30},
        ]
        result = feature.compute(records)

        assert result["val_count"] == 3
        assert result["val_mean"] == 20.0  # (10+20+30)/3

    def test_missing_field(self):
        """Test handling of records missing the target field."""
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        records = [
            {"value": 10},
            {"other": 999},
            {"value": 30},
        ]
        result = feature.compute(records)

        assert result["val_count"] == 2
        assert result["val_mean"] == 20.0

    def test_all_non_numeric(self):
        """Test when all values are non-numeric."""
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        records = [
            {"value": "a"},
            {"value": "b"},
            {"value": None},
        ]
        result = feature.compute(records)

        assert result["val_count"] == 0
        assert result["val_mean"] is None
        assert result["val_min"] is None
        assert result["val_max"] is None

    def test_float_values(self):
        """Test with float values."""
        feature = SingleFieldStatsFeature(field_name="temp", prefix="t")
        records = [
            {"temp": 20.5},
            {"temp": 21.0},
            {"temp": 19.5},
            {"temp": 22.0},
        ]
        result = feature.compute(records)

        assert result["t_count"] == 4
        assert result["t_mean"] == pytest.approx(20.75)
        assert result["t_min"] == 19.5
        assert result["t_max"] == 22.0

    def test_negative_values(self):
        """Test with negative values."""
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        records = [
            {"value": -10},
            {"value": 0},
            {"value": 10},
        ]
        result = feature.compute(records)

        assert result["val_count"] == 3
        assert result["val_mean"] == 0.0
        assert result["val_min"] == -10
        assert result["val_max"] == 10

    def test_update_stores_last_features(self):
        """Test that update stores result in last_features."""
        feature = SingleFieldStatsFeature(field_name="value", prefix="val")
        records = [{"value": 10}, {"value": 20}]

        result = feature.update(records)

        assert feature.last_features == result
        assert feature.last_features["val_count"] == 2


class TestLastRecordEchoFeature:
    """Tests for LastRecordEchoFeature."""

    def test_basic_initialization(self):
        """Test basic initialization."""
        feature = LastRecordEchoFeature(fields=["a", "b", "c"])
        assert feature.fields == ["a", "b", "c"]

    def test_empty_window(self):
        """Test compute with empty window."""
        feature = LastRecordEchoFeature(fields=["a", "b"])
        result = feature.compute([])

        assert result == {"a": None, "b": None}

    def test_single_record(self):
        """Test compute with single record."""
        feature = LastRecordEchoFeature(fields=["x", "y"])
        result = feature.compute([{"x": 10, "y": 20, "z": 30}])

        assert result == {"x": 10, "y": 20}

    def test_multiple_records_returns_last(self):
        """Test that only the last record is used."""
        feature = LastRecordEchoFeature(fields=["val"])
        records = [
            {"val": 1},
            {"val": 2},
            {"val": 3},
        ]
        result = feature.compute(records)

        assert result == {"val": 3}

    def test_missing_field_in_last_record(self):
        """Test handling of missing field in last record."""
        feature = LastRecordEchoFeature(fields=["a", "b"])
        records = [
            {"a": 1, "b": 2},
            {"a": 10},  # b is missing
        ]
        result = feature.compute(records)

        assert result == {"a": 10, "b": None}

    def test_empty_fields_list(self):
        """Test with empty fields list."""
        feature = LastRecordEchoFeature(fields=[])
        result = feature.compute([{"a": 1, "b": 2}])

        assert result == {}

    def test_various_value_types(self):
        """Test with various value types."""
        feature = LastRecordEchoFeature(fields=["int_val", "str_val", "bool_val", "none_val"])
        records = [
            {
                "int_val": 42,
                "str_val": "hello",
                "bool_val": True,
                "none_val": None,
            }
        ]
        result = feature.compute(records)

        assert result["int_val"] == 42
        assert result["str_val"] == "hello"
        assert result["bool_val"] is True
        assert result["none_val"] is None

    def test_update_stores_last_features(self):
        """Test that update stores result in last_features."""
        feature = LastRecordEchoFeature(fields=["val"])
        records = [{"val": 99}]

        result = feature.update(records)

        assert feature.last_features == result
        assert feature.last_features["val"] == 99
