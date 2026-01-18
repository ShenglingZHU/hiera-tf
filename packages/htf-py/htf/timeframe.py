# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 ZHU Shengling
from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

Record = Mapping[str, Any]
MutableRecord = Dict[str, Any]
FeatureDict = Dict[str, Any]
FeatureFunction = Callable[[Sequence[Record]], FeatureDict]
SignalFunction = Callable[[FeatureDict], Any]

_TIME_COLUMN_DEFAULTS: Dict[str, List[str]] = {
    "year": ["year", "Year", "YEAR", "yyyy", "YYYY"],
    "month": ["month", "Month", "MONTH", "mm", "MM"],
    "day": ["day", "Day", "DAY", "dd", "DD"],
    "hour": ["hour", "Hour", "HOUR", "hh", "HH"],
    "minute": ["minute", "Minute", "MINUTE", "min", "MIN"],
    "second": ["second", "Second", "SECOND", "sec", "SEC", "ss", "SS"],
}

_TIME_UNITS: List[Tuple[str, str]] = [
    ("year", "Year"),
    ("month", "Month"),
    ("day", "Day"),
    ("hour", "Hour"),
    ("minute", "Minute"),
    ("second", "Second"),
]

_INT_PARAMS = {
    "window_size",
    "min_history",
    "min_history_runs",
    "history_window",
    "ema_period_1",
    "ema_period_2",
    "window_length",
    "target_index",
    "min_run_length",
    "post_run_extension",
    "max_length",
}
_FLOAT_PARAMS = {"percentile"}
_BOOL_PARAMS = {"include_current"}

_SIGNAL_VALUE_ATTRS: Dict[str, List[str]] = {
    "ValueVsRollingPercentile": ["last_threshold"],
    "ValueVsRollingPercentileWithThreshold": ["last_threshold"],
    "SignalRunLengthReached": ["current_run", "tail_remaining"],
    "SignalRunLengthReachedHistoryPercentile": [
        "current_run",
        "current_threshold",
        "last_threshold",
        "tail_remaining",
    ],
    "SignalRunInterrupted": ["current_run", "tail_remaining"],
    "SignalRunLengthVsHistoryPercentile": ["current_run", "tail_remaining"],
    "SignalValueVsLastTrueReference": ["last_reference_value"],
    "SignalValueVsLastTargetForBase": ["last_target_value"],
    "SignalValueVsPrevious": ["previous_value"],
    "SignalValueVsLastSignalRunStatistic": ["last_statistic"],
    "SignalEMAFastSlowComparison": ["ema_1", "ema_2"],
    "SignalEMADiffVsHistoryPercentile": [
        "ema_1",
        "ema_2",
        "last_abs_diff",
        "last_threshold",
    ],
    "SignalIntervalBetweenMarkers": ["last_interval_length"],
}


def _parse_bool(value: Any, fallback: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        raw = value.strip().lower()
        if raw in ("true", "1", "yes", "y"):
            return True
        if raw in ("false", "0", "no", "n"):
            return False
    if value is None:
        return fallback
    return bool(value)


def _parse_target_value(value: Any) -> Any:
    if value is None:
        return value
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value
    if isinstance(value, str):
        raw = value.strip()
        if raw == "":
            return raw
        if raw.lower() == "true":
            return True
        if raw.lower() == "false":
            return False
        try:
            num = float(raw)
            if num.is_integer():
                return int(num)
            return num
        except ValueError:
            return raw
    return value


def _coerce_param(name: str, value: Any) -> Any:
    if value is None or value == "":
        return None
    if name in _BOOL_PARAMS:
        return _parse_bool(value, False)
    if name in _INT_PARAMS:
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None
    if name in _FLOAT_PARAMS:
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
    if name == "true_value":
        return _parse_target_value(value)
    if name == "target_value":
        return _parse_target_value(value)
    return value


def _build_signal_defs_map(
    signal_defs: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]],
) -> Dict[str, Mapping[str, Any]]:
    if not signal_defs:
        return {}
    if isinstance(signal_defs, Mapping):
        if "type" in signal_defs:
            return {str(signal_defs["type"]): signal_defs}  # type: ignore[return-value]
        return {str(k): v for k, v in signal_defs.items()}
    defs_map: Dict[str, Mapping[str, Any]] = {}
    for item in signal_defs:
        if item and "type" in item:
            defs_map[str(item["type"])] = item
    return defs_map


