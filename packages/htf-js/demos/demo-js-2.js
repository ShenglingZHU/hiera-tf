// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
/*
Demo 2 (JavaScript): create a signal on a TimeframeView using the TEMP column.

The signal used here is ValueVsRollingPercentile with:
- percentile=80
- comparison="lt"
*/

const HTF = require("..");

const makeRng = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const buildRecords = ({ start, count, stepSeconds, seed }) => {
  const rng = makeRng(seed);
  const records = [];
  for (let i = 0; i < count; i += 1) {
    const ts = new Date(start.getTime() + i * stepSeconds * 1000);
    const temp = 22 + (rng() * 7 - 3.5);
    records.push({
      timestamp: ts,
      Year: ts.getFullYear(),
      Month: ts.getMonth() + 1,
      Day: ts.getDate(),
      Hour: ts.getHours(),
      Minute: ts.getMinutes(),
      Second: ts.getSeconds(),
      TEMP: Number(temp.toFixed(2)),
    });
  }
  return records;
};

const main = () => {
  const records = buildRecords({
    start: new Date(2025, 0, 1, 0, 0, 0),
    count: 48,
    stepSeconds: 3600,
    seed: 7,
  });

  const percentileSignal = new HTF.ValueVsRollingPercentile({
    value_key: "TEMP",
    window_size: 12,
    percentile: 80,
    comparison: "lt",
  });

  const timeframe = new HTF.TimeframeView({
    config: new HTF.TimeframeConfig({
      name: "demo-1h-temp",
      window_size: 6,
      max_buffer: 200,
      role: "LTF",
    }),
    signal_fn: (features) => percentileSignal.update(features),
  });

  const results = records.map((record) => {
    const signal = timeframe.on_new_record(record);
    return {
      timestamp: record.timestamp,
      TEMP: record.TEMP,
      signal,
      threshold: percentileSignal.last_threshold,
    };
  });

  console.log("timestamp | TEMP | signal | percentile_threshold");
  results.slice(-8).forEach((row) => {
    const threshold = row.threshold === null || row.threshold === undefined ? "None" : row.threshold.toFixed(2);
    console.log(`${row.timestamp} | ${row.TEMP.toFixed(2)} | ${row.signal} | ${threshold}`);
  });
};

if (require.main === module) {
  main();
}
