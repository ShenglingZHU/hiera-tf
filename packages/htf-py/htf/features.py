# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 ZHU Shengling
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from .timeframe import FeatureDict, FeatureModule, Record


def _is_number(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _to_float_list(seq: Sequence[Any]) -> list[float]:
    out: list[float] = []
    for v in seq:
        if _is_number(v):
            out.append(float(v))
    return out


def _mean(values: Sequence[float]) -> float | None:
    if not values:
        return None
    return float(sum(values) / len(values))


@dataclass
class SingleFieldStatsFeature(FeatureModule):
    field_name: str
    prefix: str

    def compute(self, window: Sequence[Record]) -> FeatureDict:
        vals = _to_float_list([rec.get(self.field_name) for rec in window])
        if not vals:
            return {
                f"{self.prefix}_count": 0,
                f"{self.prefix}_mean": None,
                f"{self.prefix}_min": None,
                f"{self.prefix}_max": None,
            }

        return {
            f"{self.prefix}_count": len(vals),
            f"{self.prefix}_mean": _mean(vals),
            f"{self.prefix}_min": min(vals),
            f"{self.prefix}_max": max(vals),
        }


@dataclass
class LastRecordEchoFeature(FeatureModule):
    fields: Sequence[str]

    def compute(self, window: Sequence[Record]) -> FeatureDict:
        if not window:
            return {name: None for name in self.fields}
        last = window[-1]
        return {name: last.get(name) for name in self.fields}
