"""
Demo 2 (Python): create a signal on a TimeframeView using the TEMP column.

The signal used here is ValueVsRollingPercentile with:
- percentile=80
- comparison="lt"
"""

from __future__ import annotations


def main() -> None:
    import os
    import sys

    htf_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if htf_root not in sys.path:
        sys.path.insert(0, htf_root)

    from htf.demos.demo_py_2 import main as demo_main

    demo_main()


if __name__ == "__main__":
    main()
