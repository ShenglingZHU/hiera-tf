# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 ZHU Shengling
"""
Demo 2 (Python): create a signal on a TimeframeView using the TEMP column.

The signal used here is ValueVsRollingPercentile with:
- percentile=80
- comparison="lt"
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import Any

from htf import TimeframeConfig, TimeframeView, ValueVsRollingPercentile


def build_records(
    start_ts: datetime,
    count: int,
    step_seconds: int,
    seed: int,
) -> list[dict[str, Any]]:
    """Build deterministic random records with time columns and a TEMP value."""
    rng = random.Random(seed)
    records: list[dict[str, Any]] = []
    current = start_ts

    for _ in range(count):
        # Slight random walk around a baseline temperature.
        temp = 22.0 + rng.uniform(-3.5, 3.5)
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
    # Build a 1-hour series with 48 samples (2 days of data).
    records = build_records(
        start_ts=datetime(2025, 1, 1, 0, 0, 0),
        count=48,
        step_seconds=3600,
        seed=7,
    )

    # ValueVsRollingPercentile is stateful; keep one instance per signal stream.
    percentile_signal = ValueVsRollingPercentile(
        value_key="TEMP",
        window_size=12,
        percentile=80,
        comparison="lt",
    )

    def signal_fn(features: dict[str, Any]) -> int:
        # The signal compares TEMP against the 80th percentile of recent history.
        return percentile_signal(features)

    timeframe = TimeframeView(
        config=TimeframeConfig(
            name="demo-1h-temp",
            window_size=6,
            max_buffer=200,
            role="LTF",
        ),
        signal_fn=signal_fn,
    )

    results: list[dict[str, Any]] = []
    for record in records:
        signal_value = timeframe.on_new_record(record)
        results.append(
            {
                "timestamp": record["timestamp"],
                "TEMP": record["TEMP"],
                "signal": signal_value,
                "threshold": percentile_signal.last_threshold,
            }
        )

    # Print the tail of the series so the signal and thresholds are visible.
    print("timestamp | TEMP | signal | percentile_threshold")
    for row in results[-8:]:
        threshold = row["threshold"]
        threshold_str = f"{threshold:.2f}" if threshold is not None else "None"
        print(f"{row['timestamp']} | {row['TEMP']:5.2f} | {row['signal']} | {threshold_str}")


if __name__ == "__main__":
    main()
