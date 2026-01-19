# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 ZHU Shengling
from __future__ import annotations

import math
from collections import deque
from collections.abc import Iterable
from dataclasses import dataclass, field
from typing import Any, Optional


def compute_percentile(values: Iterable[float], q: float) -> Optional[float]:
    """
    Simple percentile computation (0–100) with linear interpolation.
    Empty input -> None.
    """
    vals = sorted(float(v) for v in values if not isinstance(v, bool))
    n = len(vals)
    if n == 0:
        return None

    if q <= 0:
        return vals[0]
    if q >= 100:
        return vals[-1]

    pos = (n - 1) * (q / 100.0)
    lower = math.floor(pos)
    upper = math.ceil(pos)

    if lower == upper:
        return vals[lower]

    w = pos - lower
    return vals[lower] * (1.0 - w) + vals[upper] * w


_DEFAULT_TRACE_LIMIT = 1000
_UNSET = object()


def _resolve_limit(value: Any, fallback: int) -> Optional[int]:
    if value is _UNSET:
        return fallback
    if value is None:
        return None
    try:
        num = int(value)
    except (TypeError, ValueError):
        return None
    if num <= 0:
        return None
    return num


@dataclass
class ValueVsRollingPercentile:
    """
    Signal that compares the current value against a percentile of previous
    window_size values. comparison='gt' (default) emits 1 when current > percentile;
    comparison='lt' emits 1 when current < percentile.
    """

    value_key: str
    window_size: int
    percentile: float = 50.0
    include_current: bool = False
    min_history: int = 1
    comparison: str = "gt"

    history: deque[float] = field(default_factory=deque, init=False)

    def __post_init__(self) -> None:
        cmp_lower = self.comparison.lower()
        if cmp_lower not in ("gt", "lt"):
            raise ValueError("comparison must be 'gt' or 'lt'")
        self.comparison = cmp_lower
        self.last_threshold = None

    def reset(self) -> None:
        self.history.clear()
        self.last_threshold = None

    def _get_numeric_value(self, features: dict[str, Any]) -> Optional[float]:
        raw_val = features.get(self.value_key)
        if isinstance(raw_val, (int, float)) and not isinstance(raw_val, bool):
            return float(raw_val)
        return None

    def _is_trigger(self, val: float, threshold: float) -> bool:
        if self.comparison == "gt":
            return val > threshold
        return val < threshold

    def _compute_signal_and_threshold(self, val: Optional[float]) -> tuple[int, Optional[float]]:
        """
        Shared percentile logic used by subclasses that may need the threshold.
        Returns the signal (0/1) and the computed threshold.
        """
        signal = 0
        threshold: Optional[float] = None

        if val is not None:
            if len(self.history) >= self.min_history:
                seq = list(self.history)
                if self.include_current:
                    seq.append(val)

                threshold = compute_percentile(seq, self.percentile)
                if threshold is not None and self._is_trigger(val, threshold):
                    signal = 1

            self.history.append(val)
            if len(self.history) > self.window_size:
                self.history.popleft()

        return signal, threshold

    def __call__(self, features: dict[str, Any]) -> int:
        val = self._get_numeric_value(features)
        signal, threshold = self._compute_signal_and_threshold(val)
        self.last_threshold = threshold
        return signal


@dataclass
class ValueVsRollingPercentileWithThreshold(ValueVsRollingPercentile):
    """
    Extension that exposes the percentile threshold used at each step.
    """

    last_threshold: Optional[float] = field(default=None, init=False)

    def __call__(self, features: dict[str, Any]) -> int:
        val = self._get_numeric_value(features)
        signal, threshold = self._compute_signal_and_threshold(val)
        self.last_threshold = threshold
        return signal


