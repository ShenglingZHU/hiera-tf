# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 ZHU Shengling
from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class TimeframeState:
    name: str
    role: str
    features: dict[str, Any]
    signal: Any


class MultiScaleCoordinator:
    def update(
        self,
        states: Mapping[str, TimeframeState],
        record: Mapping[str, Any],
    ) -> dict[str, Any]:
        raise NotImplementedError


class SimpleHTFCoordinator(MultiScaleCoordinator):
    def update(
        self,
        states: Mapping[str, TimeframeState],
        record: Mapping[str, Any],
    ) -> dict[str, Any]:
        htf_states = [s for s in states.values() if s.role == "HTF"]
        ltf_states = {name: s for name, s in states.items() if s.role == "LTF"}

        htf_allow = all(bool(s.signal) for s in htf_states) if htf_states else True
        ltf_raw = {name: s.signal for name, s in ltf_states.items()}
        ltf_gated = {name: (sig if htf_allow else 0) for name, sig in ltf_raw.items()}

        return {
            "htf_allow": htf_allow,
            "ltf_raw": ltf_raw,
            "ltf_gated": ltf_gated,
        }


def _normalize_flags(flags: Optional[Iterable[Any]], length: int, fill_value: bool = False) -> list[bool]:
    if not flags:
        return [fill_value for _ in range(length)]
    normalized = [bool(flag) for flag in list(flags)[:length]]
    while len(normalized) < length:
        normalized.append(fill_value)
    return normalized


def _truthy_windows(flags: Sequence[bool], timestamps: Sequence[Any]) -> list[tuple[Any, Any]]:
    windows: list[tuple[Any, Any]] = []
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


def _map_windows_to_mask(windows: Sequence[tuple[Any, Any]], timestamps: Sequence[Any]) -> list[bool]:
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


class HierarConstraintCoordinator(MultiScaleCoordinator):
    def __init__(self, order: Optional[Sequence[str]] = None) -> None:
        self.order = list(order) if order else []

    def update(
        self,
        states: Mapping[str, TimeframeState],
        record: Mapping[str, Any],
    ) -> dict[str, Any]:
        order = self.order or list(states.keys())
        allow_map: dict[str, bool] = {}
        raw_map: dict[str, Any] = {}

        for idx, name in enumerate(order):
            if name not in states:
                continue
            state = states[name]
            raw_map[name] = state.signal
            allowed = True
            for parent_name in order[:idx]:
                parent = states.get(parent_name)
                if parent is not None and not bool(parent.signal):
                    allowed = False
                    break
            allow_map[name] = allowed

        gated_map = {name: (raw_map[name] if allow_map.get(name, True) else 0) for name in raw_map}
        return {"allow_map": allow_map, "raw_map": raw_map, "gated_map": gated_map}

    def build_gate_masks_from_series(self, series_list: Sequence[Mapping[str, Any]]) -> dict[str, list[bool]]:
        """
        Build per-series hierarchy constraint masks using downward flags from coarser series.
        Each series entry should provide:
          - id or name (used as output key)
          - timestamps or data (list of records with "ts")
          - downward_flags (optional list of bool/int flags)
        If downward_flags is missing, the series is treated as unconstrained.
        """
        if not series_list:
            return {}
        meta: list[dict[str, Any]] = []
        for idx, series in enumerate(series_list):
            series_id = series.get("id") or series.get("name") or f"series-{idx}"
            timestamps = list(series.get("timestamps") or [])
            if not timestamps:
                data = series.get("data") or []
                timestamps = [rec.get("ts") for rec in data if isinstance(rec, Mapping) and "ts" in rec]
            flags = series.get("downward_flags")
            windows = None
            if flags is not None:
                normalized = _normalize_flags(flags, len(timestamps), False)
                windows = _truthy_windows(normalized, timestamps)
            meta.append({"id": series_id, "timestamps": timestamps, "windows": windows})

        masks: dict[str, list[bool]] = {}
        for idx, entry in enumerate(meta):
            timestamps = entry["timestamps"]
            mask = [True for _ in range(len(timestamps))]
            for parent in meta[:idx]:
                windows = parent["windows"]
                if windows is None:
                    continue
                if not windows:
                    mask = [False for _ in range(len(timestamps))]
                    break
                parent_mask = _map_windows_to_mask(windows, timestamps)
                mask = [mask[i] and parent_mask[i] for i in range(len(mask))]
            masks[entry["id"]] = mask
        return masks
