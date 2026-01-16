"""
Demo 3 (Python): apply a higher-timeframe signal as a hierarchical constraint.

Setup:
- 15m timeframe (higher granularity / coarser) produces a constraint signal
- 5m timeframe (lower granularity / finer) produces a base signal
- HierarConstraintCoordinator gates the 5m signal using the latest 15m signal
- HTF data uses a ramping baseline to force the constraint signal to toggle
"""

from __future__ import annotations


def main() -> None:
    import os
    import sys

    htf_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if htf_root not in sys.path:
        sys.path.insert(0, htf_root)

    from htf.demos.demo_py_3 import main as demo_main

    demo_main()


if __name__ == "__main__":
    main()