@dataclass
class SignalRunLengthReached:
    """
    Run-length signal: once a base signal has been true for at least
    min_run_length consecutive steps, this signal returns 1 from that
    moment until the run ends; after the run ends, it can optionally
    stay 1 for post_run_extension extra steps.
    """

    signal_key: str
    target_value: Any = 1
    min_run_length: int = 3
    post_run_extension: int = 0

    current_run: int = 0
    active: bool = False
    tail_remaining: int = 0

    def reset(self) -> None:
        self.current_run = 0
        self.active = False
        self.tail_remaining = 0

    def __call__(self, features: dict[str, Any]) -> int:
        v = features.get(self.signal_key)

        # run interrupted
        if v != self.target_value:
            if self.current_run > 0 and self.active and self.post_run_extension > 0:
                self.tail_remaining = self.post_run_extension

            self.current_run = 0
            self.active = False

            if self.tail_remaining > 0:
                self.tail_remaining -= 1
                return 1

            return 0

        # still in the run
        self.current_run += 1
        self.tail_remaining = 0

        if self.active:
            return 1

        if self.current_run >= self.min_run_length:
            self.active = True
            return 1

        return 0


@dataclass
class SignalRunLengthReachedHistoryPercentile:
    """
    Run-length signal whose threshold is a percentile of historical run lengths.

    - When target_value in a base signal forms consecutive runs, keep up to
      history_window completed run lengths (all from before the current run).
    - At the start of each new run, compute the chosen percentile of those
      historical lengths (if at least min_history_runs exist).
    - If the current run length reaches or exceeds that threshold, the signal
      activates, stays active until the run ends, and can optionally extend for
      post_run_extension extra steps.
    - Per-run thresholds and run lengths are recorded in run_trace.
    """

    signal_key: str
    target_value: Any = 1
    history_window: int = 100
    percentile: float = 90.0
    min_history_runs: int = 1
    post_run_extension: int = 0
    run_trace_limit: Any = _UNSET

    current_run: int = 0
    history_runs: deque[int] = field(default_factory=deque, init=False)
    current_threshold: Optional[float] = field(default=None, init=False)
    last_threshold: Optional[float] = field(default=None, init=False)
    active: bool = False
    tail_remaining: int = 0
    run_trace: list[dict[str, Any]] = field(default_factory=list, init=False)

    def __post_init__(self) -> None:
        if self.history_window <= 0:
            raise ValueError("history_window must be > 0")
        if not (0 <= self.percentile <= 100):
            raise ValueError("percentile must be between 0 and 100")
        if self.min_history_runs < 1:
            raise ValueError("min_history_runs must be >= 1")
        if self.min_history_runs > self.history_window:
            raise ValueError("min_history_runs cannot exceed history_window")

        self.run_trace_limit = _resolve_limit(self.run_trace_limit, max(self.history_window, _DEFAULT_TRACE_LIMIT))

    def reset(self) -> None:
        self.current_run = 0
        self.history_runs.clear()
        self.current_threshold = None
        self.last_threshold = None
        self.active = False
        self.tail_remaining = 0
        self.run_trace.clear()

    def _compute_threshold(self) -> Optional[float]:
        if len(self.history_runs) < self.min_history_runs:
            return None
        return compute_percentile(self.history_runs, self.percentile)

    def _finalize_run(self) -> None:
        if self.current_run > 0:
            self.run_trace.append(
                {
                    "run_length": self.current_run,
                    "threshold": self.current_threshold,
                    "activated": self.active,
                }
            )
            if self.run_trace_limit is not None and len(self.run_trace) > self.run_trace_limit:
                del self.run_trace[: len(self.run_trace) - self.run_trace_limit]
            self.history_runs.append(self.current_run)
            if len(self.history_runs) > self.history_window:
                self.history_runs.popleft()

    def __call__(self, features: dict[str, Any]) -> int:
        v = features.get(self.signal_key)

        if v != self.target_value:
            prev_threshold = self.current_threshold if self.current_run > 0 else self.last_threshold
            self._finalize_run()

            if self.active and self.post_run_extension > 0:
                self.tail_remaining = self.post_run_extension

            self.current_run = 0
            self.current_threshold = None
            self.active = False

            self.last_threshold = prev_threshold
            if self.tail_remaining > 0:
                self.tail_remaining -= 1
                return 1

            return 0

        # Start of a new run
        if self.current_run == 0:
            self.current_threshold = self._compute_threshold()

        self.current_run += 1
        self.tail_remaining = 0

        if (
            not self.active
            and self.current_threshold is not None
            and self.current_run >= self.current_threshold
        ):
            self.active = True

        self.last_threshold = self.current_threshold
        return 1 if self.active else 0


