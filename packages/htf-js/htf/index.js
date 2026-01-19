// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
((global) => {
  "use strict";

  if (!global.HTF) {
    global.HTF = {};
  }
  const HTF = global.HTF;

  HTF.__all__ = [
    "TimeframeConfig",
    "TimeframeView",
    "FeatureModule",
    "SingleFieldStatsFeature",
    "LastRecordEchoFeature",
    "ValueVsRollingPercentile",
    "ValueVsRollingPercentileWithThreshold",
    "SignalEMADiffVsHistoryPercentile",
    "SignalRunLengthReached",
    "SignalRunLengthReachedHistoryPercentile",
    "SignalRunInterrupted",
    "SignalRunLengthVsHistoryPercentile",
    "SignalValueVsLastTrueReference",
    "SignalValueVsLastTargetForBase",
    "SignalValueVsPrevious",
    "SignalValueVsLastSignalRunStatistic",
    "SignalEMAFastSlowComparison",
    "SignalIntervalBetweenMarkers",
    "SignalNthTargetWithinWindowAfterTrigger",
    "SignalIntersection",
    "SignalExternalFlag",
    "MultiScaleCoordinator",
    "SimpleHTFCoordinator",
    "HierarConstraintCoordinator",
    "TimeframeState",
    "HTFFramework",
  ];
})(typeof window !== "undefined" ? window : globalThis);
