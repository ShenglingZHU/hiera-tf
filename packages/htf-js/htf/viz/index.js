// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
(function (global) {
  "use strict";

  const HTF = global.HTF || (global.HTF = {});
  const viz = HTF.viz || (HTF.viz = {});

  viz.__all__ = [
    "setColorPalette",
    "normalizeFlagSeries",
    "truthyWindows",
    "maskToSegments",
    "getLineElement",
    "getRawElement",
    "getSignalElements",
    "findBaseSignalId",
    "buildLineStyle",
    "buildMarkerStyle",
    "buildSignalTracesForSeries",
    "buildSeriesTraces",
    "buildTimeframeSeries",
    "plotMultiTfsParallelTimeSeries",
    "plotMultiTfsSingleTimeSerie",
    "plotMultiTfsOnlyLtfTimeSerie",
  ];
})(typeof window !== "undefined" ? window : globalThis);
