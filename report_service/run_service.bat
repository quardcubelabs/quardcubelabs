@echo off
echo Starting QuardCube Labs Report Service...
cd /d "%~dp0"
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