def _collect_signal_nodes(roots: Sequence[Mapping[str, Any]]) -> List[Mapping[str, Any]]:
    nodes: List[Mapping[str, Any]] = []
    seen: set[str] = set()

    def visit(node: Mapping[str, Any]) -> None:
        node_id = str(node.get("id"))
        if not node_id or node_id in seen:
            return
        seen.add(node_id)
        nodes.append(node)
        children = node.get("children") or {}
        for child_list in children.values():
            for child in child_list or []:
                if isinstance(child, Mapping):
                    visit(child)

    for root in roots:
        if isinstance(root, Mapping):
            visit(root)
    return nodes


def _build_evaluation_order(roots: Sequence[Mapping[str, Any]]) -> List[Mapping[str, Any]]:
    ordered: List[Mapping[str, Any]] = []
    visited: set[str] = set()

    def visit(node: Mapping[str, Any]) -> None:
        node_id = str(node.get("id"))
        if not node_id or node_id in visited:
            return
        visited.add(node_id)
        children = node.get("children") or {}
        for child_list in children.values():
            for child in child_list or []:
                if isinstance(child, Mapping):
                    visit(child)
        ordered.append(node)

    for root in roots:
        if isinstance(root, Mapping):
            visit(root)
    return ordered


def _build_node_dependencies(
    node: Mapping[str, Any], signal_defs_map: Mapping[str, Any]
) -> Tuple[Dict[str, Optional[str]], Dict[str, List[str]]]:
    singles: Dict[str, Optional[str]] = {}
    lists: Dict[str, List[str]] = {}
    defn = signal_defs_map.get(str(node.get("type")))
    if defn and defn.get("params"):
        for param in defn.get("params", []):
            name = param.get("name")
            kind = param.get("kind")
            if not name:
                continue
            children = (node.get("children") or {}).get(name) or []
            if kind == "signal":
                child = children[0] if children else None
                singles[name] = str(child.get("id")) if isinstance(child, Mapping) else None
            elif kind == "signal-list":
                lists[name] = [
                    str(child.get("id"))
                    for child in children
                    if isinstance(child, Mapping) and child.get("id") is not None
                ]
        return singles, lists

    children = node.get("children") or {}
    for name, child_list in children.items():
        child_list = child_list or []
        if name == "signal_keys":
            lists[name] = [
                str(child.get("id"))
                for child in child_list
                if isinstance(child, Mapping) and child.get("id") is not None
            ]
        else:
            child = child_list[0] if child_list else None
            singles[name] = str(child.get("id")) if isinstance(child, Mapping) else None
    return singles, lists


def _normalize_flags(flags: Optional[Iterable[Any]], length: int, fill_value: bool = False) -> List[bool]:
    if not flags:
        return [fill_value for _ in range(length)]
    normalized = [bool(flag) for flag in list(flags)[:length]]
    while len(normalized) < length:
        normalized.append(fill_value)
    return normalized


def _truthy_windows(flags: Sequence[bool], timestamps: Sequence[Any]) -> List[Tuple[Any, Any]]:
    windows: List[Tuple[Any, Any]] = []
    start = None
    for idx, flag in enumerate(flags):
        if bool(flag):
            if start is None:
                start = timestamps[idx]
        else:
            if start is not None:
                end_val = timestamps[idx - 1] if idx > 0 else start
                windows.append((start, end_val))
                start = None
    if start is not None and timestamps:
        windows.append((start, timestamps[-1]))
    return windows


def _map_windows_to_mask(windows: Sequence[Tuple[Any, Any]], timestamps: Sequence[Any]) -> List[bool]:
    if not timestamps:
        return []
    if not windows:
        return [False for _ in range(len(timestamps))]
    mask = [False for _ in range(len(timestamps))]
    win_idx = 0
    start, end = windows[0]
    for idx, ts in enumerate(timestamps):
        while win_idx < len(windows) and ts > end:
            win_idx += 1
            if win_idx < len(windows):
                start, end = windows[win_idx]
        if win_idx < len(windows) and ts >= start and ts <= end:
            mask[idx] = True
    return mask