@dataclass
class SignalRunInterrupted:
    """
    Run-interruption signal: when a base signal has been true for at least
    min_run_length consecutive steps and then becomes false, this signal
    fires (1) at the interruption step and then can remain 1 for
    post_run_extension extra steps.
    """

    signal_key: str
    target_value: Any = 1
    min_run_length: int = 3
    post_run_extension: int = 0

    current_run: int = 0
    tail_remaining: int = 0

    def reset(self) -> None:
        self.current_run = 0
        self.tail_remaining = 0

    def __call__(self, features: dict[str, Any]) -> int:
        v = features.get(self.signal_key)

        # inside a run
        if v == self.target_value:
            self.current_run += 1
            self.tail_remaining = 0
            return 0

        # possible interruption
        if self.current_run >= self.min_run_length:
            self.current_run = 0
            if self.post_run_extension > 0:
                self.tail_remaining = self.post_run_extension
            return 1

        # no valid run ended, maybe in tail phase
        self.current_run = 0
        if self.tail_remaining > 0:
            self.tail_remaining -= 1
            return 1

        return 0


@dataclass
class SignalRunLengthVsHistoryPercentile:
    """
    Run-length vs history percentile signal:

    - Treat target_value in a base signal as forming runs of consecutive steps.
    - Keep a rolling window (history_runs) of completed run lengths.
    - For the current run length current_run:
        * if history is long enough, compute a percentile threshold of history_runs;
        * when current_run first exceeds this threshold, activate the signal;
        * the signal stays 1 for the rest of this run;
        * after the run ends, it can remain 1 for post_run_extension extra steps.
    """

    signal_key: str
    target_value: Any = 1
    history_window: int = 100
    percentile: float = 90.0
    min_history_runs: int = 5
    post_run_extension: int = 0

    current_run: int = 0
    history_runs: deque[int] = field(default_factory=deque, init=False)
    active: bool = False
    tail_remaining: int = 0

    def reset(self) -> None:
        self.current_run = 0
        self.history_runs.clear()
        self.active = False
        self.tail_remaining = 0

    def __call__(self, features: dict[str, Any]) -> int:
        v = features.get(self.signal_key)

        # run interrupted
        if v != self.target_value:
            if self.current_run > 0:
                self.history_runs.append(self.current_run)
                if len(self.history_runs) > self.history_window:
                    self.history_runs.popleft()

            if self.active and self.post_run_extension > 0:
                self.tail_remaining = self.post_run_extension

            self.current_run = 0
            self.active = False

            if self.tail_remaining > 0:
                self.tail_remaining -= 1
                return 1

            return 0

        # still in run
        self.current_run += 1
        self.tail_remaining = 0

        if self.active:
            return 1

        if len(self.history_runs) < self.min_history_runs:
            return 0

        thr = compute_percentile(self.history_runs, self.percentile)
        if thr is None:
            return 0

        if self.current_run > thr:
            self.active = True
            return 1

        return 0


