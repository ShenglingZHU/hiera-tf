// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
/*
Demo 3 (JavaScript): apply a higher-timeframe signal as a hierarchical constraint.

Setup:
- 15m timeframe (higher granularity / coarser) produces a constraint signal
- 5m timeframe (lower granularity / finer) produces a base signal
- HierarConstraintCoordinator gates the 5m signal using the latest 15m signal
- HTF data uses a ramping baseline to force the constraint signal to toggle
*/

const HTF = require("..");

const makeRng = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const buildRecords = ({ start, count, stepSeconds, seed, baselineFn, noiseRange = 4 }) => {
  const rng = makeRng(seed);
  const records = [];
  for (let i = 0; i < count; i += 1) {
    const ts = new Date(start.getTime() + i * stepSeconds * 1000);
    const baseline = baselineFn ? baselineFn(i) : 20;
    const temp = baseline + (rng() * 2 - 1) * noiseRange;
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
  const start = new Date(2025, 0, 1, 0, 0, 0);
  const totalDays = 4;
  const ltfCount = totalDays * 24 * 12;
  const htfCount = totalDays * 24 * 4;

  const records5m = buildRecords({ start, count: ltfCount, stepSeconds: 300, seed: 11 });

  const htfBaseline = (index) => {
    const blockSize = 24;
    const progress = index % blockSize;
    return 16 + progress * 0.6;
  };

  const records15m = buildRecords({
    start,
    count: htfCount,
    stepSeconds: 900,
    seed: 23,
    baselineFn: htfBaseline,
    noiseRange: 1.2,
  });

  const ltfSignal = new HTF.ValueVsRollingPercentile({
    value_key: "TEMP",
    window_size: 36,
    percentile: 80,
    comparison: "lt",
  });
  const htfSignal = new HTF.ValueVsRollingPercentile({
    value_key: "TEMP",
    window_size: 12,
    percentile: 90,
    comparison: "lt",
  });

  const tf5m = new HTF.TimeframeView({
    config: new HTF.TimeframeConfig({
      name: "5m",
      window_size: 18,
      max_buffer: records5m.length,
      role: "LTF",
    }),
    signal_fn: (features) => ltfSignal.update(features),
  });
  const tf15m = new HTF.TimeframeView({
    config: new HTF.TimeframeConfig({
      name: "15m",
      window_size: 6,
      max_buffer: records15m.length,
      role: "HTF",
    }),
    signal_fn: (features) => htfSignal.update(features),
  });

  const coordinator = new HTF.HierarConstraintCoordinator({ order: ["15m", "5m"] });

  const results = [];
  let htfIndex = 0;

  records5m.forEach((record) => {
    if (record.Minute % 15 === 0 && record.Second === 0 && htfIndex < records15m.length) {
      tf15m.on_new_record(records15m[htfIndex]);
      htfIndex += 1;
    }

    const ltfRaw = tf5m.on_new_record(record);
    const states = {
      "15m": new HTF.TimeframeState({
        name: tf15m.name,
        role: tf15m.role,
        features: tf15m.features,
        signal: tf15m.signal,
      }),
      "5m": new HTF.TimeframeState({
        name: tf5m.name,
        role: tf5m.role,
        features: tf5m.features,
        signal: ltfRaw,
      }),
    };
    const coordination = coordinator.update(states, record);
    const ltfGated = coordination.gated_map["5m"];

    results.push({
      timestamp: record.timestamp,
      TEMP: record.TEMP,
      htfSignal: tf15m.signal,
      htfThreshold: htfSignal.last_threshold,
      ltfRaw,
      ltfGated,
      ltfThreshold: ltfSignal.last_threshold,
    });
  });

  console.log("timestamp | TEMP | HTF(15m) | LTF_raw | LTF_gated | LTF_pctl | HTF_pctl");
  results.slice(-12).forEach((row) => {
    const ltfThreshold =
      row.ltfThreshold === null || row.ltfThreshold === undefined ? "None" : row.ltfThreshold.toFixed(2);
    const htfThreshold =
      row.htfThreshold === null || row.htfThreshold === undefined ? "None" : row.htfThreshold.toFixed(2);
    console.log(
      `${row.timestamp} | ${row.TEMP.toFixed(2)} | ${row.htfSignal} | ${row.ltfRaw} | ${row.ltfGated} | ${ltfThreshold} | ${htfThreshold}`
    );
  });
};

if (require.main === module) {
  main();
}