def _extract_series_timestamps(series: Mapping[str, Any]) -> List[Any]:
    timestamps = list(series.get("timestamps") or [])
    if timestamps:
        return timestamps
    data = series.get("data") or []
    if isinstance(data, list):
        out: List[Any] = []
        for rec in data:
            if isinstance(rec, Mapping):
                if "ts" in rec:
                    out.append(rec.get("ts"))
                elif "timestamp" in rec:
                    out.append(rec.get("timestamp"))
        return out
    return []


def _detect_time_columns(records: Sequence[Mapping[str, Any]]) -> List[str]:
    keys: set[str] = set()
    for rec in records:
        for key in rec.keys():
            keys.add(str(key))
    time_cols: List[str] = []
    for aliases in _TIME_COLUMN_DEFAULTS.values():
        for alias in aliases:
            if alias in keys:
                time_cols.append(alias)
                break
    return time_cols


def _build_timestamp_columns(
    timestamps: Sequence[Any], existing_time_cols: Sequence[str]
) -> Tuple[List[str], Dict[str, List[Any]]]:
    if not timestamps:
        return list(existing_time_cols), {}
    try:
        import pandas as pd
    except ImportError as exc:  # pragma: no cover - optional dependency path
        raise RuntimeError("pandas is required for timestamp parsing") from exc

    dt = pd.to_datetime(list(timestamps), errors="coerce")
    computed: Dict[str, List[Any]] = {}
    col_order = list(existing_time_cols)
    for unit, label in _TIME_UNITS:
        aliases = _TIME_COLUMN_DEFAULTS.get(unit, [])
        if any(alias in existing_time_cols for alias in aliases):
            continue
        series = getattr(dt.dt, unit)
        computed[label] = [val if not pd.isna(val) else None for val in series]
        col_order.append(label)
    return col_order, computed


@dataclass
class TimeframeConfig:
    """
    Static configuration for a timeframe view.
    """

    name: str  # e.g. "1h_temp"
    window_size: int  # how many recent records used for features
    max_buffer: int = 1024  # max history stored in memory
    role: str = "LTF"  # "HTF" or "LTF"

    def __post_init__(self) -> None:
        if self.window_size <= 0:
            raise ValueError("window_size must be > 0")
        if self.max_buffer <= 0:
            raise ValueError("max_buffer must be > 0")
        self.role = self.role.upper()


class FeatureModule:
    """
    Base class / protocol for feature modules.
    Subclasses implement compute(window) -> FeatureDict.
    """

    def __init__(self) -> None:
        self.last_features: FeatureDict = {}

    def compute(self, window: Sequence[Record]) -> FeatureDict:
        raise NotImplementedError

    def update(self, window: Sequence[Record]) -> FeatureDict:
        self.last_features = self.compute(window)
        return self.last_features