@dataclass
class SignalValueVsLastTrueReference:
    """
    Compare a numeric feature against the most recent value recorded when a
    reference signal was true.

    - value_key: numeric feature to evaluate (e.g. "temp").
    - reference_signal_key: signal key whose truthy state marks anchor points.
    - comparison: "lt" (default) or "gt" to choose < or > comparison.
    - Emits 1 only after at least one reference point has been stored.
    """

    value_key: str
    reference_signal_key: str
    comparison: str = "lt"

    last_reference_value: Optional[float] = field(default=None, init=False)

    def __post_init__(self) -> None:
        cmp_lower = self.comparison.lower()
        if cmp_lower not in ("lt", "gt"):
            raise ValueError("comparison must be 'lt' or 'gt'")
        self.comparison = cmp_lower

    def reset(self) -> None:
        self.last_reference_value = None

    def _get_numeric_value(self, features: dict[str, Any]) -> Optional[float]:
        raw_val = features.get(self.value_key)
        if isinstance(raw_val, (int, float)) and not isinstance(raw_val, bool):
            return float(raw_val)
        return None

    def __call__(self, features: dict[str, Any]) -> int:
        val = self._get_numeric_value(features)
        ref_active = bool(features.get(self.reference_signal_key))

        # When reference fires, treat it as an anchor update only.
        if ref_active:
            if val is not None:
                self.last_reference_value = val
            return 0

        if self.last_reference_value is None or val is None:
            return 0

        if self.comparison == "lt":
            return 1 if val < self.last_reference_value else 0
        return 1 if val > self.last_reference_value else 0


@dataclass
class SignalValueVsLastTargetForBase:
    """
    Compare a numeric feature when a base signal is true against the most recent
    value observed when a target signal was true.

    - value_key: numeric feature to evaluate (e.g. "temp").
    - base_signal_key: signal key whose truthy state triggers evaluation.
    - target_signal_key: signal key whose truthy state updates the reference value.
    - comparison: "lt" (default) or "gt" to choose < or > comparison.
    - Emits 1 only when base_signal_key is true and at least one target anchor exists.
      If base and target are true in the same step, the anchor is refreshed and
      no signal is emitted for that step.
    """

    value_key: str
    base_signal_key: str
    target_signal_key: str
    comparison: str = "lt"

    last_target_value: Optional[float] = field(default=None, init=False)

    def __post_init__(self) -> None:
        cmp_lower = self.comparison.lower()
        if cmp_lower not in ("lt", "gt"):
            raise ValueError("comparison must be 'lt' or 'gt'")
        self.comparison = cmp_lower

    def reset(self) -> None:
        self.last_target_value = None

    def _get_numeric_value(self, features: dict[str, Any]) -> Optional[float]:
        raw_val = features.get(self.value_key)
        if isinstance(raw_val, (int, float)) and not isinstance(raw_val, bool):
            return float(raw_val)
        return None

    def __call__(self, features: dict[str, Any]) -> int:
        val = self._get_numeric_value(features)
        base_active = bool(features.get(self.base_signal_key))
        target_active = bool(features.get(self.target_signal_key))

        if target_active and val is not None:
            self.last_target_value = val
            if base_active:
                return 0

        if not base_active or self.last_target_value is None or val is None:
            return 0

        if self.comparison == "lt":
            return 1 if val < self.last_target_value else 0
        return 1 if val > self.last_target_value else 0


@dataclass
class SignalValueVsPrevious:
    """
    Compare a numeric feature against its value from the previous step.

    - value_key: numeric feature to evaluate (e.g. "temp").
    - comparison: "gt" (default) emits 1 when current > previous;
      "lt" emits 1 when current < previous.
    """

    value_key: str
    comparison: str = "gt"

    previous_value: Optional[float] = field(default=None, init=False)

    def __post_init__(self) -> None:
        cmp_lower = self.comparison.lower()
        if cmp_lower not in ("gt", "lt"):
            raise ValueError("comparison must be 'gt' or 'lt'")
        self.comparison = cmp_lower

    def reset(self) -> None:
        self.previous_value = None

    def _get_numeric_value(self, features: dict[str, Any]) -> Optional[float]:
        raw_val = features.get(self.value_key)
        if isinstance(raw_val, (int, float)) and not isinstance(raw_val, bool):
            return float(raw_val)
        return None

    def __call__(self, features: dict[str, Any]) -> int:
        val = self._get_numeric_value(features)
        signal = 0

        if val is not None and self.previous_value is not None:
            if self.comparison == "gt":
                signal = 1 if val > self.previous_value else 0
            else:
                signal = 1 if val < self.previous_value else 0

        self.previous_value = val
        return signal


