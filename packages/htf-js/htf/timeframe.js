// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
((global) => {
  "use strict";

  const HTF = global.HTF || (global.HTF = {});

  const TIME_COLUMN_DEFAULTS = {
    year: ["year", "Year", "YEAR", "yyyy", "YYYY"],
    month: ["month", "Month", "MONTH", "mm", "MM"],
    day: ["day", "Day", "DAY", "dd", "DD"],
    hour: ["hour", "Hour", "HOUR", "hh", "HH"],
    minute: ["minute", "Minute", "MINUTE", "min", "MIN"],
    second: ["second", "Second", "SECOND", "sec", "SEC", "ss", "SS"],
  };

  const TIME_UNITS = [
    { key: "year", label: "Year" },
    { key: "month", label: "Month" },
    { key: "day", label: "Day" },
    { key: "hour", label: "Hour" },
    { key: "minute", label: "Minute" },
    { key: "second", label: "Second" },
  ];

  const INT_PARAMS = new Set([
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
  ]);
  const FLOAT_PARAMS = new Set(["percentile"]);
  const BOOL_PARAMS = new Set(["include_current"]);

  const SIGNAL_VALUE_ATTRS = {
    ValueVsRollingPercentile: ["last_threshold"],
    ValueVsRollingPercentileWithThreshold: ["last_threshold"],
    SignalRunLengthReached: ["current_run", "tail_remaining"],
    SignalRunLengthReachedHistoryPercentile: ["current_run", "current_threshold", "last_threshold", "tail_remaining"],
    SignalRunInterrupted: ["current_run", "tail_remaining"],
    SignalRunLengthVsHistoryPercentile: ["current_run", "tail_remaining"],
    SignalValueVsLastTrueReference: ["last_reference_value"],
    SignalValueVsLastTargetForBase: ["last_target_value"],
    SignalValueVsPrevious: ["previous_value"],
    SignalValueVsLastSignalRunStatistic: ["last_statistic"],
    SignalEMAFastSlowComparison: ["ema_1", "ema_2"],
    SignalEMADiffVsHistoryPercentile: ["ema_1", "ema_2", "last_abs_diff", "last_threshold"],
    SignalIntervalBetweenMarkers: ["last_interval_length"],
  };

  const parseBool = (value, fallback = false) => {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const raw = value.trim().toLowerCase();
      if (["true", "1", "yes", "y"].includes(raw)) {
        return true;
      }
      if (["false", "0", "no", "n"].includes(raw)) {
        return false;
      }
    }
    if (value === null || value === undefined) {
      return fallback;
    }
    return Boolean(value);
  };

  const parseTargetValue = (value) => {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const raw = value.trim();
      if (!raw) {
        return raw;
      }
      if (raw.toLowerCase() === "true") {
        return true;
      }
      if (raw.toLowerCase() === "false") {
        return false;
      }
      const num = Number(raw);
      if (Number.isFinite(num)) {
        return Number.isInteger(num) ? Math.trunc(num) : num;
      }
      return raw;
    }
    return value;
  };

  const coerceParam = (name, value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    if (BOOL_PARAMS.has(name)) {
      return parseBool(value, false);
    }
    if (INT_PARAMS.has(name)) {
      const num = Number(value);
      return Number.isFinite(num) ? Math.trunc(num) : null;
    }
    if (FLOAT_PARAMS.has(name)) {
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    }
    if (name === "true_value") {
      return parseTargetValue(value);
    }
    if (name === "target_value") {
      return parseTargetValue(value);
    }
    return value;
  };

  const buildSignalDefsMap = (defs) => {
    if (!defs) {
      return new Map();
    }
    if (defs instanceof Map) {
      return defs;
    }
    const map = new Map();
    if (Array.isArray(defs)) {
      defs.forEach((def) => {
        if (def && def.type) {
          map.set(def.type, def);
        }
      });
      return map;
    }
    if (typeof defs === "object") {
      Object.values(defs).forEach((def) => {
        if (def && def.type) {
          map.set(def.type, def);
        }
      });
    }
    return map;
  };

  const detectTimeColumns = (records) => {
    const keys = new Set();
    records.forEach((rec) => {
      if (!rec) {
        return;
      }
      Object.keys(rec).forEach((key) => {
        keys.add(key);
      });
    });
    const cols = [];
    TIME_UNITS.forEach((unit) => {
      const aliases = TIME_COLUMN_DEFAULTS[unit.key] || [];
      const found = aliases.find((alias) => keys.has(alias));
      if (found) {
        cols.push(found);
      }
    });
    return cols;
  };

  const parseTimestamp = (value) => {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) {
      return null;
    }
    return dt;
  };

  const buildTimestampColumns = (timestamps, existingCols) => {
    if (!timestamps || !timestamps.length) {
      return { cols: existingCols.slice(), computed: {} };
    }
    const cols = existingCols.slice();
    const computed = {};
    const dates = timestamps.map((ts) => parseTimestamp(ts));
    TIME_UNITS.forEach((unit) => {
      const aliases = TIME_COLUMN_DEFAULTS[unit.key] || [];
      if (aliases.some((alias) => cols.includes(alias))) {
        return;
      }
      const values = dates.map((dt) => {
        if (!dt) {
          return null;
        }
        switch (unit.key) {
          case "year":
            return dt.getUTCFullYear();
          case "month":
            return dt.getUTCMonth() + 1;
          case "day":
            return dt.getUTCDate();
          case "hour":
            return dt.getUTCHours();
          case "minute":
            return dt.getUTCMinutes();
          case "second":
            return dt.getUTCSeconds();
          default:
            return null;
        }
      });
      computed[unit.label] = values;
      cols.push(unit.label);
    });
    return { cols, computed };
  };

  const utils = HTF.utils;
  if (
    !utils ||
    typeof utils.normalizeFlagSeries !== "function" ||
    typeof utils.truthyWindows !== "function" ||
    typeof utils.mapWindowsToMask !== "function"
  ) {
    throw new Error("HTF.utils with normalizeFlagSeries/truthyWindows/mapWindowsToMask is required");
  }
  const { normalizeFlagSeries, truthyWindows, mapWindowsToMask } = utils;

  const extractSeriesTimestamps = (series) => {
    if (!series) {
      return [];
    }
    if (Array.isArray(series.timestamps)) {
      return series.timestamps;
    }
    const data = Array.isArray(series.data) ? series.data : [];
    return data.map((point) => point.ts ?? point.timestamp).filter((val) => val !== undefined);
  };

  const collectSignalNodes = (roots) => {
    const nodes = [];
    const visited = new Set();
    const visit = (node) => {
      if (!node || !node.id || visited.has(node.id)) {
        return;
      }
      visited.add(node.id);
      nodes.push(node);
      const children = node.children || {};
      Object.values(children).forEach((list) => {
        (list || []).forEach((child) => {
          visit(child);
        });
      });
    };
    (roots || []).forEach((root) => {
      visit(root);
    });
    return nodes;
  };

  const buildEvaluationOrder = (roots) => {
    const ordered = [];
    const visited = new Set();
    const visit = (node) => {
      if (!node || !node.id || visited.has(node.id)) {
        return;
      }
      visited.add(node.id);
      const children = node.children || {};
      Object.values(children).forEach((list) => {
        (list || []).forEach((child) => {
          visit(child);
        });
      });
      ordered.push(node);
    };
    (roots || []).forEach((root) => {
      visit(root);
    });
    return ordered;
  };

  const buildNodeDependencies = (node, defsMap) => {
    const singles = {};
    const lists = {};
    const def = defsMap && node && node.type ? defsMap.get(node.type) : null;
    if (def && Array.isArray(def.params)) {
      def.params.forEach((param) => {
        const name = param.name;
        const kind = param.kind;
        if (!name) {
          return;
        }
        const children = (node.children && node.children[name]) || [];
        if (kind === "signal") {
          const child = children[0];
          singles[name] = child ? child.id : null;
        } else if (kind === "signal-list") {
          lists[name] = children.filter(Boolean).map((child) => child.id);
        }
      });
      return { singles, lists };
    }
    const children = node.children || {};
    Object.keys(children).forEach((name) => {
      const list = children[name] || [];
      if (name === "signal_keys") {
        lists[name] = list.filter(Boolean).map((child) => child.id);
      } else {
        const child = list[0];
        singles[name] = child ? child.id : null;
      }
    });
    return { singles, lists };
  };

  const buildPointFeatures = (record) => {
    const features = {};
    if (!record || typeof record !== "object") {
      return features;
    }
    if (record.values && typeof record.values === "object") {
      Object.entries(record.values).forEach(([key, val]) => {
        features[key] = val;
      });
    }
    if (Object.hasOwn(record, "value")) {
      features.value = record.value;
    }
    return features;
  };

  const getSignalClass = (type) => {
    const registry = global.HTF && global.HTF.signals ? global.HTF.signals : null;
    if (!registry || !type) {
      return null;
    }
    return registry[type] || null;
  };

  class TimeframeConfig {
    constructor({ name, window_size, max_buffer = 1024, role = "LTF" } = {}) {
      this.name = name;
      this.window_size = Number(window_size);
      this.max_buffer = Number(max_buffer);
      this.role = String(role || "LTF").toUpperCase();

      if (!Number.isFinite(this.window_size) || this.window_size <= 0) {
        throw new Error("window_size must be > 0");
      }
      if (!Number.isFinite(this.max_buffer) || this.max_buffer <= 0) {
        throw new Error("max_buffer must be > 0");
      }
    }
  }

  class FeatureModule {
    constructor() {
      this.last_features = {};
    }

    compute(_window) {
      throw new Error("compute() must be implemented by subclasses");
    }

    update(window) {
      this.last_features = this.compute(window);
      return this.last_features;
    }
  }

  class TimeframeView {
    constructor({ config, feature_module = null, feature_fn = null, signal_fn = null } = {}) {
      if (!config) {
        throw new Error("TimeframeView requires a config");
      }
      this.config = config;
      this.feature_module = feature_module;
      this.feature_fn = feature_fn;
      this.signal_fn = signal_fn;

      this.buffer = [];
      this.features = {};
      this.signal = null;
    }

    reset() {
      this.buffer = [];
      this.features = {};
      this.signal = null;
      if (this.feature_module && Object.hasOwn(this.feature_module, "last_features")) {
        this.feature_module.last_features = {};
      }
    }

    get name() {
      return this.config.name;
    }

    get role() {
      return this.config.role;
    }

    get buffer_size() {
      return this.buffer.length;
    }

    get is_warm() {
      return this.buffer.length >= this.config.window_size;
    }

    _update_buffer(record) {
      this.buffer.push({ ...record });
      const excess = this.buffer.length - this.config.max_buffer;
      if (excess > 0) {
        this.buffer.splice(0, excess);
      }
    }

    _get_window() {
      if (this.buffer.length <= this.config.window_size) {
        return this.buffer.slice();
      }
      return this.buffer.slice(-this.config.window_size);
    }

    _update_features_and_signal() {
      const window = this._get_window();
      let feats = {};
      if (this.feature_module) {
        feats = this.feature_module.update(window);
      } else if (this.feature_fn) {
        feats = this.feature_fn(window);
      } else if (window.length) {
        feats = { ...window[window.length - 1] };
      }

      this.features = feats;
      if (this.signal_fn) {
        this.signal = this.signal_fn(this.features);
      } else {
        this.signal = null;
      }
    }

    on_new_record(record) {
      this._update_buffer(record);
      this._update_features_and_signal();
      return this.signal;
    }

    export_signal_dataframe({
      signal_type,
      signal_alias,
      include_dependencies = false,
      include_values = false,
      hierar_constraint_series = null,
      timeframe_series = null,
      signal_graph = null,
      signal_defs = null,
      timestamp_key = "timestamp",
      current_series_id = null,
    } = {}) {
      if (!signal_type || !signal_alias) {
        throw new Error("signal_type and signal_alias are required");
      }

      const records = this.buffer.slice();
      if (!records.length) {
        return [];
      }

      const timeCols = detectTimeColumns(records);
      const tsCandidates = [];
      if (timestamp_key) {
        tsCandidates.push(timestamp_key);
      }
      tsCandidates.push("timestamp", "ts");
      const tsKey = tsCandidates.find((key) => records.some((rec) => rec && Object.hasOwn(rec, key)));
      const timestamps = tsKey ? records.map((rec) => (rec ? rec[tsKey] : null)) : [];
      const { cols: orderedTimeCols, computed: computedTimeCols } = timestamps.length
        ? buildTimestampColumns(timestamps, timeCols)
        : { cols: timeCols, computed: {} };

      if ((include_dependencies || include_values) && !signal_graph) {
        throw new Error("signal_graph is required when include_dependencies or include_values is true");
      }

      const defsMap = buildSignalDefsMap(signal_defs);

      const resolveRoots = (graph) => {
        if (!graph) {
          return [];
        }
        if (Array.isArray(graph)) {
          return graph.filter((node) => node && typeof node === "object");
        }
        const roots = graph.items || graph.roots || graph.signals || [];
        return Array.isArray(roots) ? roots.filter((node) => node && typeof node === "object") : [];
      };

      const nodeAlias = (node) => {
        const alias = node && typeof node.alias === "string" ? node.alias.trim() : "";
        return alias || String(node.type || "");
      };

      const roots = resolveRoots(signal_graph);
      const nodes = collectSignalNodes(roots);
      let targetNode = null;
      if (roots.length) {
        nodes.forEach((node) => {
          if (!node || String(node.type) !== String(signal_type)) {
            return;
          }
          if (nodeAlias(node) === signal_alias) {
            if (targetNode) {
              throw new Error("signal_type and signal_alias must identify a unique signal");
            }
            targetNode = node;
          }
        });
      }
      if (roots.length && !targetNode) {
        throw new Error("signal_type and signal_alias did not match any signal in signal_graph");
      }

      const computeOutputs = (recs, rootsIn, collectValues) => {
        const ordered = buildEvaluationOrder(rootsIn);
        const runners = new Map();
        ordered.forEach((node) => {
          if (!node || !node.id) {
            return;
          }
          const deps = buildNodeDependencies(node, defsMap);
          const params = node.params || {};
          const options = {};
          Object.entries(params).forEach(([key, val]) => {
            options[key] = coerceParam(key, val);
          });
          Object.entries(deps.singles).forEach(([name, depId]) => {
            if (depId) {
              options[name] = depId;
            }
          });
          Object.entries(deps.lists).forEach(([name, depIds]) => {
            options[name] = depIds;
          });
          const SignalClass = getSignalClass(node.type);
          let instance = null;
          if (typeof SignalClass === "function") {
            try {
              instance = new SignalClass(options);
            } catch (_err) {
              instance = null;
            }
          }
          runners.set(node.id, { instance, deps, type: node.type, node });
        });

        const outputs = new Map();
        runners.forEach((_value, key) => {
          outputs.set(key, []);
        });

        const valueData = {};
        const valueOrder = [];
        if (collectValues) {
          runners.forEach((runner) => {
            const attrs = SIGNAL_VALUE_ATTRS[runner.type] || [];
            const baseName = nodeAlias(runner.node);
            attrs.forEach((attr) => {
              const col = `${baseName}_${attr}`;
              if (!Object.hasOwn(valueData, col)) {
                valueData[col] = [];
                valueOrder.push(col);
              }
            });
          });
        }

        recs.forEach((rec) => {
          const stepOutputs = {};
          const baseFeatures = buildPointFeatures(rec);
          ordered.forEach((node) => {
            const runner = runners.get(node.id);
            if (!runner) {
              return;
            }
            const features = { ...baseFeatures };
            Object.values(runner.deps.singles).forEach((depId) => {
              if (depId) {
                features[depId] = stepOutputs[depId] || 0;
              }
            });
            Object.values(runner.deps.lists).forEach((depIds) => {
              depIds.forEach((depId) => {
                features[depId] = stepOutputs[depId] || 0;
              });
            });
            let value = 0;
            if (runner.instance && typeof runner.instance.update === "function") {
              value = runner.instance.update(features);
            }
            const normalized = value ? 1 : 0;
            stepOutputs[node.id] = normalized;
            outputs.get(node.id).push(normalized);

            if (collectValues) {
              const attrs = SIGNAL_VALUE_ATTRS[runner.type] || [];
              const baseName = nodeAlias(runner.node);
              attrs.forEach((attr) => {
                const col = `${baseName}_${attr}`;
                const val = runner.instance ? runner.instance[attr] : null;
                valueData[col].push(typeof val === "boolean" ? Number(val) : val);
              });
            }
          });
        });

        return { outputs, valueData, valueOrder, ordered };
      };

      let outputs = new Map();
      let valueData = {};
      let valueOrder = [];
      let depNodes = [];
      let targetOutputs = [];

      if (targetNode) {
        const result = computeOutputs(records, [targetNode], include_values);
        outputs = result.outputs;
        valueData = result.valueData;
        valueOrder = result.valueOrder;
        depNodes = result.ordered.slice(0, -1);
        targetOutputs = outputs.get(targetNode.id) || new Array(records.length).fill(0);
      } else {
        const aliasKey = signal_alias;
        const typeKey = signal_type;
        targetOutputs = records.map((rec) => {
          if (!rec) {
            return 0;
          }
          const raw = Object.hasOwn(rec, aliasKey) ? rec[aliasKey] : rec[typeKey];
          return raw ? 1 : 0;
        });
      }

      const currentId = current_series_id || this.name;
      const currentTimestamps =
        timestamps.length && timestamps.every((ts) => ts !== null && ts !== undefined) ? timestamps : [];
      const extMasks = {};
      const calcMasks = {};
      const hierarConstraintCols = {};
      const hierarConstraintOrder = [];

      const findSeriesIndex = (seriesList, seriesId) => {
        for (let i = 0; i < seriesList.length; i += 1) {
          const series = seriesList[i];
          const sid = series.id || series.name || `series-${i}`;
          if (sid === seriesId || series.name === seriesId) {
            return i;
          }
        }
        return Math.max(0, seriesList.length - 1);
      };

      let higherSeriesOrder = [];
      if (currentTimestamps.length) {
        if (Array.isArray(hierar_constraint_series)) {
          const extList = hierar_constraint_series;
          const extIdx = findSeriesIndex(extList, currentId);
          const higherExt = extIdx > 0 ? extList.slice(0, extIdx) : [];
          higherSeriesOrder = higherExt.map((series, idx) => series.name || series.id || `series-${idx}`);
          higherExt.forEach((series, idx) => {
            const seriesName = series.name || series.id || `series-${idx}`;
            const flags = series.downward_flags;
            const ts = extractSeriesTimestamps(series);
            let mask = new Array(currentTimestamps.length).fill(true);
            if (ts.length && ts.every((t) => t !== null && t !== undefined) && flags !== null && flags !== undefined) {
              const windows = truthyWindows(normalizeFlagSeries(flags, ts.length, false), ts);
              mask = mapWindowsToMask(windows, currentTimestamps);
            }
            extMasks[seriesName] = mask;
          });
        }

        if (Array.isArray(timeframe_series)) {
          const calcList = timeframe_series;
          const calcIdx = findSeriesIndex(calcList, currentId);
          const higherCalc = calcIdx > 0 ? calcList.slice(0, calcIdx) : [];
          if (!higherSeriesOrder.length) {
            higherSeriesOrder = higherCalc.map((series, idx) => series.name || series.id || `series-${idx}`);
          }
          higherCalc.forEach((series, idx) => {
            const seriesName = series.name || series.id || `series-${idx}`;
            const downId = series.signals ? series.signals.downwardSignalId : "";
            const ts = extractSeriesTimestamps(series);
            let mask = new Array(currentTimestamps.length).fill(true);
            if (ts.length && ts.every((t) => t !== null && t !== undefined) && downId) {
              const rootsIn = resolveRoots(series.signals ? series.signals.items : null);
              const result = computeOutputs(series.data || [], rootsIn, false);
              const flags = result.outputs.get(downId) || [];
              if (flags.length) {
                const windows = truthyWindows(normalizeFlagSeries(flags, ts.length, false), ts);
                mask = mapWindowsToMask(windows, currentTimestamps);
              }
            }
            calcMasks[seriesName] = mask;
          });
        }
      }

      higherSeriesOrder.forEach((seriesName) => {
        if (extMasks[seriesName]) {
          const col = `hierar_constraint_ext_${seriesName}`;
          hierarConstraintOrder.push(col);
          hierarConstraintCols[col] = extMasks[seriesName].map((v) => (v ? 1 : 0));
        }
        if (calcMasks[seriesName]) {
          const col = `hierar_constraint_calc_${seriesName}`;
          hierarConstraintOrder.push(col);
          hierarConstraintCols[col] = calcMasks[seriesName].map((v) => (v ? 1 : 0));
        }
        if (extMasks[seriesName] && calcMasks[seriesName]) {
          const col = `hierar_constraint_mismatch_${seriesName}`;
          hierarConstraintOrder.push(col);
          const mismatch = extMasks[seriesName].map((v, idx) => (v !== calcMasks[seriesName][idx] ? 1 : 0));
          hierarConstraintCols[col] = mismatch;
        }
      });

      let hierarConstraintAll = null;
      if (currentTimestamps.length && higherSeriesOrder.length) {
        const effectiveMasks = [];
        higherSeriesOrder.forEach((seriesName) => {
          if (extMasks[seriesName] && calcMasks[seriesName]) {
            effectiveMasks.push(extMasks[seriesName].map((v, idx) => v && calcMasks[seriesName][idx]));
          } else if (extMasks[seriesName]) {
            effectiveMasks.push(extMasks[seriesName]);
          } else if (calcMasks[seriesName]) {
            effectiveMasks.push(calcMasks[seriesName]);
          }
        });
        if (effectiveMasks.length) {
          hierarConstraintAll = currentTimestamps.map((_, idx) => effectiveMasks.every((mask) => mask[idx]));
        } else {
          hierarConstraintAll = currentTimestamps.map(() => true);
        }
      }

      if (hierarConstraintAll) {
        hierarConstraintCols.hierar_constraint_all = hierarConstraintAll.map((v) => (v ? 1 : 0));
        hierarConstraintOrder.push("hierar_constraint_all");
      } else if (currentTimestamps.length && (hierar_constraint_series || timeframe_series)) {
        hierarConstraintAll = currentTimestamps.map(() => true);
        hierarConstraintCols.hierar_constraint_all = hierarConstraintAll.map(() => 1);
        hierarConstraintOrder.push("hierar_constraint_all");
      }

      const columnData = {};
      orderedTimeCols.forEach((col) => {
        if (Object.hasOwn(computedTimeCols, col)) {
          columnData[col] = computedTimeCols[col];
        } else {
          columnData[col] = records.map((rec) => (rec ? rec[col] : null));
        }
      });

      hierarConstraintOrder.forEach((col) => {
        columnData[col] = hierarConstraintCols[col];
      });

      if (include_dependencies && depNodes.length) {
        depNodes.forEach((node) => {
          const col = nodeAlias(node);
          columnData[col] = outputs.get(node.id) || new Array(records.length).fill(0);
        });
      }

      if (hierarConstraintAll) {
        columnData[`${signal_type}_raw`] = targetOutputs;
        columnData[`${signal_type}_gated`] = targetOutputs.map((val, idx) => (hierarConstraintAll[idx] ? val : 0));
      } else {
        columnData[signal_type] = targetOutputs;
      }

      valueOrder.forEach((col) => {
        columnData[col] = valueData[col] || new Array(records.length).fill(null);
      });

      const rows = Array.from({ length: records.length }, () => ({}));
      Object.keys(columnData).forEach((col) => {
        const values = columnData[col] || [];
        for (let i = 0; i < rows.length; i += 1) {
          rows[i][col] = i < values.length ? values[i] : null;
        }
      });
      return rows;
    }

    export_buffer_as_dataframe() {
      return this.buffer.map((rec) => ({ ...rec }));
    }
  }

  HTF.TimeframeConfig = TimeframeConfig;
  HTF.FeatureModule = FeatureModule;
  HTF.TimeframeView = TimeframeView;
})(typeof window !== "undefined" ? window : globalThis);
