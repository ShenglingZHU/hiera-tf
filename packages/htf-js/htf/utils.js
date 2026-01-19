// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
((global) => {
  "use strict";

  if (!global.HTF) {
    global.HTF = {};
  }
  const HTF = global.HTF;

  if (!HTF.utils) {
    HTF.utils = {};
  }
  const utils = HTF.utils;

  const normalizeFlagSeries = (flags, length, fillValue) => {
    const filled = Array.isArray(flags) ? flags.slice(0, length) : [];
    while (filled.length < length) {
      filled.push(fillValue);
    }
    return filled.map((val) => Boolean(val));
  };

  const truthyWindows = (flags, xs) => {
    const windows = [];
    let start = null;
    flags.forEach((flag, idx) => {
      if (flag) {
        if (start === null) {
          start = xs[idx];
        }
        return;
      }
      if (start !== null) {
        const end = idx > 0 ? xs[idx - 1] : start;
        windows.push([start, end]);
        start = null;
      }
    });
    if (start !== null && xs.length) {
      windows.push([start, xs[xs.length - 1]]);
    }
    return windows;
  };

  const mapWindowsToMask = (windows, timestamps) => {
    if (!timestamps || !timestamps.length) {
      return [];
    }
    if (!windows || !windows.length) {
      return new Array(timestamps.length).fill(false);
    }
    const mask = new Array(timestamps.length).fill(false);
    let winIdx = 0;
    let start = windows[0][0];
    let end = windows[0][1];
    for (let i = 0; i < timestamps.length; i += 1) {
      const ts = timestamps[i];
      while (winIdx < windows.length && ts > end) {
        winIdx += 1;
        if (winIdx < windows.length) {
          start = windows[winIdx][0];
          end = windows[winIdx][1];
        }
      }
      if (winIdx < windows.length && ts >= start && ts <= end) {
        mask[i] = true;
      }
    }
    return mask;
  };

  utils.normalizeFlagSeries = normalizeFlagSeries;
  utils.truthyWindows = truthyWindows;
  utils.mapWindowsToMask = mapWindowsToMask;
  utils.__all__ = ["normalizeFlagSeries", "truthyWindows", "mapWindowsToMask"];
})(typeof window !== "undefined" ? window : globalThis);
