# RetroScan YOLO Backend

This backend provides a FastAPI detection API for the RetroScan frontend using YOLOv8 and OpenCV.

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

## Endpoint

- `GET /health`
- `POST /detect`
  - multipart form fields:
    - `file`: uploaded image
    - `speed`: one of `40, 60, 80, 100, 120`

## Notes

- Default model: `yolov8n.pt`
- Override model with env var:

```powershell
$env:YOLO_MODEL="yolov8s.pt"
```
