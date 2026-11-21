#!/bin/bash
# FYND OPS Backend — start script
# Uses Python 3.13 (Python 3.15 DLLs are blocked by Application Control policy on this machine)
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
