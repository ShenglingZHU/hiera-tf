# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 ZHU Shengling
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any, Dict

from .coordinator import MultiScaleCoordinator, TimeframeState
from .timeframe import TimeframeView


@dataclass
class HTFFramework:
    timeframes: Dict[str, TimeframeView]
    coordinator: MultiScaleCoordinator

    last_output: Dict[str, Any] = field(default_factory=dict, init=False)

    def reset(self) -> None:
        for tf in self.timeframes.values():
            tf.reset()
        self.last_output = {}

    def on_new_record(self, record: Mapping[str, Any]) -> Dict[str, Any]:
        for tf in self.timeframes.values():
            tf.on_new_record(record)

        states: Dict[str, TimeframeState] = {
            name: TimeframeState(
                name=tf.name,
                role=tf.role,
                features=tf.features,
                signal=tf.signal,
            )
            for name, tf in self.timeframes.items()
        }

        coord = self.coordinator.update(states, record)
        self.last_output = {"states": states, "coordination": coord}
        return self.last_output
