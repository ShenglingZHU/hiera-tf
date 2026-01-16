"""
Demo 1 (Python): create a TimeframeView instance and push random data into it.

This example focuses on the minimal setup for a time series view:
- build synthetic records with Year/Month/Day/Hour/Minute/Second + TEMP
- create TimeframeConfig/TimeframeView
- feed records through on_new_record()
"""

from __future__ import annotations


def main() -> None:
    import os
    import sys

    htf_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if htf_root not in sys.path:
        sys.path.insert(0, htf_root)

    from htf.demos.demo_py_1 import main as demo_main

    demo_main()


if __name__ == "__main__":
    main()