@dataclass
class SignalValueVsLastSignalRunStatistic:
    """
    Compare a numeric feature against a statistic computed from the most recent
    completed consecutive run of a reference signal (A).

    - value_key: numeric feature to evaluate.
    - signal_key: reference signal A defining consecutive runs.
    - statistic: "mean", "min", "max", "median", or "percentile".
    - percentile: 0-100 percentile used when statistic="percentile".
    - comparison: "gt" (default) emits 1 when value > statistic; "lt" emits 1
      when value < statistic.

    The statistic is updated when a run of A ends. If no prior run exists or the
    latest run has no numeric values, the signal stays 0.
    """

    value_key: str
    signal_key: str
    statistic: str = "mean"
    percentile: float = 50.0
    comparison: str = "gt"

    current_run_values: list[float] = field(default_factory=list, init=False)
    in_run: bool = False
    last_statistic: Optional[float] = field(default=None, init=False)

    def __post_init__(self) -> None:
        stat_lower = self.statistic.lower()
        if stat_lower not in ("mean", "min", "max", "median", "percentile"):
            raise ValueError("statistic must be one of: mean, min, max, median, percentile")
        self.statistic = stat_lower

        cmp_lower = self.comparison.lower()
        if cmp_lower not in ("gt", "lt"):
            raise ValueError("comparison must be 'gt' or 'lt'")
        self.comparison = cmp_lower

        if self.statistic == "percentile" and not (0 <= self.percentile <= 100):
            raise ValueError("percentile must be between 0 and 100")

    def reset(self) -> None:
        self.current_run_values.clear()
        self.in_run = False
        self.last_statistic = None

    def _get_numeric_value(self, features: dict[str, Any]) -> Optional[float]:
        raw_val = features.get(self.value_key)
        if isinstance(raw_val, (int, float)) and not isinstance(raw_val, bool):
            return float(raw_val)
        return None

    def _compute_statistic(self, values: list[float]) -> Optional[float]:
        if not values:
            return None
        if self.statistic == "mean":
            return sum(values) / len(values)
        if self.statistic == "min":
            return min(values)
        if self.statistic == "max":
            return max(values)
        if self.statistic == "median":
            return compute_percentile(values, 50.0)
        return compute_percentile(values, self.percentile)

    def _is_trigger(self, val: float, threshold: float) -> bool:
        if self.comparison == "gt":
            return val > threshold
        return val < threshold

    def __call__(self, features: dict[str, Any]) -> int:
        val = self._get_numeric_value(features)
        signal_active = bool(features.get(self.signal_key))

        if signal_active:
            if val is not None:
                self.current_run_values.append(val)
            self.in_run = True
        elif self.in_run:
            # finalize the completed run
            self.last_statistic = self._compute_statistic(self.current_run_values)
            self.current_run_values.clear()
            self.in_run = False

        if val is None or self.last_statistic is None:
            return 0

        return 1 if self._is_trigger(val, self.last_statistic) else 0


