# Retro Scan AI

Retro Scan AI is an end-to-end solution for automated road asset detection, scoring, and analytics using YOLO-based computer vision and a modern web dashboard.

## Features
- **YOLO-based Detection**: Fast, accurate object detection for road signs, markings, and studs.
- **FastAPI Backend**: Python API for running YOLO inference and serving results.
- **React Frontend**: Modern dashboard for visualizing detections, analytics, and reports.
- **Seamless Integration**: Frontend automatically detects backend availability and falls back gracefully if offline.
- **Extensible Scoring**: Customizable scoring and compliance logic for different asset types.

## Project Structure
```
Retro Scan AI/
├── backend/           # FastAPI backend and YOLO logic
│   ├── app.py         # Main FastAPI app
│   ├── requirements.txt
│   └── ...
├── src/               # React frontend source code
│   ├── api/
│   ├── components/
│   ├── pages/
│   └── ...
├── public/            # Static assets
├── package.json       # Frontend dependencies
└── ...
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Recommended) [Git](https://git-scm.com/)

### Backend Setup
1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Create and activate a virtual environment:
   ```sh
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```sh
   uvicorn app:app --reload --host 127.0.0.1 --port 8000
   ```

### Frontend Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## API Endpoints
- `GET /health` — Health check
- `POST /detect` — Run YOLO detection on an uploaded image

## YOLO Model
- The backend uses [Ultralytics YOLO](https://github.com/ultralytics/ultralytics). The default model is `yolov8n.pt`.
- To use a custom model, set the `YOLO_MODEL` environment variable.

## Troubleshooting
- **Backend not found?** Ensure the FastAPI server is running and accessible at `http://127.0.0.1:8000`.
- **Module errors?** Double-check your Python environment and installed dependencies.
- **YOLO errors?** Make sure the model file exists and is compatible with your Ultralytics version.

## License
MIT License

## Authors
- [Your Name] — Project Lead
- [Contributors]

---
For questions or support, please open an issue or contact the maintainer.
