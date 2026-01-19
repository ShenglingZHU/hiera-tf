// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
((global) => {
  "use strict";

  const HTF = global.HTF || (global.HTF = {});
  const FeatureModule = HTF.FeatureModule;

  const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

  const toFloatList = (seq) => {
    const out = [];
    seq.forEach((val) => {
      if (isNumber(val)) {
        out.push(val);
      }
    });
    return out;
  };

  const mean = (values) => {
    if (!values.length) {
      return null;
    }
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  class SingleFieldStatsFeature extends FeatureModule {
    constructor({ field_name, prefix } = {}) {
      super();
      this.field_name = field_name;
      this.prefix = prefix;
    }

    compute(window) {
      const vals = toFloatList(window.map((rec) => (rec ? rec[this.field_name] : undefined)));
      if (!vals.length) {
        return {
          [`${this.prefix}_count`]: 0,
          [`${this.prefix}_mean`]: null,
          [`${this.prefix}_min`]: null,
          [`${this.prefix}_max`]: null,
        };
      }
      return {
        [`${this.prefix}_count`]: vals.length,
        [`${this.prefix}_mean`]: mean(vals),
        [`${this.prefix}_min`]: Math.min(...vals),
        [`${this.prefix}_max`]: Math.max(...vals),
      };
    }
  }

  class LastRecordEchoFeature extends FeatureModule {
    constructor({ fields } = {}) {
      super();
      this.fields = Array.isArray(fields) ? fields : [];
    }

    compute(window) {
      if (!window.length) {
        const empty = {};
        this.fields.forEach((name) => {
          empty[name] = null;
        });
        return empty;
      }
      const last = window[window.length - 1] || {};
      const out = {};
      this.fields.forEach((name) => {
        out[name] = Object.hasOwn(last, name) ? last[name] : null;
      });
      return out;
    }
  }

  HTF.SingleFieldStatsFeature = SingleFieldStatsFeature;
  HTF.LastRecordEchoFeature = LastRecordEchoFeature;
})(typeof window !== "undefined" ? window : globalThis);