@dataclass
class SignalEMAFastSlowComparison:
    """
    Compare EMA fast vs EMA slow and emit 1 when the preferred side is larger.

    - value_key: numeric feature to run the EMAs on (e.g. "temp").
    - ema_period_1 / ema_period_2: EMA periods (must be > 0 and not equal).
    - prefer: "fast" or "slow" to choose which EMA should be larger to emit 1.
    """

    value_key: str
    ema_period_1: int
    ema_period_2: int
    prefer: str = "fast"

    ema_1: Optional[float] = field(default=None, init=False)
    ema_2: Optional[float] = field(default=None, init=False)
    fast_period: int = field(default=0, init=False)
    slow_period: int = field(default=0, init=False)

    def __post_init__(self) -> None:
        if self.ema_period_1 <= 0 or self.ema_period_2 <= 0:
            raise ValueError("EMA periods must be > 0")
        if self.ema_period_1 == self.ema_period_2:
            raise ValueError("ema_period_1 and ema_period_2 must differ")
        prefer_lower = self.prefer.lower()
        if prefer_lower not in ("fast", "slow"):
            raise ValueError("prefer must be 'fast' or 'slow'")
        self.prefer = prefer_lower

        if self.ema_period_1 < self.ema_period_2:
            self.fast_period = self.ema_period_1
            self.slow_period = self.ema_period_2
        else:
            self.fast_period = self.ema_period_2
            self.slow_period = self.ema_period_1

    def reset(self) -> None:
        self.ema_1 = None
        self.ema_2 = None

    def _get_numeric_value(self, features: dict[str, Any]) -> Optional[float]:
        raw_val = features.get(self.value_key)
        if isinstance(raw_val, (int, float)) and not isinstance(raw_val, bool):
            return float(raw_val)
        return None

    def _update_ema(self, value: float, current: Optional[float], period: int) -> float:
        alpha = 2.0 / (period + 1.0)
        if current is None:
            return value
        return value * alpha + current * (1.0 - alpha)

    def _get_fast_slow_ema(self) -> tuple[Optional[float], Optional[float]]:
        if self.ema_period_1 < self.ema_period_2:
            return self.ema_1, self.ema_2
        return self.ema_2, self.ema_1

    def __call__(self, features: dict[str, Any]) -> int:
        val = self._get_numeric_value(features)
        if val is None:
            return 0

        self.ema_1 = self._update_ema(val, self.ema_1, self.ema_period_1)
        self.ema_2 = self._update_ema(val, self.ema_2, self.ema_period_2)

        fast_ema, slow_ema = self._get_fast_slow_ema()
        if fast_ema is None or slow_ema is None:
            return 0

        if self.prefer == "fast":
            return 1 if fast_ema > slow_ema else 0
        return 1 if slow_ema > fast_ema else 0


@dataclass
class SignalEMADiffVsHistoryPercentile:
    """
    Compare the absolute difference between two EMAs against a percentile of
    previous absolute differences (excluding the current point).

    - value_key: numeric feature to run the EMAs on (e.g. "temp").
    - ema_period_1 / ema_period_2: EMA periods.
    - history_window: how many previous points (excluding current) to include
      when computing the percentile threshold.
    - percentile: percentile (0-100) applied to the history of abs differences.
    - min_history: minimum number of past abs-diff points required before a
      threshold is computed; otherwise the signal stays 0 and threshold None.
    - comparison: "gt" (default) compares current abs diff > percentile;
      "lt" compares current abs diff < percentile.

    The signal also records per-step EMA values, absolute differences, and the
    percentile threshold used for that step in the `trace` list.
    """

    value_key: str
    ema_period_1: int
    ema_period_2: int
    history_window: int
    percentile: float = 90.0
    min_history: int = 1
    comparison: str = "gt"
    trace_limit: Any = _UNSET

    ema_1: Optional[float] = field(default=None, init=False)
    ema_2: Optional[float] = field(default=None, init=False)
    last_abs_diff: Optional[float] = field(default=None, init=False)
    last_threshold: Optional[float] = field(default=None, init=False)
    abs_diff_history: deque[float] = field(default_factory=deque, init=False)
    trace: list[dict[str, Optional[float]]] = field(default_factory=list, init=False)

    def __post_init__(self) -> None:
        if self.ema_period_1 <= 0 or self.ema_period_2 <= 0:
            raise ValueError("EMA periods must be > 0")
        if self.history_window <= 0:
            raise ValueError("history_window must be > 0")
        if not (0 <= self.percentile <= 100):
            raise ValueError("percentile must be between 0 and 100")
        if self.min_history < 1:
            raise ValueError("min_history must be >= 1")
        if self.min_history > self.history_window:
            raise ValueError("min_history cannot exceed history_window")
        cmp_lower = self.comparison.lower()
        if cmp_lower not in ("gt", "lt"):
            raise ValueError("comparison must be 'gt' or 'lt'")
        self.comparison = cmp_lower

        self.trace_limit = _resolve_limit(self.trace_limit, max(self.history_window, _DEFAULT_TRACE_LIMIT))

    def reset(self) -> None:
        self.ema_1 = None
        self.ema_2 = None
        self.last_abs_diff = None
        self.last_threshold = None
        self.abs_diff_history.clear()
        self.trace.clear()

    def _get_numeric_value(self, features: dict[str, Any]) -> Optional[float]:
        raw_val = features.get(self.value_key)
        if isinstance(raw_val, (int, float)) and not isinstance(raw_val, bool):
            return float(raw_val)
        return None

    def _update_ema(self, value: float, current: Optional[float], period: int) -> float:
        alpha = 2.0 / (period + 1.0)
        if current is None:
            return value
        return value * alpha + current * (1.0 - alpha)

    def __call__(self, features: dict[str, Any]) -> int:
        val = self._get_numeric_value(features)
        signal = 0
        threshold: Optional[float] = None
        abs_diff: Optional[float] = None

        if val is not None:
            self.ema_1 = self._update_ema(val, self.ema_1, self.ema_period_1)
            self.ema_2 = self._update_ema(val, self.ema_2, self.ema_period_2)
            abs_diff = abs(self.ema_1 - self.ema_2)

            if (
                len(self.abs_diff_history) >= self.min_history
                and (threshold := compute_percentile(self.abs_diff_history, self.percentile)) is not None
                and (
                    (self.comparison == "gt" and abs_diff > threshold)
                    or (self.comparison == "lt" and abs_diff < threshold)
                )
            ):
                signal = 1

            self.abs_diff_history.append(abs_diff)
            if len(self.abs_diff_history) > self.history_window:
                self.abs_diff_history.popleft()

        self.last_abs_diff = abs_diff
        self.last_threshold = threshold
        self.trace.append(
            {
                "ema_1": self.ema_1,
                "ema_2": self.ema_2,
                "abs_diff": abs_diff,
                "threshold": threshold,
            }
        )
        if self.trace_limit is not None and len(self.trace) > self.trace_limit:
            del self.trace[: len(self.trace) - self.trace_limit]

        return signal


