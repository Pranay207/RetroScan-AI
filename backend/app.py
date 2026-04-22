from __future__ import annotations

import io
import os
from functools import lru_cache
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

GRID_BRIGHTNESS_THRESHOLD = 120

SPEED_THRESHOLDS = {
    40: 100,
    60: 150,
    80: 200,
    100: 250,
    120: 300,
}

OBJECT_TYPES = {
    "sign": {
        "label": "Road Sign",
        "standard": "IRC 67",
        "score_multiplier": 2.1,
        "compliant": 300,
        "warning": 150,
    },
    "marking": {
        "label": "Pavement Marking",
        "standard": "IRC 35",
        "score_multiplier": 1.6,
        "compliant": 200,
        "warning": 100,
    },
    "stud": {
        "label": "Road Stud",
        "standard": "IRC 35",
        "score_multiplier": 2.8,
        "compliant": 400,
        "warning": 200,
    },
}


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def classify_object_type(class_name: str, brightness: float) -> str:
    normalized = class_name.lower()
    if "sign" in normalized or "traffic" in normalized:
        return "sign"
    if "road" in normalized or "lane" in normalized or "crosswalk" in normalized or "mark" in normalized:
        return "marking"
    if "cone" in normalized or "bollard" in normalized or "stud" in normalized or "reflector" in normalized:
        return "stud"
    if brightness > 200:
        return "sign"
    if brightness >= 130:
        return "marking"
    return "stud"


def compute_brightness(image: np.ndarray, bbox: list[int]) -> int:
    x1, y1, x2, y2 = bbox
    roi = image[y1:y2, x1:x2]
    if roi.size == 0:
        return 0
    rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
    brightness = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    return int(np.mean(brightness))


def score_to_status(score: int, object_type: str) -> str:
    thresholds = OBJECT_TYPES[object_type]
    if score >= thresholds["compliant"]:
        return "COMPLIANT"
    if score >= thresholds["warning"]:
        return "WARNING"
    return "NON-COMPLIANT"


def recommendation_for_status(status: str) -> str:
    if status == "COMPLIANT":
        return "No action needed"
    if status == "WARNING":
        return "Schedule inspection within 3 months"
    return "Immediate replacement required"


def priority_for_status(status: str, score: int, object_type: str) -> str:
    threshold = OBJECT_TYPES[object_type]["warning"]
    if status == "NON-COMPLIANT":
        return "CRITICAL" if score < threshold * 0.75 else "HIGH"
    if status == "WARNING":
        return "MEDIUM"
    return "LOW"


def safety_summary(objects: list[dict[str, Any]]) -> dict[str, Any]:
    if not objects:
        return {"score": 0, "compliantCount": 0, "totalCount": 0, "grade": "F"}

    weighted = 0.0
    compliant = 0
    for obj in objects:
        if obj["ircStatus"] == "COMPLIANT":
            weighted += 1
            compliant += 1
        elif obj["ircStatus"] == "WARNING":
            weighted += 0.5

    score = round((weighted / len(objects)) * 100)
    if score >= 90:
        grade = "A"
    elif score >= 80:
        grade = "B"
    elif score >= 70:
        grade = "C"
    elif score >= 60:
        grade = "D"
    else:
        grade = "F"

    return {
        "score": score,
        "compliantCount": compliant,
        "totalCount": len(objects),
        "grade": grade,
    }


@lru_cache
def get_model() -> YOLO:
    model_name = os.getenv("YOLO_MODEL", "yolov8n.pt")
    return YOLO(model_name)


app = FastAPI(title="RetroScan YOLO API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/detect")
async def detect(file: UploadFile = File(...), speed: int = Form(80)) -> dict[str, Any]:
    if speed not in SPEED_THRESHOLDS:
        raise HTTPException(status_code=400, detail="Speed must be one of 40, 60, 80, 100, 120.")

    raw = await file.read()
    np_buffer = np.frombuffer(raw, dtype=np.uint8)
    image = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Unable to decode uploaded image.")

    model = get_model()
    results = model.predict(source=image, verbose=False)
    detections: list[dict[str, Any]] = []

    if results:
        result = results[0]
        names = result.names
        boxes = result.boxes
        if boxes is not None:
            for index, box in enumerate(boxes):
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int).tolist()
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(image.shape[1], x2)
                y2 = min(image.shape[0], y2)
                if x2 <= x1 or y2 <= y1:
                    continue

                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                class_name = names.get(class_id, f"class_{class_id}")
                brightness = compute_brightness(image, [x1, y1, x2, y2])

                if brightness < GRID_BRIGHTNESS_THRESHOLD * 0.7:
                    continue

                object_type = classify_object_type(class_name, brightness)
                config = OBJECT_TYPES[object_type]
                score = round(brightness * config["score_multiplier"])
                irc_status = score_to_status(score, object_type)
                speed_threshold = SPEED_THRESHOLDS[speed]
                speed_status = "SAFE" if score >= speed_threshold else "UNSAFE"

                detections.append(
                    {
                        "id": f"OBJ-{index + 1:03d}",
                        "className": class_name,
                        "type": object_type,
                        "typeLabel": config["label"],
                        "standard": config["standard"],
                        "brightness": brightness,
                        "score": score,
                        "ircStatus": irc_status,
                        "speedThreshold": speed_threshold,
                        "speedStatus": speed_status,
                        "speedUnsafeDespiteIrc": irc_status == "COMPLIANT" and score < speed_threshold,
                        "confidence": min(99, round(max(60, 60 + brightness / 5, confidence * 100))),
                        "visibilityDistance": round(score * 0.8),
                        "recommendation": recommendation_for_status(irc_status),
                        "priority": priority_for_status(irc_status, score, object_type),
                        "bbox": {
                            "x": x1,
                            "y": y1,
                            "width": x2 - x1,
                            "height": y2 - y1,
                        },
                    }
                )

    detections = sorted(detections, key=lambda item: item["brightness"], reverse=True)[:5]
    for index, item in enumerate(detections):
        item["id"] = f"OBJ-{index + 1:03d}"

    return {
        "fileName": file.filename,
        "objects": detections,
        "summary": safety_summary(detections),
    }
