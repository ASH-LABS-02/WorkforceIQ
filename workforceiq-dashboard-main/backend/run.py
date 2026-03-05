#!/usr/bin/env python3
"""
Quick start script for the WorkforceIQ backend.
Runs uvicorn with hot reload enabled.
"""
import subprocess
import sys
import os

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    subprocess.run(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        check=True,
    )
