// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
(function (global) {
  "use strict";

  const HTF = global.HTF || (global.HTF = {});

  class HTFFramework {
    constructor({ timeframes, coordinator } = {}) {
      this.timeframes = timeframes || {};
      this.coordinator = coordinator;
      this.last_output = {};
    }

    reset() {
      const values = this.timeframes instanceof Map ? Array.from(this.timeframes.values()) : Object.values(this.timeframes);
      values.forEach((tf) => {
        if (tf && typeof tf.reset === "function") {
          tf.reset();
        }
      });
      this.last_output = {};
    }

    on_new_record(record) {
      const entries = this.timeframes instanceof Map ? Array.from(this.timeframes.entries()) : Object.entries(this.timeframes);
      entries.forEach(([, tf]) => {
        if (tf && typeof tf.on_new_record === "function") {
          tf.on_new_record(record);
        }
      });

      const states = {};
      entries.forEach(([name, tf]) => {
        states[name] = new HTF.TimeframeState({
          name: tf.name,
          role: tf.role,
          features: tf.features,
          signal: tf.signal,
        });
      });

      const coord = this.coordinator ? this.coordinator.update(states, record) : {};
      this.last_output = { states, coordination: coord };
      return this.last_output;
    }
  }

  HTF.HTFFramework = HTFFramework;
})(typeof window !== "undefined" ? window : globalThis);