@dataclass
class TimeframeView:
    config: TimeframeConfig
    feature_module: Optional[FeatureModule] = None
    feature_fn: Optional[FeatureFunction] = None
    signal_fn: Optional[SignalFunction] = None

    buffer: List[MutableRecord] = field(default_factory=list, init=False)
    features: FeatureDict = field(default_factory=dict, init=False)
    signal: Any = None

    def reset(self) -> None:
        self.buffer.clear()
        self.features = {}
        self.signal = None
        if self.feature_module is not None and hasattr(self.feature_module, "last_features"):
            self.feature_module.last_features = {}

    @property
    def name(self) -> str:
        return self.config.name

    @property
    def role(self) -> str:
        return self.config.role

    @property
    def buffer_size(self) -> int:
        return len(self.buffer)

    @property
    def is_warm(self) -> bool:
        """True if buffer has at least window_size records."""
        return len(self.buffer) >= self.config.window_size

    def _update_buffer(self, record: Mapping[str, Any]) -> None:
        """
        Append a new record to buffer; trim to max_buffer.
        Store a shallow-copied dict so later modifications do not affect original.
        """
        self.buffer.append(dict(record))
        excess = len(self.buffer) - self.config.max_buffer
        if excess > 0:
            del self.buffer[0:excess]

    def _get_window(self) -> List[Record]:
        """
        Return the last window_size records as the feature window.
        If buffer is shorter than window_size, return all available records.
        """
        if len(self.buffer) <= self.config.window_size:
            return list(self.buffer)
        return list(self.buffer[-self.config.window_size :])

    def _update_features_and_signal(self) -> None:
        """
        Use feature_module OR feature_fn to compute features from current window.
        Then compute signal using signal_fn(features), or set signal=None if not provided.
        If neither feature_module nor feature_fn is given and window is non-empty,
        default features = dict(window[-1]).
        """
        window = self._get_window()
        feats: FeatureDict
        if self.feature_module is not None:
            feats = self.feature_module.update(window)
        elif self.feature_fn is not None:
            feats = self.feature_fn(window)
        elif window:
            feats = dict(window[-1])
        else:
            feats = {}

        self.features = feats

        if self.signal_fn is not None:
            self.signal = self.signal_fn(self.features)
        else:
            self.signal = None

    def on_new_record(self, record: Mapping[str, Any]) -> Any:
        """
        Push a new record into the timeframe, update buffer, features, and signal.
        Return the current signal.
        """
        self._update_buffer(record)
        self._update_features_and_signal()
        return self.signal

    def export_signal_dataframe(
        self,
        signal_type: str,
        signal_alias: str,
        *,
        include_dependencies: bool = False,
        include_values: bool = False,
        hierar_constraint_series: Optional[Sequence[Mapping[str, Any]]] = None,
        timeframe_series: Optional[Sequence[Mapping[str, Any]]] = None,
        signal_graph: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        signal_defs: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]] = None,
        timestamp_key: str = "timestamp",
        current_series_id: Optional[str] = None,
    ):
        """
        Build a DataFrame for the selected signal and optional dependencies/values/hierarchy constraint signals.
        """
        try:
            import pandas as pd
        except ImportError as exc:  # pragma: no cover - optional dependency path
            raise RuntimeError("pandas is required for export_signal_dataframe") from exc

        records = list(self.buffer)
        if not records:
            return pd.DataFrame()

        time_cols = _detect_time_columns(records)
        ts_key_candidates = [timestamp_key] if timestamp_key else []
        ts_key_candidates.extend(["timestamp", "ts"])
        ts_key = next(
            (key for key in ts_key_candidates if any(key in rec for rec in records)),
            None,
        )
        timestamps = [rec.get(ts_key) for rec in records] if ts_key else []
        computed_time_cols: Dict[str, List[Any]] = {}
        if timestamps:
            time_cols, computed_time_cols = _build_timestamp_columns(timestamps, time_cols)

        if (include_dependencies or include_values) and not signal_graph:
            raise ValueError("signal_graph is required when include_dependencies or include_values is True")

        signal_defs_map = _build_signal_defs_map(signal_defs)

        def _resolve_roots(
            graph: Optional[Union[Mapping[str, Any], Sequence[Mapping[str, Any]]]],
        ) -> List[Mapping[str, Any]]:
            if not graph:
                return []
            if isinstance(graph, Mapping):
                roots = graph.get("items") or graph.get("roots") or graph.get("signals") or []
            else:
                roots = graph
            return [root for root in roots if isinstance(root, Mapping)]

        def _node_alias(node: Mapping[str, Any]) -> str:
            alias = node.get("alias")
            if isinstance(alias, str) and alias.strip():
                return alias.strip()
            return str(node.get("type"))

        roots = _resolve_roots(signal_graph)
        nodes = _collect_signal_nodes(roots)
        target_node: Optional[Mapping[str, Any]] = None
        if roots:
            for node in nodes:
                if str(node.get("type")) != signal_type:
                    continue
                if _node_alias(node) == signal_alias:
                    if target_node is not None:
                        raise ValueError("signal_type and signal_alias must identify a unique signal")
                    target_node = node
        if roots and target_node is None:
            raise ValueError("signal_type and signal_alias did not match any signal in signal_graph")

        from .signals import (  # local import to avoid heavy dependency at module load
            SignalEMADiffVsHistoryPercentile,
            SignalEMAFastSlowComparison,
            SignalExternalFlag,
            SignalIntersection,
            SignalIntervalBetweenMarkers,
            SignalNthTargetWithinWindowAfterTrigger,
            SignalRunInterrupted,
            SignalRunLengthReached,
            SignalRunLengthReachedHistoryPercentile,
            SignalRunLengthVsHistoryPercentile,
            SignalValueVsLastSignalRunStatistic,
            SignalValueVsLastTargetForBase,
            SignalValueVsLastTrueReference,
            SignalValueVsPrevious,
            ValueVsRollingPercentile,
            ValueVsRollingPercentileWithThreshold,
        )

        signal_class_map: Dict[str, Any] = {
            "ValueVsRollingPercentile": ValueVsRollingPercentile,
            "ValueVsRollingPercentileWithThreshold": ValueVsRollingPercentileWithThreshold,
            "SignalEMADiffVsHistoryPercentile": SignalEMADiffVsHistoryPercentile,
            "SignalRunLengthReached": SignalRunLengthReached,
            "SignalRunLengthReachedHistoryPercentile": SignalRunLengthReachedHistoryPercentile,
            "SignalRunInterrupted": SignalRunInterrupted,
            "SignalRunLengthVsHistoryPercentile": SignalRunLengthVsHistoryPercentile,
            "SignalValueVsLastTrueReference": SignalValueVsLastTrueReference,
            "SignalValueVsLastTargetForBase": SignalValueVsLastTargetForBase,
            "SignalValueVsPrevious": SignalValueVsPrevious,
            "SignalValueVsLastSignalRunStatistic": SignalValueVsLastSignalRunStatistic,
            "SignalEMAFastSlowComparison": SignalEMAFastSlowComparison,
            "SignalIntervalBetweenMarkers": SignalIntervalBetweenMarkers,
            "SignalNthTargetWithinWindowAfterTrigger": SignalNthTargetWithinWindowAfterTrigger,
            "SignalIntersection": SignalIntersection,
            "SignalExternalFlag": SignalExternalFlag,
        }

        def _compute_outputs(
            recs: Sequence[Mapping[str, Any]], roots_in: Sequence[Mapping[str, Any]]
        ) -> Dict[str, List[int]]:
            ordered = _build_evaluation_order(roots_in)
            runners: Dict[str, Dict[str, Any]] = {}
            for node in ordered:
                node_id = str(node.get("id"))
                node_type = str(node.get("type"))
                deps = _build_node_dependencies(node, signal_defs_map)
                params = node.get("params") or {}
                options = {str(k): _coerce_param(str(k), v) for k, v in params.items()}
                for name, dep_id in deps[0].items():
                    if dep_id:
                        options[name] = dep_id
                for name, dep_ids in deps[1].items():
                    options[name] = dep_ids
                instance = None
                SignalClass = signal_class_map.get(node_type)
                if SignalClass:
                    try:
                        instance = SignalClass(**options)
                    except Exception:
                        instance = None
                runners[node_id] = {"instance": instance, "deps": deps, "type": node_type, "node": node}

            outputs: Dict[str, List[int]] = {node_id: [] for node_id in runners}

            value_data: Dict[str, List[Any]] = {}
            value_order: List[str] = []
            if include_values:
                for runner in runners.values():
                    node_type = runner["type"]
                    base_name = _node_alias(runner["node"])
                    for attr in _SIGNAL_VALUE_ATTRS.get(node_type, []):
                        col_name = f"{base_name}_{attr}"
                        if col_name not in value_data:
                            value_data[col_name] = []
                            value_order.append(col_name)

            for rec in recs:
                step_outputs: Dict[str, int] = {}
                base_features: Dict[str, Any] = {}
                if isinstance(rec, Mapping):
                    values = rec.get("values")
                    if isinstance(values, Mapping):
                        base_features.update(values)
                    if "value" in rec:
                        base_features["value"] = rec.get("value")
                for node in ordered:
                    node_id = str(node.get("id"))
                    runner = runners[node_id]
                    instance = runner["instance"]
                    deps = runner["deps"]
                    features = dict(base_features)
                    for dep_id in deps[0].values():
                        if dep_id:
                            features[dep_id] = step_outputs.get(dep_id, 0)
                    for dep_ids in deps[1].values():
                        for dep_id in dep_ids:
                            features[dep_id] = step_outputs.get(dep_id, 0)
                    value = instance(features) if instance is not None else 0
                    normalized = 1 if value else 0
                    step_outputs[node_id] = normalized
                    outputs[node_id].append(normalized)

                    if include_values:
                        node_type = runner["type"]
                        base_name = _node_alias(runner["node"])
                        for attr in _SIGNAL_VALUE_ATTRS.get(node_type, []):
                            col_name = f"{base_name}_{attr}"
                            val = getattr(instance, attr, None) if instance is not None else None
                            if isinstance(val, bool):
                                val = int(val)
                            value_data[col_name].append(val)

            outputs["_value_columns"] = value_order
            outputs["_value_data"] = value_data
            return outputs

        outputs: Dict[str, List[int]] = {}
        value_col_order: List[str] = []
        value_data: Dict[str, List[Any]] = {}
        dep_nodes: List[Mapping[str, Any]] = []
        target_outputs: List[int] = []

        if target_node is not None:
            outputs = _compute_outputs(records, [target_node])
            value_col_order = outputs.pop("_value_columns", [])
            value_data = outputs.pop("_value_data", {})
            ordered_nodes = _build_evaluation_order([target_node])
            dep_nodes = ordered_nodes[:-1]
            target_id = str(target_node.get("id"))
            target_outputs = outputs.get(target_id, [0 for _ in range(len(records))])

        if target_node is None:
            alias_key = signal_alias
            type_key = signal_type
            target_outputs = [1 if bool(rec.get(alias_key, rec.get(type_key, 0))) else 0 for rec in records]

        current_id = current_series_id or self.name
        current_timestamps = timestamps if timestamps and all(ts is not None for ts in timestamps) else []

        ext_masks: Dict[str, List[bool]] = {}
        calc_masks: Dict[str, List[bool]] = {}
        hierar_constraint_order: List[str] = []
        hierar_constraint_cols: Dict[str, List[int]] = {}

        def _find_series_index(series_list: Sequence[Mapping[str, Any]], series_id: str) -> int:
            for idx, series in enumerate(series_list):
                sid = series.get("id") or series.get("name") or f"series-{idx}"
                if sid == series_id or series.get("name") == series_id:
                    return idx
            return max(0, len(series_list) - 1)

        higher_series_order: List[str] = []
        if current_timestamps:
            if hierar_constraint_series:
                ext_list = list(hierar_constraint_series)
                ext_idx = _find_series_index(ext_list, current_id)
                higher_ext = ext_list[:ext_idx] if ext_idx > 0 else []
                higher_series_order = [
                    str(series.get("name") or series.get("id") or f"series-{idx}")
                    for idx, series in enumerate(higher_ext)
                ]
                for idx, series in enumerate(higher_ext):
                    series_name = str(series.get("name") or series.get("id") or f"series-{idx}")
                    flags = series.get("downward_flags")
                    ts = _extract_series_timestamps(series)
                    if not ts or any(t is None for t in ts) or flags is None:
                        mask = [True for _ in range(len(current_timestamps))]
                    else:
                        windows = _truthy_windows(_normalize_flags(flags, len(ts), False), ts)
                        mask = _map_windows_to_mask(windows, current_timestamps)
                    ext_masks[series_name] = mask

            if timeframe_series:
                calc_list = list(timeframe_series)
                calc_idx = _find_series_index(calc_list, current_id)
                higher_calc = calc_list[:calc_idx] if calc_idx > 0 else []
                if not higher_series_order:
                    higher_series_order = [
                        str(series.get("name") or series.get("id") or f"series-{idx}")
                        for idx, series in enumerate(higher_calc)
                    ]
                for idx, series in enumerate(higher_calc):
                    series_name = str(series.get("name") or series.get("id") or f"series-{idx}")
                    signals = series.get("signals") or {}
                    down_id = signals.get("downwardSignalId") if isinstance(signals, Mapping) else None
                    ts = _extract_series_timestamps(series)
                    if not ts or any(t is None for t in ts) or not down_id:
                        mask = [True for _ in range(len(current_timestamps))]
                    else:
                        graph_roots = _resolve_roots(signals.get("items") if isinstance(signals, Mapping) else None)
                        series_outputs = _compute_outputs(series.get("data") or [], graph_roots)
                        flags = series_outputs.get(str(down_id), [])
                        if not flags:
                            mask = [True for _ in range(len(current_timestamps))]
                        else:
                            windows = _truthy_windows(_normalize_flags(flags, len(ts), False), ts)
                            mask = _map_windows_to_mask(windows, current_timestamps)
                    calc_masks[series_name] = mask

        for series_name in higher_series_order:
            if series_name in ext_masks:
                col_name = f"hierar_constraint_ext_{series_name}"
                hierar_constraint_order.append(col_name)
                hierar_constraint_cols[col_name] = [1 if v else 0 for v in ext_masks[series_name]]
            if series_name in calc_masks:
                col_name = f"hierar_constraint_calc_{series_name}"
                hierar_constraint_order.append(col_name)
                hierar_constraint_cols[col_name] = [1 if v else 0 for v in calc_masks[series_name]]
            if series_name in ext_masks and series_name in calc_masks:
                col_name = f"hierar_constraint_mismatch_{series_name}"
                hierar_constraint_order.append(col_name)
                mismatch = [
                    1 if ext_masks[series_name][i] != calc_masks[series_name][i] else 0
                    for i in range(len(current_timestamps))
                ]
                hierar_constraint_cols[col_name] = mismatch

        hierar_constraint_all: Optional[List[bool]] = None
        if current_timestamps and higher_series_order:
            effective_masks: List[List[bool]] = []
            for series_name in higher_series_order:
                if series_name in ext_masks and series_name in calc_masks:
                    effective = [
                        ext_masks[series_name][i] and calc_masks[series_name][i] for i in range(len(current_timestamps))
                    ]
                    effective_masks.append(effective)
                elif series_name in ext_masks:
                    effective_masks.append(ext_masks[series_name])
                elif series_name in calc_masks:
                    effective_masks.append(calc_masks[series_name])
            if effective_masks:
                hierar_constraint_all = [
                    all(mask[i] for mask in effective_masks) for i in range(len(current_timestamps))
                ]
            else:
                hierar_constraint_all = [True for _ in range(len(current_timestamps))]

        if hierar_constraint_all is not None:
            hierar_constraint_cols["hierar_constraint_all"] = [1 if v else 0 for v in hierar_constraint_all]
            hierar_constraint_order.append("hierar_constraint_all")
        elif current_timestamps and (hierar_constraint_series or timeframe_series):
            hierar_constraint_all = [True for _ in range(len(current_timestamps))]
            hierar_constraint_cols["hierar_constraint_all"] = [1 for _ in range(len(current_timestamps))]
            hierar_constraint_order.append("hierar_constraint_all")

        column_data: Dict[str, List[Any]] = {}
        for col in time_cols:
            if col in computed_time_cols:
                column_data[col] = computed_time_cols[col]
            else:
                column_data[col] = [rec.get(col) for rec in records]

        for col in hierar_constraint_order:
            column_data[col] = hierar_constraint_cols[col]

        if include_dependencies and dep_nodes:
            for node in dep_nodes:
                node_id = str(node.get("id"))
                col_name = _node_alias(node)
                column_data[col_name] = outputs.get(node_id, [0 for _ in range(len(records))])

        if hierar_constraint_all is not None:
            column_data[f"{signal_type}_raw"] = target_outputs
            column_data[f"{signal_type}_gated"] = [
                target_outputs[i] if hierar_constraint_all[i] else 0 for i in range(len(target_outputs))
            ]
        else:
            column_data[signal_type] = target_outputs

        for col in value_col_order:
            column_data[col] = value_data.get(col, [None for _ in range(len(records))])

        return pd.DataFrame(column_data)

    def export_buffer_as_dataframe(self):
        """
        Return the buffer as a pandas.DataFrame.
        Import pandas inside the method; if ImportError, raise a RuntimeError.
        """
        try:
            import pandas as pd
        except ImportError as exc:  # pragma: no cover - optional dependency path
            raise RuntimeError("pandas is required for export_buffer_as_dataframe") from exc

        return pd.DataFrame(self.buffer)
