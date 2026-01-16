// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
/*
Demo 1 (JavaScript): create a TimeframeView instance and push random data into it.

This example focuses on the minimal setup for a time series view:
- build synthetic records with Year/Month/Day/Hour/Minute/Second + TEMP
- create TimeframeConfig/TimeframeView
- feed records through on_new_record()
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
    const temp = 18 + rng() * 10;
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
    count: 24,
    stepSeconds: 300,
    seed: 42,
  });

  const config = new HTF.TimeframeConfig({
    name: "demo-5m-temp",
    window_size: 6,
    max_buffer: 128,
    role: "LTF",
  });
  const timeframe = new HTF.TimeframeView({ config });

  records.forEach((record) => {
    timeframe.on_new_record(record);
  });

  console.log("Buffer size:", timeframe.buffer_size);
  console.log("Is warm (buffer >= window_size):", timeframe.is_warm);
  console.log("Latest features (last record):", timeframe.features);
  console.log("Latest signal (none configured):", timeframe.signal);
};

if (require.main === module) {
  main();
}
