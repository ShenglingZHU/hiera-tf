// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
(function (global) {
  "use strict";

  const HTF = global.HTF || (global.HTF = {});
  const signalGraph = HTF.signalGraph || {};

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

  class TimeframeState {
    constructor({ name, role, features, signal } = {}) {
      this.name = name;
      this.role = role;
      this.features = features || {};
      this.signal = signal;
    }
  }

  class MultiScaleCoordinator {
    update(_states, _record) {
      throw new Error("update() must be implemented by subclasses");
    }
  }

  class SimpleHTFCoordinator extends MultiScaleCoordinator {
    update(states, _record) {
      const stateValues = states instanceof Map ? Array.from(states.values()) : Object.values(states || {});
      const htfStates = stateValues.filter((state) => state.role === "HTF");
      const ltfEntries = states instanceof Map ? Array.from(states.entries()) : Object.entries(states || {});

      const htfAllow = htfStates.length ? htfStates.every((state) => Boolean(state.signal)) : true;
      const ltfRaw = {};
      const ltfGated = {};

      ltfEntries.forEach(([name, state]) => {
        if (!state || state.role !== "LTF") {
          return;
        }
        ltfRaw[name] = state.signal;
        ltfGated[name] = htfAllow ? state.signal : 0;
      });

      return {
        htf_allow: htfAllow,
        ltf_raw: ltfRaw,
        ltf_gated: ltfGated,
      };
    }
  }

  class HierarConstraintCoordinator extends MultiScaleCoordinator {
    constructor({ order } = {}) {
      super();
      this.order = Array.isArray(order) ? order.slice() : [];
    }

    update(states, _record) {
      const entries = states instanceof Map ? Array.from(states.entries()) : Object.entries(states || {});
      const order = this.order.length ? this.order : entries.map(([name]) => name);
      const stateByName = new Map(entries);
      const allow_map = {};
      const raw_map = {};

      order.forEach((name, idx) => {
        const state = stateByName.get(name);
        if (!state) {
          return;
        }
        raw_map[name] = state.signal;
        let allowed = true;
        for (let i = 0; i < idx; i += 1) {
          const parent = stateByName.get(order[i]);
          if (parent && !parent.signal) {
            allowed = false;
            break;
          }
        }
        allow_map[name] = allowed;
      });

      const gated_map = {};
      Object.keys(raw_map).forEach((name) => {
        gated_map[name] = allow_map[name] ? raw_map[name] : 0;
      });

      return { allow_map, raw_map, gated_map };
    }

    buildGateMasksFromSeries(seriesList, signalCache) {
      if (!Array.isArray(seriesList) || !seriesList.length) {
        return new Map();
      }
      const meta = seriesList.map((series, idx) => {
        const id = series && (series.id || series.name) ? (series.id || series.name) : `series-${idx}`;
        const data = Array.isArray(series && series.data) ? series.data : [];
        const timestamps = data.length ? data.map((point) => point.ts) : Array.isArray(series.timestamps) ? series.timestamps : [];
        const downId = series && series.signals ? series.signals.downwardSignalId : "";
        let windows = null;
        if (downId) {
          const outputs = signalGraph.getSeriesSignalOutputs
            ? signalGraph.getSeriesSignalOutputs(series, signalCache)
            : new Map();
          const flags = normalizeFlagSeries(outputs.get(downId), timestamps.length, false);
          windows = truthyWindows(flags, timestamps);
        }
        return { id, timestamps, windows };
      });

      const masks = new Map();
      meta.forEach((entry, idx) => {
        const timestamps = entry.timestamps || [];
        let mask = new Array(timestamps.length).fill(true);
        for (let i = 0; i < idx; i += 1) {
          const parent = meta[i];
          if (!parent) {
            continue;
          }
          if (parent.windows === null) {
            continue;
          }
          if (!parent.windows.length) {
            mask = new Array(timestamps.length).fill(false);
            break;
          }
          const parentMask = mapWindowsToMask(parent.windows, timestamps);
          for (let j = 0; j < mask.length; j += 1) {
            mask[j] = mask[j] && parentMask[j];
          }
        }
        masks.set(entry.id, mask);
      });

      return masks;
    }
  }

  HTF.TimeframeState = TimeframeState;
  HTF.MultiScaleCoordinator = MultiScaleCoordinator;
  HTF.SimpleHTFCoordinator = SimpleHTFCoordinator;
  HTF.HierarConstraintCoordinator = HierarConstraintCoordinator;
})(typeof window !== "undefined" ? window : globalThis);
