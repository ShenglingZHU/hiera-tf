# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 ZHU Shengling
"""
Demo 3 (Python): apply a higher-timeframe signal as a hierarchical constraint.

Setup:
- 15m timeframe (higher granularity / coarser) produces a constraint signal
- 5m timeframe (lower granularity / finer) produces a base signal
- HierarConstraintCoordinator gates the 5m signal using the latest 15m signal
- HTF data uses a ramping baseline to force the constraint signal to toggle
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import Any

from htf import (
    HierarConstraintCoordinator,
    TimeframeConfig,
    TimeframeState,
    TimeframeView,
    ValueVsRollingPercentile,
)


def build_records(
    start_ts: datetime,
    count: int,
    step_seconds: int,
    seed: int,
    *,
    baseline_fn=None,
    noise_range: float = 4.0,
) -> list[dict[str, Any]]:
    """Build deterministic random records with time columns and a TEMP value."""
    rng = random.Random(seed)
    records: list[dict[str, Any]] = []
    current = start_ts

    for idx in range(count):
        # TEMP follows a baseline plus random noise to keep values realistic.
        baseline = baseline_fn(idx) if baseline_fn else 20.0
        temp = baseline + rng.uniform(-noise_range, noise_range)
        records.append(
            {
                "timestamp": current,
                "Year": current.year,
                "Month": current.month,
                "Day": current.day,
                "Hour": current.hour,
                "Minute": current.minute,
                "Second": current.second,
                "TEMP": round(temp, 2),
            }
        )
        current += timedelta(seconds=step_seconds)

    return records


def main() -> None:
    start = datetime(2025, 1, 1, 0, 0, 0)

    total_days = 4
    ltf_count = total_days * 24 * 12
    htf_count = total_days * 24 * 4

    # Build a 5-minute (LTF) series and a 15-minute (HTF) series over the same span.
    records_5m = build_records(start, count=ltf_count, step_seconds=300, seed=11)

    def htf_baseline(idx: int) -> float:
        # 6-hour ramps create periods that push above the recent 90th percentile.
        block_size = 24
        progress = idx % block_size
        return 16.0 + progress * 0.6

    records_15m = build_records(
        start,
        count=htf_count,
        step_seconds=900,
        seed=23,
        baseline_fn=htf_baseline,
        noise_range=1.2,
    )

    # Base signal on the 5m timeframe.
    ltf_signal = ValueVsRollingPercentile(
        value_key="TEMP",
        window_size=36,
        percentile=80,
        comparison="lt",
    )

    # Hierarchical constraint signal on the 15m timeframe.
    htf_signal = ValueVsRollingPercentile(
        value_key="TEMP",
        window_size=12,
        percentile=90,
        comparison="lt",
    )

    tf_5m = TimeframeView(
        config=TimeframeConfig(
            name="5m",
            window_size=18,
            max_buffer=len(records_5m),
            role="LTF",
        ),
        signal_fn=lambda feats: ltf_signal(feats),
    )
    tf_15m = TimeframeView(
        config=TimeframeConfig(
            name="15m",
            window_size=6,
            max_buffer=len(records_15m),
            role="HTF",
        ),
        signal_fn=lambda feats: htf_signal(feats),
    )

    coordinator = HierarConstraintCoordinator(order=["15m", "5m"])

    results: list[dict[str, Any]] = []
    htf_index = 0

    for record in records_5m:
        # Update the 15m timeframe when the 5m timestamp hits a 15-minute boundary.
        if record["Minute"] % 15 == 0 and record["Second"] == 0 and htf_index < len(records_15m):
            tf_15m.on_new_record(records_15m[htf_index])
            htf_index += 1

        ltf_raw = tf_5m.on_new_record(record)

        # Build states for the coordinator using the latest signals.
        states = {
            "15m": TimeframeState(
                name=tf_15m.name,
                role=tf_15m.role,
                features=tf_15m.features,
                signal=tf_15m.signal,
            ),
            "5m": TimeframeState(
                name=tf_5m.name,
                role=tf_5m.role,
                features=tf_5m.features,
                signal=ltf_raw,
            ),
        }
        coordination = coordinator.update(states, record)
        ltf_gated = coordination["gated_map"]["5m"]

        results.append(
            {
                "timestamp": record["timestamp"],
                "TEMP": record["TEMP"],
                "htf_signal": tf_15m.signal,
                "htf_threshold": htf_signal.last_threshold,
                "ltf_raw": ltf_raw,
                "ltf_gated": ltf_gated,
                "ltf_threshold": ltf_signal.last_threshold,
            }
        )

    # Show how the HTF constraint affects the LTF signal near the end of the run.
    print("timestamp | TEMP | HTF(15m) | LTF_raw | LTF_gated | LTF_pctl | HTF_pctl")
    for row in results[-12:]:
        ltf_threshold = row["ltf_threshold"]
        htf_threshold = row["htf_threshold"]
        ltf_threshold_str = f"{ltf_threshold:.2f}" if ltf_threshold is not None else "None"
        htf_threshold_str = f"{htf_threshold:.2f}" if htf_threshold is not None else "None"
        print(
            f"{row['timestamp']} | {row['TEMP']:5.2f} | "
            f"{row['htf_signal']} | {row['ltf_raw']} | {row['ltf_gated']} | "
            f"{ltf_threshold_str} | {htf_threshold_str}"
        )


if __name__ == "__main__":
    main()
