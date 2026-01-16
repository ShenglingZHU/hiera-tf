# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 ZHU Shengling
from __future__ import annotations

from .coordinator import HierarConstraintCoordinator, MultiScaleCoordinator, SimpleHTFCoordinator, TimeframeState
from .features import LastRecordEchoFeature, SingleFieldStatsFeature
from .framework import HTFFramework
from .signals import (
    SignalEMADiffVsHistoryPercentile,
    SignalEMAFastSlowComparison,
    SignalExternalFlag,
    SignalIntersection,
    SignalIntervalBetweenMarkers,
    SignalNthTargetWithinWindowAfterTrigger,
    SignalRunInterrupted,
    SignalRunLengthReached,
    SignalRunLengthReachedHistoryPercentile,
    SignalRunLengthVsHistoryPercentile,
    SignalValueVsLastSignalRunStatistic,
    SignalValueVsLastTargetForBase,
    SignalValueVsLastTrueReference,
    SignalValueVsPrevious,
    ValueVsRollingPercentile,
    ValueVsRollingPercentileWithThreshold,
)
from .timeframe import FeatureModule, TimeframeConfig, TimeframeView

__all__ = [
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
]
