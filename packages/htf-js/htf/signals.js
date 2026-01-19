// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
((global) => {
  "use strict";

  const HTF = global.HTF || (global.HTF = {});
  const signals = HTF.signals || (HTF.signals = {});
  const signalGraph = HTF.signalGraph || (HTF.signalGraph = {});

  const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
  const DEFAULT_TRACE_LIMIT = 1000;

  const resolveLimit = (value, fallback) => {
    if (value === undefined) {
      return fallback;
    }
    if (value === null) {
      return null;
    }
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return null;
    }
    return Math.trunc(num);
  };

  const trimToLimit = (list, limit) => {
    if (!limit || !Array.isArray(list)) {
      return;
    }
    const excess = list.length - limit;
    if (excess > 0) {
      list.splice(0, excess);
    }
  };

  function computePercentile(values, q) {
    const vals = [];
    for (const v of values || []) {
      if (isNumber(v)) {
        vals.push(v);
      }
    }
    vals.sort((a, b) => a - b);
    const n = vals.length;
    if (n === 0) {
      return null;
    }
    if (q <= 0) {
      return vals[0];
    }
    if (q >= 100) {
      return vals[n - 1];
    }
    const pos = (n - 1) * (q / 100);
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);
    if (lower === upper) {
      return vals[lower];
    }
    const w = pos - lower;
    return vals[lower] * (1 - w) + vals[upper] * w;
  }

  class ValueVsRollingPercentile {
    constructor({
      value_key,
      window_size,
      percentile = 50.0,
      include_current = false,
      min_history = 1,
      comparison = "gt",
    } = {}) {
      this.value_key = value_key;
      this.window_size = window_size;
      this.percentile = percentile;
      this.include_current = include_current;
      this.min_history = min_history;
      this.comparison = String(comparison || "gt").toLowerCase();
      this.history = [];
      this.last_threshold = null;

      if (this.comparison !== "gt" && this.comparison !== "lt") {
        throw new Error("comparison must be 'gt' or 'lt'");
      }
    }

    reset() {
      this.history = [];
      this.last_threshold = null;
    }

    _get_numeric_value(features) {
      if (!features || !this.value_key) {
        return null;
      }
      const raw = features[this.value_key];
      return isNumber(raw) ? raw : null;
    }

    _is_trigger(val, threshold) {
      if (this.comparison === "gt") {
        return val > threshold;
      }
      return val < threshold;
    }

    _compute_signal_and_threshold(val) {
      let signal = 0;
      let threshold = null;

      if (val !== null) {
        if (this.history.length >= this.min_history) {
          const seq = this.include_current ? [...this.history, val] : [...this.history];
          threshold = computePercentile(seq, this.percentile);
          if (threshold !== null && this._is_trigger(val, threshold)) {
            signal = 1;
          }
        }
        this.history.push(val);
        if (this.history.length > this.window_size) {
          this.history.shift();
        }
      }

      return [signal, threshold];
    }

    update(features) {
      const val = this._get_numeric_value(features);
      const [signal, threshold] = this._compute_signal_and_threshold(val);
      this.last_threshold = threshold;
      return signal;
    }
  }

  class ValueVsRollingPercentileWithThreshold extends ValueVsRollingPercentile {
    constructor(options = {}) {
      super(options);
      this.last_threshold = null;
    }

    update(features) {
      const val = this._get_numeric_value(features);
      const [signal, threshold] = this._compute_signal_and_threshold(val);
      this.last_threshold = threshold;
      return signal;
    }
  }

  class SignalRunLengthReached {
    constructor({ signal_key, target_value = 1, min_run_length = 3, post_run_extension = 0 } = {}) {
      this.signal_key = signal_key;
      this.target_value = target_value;
      this.min_run_length = min_run_length;
      this.post_run_extension = post_run_extension;
      this.current_run = 0;
      this.active = false;
      this.tail_remaining = 0;
    }

    reset() {
      this.current_run = 0;
      this.active = false;
      this.tail_remaining = 0;
    }

    update(features) {
      const v = features ? features[this.signal_key] : undefined;

      if (v !== this.target_value) {
        if (this.current_run > 0 && this.active && this.post_run_extension > 0) {
          this.tail_remaining = this.post_run_extension;
        }
        this.current_run = 0;
        this.active = false;
        if (this.tail_remaining > 0) {
          this.tail_remaining -= 1;
          return 1;
        }
        return 0;
      }

      this.current_run += 1;
      this.tail_remaining = 0;

      if (this.active) {
        return 1;
      }
      if (this.current_run >= this.min_run_length) {
        this.active = true;
        return 1;
      }
      return 0;
    }
  }

  class SignalRunLengthReachedHistoryPercentile {
    constructor({
      signal_key,
      target_value = 1,
      history_window = 100,
      percentile = 90.0,
      min_history_runs = 1,
      post_run_extension = 0,
      run_trace_limit = undefined,
    } = {}) {
      this.signal_key = signal_key;
      this.target_value = target_value;
      this.history_window = history_window;
      this.percentile = percentile;
      this.min_history_runs = min_history_runs;
      this.post_run_extension = post_run_extension;

      this.current_run = 0;
      this.history_runs = [];
      this.current_threshold = null;
      this.last_threshold = null;
      this.active = false;
      this.tail_remaining = 0;
      this.run_trace = [];

      if (!Number.isFinite(this.history_window) || this.history_window <= 0) {
        throw new Error("history_window must be > 0");
      }
      if (!(this.percentile >= 0 && this.percentile <= 100)) {
        throw new Error("percentile must be between 0 and 100");
      }
      if (!Number.isFinite(this.min_history_runs) || this.min_history_runs < 1) {
        throw new Error("min_history_runs must be >= 1");
      }
      if (this.min_history_runs > this.history_window) {
        throw new Error("min_history_runs cannot exceed history_window");
      }

      this.run_trace_limit = resolveLimit(
        run_trace_limit,
        Math.max(this.history_window, DEFAULT_TRACE_LIMIT),
      );
    }

    reset() {
      this.current_run = 0;
      this.history_runs = [];
      this.current_threshold = null;
      this.last_threshold = null;
      this.active = false;
      this.tail_remaining = 0;
      this.run_trace = [];
    }

    _compute_threshold() {
      if (this.history_runs.length < this.min_history_runs) {
        return null;
      }
      return computePercentile(this.history_runs, this.percentile);
    }

    _finalize_run() {
      if (this.current_run > 0) {
        this.run_trace.push({
          run_length: this.current_run,
          threshold: this.current_threshold,
          activated: this.active,
        });
        trimToLimit(this.run_trace, this.run_trace_limit);
        this.history_runs.push(this.current_run);
        if (this.history_runs.length > this.history_window) {
          this.history_runs.shift();
        }
      }
    }

    update(features) {
      const v = features ? features[this.signal_key] : undefined;

      if (v !== this.target_value) {
        const prev_threshold = this.current_run > 0 ? this.current_threshold : this.last_threshold;
        this._finalize_run();
        if (this.active && this.post_run_extension > 0) {
          this.tail_remaining = this.post_run_extension;
        }

        this.current_run = 0;
        this.current_threshold = null;
        this.active = false;
        this.last_threshold = prev_threshold;

        if (this.tail_remaining > 0) {
          this.tail_remaining -= 1;
          return 1;
        }
        return 0;
      }

      if (this.current_run === 0) {
        this.current_threshold = this._compute_threshold();
      }
      this.current_run += 1;
      this.tail_remaining = 0;

      if (!this.active && this.current_threshold !== null) {
        if (this.current_run >= this.current_threshold) {
          this.active = true;
        }
      }

      this.last_threshold = this.current_threshold;
      return this.active ? 1 : 0;
    }
  }

  class SignalRunInterrupted {
    constructor({ signal_key, target_value = 1, min_run_length = 3, post_run_extension = 0 } = {}) {
      this.signal_key = signal_key;
      this.target_value = target_value;
      this.min_run_length = min_run_length;
      this.post_run_extension = post_run_extension;
      this.current_run = 0;
      this.tail_remaining = 0;
    }

    reset() {
      this.current_run = 0;
      this.tail_remaining = 0;
    }

    update(features) {
      const v = features ? features[this.signal_key] : undefined;

      if (v === this.target_value) {
        this.current_run += 1;
        this.tail_remaining = 0;
        return 0;
      }

      if (this.current_run >= this.min_run_length) {
        this.current_run = 0;
        if (this.post_run_extension > 0) {
          this.tail_remaining = this.post_run_extension;
        }
        return 1;
      }

      this.current_run = 0;
      if (this.tail_remaining > 0) {
        this.tail_remaining -= 1;
        return 1;
      }
      return 0;
    }
  }

  class SignalRunLengthVsHistoryPercentile {
    constructor({
      signal_key,
      target_value = 1,
      history_window = 100,
      percentile = 90.0,
      min_history_runs = 5,
      post_run_extension = 0,
    } = {}) {
      this.signal_key = signal_key;
      this.target_value = target_value;
      this.history_window = history_window;
      this.percentile = percentile;
      this.min_history_runs = min_history_runs;
      this.post_run_extension = post_run_extension;

      this.current_run = 0;
      this.history_runs = [];
      this.active = false;
      this.tail_remaining = 0;
    }

    reset() {
      this.current_run = 0;
      this.history_runs = [];
      this.active = false;
      this.tail_remaining = 0;
    }

    update(features) {
      const v = features ? features[this.signal_key] : undefined;

      if (v !== this.target_value) {
        if (this.current_run > 0) {
          this.history_runs.push(this.current_run);
          if (this.history_runs.length > this.history_window) {
            this.history_runs.shift();
          }
        }
        if (this.active && this.post_run_extension > 0) {
          this.tail_remaining = this.post_run_extension;
        }

        this.current_run = 0;
        this.active = false;

        if (this.tail_remaining > 0) {
          this.tail_remaining -= 1;
          return 1;
        }
        return 0;
      }

      this.current_run += 1;
      this.tail_remaining = 0;

      if (this.active) {
        return 1;
      }

      if (this.history_runs.length < this.min_history_runs) {
        return 0;
      }

      const thr = computePercentile(this.history_runs, this.percentile);
      if (thr === null) {
        return 0;
      }

      if (this.current_run > thr) {
        this.active = true;
        return 1;
      }
      return 0;
    }
  }

  class SignalValueVsLastTrueReference {
    constructor({ value_key, reference_signal_key, comparison = "lt" } = {}) {
      this.value_key = value_key;
      this.reference_signal_key = reference_signal_key;
      this.comparison = String(comparison || "lt").toLowerCase();
      this.last_reference_value = null;
      if (this.comparison !== "lt" && this.comparison !== "gt") {
        throw new Error("comparison must be 'lt' or 'gt'");
      }
    }

    reset() {
      this.last_reference_value = null;
    }

    _get_numeric_value(features) {
      if (!features || !this.value_key) {
        return null;
      }
      const raw = features[this.value_key];
      return isNumber(raw) ? raw : null;
    }

    update(features) {
      const val = this._get_numeric_value(features);
      const ref_active = Boolean(
        features && this.reference_signal_key ? features[this.reference_signal_key] : false
      );

      if (ref_active) {
        if (val !== null) {
          this.last_reference_value = val;
        }
        return 0;
      }

      if (this.last_reference_value === null || val === null) {
        return 0;
      }

      if (this.comparison === "lt") {
        return val < this.last_reference_value ? 1 : 0;
      }
      return val > this.last_reference_value ? 1 : 0;
    }
  }

  class SignalValueVsLastTargetForBase {
    constructor({ value_key, base_signal_key, target_signal_key, comparison = "lt" } = {}) {
      this.value_key = value_key;
      this.base_signal_key = base_signal_key;
      this.target_signal_key = target_signal_key;
      this.comparison = String(comparison || "lt").toLowerCase();
      this.last_target_value = null;
      if (this.comparison !== "lt" && this.comparison !== "gt") {
        throw new Error("comparison must be 'lt' or 'gt'");
      }
    }

    reset() {
      this.last_target_value = null;
    }

    _get_numeric_value(features) {
      if (!features || !this.value_key) {
        return null;
      }
      const raw = features[this.value_key];
      return isNumber(raw) ? raw : null;
    }

    update(features) {
      const val = this._get_numeric_value(features);
      const base_active = Boolean(
        features && this.base_signal_key ? features[this.base_signal_key] : false
      );
      const target_active = Boolean(
        features && this.target_signal_key ? features[this.target_signal_key] : false
      );

      if (target_active && val !== null) {
        this.last_target_value = val;
        if (base_active) {
          return 0;
        }
      }

      if (!base_active || this.last_target_value === null || val === null) {
        return 0;
      }

      if (this.comparison === "lt") {
        return val < this.last_target_value ? 1 : 0;
      }
      return val > this.last_target_value ? 1 : 0;
    }
  }

  class SignalValueVsPrevious {
    constructor({ value_key, comparison = "gt" } = {}) {
      this.value_key = value_key;
      this.comparison = String(comparison || "gt").toLowerCase();
      this.previous_value = null;
      if (this.comparison !== "gt" && this.comparison !== "lt") {
        throw new Error("comparison must be 'gt' or 'lt'");
      }
    }

    reset() {
      this.previous_value = null;
    }

    _get_numeric_value(features) {
      if (!features || !this.value_key) {
        return null;
      }
      const raw = features[this.value_key];
      return isNumber(raw) ? raw : null;
    }

    update(features) {
      const val = this._get_numeric_value(features);
      let signal = 0;

      if (val !== null && this.previous_value !== null) {
        if (this.comparison === "gt") {
          signal = val > this.previous_value ? 1 : 0;
        } else {
          signal = val < this.previous_value ? 1 : 0;
        }
      }

      this.previous_value = val;
      return signal;
    }
  }

  class SignalValueVsLastSignalRunStatistic {
    constructor({
      value_key,
      signal_key,
      statistic = "mean",
      percentile = 50.0,
      comparison = "gt",
    } = {}) {
      this.value_key = value_key;
      this.signal_key = signal_key;
      this.statistic = String(statistic || "mean").toLowerCase();
      this.percentile = percentile;
      this.comparison = String(comparison || "gt").toLowerCase();

      this.current_run_values = [];
      this.in_run = false;
      this.last_statistic = null;

      if (!["mean", "min", "max", "median", "percentile"].includes(this.statistic)) {
        throw new Error("statistic must be one of: mean, min, max, median, percentile");
      }
      if (this.comparison !== "gt" && this.comparison !== "lt") {
        throw new Error("comparison must be 'gt' or 'lt'");
      }
      if (this.statistic === "percentile" && !(this.percentile >= 0 && this.percentile <= 100)) {
        throw new Error("percentile must be between 0 and 100");
      }
    }

    reset() {
      this.current_run_values = [];
      this.in_run = false;
      this.last_statistic = null;
    }

    _get_numeric_value(features) {
      if (!features || !this.value_key) {
        return null;
      }
      const raw = features[this.value_key];
      return isNumber(raw) ? raw : null;
    }

    _compute_statistic(values) {
      if (!values.length) {
        return null;
      }
      if (this.statistic === "mean") {
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      }
      if (this.statistic === "min") {
        return Math.min(...values);
      }
      if (this.statistic === "max") {
        return Math.max(...values);
      }
      if (this.statistic === "median") {
        return computePercentile(values, 50.0);
      }
      return computePercentile(values, this.percentile);
    }

    _is_trigger(val, threshold) {
      if (this.comparison === "gt") {
        return val > threshold;
      }
      return val < threshold;
    }

    update(features) {
      const val = this._get_numeric_value(features);
      const signal_active = Boolean(features && this.signal_key ? features[this.signal_key] : false);

      if (signal_active) {
        if (val !== null) {
          this.current_run_values.push(val);
        }
        this.in_run = true;
      } else if (this.in_run) {
        this.last_statistic = this._compute_statistic(this.current_run_values);
        this.current_run_values = [];
        this.in_run = false;
      }

      if (val === null || this.last_statistic === null) {
        return 0;
      }

      return this._is_trigger(val, this.last_statistic) ? 1 : 0;
    }
  }

  class SignalEMAFastSlowComparison {
    constructor({ value_key, ema_period_1, ema_period_2, prefer = "fast" } = {}) {
      this.value_key = value_key;
      this.ema_period_1 = ema_period_1;
      this.ema_period_2 = ema_period_2;
      this.prefer = String(prefer || "fast").toLowerCase();

      this.ema_1 = null;
      this.ema_2 = null;

      if (!Number.isFinite(this.ema_period_1) || !Number.isFinite(this.ema_period_2)) {
        throw new Error("EMA periods must be > 0");
      }
      if (this.ema_period_1 <= 0 || this.ema_period_2 <= 0) {
        throw new Error("EMA periods must be > 0");
      }
      if (this.ema_period_1 === this.ema_period_2) {
        throw new Error("ema_period_1 and ema_period_2 must differ");
      }
      if (this.prefer !== "fast" && this.prefer !== "slow") {
        throw new Error("prefer must be 'fast' or 'slow'");
      }
    }

    reset() {
      this.ema_1 = null;
      this.ema_2 = null;
    }

    _get_numeric_value(features) {
      if (!features || !this.value_key) {
        return null;
      }
      const raw = features[this.value_key];
      return isNumber(raw) ? raw : null;
    }

    _update_ema(value, current, period) {
      const alpha = 2 / (period + 1);
      if (current === null) {
        return value;
      }
      return value * alpha + current * (1 - alpha);
    }

    _get_fast_slow_ema() {
      if (this.ema_period_1 < this.ema_period_2) {
        return [this.ema_1, this.ema_2];
      }
      return [this.ema_2, this.ema_1];
    }

    update(features) {
      const val = this._get_numeric_value(features);
      if (val === null) {
        return 0;
      }

      this.ema_1 = this._update_ema(val, this.ema_1, this.ema_period_1);
      this.ema_2 = this._update_ema(val, this.ema_2, this.ema_period_2);

      const [fastEma, slowEma] = this._get_fast_slow_ema();
      if (fastEma === null || slowEma === null) {
        return 0;
      }

      if (this.prefer === "fast") {
        return fastEma > slowEma ? 1 : 0;
      }
      return slowEma > fastEma ? 1 : 0;
    }
  }

  class SignalEMADiffVsHistoryPercentile {
    constructor({
      value_key,
      ema_period_1,
      ema_period_2,
      history_window,
      percentile = 90.0,
      min_history = 1,
      comparison = "gt",
      trace_limit = undefined,
    } = {}) {
      this.value_key = value_key;
      this.ema_period_1 = ema_period_1;
      this.ema_period_2 = ema_period_2;
      this.history_window = history_window;
      this.percentile = percentile;
      this.min_history = min_history;
      this.comparison = String(comparison || "gt").toLowerCase();

      this.ema_1 = null;
      this.ema_2 = null;
      this.last_abs_diff = null;
      this.last_threshold = null;
      this.abs_diff_history = [];
      this.trace = [];

      if (!Number.isFinite(this.ema_period_1) || !Number.isFinite(this.ema_period_2)) {
        throw new Error("EMA periods must be > 0");
      }
      if (this.ema_period_1 <= 0 || this.ema_period_2 <= 0) {
        throw new Error("EMA periods must be > 0");
      }
      if (!Number.isFinite(this.history_window) || this.history_window <= 0) {
        throw new Error("history_window must be > 0");
      }
      if (!(this.percentile >= 0 && this.percentile <= 100)) {
        throw new Error("percentile must be between 0 and 100");
      }
      if (!Number.isFinite(this.min_history) || this.min_history < 1) {
        throw new Error("min_history must be >= 1");
      }
      if (this.min_history > this.history_window) {
        throw new Error("min_history cannot exceed history_window");
      }
      if (this.comparison !== "gt" && this.comparison !== "lt") {
        throw new Error("comparison must be 'gt' or 'lt'");
      }

      this.trace_limit = resolveLimit(
        trace_limit,
        Math.max(this.history_window, DEFAULT_TRACE_LIMIT),
      );
    }

    reset() {
      this.ema_1 = null;
      this.ema_2 = null;
      this.last_abs_diff = null;
      this.last_threshold = null;
      this.abs_diff_history = [];
      this.trace = [];
    }

    _get_numeric_value(features) {
      if (!features || !this.value_key) {
        return null;
      }
      const raw = features[this.value_key];
      return isNumber(raw) ? raw : null;
    }

    _update_ema(value, current, period) {
      const alpha = 2 / (period + 1);
      if (current === null) {
        return value;
      }
      return value * alpha + current * (1 - alpha);
    }

    update(features) {
      const val = this._get_numeric_value(features);
      let signal = 0;
      let threshold = null;
      let abs_diff = null;

      if (val !== null) {
        this.ema_1 = this._update_ema(val, this.ema_1, this.ema_period_1);
        this.ema_2 = this._update_ema(val, this.ema_2, this.ema_period_2);
        abs_diff = Math.abs(this.ema_1 - this.ema_2);

        if (this.abs_diff_history.length >= this.min_history) {
          threshold = computePercentile(this.abs_diff_history, this.percentile);
          if (threshold !== null) {
            if (this.comparison === "gt" && abs_diff > threshold) {
              signal = 1;
            } else if (this.comparison === "lt" && abs_diff < threshold) {
              signal = 1;
            }
          }
        }

        this.abs_diff_history.push(abs_diff);
        if (this.abs_diff_history.length > this.history_window) {
          this.abs_diff_history.shift();
        }
      }

      this.last_abs_diff = abs_diff;
      this.last_threshold = threshold;
      this.trace.push({
        ema_1: this.ema_1,
        ema_2: this.ema_2,
        abs_diff,
        threshold,
      });
      trimToLimit(this.trace, this.trace_limit);

      return signal;
    }
  }

  class SignalIntervalBetweenMarkers {
    constructor({ start_signal_key, end_signal_key, max_length = null, intervals_limit = undefined } = {}) {
      this.start_signal_key = start_signal_key;
      this.end_signal_key = end_signal_key;
      this.max_length = max_length === undefined || max_length === "" ? null : max_length;

      this.active = false;
      this.current_length = 0;
      this.current_start_index = null;
      this.last_interval_length = null;
      this.last_interval_closed_by = null;
      this.intervals = [];
      this.step_index = 0;

      if (this.max_length !== null && (!Number.isFinite(this.max_length) || this.max_length <= 0)) {
        throw new Error("max_length must be > 0 when provided");
      }

      this.intervals_limit = resolveLimit(intervals_limit, DEFAULT_TRACE_LIMIT);
    }

    reset() {
      this.active = false;
      this.current_length = 0;
      this.current_start_index = null;
      this.last_interval_length = null;
      this.last_interval_closed_by = null;
      this.intervals = [];
      this.step_index = 0;
    }

    _close_interval(reason) {
      const interval = {
        start_index: this.current_start_index,
        end_index: this.step_index,
        length: this.current_length,
        closed_by: reason,
      };
      this.last_interval_length = this.current_length;
      this.last_interval_closed_by = reason;
      this.intervals.push(interval);
      trimToLimit(this.intervals, this.intervals_limit);

      this.active = false;
      this.current_length = 0;
      this.current_start_index = null;
    }

    update(features) {
      const start_active = Boolean(
        features && this.start_signal_key ? features[this.start_signal_key] : false
      );
      const end_active = Boolean(features && this.end_signal_key ? features[this.end_signal_key] : false);
      let signal = 0;

      if (this.active) {
        this.current_length += 1;
        signal = 1;
        const reached_max = this.max_length !== null && this.current_length >= this.max_length;
        if (end_active || reached_max) {
          this._close_interval(end_active ? "end_signal" : "max_length");
        }
      } else if (start_active) {
        this.active = true;
        this.current_length = 1;
        this.current_start_index = this.step_index;
        signal = 1;
        const reached_max = this.max_length !== null && this.current_length >= this.max_length;
        if (end_active || reached_max) {
          this._close_interval(end_active ? "end_signal" : "max_length");
        }
      }

      this.step_index += 1;
      return signal;
    }
  }

  class SignalNthTargetWithinWindowAfterTrigger {
    constructor({ trigger_signal_key, target_signal_key, window_length, target_index } = {}) {
      this.trigger_signal_key = trigger_signal_key;
      this.target_signal_key = target_signal_key;
      this.window_length = window_length;
      this.target_index = target_index;

      this.active_windows = [];
      this.last_search_success = null;
      this.step_index = 0;

      if (!Number.isFinite(this.window_length) || this.window_length <= 0) {
        throw new Error("window_length must be > 0");
      }
      if (!Number.isFinite(this.target_index) || this.target_index <= 0) {
        throw new Error("target_index must be >= 1");
      }
    }

    reset() {
      this.active_windows = [];
      this.last_search_success = null;
      this.step_index = 0;
    }

    update(features) {
      let signal = 0;
      const target_active = Boolean(
        features && this.target_signal_key ? features[this.target_signal_key] : false
      );
      const next_windows = [];

      this.active_windows.forEach((window) => {
        if (target_active) {
          window.seen_targets = (window.seen_targets || 0) + 1;
          if (window.seen_targets === this.target_index) {
            signal = 1;
            this.last_search_success = true;
            return;
          }
        }

        window.remaining_steps = (window.remaining_steps || 0) - 1;
        if (window.remaining_steps <= 0) {
          this.last_search_success = false;
          return;
        }
        next_windows.push(window);
      });

      this.active_windows = next_windows;

      if (features && this.trigger_signal_key ? features[this.trigger_signal_key] : false) {
        this.active_windows.push({
          remaining_steps: this.window_length,
          seen_targets: 0,
          start_step: this.step_index,
        });
      }

      this.step_index += 1;
      return signal;
    }
  }

  class SignalIntersection {
    constructor({ signal_keys } = {}) {
      this.signal_keys = Array.isArray(signal_keys) ? signal_keys : [];
      if (this.signal_keys.length < 2) {
        throw new Error("signal_keys must contain at least 2 keys");
      }
      const unique = new Set(this.signal_keys);
      if (unique.size !== this.signal_keys.length) {
        throw new Error("signal_keys must be unique");
      }
    }

    reset() {}

    update(features) {
      for (const key of this.signal_keys) {
        if (!(features && key ? features[key] : false)) {
          return 0;
        }
      }
      return 1;
    }
  }

  class SignalExternalFlag {
    constructor({ signal_key, true_value = 1 } = {}) {
      this.signal_key = signal_key;
      this.true_value = true_value;
    }

    reset() {}

    update(features) {
      const value = features && this.signal_key ? features[this.signal_key] : undefined;
      return value === this.true_value ? 1 : 0;
    }
  }

  const SIGNAL_CLASS_MAP = {
    ValueVsRollingPercentile,
    ValueVsRollingPercentileWithThreshold,
    SignalRunLengthReached,
    SignalRunLengthReachedHistoryPercentile,
    SignalRunInterrupted,
    SignalRunLengthVsHistoryPercentile,
    SignalValueVsLastTrueReference,
    SignalValueVsLastTargetForBase,
    SignalValueVsPrevious,
    SignalValueVsLastSignalRunStatistic,
    SignalEMAFastSlowComparison,
    SignalEMADiffVsHistoryPercentile,
    SignalIntervalBetweenMarkers,
    SignalNthTargetWithinWindowAfterTrigger,
    SignalIntersection,
    SignalExternalFlag,
  };

  signals.computePercentile = computePercentile;
  signals.ValueVsRollingPercentile = ValueVsRollingPercentile;
  signals.ValueVsRollingPercentileWithThreshold = ValueVsRollingPercentileWithThreshold;
  signals.SignalRunLengthReached = SignalRunLengthReached;
  signals.SignalRunLengthReachedHistoryPercentile = SignalRunLengthReachedHistoryPercentile;
  signals.SignalRunInterrupted = SignalRunInterrupted;
  signals.SignalRunLengthVsHistoryPercentile = SignalRunLengthVsHistoryPercentile;
  signals.SignalValueVsLastTrueReference = SignalValueVsLastTrueReference;
  signals.SignalValueVsLastTargetForBase = SignalValueVsLastTargetForBase;
  signals.SignalValueVsPrevious = SignalValueVsPrevious;
  signals.SignalValueVsLastSignalRunStatistic = SignalValueVsLastSignalRunStatistic;
  signals.SignalEMAFastSlowComparison = SignalEMAFastSlowComparison;
  signals.SignalEMADiffVsHistoryPercentile = SignalEMADiffVsHistoryPercentile;
  signals.SignalIntervalBetweenMarkers = SignalIntervalBetweenMarkers;
  signals.SignalNthTargetWithinWindowAfterTrigger = SignalNthTargetWithinWindowAfterTrigger;
  signals.SignalIntersection = SignalIntersection;
  signals.SignalExternalFlag = SignalExternalFlag;

  HTF.computePercentile = computePercentile;
  HTF.ValueVsRollingPercentile = ValueVsRollingPercentile;
  HTF.ValueVsRollingPercentileWithThreshold = ValueVsRollingPercentileWithThreshold;
  HTF.SignalRunLengthReached = SignalRunLengthReached;
  HTF.SignalRunLengthReachedHistoryPercentile = SignalRunLengthReachedHistoryPercentile;
  HTF.SignalRunInterrupted = SignalRunInterrupted;
  HTF.SignalRunLengthVsHistoryPercentile = SignalRunLengthVsHistoryPercentile;
  HTF.SignalValueVsLastTrueReference = SignalValueVsLastTrueReference;
  HTF.SignalValueVsLastTargetForBase = SignalValueVsLastTargetForBase;
  HTF.SignalValueVsPrevious = SignalValueVsPrevious;
  HTF.SignalValueVsLastSignalRunStatistic = SignalValueVsLastSignalRunStatistic;
  HTF.SignalEMAFastSlowComparison = SignalEMAFastSlowComparison;
  HTF.SignalEMADiffVsHistoryPercentile = SignalEMADiffVsHistoryPercentile;
  HTF.SignalIntervalBetweenMarkers = SignalIntervalBetweenMarkers;
  HTF.SignalNthTargetWithinWindowAfterTrigger = SignalNthTargetWithinWindowAfterTrigger;
  HTF.SignalIntersection = SignalIntersection;
  HTF.SignalExternalFlag = SignalExternalFlag;

  let signalDefs = null;

  const clampPercentile = (value, fallback) => {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return fallback;
    }
    if (num < 0) {
      return 0;
    }
    if (num > 100) {
      return 100;
    }
    return num;
  };

  const toPositiveInt = (value, fallback) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return fallback;
    }
    return Math.floor(num);
  };

  const toNonNegativeInt = (value, fallback) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      return fallback;
    }
    return Math.floor(num);
  };

  const toOptionalPositiveInt = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return null;
    }
    return Math.floor(num);
  };

  const normalizeComparison = (value, fallback) => {
    const cmp = String(value || "").toLowerCase();
    if (cmp === "gt" || cmp === "lt") {
      return cmp;
    }
    return fallback;
  };

  const normalizeStatistic = (value, fallback) => {
    const stat = String(value || "").toLowerCase();
    if (["mean", "min", "max", "median", "percentile"].includes(stat)) {
      return stat;
    }
    return fallback;
  };

  const normalizePrefer = (value, fallback) => {
    const pref = String(value || "").toLowerCase();
    if (pref === "fast" || pref === "slow") {
      return pref;
    }
    return fallback;
  };

  const toBoolean = (value, fallback) => {
    if (typeof value === "boolean") {
      return value;
    }
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    if (value === undefined || value === null || value === "") {
      return fallback;
    }
    return Boolean(value);
  };

  const parseTargetValue = (value) => {
    if (value === undefined || value === null) {
      return value;
    }
    if (typeof value === "number") {
      return value;
    }
    const raw = String(value).trim();
    if (!raw) {
      return raw;
    }
    if (raw === "true") {
      return true;
    }
    if (raw === "false") {
      return false;
    }
    const num = Number(raw);
    if (Number.isFinite(num)) {
      return num;
    }
    return raw;
  };

  const buildPointFeatures = (point) => {
    const features = {};
    if (!point) {
      return features;
    }
    if (point.values && typeof point.values === "object") {
      Object.entries(point.values).forEach(([key, val]) => {
        features[key] = val;
      });
    }
    if (Object.hasOwn(point, "value")) {
      features.value = point.value;
    }
    return features;
  };

  const getParamOrDefault = (node, def, name) => {
    const raw = node && node.params ? node.params[name] : undefined;
    if (raw !== undefined && raw !== null && raw !== "") {
      return raw;
    }
    if (!def || !def.params) {
      return raw;
    }
    const param = def.params.find((item) => item.name === name);
    if (!param) {
      return raw;
    }
    return param.default !== undefined ? param.default : raw;
  };

  const buildEvaluationOrder = (series) => {
    const ordered = [];
    const visited = new Set();
    const visit = (node) => {
      if (!node || visited.has(node.id)) {
        return;
      }
      visited.add(node.id);
      Object.values(node.children || {}).forEach((list) => {
        list.forEach((child) => {
          visit(child);
        });
      });
      ordered.push(node);
    };
    const roots = series && series.signals ? series.signals.items || [] : [];
    roots.forEach((root) => {
      visit(root);
    });
    return ordered;
  };

  const buildNodeDependencies = (node, def) => {
    const singles = {};
    const lists = {};
    if (!def || !def.params) {
      return { singles, lists };
    }
    def.params.forEach((param) => {
      if (param.kind === "signal") {
        const child = (node.children && node.children[param.name] ? node.children[param.name] : [])[0] || null;
        singles[param.name] = child ? child.id : null;
      } else if (param.kind === "signal-list") {
        const list = node.children && node.children[param.name] ? node.children[param.name] : [];
        lists[param.name] = list.map((child) => child.id);
      }
    });
    return { singles, lists };
  };

  const buildSignalOptions = (node, def, deps) => {
    switch (node.type) {
      case "ValueVsRollingPercentile":
      case "ValueVsRollingPercentileWithThreshold":
        return {
          value_key: getParamOrDefault(node, def, "value_key"),
          window_size: toPositiveInt(getParamOrDefault(node, def, "window_size"), 20),
          percentile: clampPercentile(getParamOrDefault(node, def, "percentile"), 50),
          include_current: toBoolean(getParamOrDefault(node, def, "include_current"), false),
          min_history: toPositiveInt(getParamOrDefault(node, def, "min_history"), 1),
          comparison: normalizeComparison(getParamOrDefault(node, def, "comparison"), "gt"),
        };
      case "SignalRunLengthReached":
        return {
          signal_key: deps.singles.signal_key || null,
          target_value: parseTargetValue(getParamOrDefault(node, def, "target_value")),
          min_run_length: toPositiveInt(getParamOrDefault(node, def, "min_run_length"), 3),
          post_run_extension: toNonNegativeInt(getParamOrDefault(node, def, "post_run_extension"), 0),
        };
      case "SignalRunLengthReachedHistoryPercentile":
        return {
          signal_key: deps.singles.signal_key || null,
          target_value: parseTargetValue(getParamOrDefault(node, def, "target_value")),
          history_window: toPositiveInt(getParamOrDefault(node, def, "history_window"), 100),
          percentile: clampPercentile(getParamOrDefault(node, def, "percentile"), 90),
          min_history_runs: toPositiveInt(getParamOrDefault(node, def, "min_history_runs"), 1),
          post_run_extension: toNonNegativeInt(getParamOrDefault(node, def, "post_run_extension"), 0),
        };
      case "SignalRunInterrupted":
        return {
          signal_key: deps.singles.signal_key || null,
          target_value: parseTargetValue(getParamOrDefault(node, def, "target_value")),
          min_run_length: toPositiveInt(getParamOrDefault(node, def, "min_run_length"), 3),
          post_run_extension: toNonNegativeInt(getParamOrDefault(node, def, "post_run_extension"), 0),
        };
      case "SignalRunLengthVsHistoryPercentile":
        return {
          signal_key: deps.singles.signal_key || null,
          target_value: parseTargetValue(getParamOrDefault(node, def, "target_value")),
          history_window: toPositiveInt(getParamOrDefault(node, def, "history_window"), 100),
          percentile: clampPercentile(getParamOrDefault(node, def, "percentile"), 90),
          min_history_runs: toPositiveInt(getParamOrDefault(node, def, "min_history_runs"), 5),
          post_run_extension: toNonNegativeInt(getParamOrDefault(node, def, "post_run_extension"), 0),
        };
      case "SignalValueVsLastTrueReference":
        return {
          value_key: getParamOrDefault(node, def, "value_key"),
          reference_signal_key: deps.singles.reference_signal_key || null,
          comparison: normalizeComparison(getParamOrDefault(node, def, "comparison"), "lt"),
        };
      case "SignalValueVsLastTargetForBase":
        return {
          value_key: getParamOrDefault(node, def, "value_key"),
          base_signal_key: deps.singles.base_signal_key || null,
          target_signal_key: deps.singles.target_signal_key || null,
          comparison: normalizeComparison(getParamOrDefault(node, def, "comparison"), "lt"),
        };
      case "SignalValueVsPrevious":
        return {
          value_key: getParamOrDefault(node, def, "value_key"),
          comparison: normalizeComparison(getParamOrDefault(node, def, "comparison"), "gt"),
        };
      case "SignalValueVsLastSignalRunStatistic":
        return {
          value_key: getParamOrDefault(node, def, "value_key"),
          signal_key: deps.singles.signal_key || null,
          statistic: normalizeStatistic(getParamOrDefault(node, def, "statistic"), "mean"),
          percentile: clampPercentile(getParamOrDefault(node, def, "percentile"), 50),
          comparison: normalizeComparison(getParamOrDefault(node, def, "comparison"), "gt"),
        };
      case "SignalEMAFastSlowComparison": {
        const ema_period_1 = toPositiveInt(getParamOrDefault(node, def, "ema_period_1"), 12);
        let ema_period_2 = toPositiveInt(getParamOrDefault(node, def, "ema_period_2"), 26);
        if (ema_period_1 === ema_period_2) {
          ema_period_2 = ema_period_1 + 1;
        }
        return {
          value_key: getParamOrDefault(node, def, "value_key"),
          ema_period_1,
          ema_period_2,
          prefer: normalizePrefer(getParamOrDefault(node, def, "prefer"), "fast"),
        };
      }
      case "SignalEMADiffVsHistoryPercentile":
        return {
          value_key: getParamOrDefault(node, def, "value_key"),
          ema_period_1: toPositiveInt(getParamOrDefault(node, def, "ema_period_1"), 12),
          ema_period_2: toPositiveInt(getParamOrDefault(node, def, "ema_period_2"), 26),
          history_window: toPositiveInt(getParamOrDefault(node, def, "history_window"), 50),
          percentile: clampPercentile(getParamOrDefault(node, def, "percentile"), 90),
          min_history: toPositiveInt(getParamOrDefault(node, def, "min_history"), 1),
          comparison: normalizeComparison(getParamOrDefault(node, def, "comparison"), "gt"),
        };
      case "SignalIntervalBetweenMarkers":
        return {
          start_signal_key: deps.singles.start_signal_key || null,
          end_signal_key: deps.singles.end_signal_key || null,
          max_length: toOptionalPositiveInt(getParamOrDefault(node, def, "max_length")),
        };
      case "SignalNthTargetWithinWindowAfterTrigger":
        return {
          trigger_signal_key: deps.singles.trigger_signal_key || null,
          target_signal_key: deps.singles.target_signal_key || null,
          window_length: toPositiveInt(getParamOrDefault(node, def, "window_length"), 20),
          target_index: toPositiveInt(getParamOrDefault(node, def, "target_index"), 1),
        };
      case "SignalIntersection":
        return {
          signal_keys: deps.lists.signal_keys || [],
        };
      case "SignalExternalFlag":
        return {
          signal_key: getParamOrDefault(node, def, "signal_key"),
          true_value: parseTargetValue(getParamOrDefault(node, def, "true_value")),
        };
      default:
        return {};
    }
  };

  const createSignalRunner = (node) => {
    const def = signalDefs ? signalDefs.get(node.type) : null;
    const deps = buildNodeDependencies(node, def);
    const options = buildSignalOptions(node, def, deps);
    const SignalClass = SIGNAL_CLASS_MAP[node.type];
    let instance = null;
    if (SignalClass) {
      try {
        instance = new SignalClass(options);
      } catch (_err) {
        instance = null;
      }
    }
    return { instance, deps };
  };

  const computeSignalOutputs = (series) => {
    if (!series || !series.data || !series.data.length) {
      return new Map();
    }
    if (!series.signals || !series.signals.items || !series.signals.items.length) {
      return new Map();
    }
    if (!signalDefs) {
      return new Map();
    }

    const ordered = buildEvaluationOrder(series);
    if (!ordered.length) {
      return new Map();
    }

    const runners = new Map();
    ordered.forEach((node) => {
      runners.set(node.id, createSignalRunner(node));
    });

    const outputs = new Map();
    ordered.forEach((node) => {
      outputs.set(node.id, []);
    });

    series.data.forEach((point) => {
      const stepOutputs = new Map();
      const pointFeatures = buildPointFeatures(point);

      ordered.forEach((node) => {
        const runner = runners.get(node.id);
        let value = 0;
        if (runner && runner.instance) {
          const features = { ...pointFeatures };
          Object.values(runner.deps.singles).forEach((depId) => {
            if (depId) {
              features[depId] = stepOutputs.get(depId) || 0;
            }
          });
          Object.values(runner.deps.lists).forEach((depIds) => {
            depIds.forEach((depId) => {
              if (depId) {
                features[depId] = stepOutputs.get(depId) || 0;
              }
            });
          });
          value = runner.instance.update(features);
        }
        const normalized = value ? 1 : 0;
        stepOutputs.set(node.id, normalized);
        outputs.get(node.id).push(normalized);
      });
    });

    return outputs;
  };

  const getSeriesSignalOutputs = (series, cache) => {
    if (!series || !series.data || !series.data.length) {
      return new Map();
    }
    if (!series.signals || !series.signals.items || !series.signals.items.length) {
      return new Map();
    }
    if (cache && cache.has(series.id)) {
      return cache.get(series.id);
    }
    const outputs = computeSignalOutputs(series);
    if (cache) {
      cache.set(series.id, outputs);
    }
    return outputs;
  };

  const setSignalDefs = (defs) => {
    if (!defs) {
      signalDefs = null;
      return;
    }
    if (defs instanceof Map) {
      signalDefs = defs;
      return;
    }
    signalDefs = new Map();
    if (Array.isArray(defs)) {
      defs.forEach((def) => {
        if (def && def.type) {
          signalDefs.set(def.type, def);
        }
      });
    } else {
      Object.values(defs).forEach((def) => {
        if (def && def.type) {
          signalDefs.set(def.type, def);
        }
      });
    }
  };

  signalGraph.setSignalDefs = setSignalDefs;
  signalGraph.buildEvaluationOrder = buildEvaluationOrder;
  signalGraph.computeSignalOutputs = computeSignalOutputs;
  signalGraph.getSeriesSignalOutputs = getSeriesSignalOutputs;
})(typeof window !== "undefined" ? window : globalThis);

