# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 ZHU Shengling
"""
Demo 1 (Python): create a TimeframeView instance and push random data into it.

This example focuses on the minimal setup for a time series view:
- build synthetic records with Year/Month/Day/Hour/Minute/Second + TEMP
- create TimeframeConfig/TimeframeView
- feed records through on_new_record()
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import Any

from htf import TimeframeConfig, TimeframeView


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
        # TEMP is a synthetic numeric column; values are intentionally small and smooth.
        temp = 18.0 + rng.random() * 10.0
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
    # Build a 5-minute series with 24 samples (2 hours of data).
    records = build_records(
        start_ts=datetime(2025, 1, 1, 0, 0, 0),
        count=24,
        step_seconds=300,
        seed=42,
    )

    # TimeframeView stores a rolling buffer and exposes the latest features/signal.
    config = TimeframeConfig(
        name="demo-5m-temp",
        window_size=6,
        max_buffer=128,
        role="LTF",
    )
    timeframe = TimeframeView(config=config)

    # Push data into the timeframe; without a signal_fn it just stores features.
    for record in records:
        timeframe.on_new_record(record)

    # Inspect the final state after streaming the records.
    print("Buffer size:", timeframe.buffer_size)
    print("Is warm (buffer >= window_size):", timeframe.is_warm)
    print("Latest features (last record):", timeframe.features)
    print("Latest signal (none configured):", timeframe.signal)


if __name__ == "__main__":
    main()