@dataclass
class SignalIntervalBetweenMarkers:
    """
    Mark all steps between a start signal and an end signal (inclusive).

    - start_signal_key: feature/signal treated as the interval start (A).
    - end_signal_key: feature/signal treated as the interval end (B).
    - max_length: optional cap on the number of steps inside one interval
      (inclusive of start/end). If the cap is reached before the end signal is
      seen, the interval closes automatically at that step.

    The call returns 1 for steps inside the open interval, otherwise 0. Closed
    intervals are recorded in `intervals` with their length and closure reason,
    and summary info is stored on `last_interval_length` and
    `last_interval_closed_by`.
    """

    start_signal_key: str
    end_signal_key: str
    max_length: Optional[int] = None
    intervals_limit: Any = _UNSET

    active: bool = False
    current_length: int = 0
    current_start_index: Optional[int] = None
    last_interval_length: Optional[int] = None
    last_interval_closed_by: Optional[str] = None
    intervals: list[dict[str, Any]] = field(default_factory=list, init=False)
    step_index: int = 0

    def __post_init__(self) -> None:
        if self.max_length is not None and self.max_length <= 0:
            raise ValueError("max_length must be > 0 when provided")
        self.intervals_limit = _resolve_limit(self.intervals_limit, _DEFAULT_TRACE_LIMIT)

    def reset(self) -> None:
        self.active = False
        self.current_length = 0
        self.current_start_index = None
        self.last_interval_length = None
        self.last_interval_closed_by = None
        self.intervals.clear()
        self.step_index = 0

    def _close_interval(self, reason: str) -> None:
        interval = {
            "start_index": self.current_start_index,
            "end_index": self.step_index,
            "length": self.current_length,
            "closed_by": reason,
        }
        self.last_interval_length = self.current_length
        self.last_interval_closed_by = reason
        self.intervals.append(interval)
        if self.intervals_limit is not None and len(self.intervals) > self.intervals_limit:
            del self.intervals[: len(self.intervals) - self.intervals_limit]

        self.active = False
        self.current_length = 0
        self.current_start_index = None

    def __call__(self, features: dict[str, Any]) -> int:
        start_active = bool(features.get(self.start_signal_key))
        end_active = bool(features.get(self.end_signal_key))
        signal = 0

        if self.active:
            self.current_length += 1
            signal = 1
            reached_max = self.max_length is not None and self.current_length >= self.max_length
            if end_active or reached_max:
                self._close_interval("end_signal" if end_active else "max_length")
        elif start_active:
            self.active = True
            self.current_length = 1
            self.current_start_index = self.step_index
            signal = 1
            reached_max = self.max_length is not None and self.current_length >= self.max_length
            if end_active or reached_max:
                self._close_interval("end_signal" if end_active else "max_length")

        self.step_index += 1
        return signal


