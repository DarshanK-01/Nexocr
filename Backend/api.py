"""
api.py — FastAPI wrapper around infer.py
Exposes POST /detect-signatures for the Next.js frontend.

Usage:
  pip install fastapi uvicorn python-multipart
  uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload
"""

import base64
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from infer import detect, crop_signature, draw_boxes

app = FastAPI(title="SignatureScan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9002", "http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── Load model once at startup ────────────────────────────────────────────────
MODEL = None
MODEL_PATH = ROOT / "runs" / "train" / "sig_v1" / "weights" / "best.pt"

@app.on_event("startup")
def load_model():
    global MODEL
    if not MODEL_PATH.exists():
        print(f"[SignatureScan] WARNING: model not found at {MODEL_PATH}")
        print("  Run: python backend/train.py  to train first.")
        return
    try:
        from ultralytics import YOLO
        MODEL = YOLO(str(MODEL_PATH))
        print(f"[SignatureScan] Model loaded: {MODEL_PATH}")
    except Exception as e:
        print(f"[SignatureScan] Failed to load model: {e}")


# ── Request / Response schemas ────────────────────────────────────────────────

class DetectRequest(BaseModel):
    imageBase64: str        # data URI or raw base64
    conf: float = 0.35
    iou: float = 0.45
    pad: int = 6

class SignatureResult(BaseModel):
    id: int
    conf: float
    x: int
    y: int
    w: int
    h: int
    cropBase64: str         # transparent PNG crop as base64 data URI

class DetectResponse(BaseModel):
    count: int
    signatures: list[SignatureResult]
    annotatedBase64: str    # original image with bounding boxes drawn


# ── Endpoint ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "modelLoaded": MODEL is not None}


@app.post("/detect-signatures", response_model=DetectResponse)
def detect_signatures(req: DetectRequest):
    if MODEL is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Train the model first: python backend/train.py"
        )

    # Decode base64 image
    raw = req.imageBase64
    if raw.startswith("data:"):
        raw = raw.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(raw)
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")

    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    # Run detection
    dets = detect(MODEL, img, req.conf, req.iou)

    results = []
    for d in dets:
        bgra, _ = crop_signature(img, d, pad=req.pad)
        _, buf = cv2.imencode(".png", bgra)
        crop_b64 = "data:image/png;base64," + base64.b64encode(buf).decode()
        results.append(SignatureResult(
            id=d["id"], conf=round(d["conf"], 4),
            x=d["x"], y=d["y"], w=d["w"], h=d["h"],
            cropBase64=crop_b64,
        ))

    # Annotated image
    ann = draw_boxes(img, dets)
    _, ann_buf = cv2.imencode(".jpg", ann, [cv2.IMWRITE_JPEG_QUALITY, 90])
    ann_b64 = "data:image/jpeg;base64," + base64.b64encode(ann_buf).decode()

    return DetectResponse(count=len(results), signatures=results, annotatedBase64=ann_b64)
