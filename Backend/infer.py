"""
infer.py
────────
Run the trained model on one image (or a folder of images).
Crops each detected signature and saves it as a transparent PNG.
Also saves a white output page with signatures at their original coordinates.

Usage
-----
  python infer.py --image document.jpg
  python infer.py --image docs/ --out results/   # batch folder
  python infer.py --image doc.jpg --show          # display windows
  python infer.py --image doc.jpg --conf 0.25     # lower threshold
"""

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


# ─── Detection ────────────────────────────────────────────────────────────────

def detect(model, image: np.ndarray, conf: float, iou: float) -> list[dict]:
    """Returns list of {id, conf, x, y, w, h}."""
    results = model.predict(source=image, conf=conf, iou=iou, verbose=False)
    dets = []
    for res in results:
        if res.boxes is None:
            continue
        for i, box in enumerate(res.boxes):
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            dets.append({
                "id": i + 1,
                "conf": float(box.conf[0]),
                "x": int(x1), "y": int(y1),
                "w": int(x2 - x1), "h": int(y2 - y1),
            })
    dets.sort(key=lambda d: d["conf"], reverse=True)
    for i, d in enumerate(dets):
        d["id"] = i + 1
    return dets


# ─── Extraction ───────────────────────────────────────────────────────────────

def remove_background(crop_bgr: np.ndarray, threshold: int = 215) -> np.ndarray:
    """Return BGRA with white background made transparent."""
    bgra = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2BGRA)
    gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)
    _, bg = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
    ink   = cv2.bitwise_not(bg)
    ink   = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    bgra[:, :, 3] = ink
    return bgra


def crop_signature(img: np.ndarray, det: dict, pad: int = 6) -> tuple[np.ndarray, dict]:
    """Crop + remove background. Returns (bgra_crop, padded_bbox)."""
    ih, iw = img.shape[:2]
    x1 = max(0, det["x"] - pad)
    y1 = max(0, det["y"] - pad)
    x2 = min(iw, det["x"] + det["w"] + pad)
    y2 = min(ih, det["y"] + det["h"] + pad)
    crop = img[y1:y2, x1:x2].copy()
    bgra = remove_background(crop)
    return bgra, {"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1}


def paste_onto(canvas: np.ndarray, bgra: np.ndarray, x: int, y: int) -> None:
    """Alpha-blend bgra crop onto canvas (BGR) at (x, y), in-place."""
    sh, sw = bgra.shape[:2]
    ch, cw = canvas.shape[:2]
    x2, y2 = min(x + sw, cw), min(y + sh, ch)
    if x2 <= x or y2 <= y:
        return
    crop_region   = bgra[0:y2-y, 0:x2-x]
    canvas_region = canvas[y:y2, x:x2].astype(np.float32)
    ink   = crop_region[:, :, :3].astype(np.float32)
    alpha = crop_region[:, :, 3:4].astype(np.float32) / 255.0
    blended = ink * alpha + canvas_region * (1.0 - alpha)
    canvas[y:y2, x:x2] = np.clip(blended, 0, 255).astype(np.uint8)


def draw_boxes(img: np.ndarray, dets: list[dict]) -> np.ndarray:
    out = img.copy()
    colors = [(0,229,255),(255,95,126),(255,201,77),(91,140,255),(191,127,255)]
    for d in dets:
        col = colors[(d["id"] - 1) % len(colors)]
        cv2.rectangle(out, (d["x"], d["y"]), (d["x"]+d["w"], d["y"]+d["h"]), col, 2)
        label = f"sig{d['id']} {d['conf']:.0%}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(out, (d["x"], d["y"]-th-8), (d["x"]+tw+4, d["y"]), col, -1)
        cv2.putText(out, label, (d["x"]+2, d["y"]-4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0,0,0), 1, cv2.LINE_AA)
    return out


# ─── Per-image pipeline ───────────────────────────────────────────────────────

def process_image(model, img_path: Path, out_dir: Path, args) -> int:
    img = cv2.imread(str(img_path))
    if img is None:
        print(f"  [!] Cannot read: {img_path}")
        return 0

    ih, iw = img.shape[:2]
    dets = detect(model, img, args.conf, args.iou)

    if not dets:
        print(f"  {img_path.name}: no signatures detected")
        return 0

    print(f"  {img_path.name}: {len(dets)} signature(s) detected")

    stem      = img_path.stem
    crops_dir = out_dir / stem / "crops"
    crops_dir.mkdir(parents=True, exist_ok=True)

    # White output canvas
    output_page = np.full((ih, iw, 3), 255, dtype=np.uint8)

    for d in dets:
        bgra, bbox = crop_signature(img, d, pad=args.pad)

        # Save individual crop
        crop_path = crops_dir / f"sig_{d['id']:02d}.png"
        cv2.imwrite(str(crop_path), bgra)

        # Place on output page
        paste_onto(output_page, bgra, bbox["x"], bbox["y"])

        print(f"    sig_{d['id']:02d}  conf={d['conf']:.3f}  "
              f"x={d['x']} y={d['y']} w={d['w']} h={d['h']}")

    # Save outputs
    ann  = draw_boxes(img, dets)
    cv2.imwrite(str(out_dir / stem / "annotated.png"), ann)
    cv2.imwrite(str(out_dir / stem / "output_page.png"), output_page)

    if args.show:
        cv2.imshow("Annotated", ann)
        cv2.imshow("Output Page", output_page)
        print("  Press any key…")
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    return len(dets)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--image",   required=True, help="Image file or folder.")
    p.add_argument("--model",   default="runs/train/sig_v1/weights/best.pt")
    p.add_argument("--conf",    type=float, default=0.35)
    p.add_argument("--iou",     type=float, default=0.45)
    p.add_argument("--pad",     type=int,   default=6, help="Bbox padding in pixels.")
    p.add_argument("--out",     default="outputs/")
    p.add_argument("--show",    action="store_true")
    args = p.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        print(f"[!] Model not found: {model_path}")
        print("    Train first:  python train/train.py")
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[!] Run: pip install ultralytics")
        sys.exit(1)

    print(f"Loading model: {model_path}")
    model = YOLO(str(model_path))

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    src = Path(args.image)
    if src.is_dir():
        images = [p for p in src.rglob("*") if p.suffix.lower() in IMG_EXTS]
        print(f"Processing {len(images)} image(s) from {src}\n")
    else:
        images = [src]

    total = sum(process_image(model, img, out_dir, args) for img in images)
    print(f"\nDone. {total} signature(s) extracted → {out_dir}")


if __name__ == "__main__":
    main()