@dataclass
class SignalNthTargetWithinWindowAfterTrigger:
    """
    After a trigger signal (A) fires, search the next `window_length` steps
    for the `target_index`-th occurrence (1-based) of a target signal (B).
    Emit 1 only on the step where that occurrence of B is observed.

    - trigger_signal_key: feature/signal treated as A.
    - target_signal_key: feature/signal treated as B.
    - target_index: which B occurrence to pick within the window (1-based).
    - window_length: how many future steps (excluding the trigger step) to scan.

    Each trigger opens an independent search window. If the requested B is not
    found before the window expires, last_search_success is set to False; if it
    is found, last_search_success is set to True. Overlapping windows from
    multiple triggers are supported.
    """

    trigger_signal_key: str
    target_signal_key: str
    window_length: int
    target_index: int

    active_windows: list[dict[str, int]] = field(default_factory=list, init=False)
    last_search_success: Optional[bool] = field(default=None, init=False)
    step_index: int = 0

    def __post_init__(self) -> None:
        if self.window_length <= 0:
            raise ValueError("window_length must be > 0")
        if self.target_index <= 0:
            raise ValueError("target_index must be >= 1")

    def reset(self) -> None:
        self.active_windows.clear()
        self.last_search_success = None
        self.step_index = 0

    def __call__(self, features: dict[str, Any]) -> int:
        signal = 0
        target_active = bool(features.get(self.target_signal_key))
        new_active_windows: list[dict[str, int]] = []

        for window in self.active_windows:
            if target_active:
                window["seen_targets"] = window.get("seen_targets", 0) + 1
                if window["seen_targets"] == self.target_index:
                    signal = 1
                    self.last_search_success = True
                    continue

            window["remaining_steps"] = window.get("remaining_steps", 0) - 1
            if window["remaining_steps"] <= 0:
                self.last_search_success = False
                continue

            new_active_windows.append(window)

        self.active_windows = new_active_windows

        if bool(features.get(self.trigger_signal_key)):
            self.active_windows.append(
                {
                    "remaining_steps": self.window_length,
                    "seen_targets": 0,
                    "start_step": self.step_index,
                }
            )

        self.step_index += 1
        return signal


@dataclass
class SignalIntersection:
    """
    Intersection signal: returns 1 only when all listed signal keys are truthy.
    """

    signal_keys: list[str]

    def __post_init__(self) -> None:
        if len(self.signal_keys) < 2:
            raise ValueError("signal_keys must contain at least 2 keys")
        if len(set(self.signal_keys)) != len(self.signal_keys):
            raise ValueError("signal_keys must be unique")

    def reset(self) -> None:
        pass

    def __call__(self, features: dict[str, Any]) -> int:
        for key in self.signal_keys:
            if not bool(features.get(key)):
                return 0
        return 1


@dataclass
class SignalExternalFlag:
    """
    External flag signal: returns 1 when the external feature equals true_value.
    """

    signal_key: str
    true_value: Any = 1

    def reset(self) -> None:
        pass

    def __call__(self, features: dict[str, Any]) -> int:
        return 1 if features.get(self.signal_key) == self.true_value else 0
