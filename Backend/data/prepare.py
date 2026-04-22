"""
data/prepare.py
───────────────
Downloads public signature datasets and converts them to YOLO format.

Supported sources
-----------------
1. CEDAR (cedar.buffalo.edu)          -- genuine/forged signature PNGs
2. Kaggle: robinreni/signature-verification-dataset
3. Kaggle: victordibia/signverod      -- signatures already on documents (pre-labeled)
4. SigNet (local zips if you have them)

If you have your OWN signature crop images:
  - Place PNGs/JPGs anywhere, run:
      python data/prepare.py --source local --sig-dir /path/to/your/crops

Output
------
  data/raw/signatures/   raw signature crops
  data/yolo/             YOLO dataset (images + labels) ready for train.py

Usage examples
--------------
  python data/prepare.py --source kaggle     # needs KAGGLE_USERNAME / KAGGLE_KEY env vars
  python data/prepare.py --source local --sig-dir my_sigs/
  python data/prepare.py --source synthetic  # generate without any real data
"""

import argparse
import os
import random
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from tqdm import tqdm

ROOT     = Path(__file__).resolve().parent.parent
RAW_DIR  = ROOT / "data" / "raw" / "signatures"
YOLO_DIR = ROOT / "data" / "yolo"

random.seed(42)
np.random.seed(42)

# ── Page constants ────────────────────────────────────────────────────────────
PAGE_W, PAGE_H   = 1240, 1754     # A4 @ ~150 dpi
MIN_SCALE        = 0.06            # signature min width as fraction of page
MAX_SCALE        = 0.28
MAX_SIGS_PER_IMG = 3


# ═════════════════════════════════════════════════════════════════════════════
# 1. DOWNLOADERS
# ═════════════════════════════════════════════════════════════════════════════

def download_kaggle(dataset: str, dest: Path):
    """Download a Kaggle dataset. Requires KAGGLE_USERNAME + KAGGLE_KEY env vars."""
    dest.mkdir(parents=True, exist_ok=True)
    print(f"  Downloading kaggle dataset: {dataset}")
    result = subprocess.run(
        ["kaggle", "datasets", "download", dataset, "-p", str(dest), "--unzip"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"  [!] kaggle error:\n{result.stderr}")
        sys.exit(1)


def collect_images_from_dir(src: Path, dst: Path, label: str) -> int:
    """Copy all image files from src (recursive) into dst with a label prefix."""
    dst.mkdir(parents=True, exist_ok=True)
    exts = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
    count = 0
    for p in src.rglob("*"):
        if p.suffix.lower() in exts and p.stat().st_size > 0:
            dst_path = dst / f"{label}_{count:06d}{p.suffix.lower()}"
            shutil.copy2(p, dst_path)
            count += 1
    return count


def source_kaggle_robinreni(raw_dir: Path):
    tmp = raw_dir / "_kaggle_rr"
    download_kaggle("robinreni/signature-verification-dataset", tmp)
    # Dataset contains genuine/ and forged/ — we use genuine only
    genuine = tmp / "Dataset_Signature_Final" / "Dataset" / "Dataset_Signature"
    if not genuine.exists():
        # Try flat structure
        genuine = tmp
    n = collect_images_from_dir(genuine, raw_dir, "rr")
    print(f"  Collected {n} signature crops from robinreni dataset.")
    shutil.rmtree(tmp, ignore_errors=True)


def source_local(sig_dir: str, raw_dir: Path):
    src = Path(sig_dir)
    if not src.exists():
        print(f"[!] Directory not found: {src}")
        sys.exit(1)
    n = collect_images_from_dir(src, raw_dir, "local")
    print(f"  Collected {n} signature crops from {src}.")


# ═════════════════════════════════════════════════════════════════════════════
# 2. BACKGROUND GENERATORS
# ═════════════════════════════════════════════════════════════════════════════

_LOREM = (
    "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor "
    "incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud "
    "exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute "
    "irure dolor reprehenderit voluptate velit esse cillum dolore eu fugiat nulla "
    "pariatur excepteur sint occaecat cupidatat non proident sunt culpa officia "
    "deserunt mollit anim id est laborum "
).split()


def make_background(style: str = "auto") -> np.ndarray:
    """Return an H×W×3 uint8 BGR background."""
    styles = ["blank", "lined", "text"]
    s = random.choice(styles) if style == "auto" else style

    bg = np.full((PAGE_H, PAGE_W, 3), 252, dtype=np.uint8)
    noise = np.random.randint(-5, 5, bg.shape, dtype=np.int16)
    bg = np.clip(bg.astype(np.int16) + noise, 200, 255).astype(np.uint8)

    if s == "lined":
        for y in range(90, PAGE_H, 36):
            cv2.line(bg, (50, y), (PAGE_W - 50, y), (195, 205, 215), 1)

    if s == "text":
        img_pil = Image.fromarray(cv2.cvtColor(bg, cv2.COLOR_BGR2RGB))
        draw    = ImageDraw.Draw(img_pil)
        words   = _LOREM * 40
        x, y    = 60, 80
        lh      = 22
        for w in words:
            ww = len(w) * 7
            if x + ww > PAGE_W - 60:
                x = 60; y += lh
            if y > PAGE_H - 100:
                break
            draw.text((x, y), w, fill=(45, 45, 55))
            x += ww + 8
        bg = cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)

    # Random slight blur to mimic scan
    if random.random() < 0.25:
        bg = cv2.GaussianBlur(bg, (3, 3), 0)

    return bg


# ═════════════════════════════════════════════════════════════════════════════
# 3. SIGNATURE PREPROCESSING
# ═════════════════════════════════════════════════════════════════════════════

def load_sig_rgba(path: Path) -> Optional[np.ndarray]:
    """Load a signature image and remove its white background → BGRA."""
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        return None

    # If already BGRA keep it
    if img.ndim == 3 and img.shape[2] == 4:
        bgra = img
    else:
        bgra = cv2.cvtColor(img if img.ndim == 3 else cv2.cvtColor(img, cv2.COLOR_GRAY2BGR),
                            cv2.COLOR_BGR2BGRA)

    # Remove white background via brightness threshold
    gray = cv2.cvtColor(bgra[:, :, :3], cv2.COLOR_BGR2GRAY)
    _, bg_mask = cv2.threshold(gray, 210, 255, cv2.THRESH_BINARY)
    ink_mask   = cv2.bitwise_not(bg_mask)
    ink_mask   = cv2.morphologyEx(ink_mask, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))

    # Drop near-empty images
    if ink_mask.sum() < 500:
        return None

    bgra[:, :, 3] = ink_mask
    return bgra


def augment_sig(bgra: np.ndarray) -> np.ndarray:
    """Random rotation, slight skew, opacity variation."""
    angle   = random.uniform(-8, 8)
    h, w    = bgra.shape[:2]
    M       = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    bgra    = cv2.warpAffine(bgra, M, (w, h), flags=cv2.INTER_LINEAR,
                             borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 255, 255, 0))

    # Slight horizontal stretch / squish
    sx = random.uniform(0.85, 1.15)
    new_w = max(1, int(w * sx))
    bgra = cv2.resize(bgra, (new_w, h), interpolation=cv2.INTER_LINEAR)

    # Opacity jitter
    alpha = random.uniform(0.70, 1.0)
    bgra[:, :, 3] = np.clip(bgra[:, :, 3].astype(np.float32) * alpha, 0, 255).astype(np.uint8)
    return bgra


def scale_sig(bgra: np.ndarray, page_w: int) -> np.ndarray:
    scale = random.uniform(MIN_SCALE, MAX_SCALE)
    nw    = max(1, int(page_w * scale))
    ratio = nw / bgra.shape[1]
    nh    = max(1, int(bgra.shape[0] * ratio))
    return cv2.resize(bgra, (nw, nh), interpolation=cv2.INTER_LANCZOS4)


# ═════════════════════════════════════════════════════════════════════════════
# 4. COMPOSITING + YOLO LABEL
# ═════════════════════════════════════════════════════════════════════════════

def paste(bg: np.ndarray, sig_bgra: np.ndarray, x: int, y: int) -> None:
    """Alpha-blend sig_bgra onto bg (in-place, BGR)."""
    sh, sw = sig_bgra.shape[:2]
    ph, pw = bg.shape[:2]
    x2, y2 = min(x + sw, pw), min(y + sh, ph)
    if x2 <= x or y2 <= y:
        return
    roi    = bg[y:y2, x:x2].astype(np.float32)
    ink    = sig_bgra[0:y2-y, 0:x2-x, :3].astype(np.float32)
    alpha  = sig_bgra[0:y2-y, 0:x2-x, 3:4].astype(np.float32) / 255.0
    blended = ink * alpha + roi * (1.0 - alpha)
    bg[y:y2, x:x2] = np.clip(blended, 0, 255).astype(np.uint8)


def try_place(pw, ph, sw, sh, occupied, margin=40, tries=60):
    for _ in range(tries):
        x = random.randint(margin, max(margin + 1, pw - sw - margin))
        y = random.randint(margin, max(margin + 1, ph - sh - margin))
        if not any(x < ox+ow and x+sw > ox and y < oy+oh and y+sh > oy
                   for ox, oy, ow, oh in occupied):
            return x, y
    return None


def yolo_line(x, y, w, h, pw, ph, cls=0) -> str:
    cx = (x + w / 2) / pw
    cy = (y + h / 2) / ph
    return f"{cls} {cx:.6f} {cy:.6f} {w/pw:.6f} {h/ph:.6f}"


# ═════════════════════════════════════════════════════════════════════════════
# 5. DATASET SYNTHESIS
# ═════════════════════════════════════════════════════════════════════════════

def synthesize(split: str, n: int, sig_paths: list[Path], yolo_dir: Path):
    img_out = yolo_dir / "images" / split
    lbl_out = yolo_dir / "labels" / split
    img_out.mkdir(parents=True, exist_ok=True)
    lbl_out.mkdir(parents=True, exist_ok=True)

    saved = 0
    for i in tqdm(range(n), desc=f"  {split:5s}", unit="img"):
        bg = make_background()
        ph, pw = bg.shape[:2]

        occupied = []
        labels   = []

        for _ in range(random.randint(1, MAX_SIGS_PER_IMG)):
            path    = random.choice(sig_paths)
            sig_raw = load_sig_rgba(path)
            if sig_raw is None:
                continue
            sig = augment_sig(sig_raw)
            sig = scale_sig(sig, pw)
            sh, sw = sig.shape[:2]

            pos = try_place(pw, ph, sw, sh, occupied)
            if pos is None:
                continue

            x, y = pos
            paste(bg, sig, x, y)
            occupied.append((x, y, sw, sh))
            labels.append(yolo_line(x, y, sw, sh, pw, ph))

        if not labels:
            continue

        stem = f"{split}_{saved:06d}"
        cv2.imwrite(str(img_out / f"{stem}.jpg"), bg, [cv2.IMWRITE_JPEG_QUALITY, 92])
        (lbl_out / f"{stem}.txt").write_text("\n".join(labels))
        saved += 1

    print(f"  → {saved} images written")


# ═════════════════════════════════════════════════════════════════════════════
# 6. MAIN
# ═════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["kaggle", "local", "synthetic"],
                        default="synthetic",
                        help="Where to get signature crops.")
    parser.add_argument("--sig-dir", default=None,
                        help="Path to local signature crop images (--source local).")
    parser.add_argument("--n-train", type=int, default=2000)
    parser.add_argument("--n-val",   type=int, default=400)
    parser.add_argument("--n-test",  type=int, default=200)
    args = parser.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    # ── Collect signature crops ───────────────────────────────────────
    print("\n[1/2] Collecting signature crops…")

    if args.source == "kaggle":
        source_kaggle_robinreni(RAW_DIR)
    elif args.source == "local":
        if not args.sig_dir:
            print("[!] --sig-dir required with --source local"); sys.exit(1)
        source_local(args.sig_dir, RAW_DIR)
    else:  # synthetic — generate minimal placeholder crops
        print("  No external source. Generating simple synthetic signature crops…")
        _generate_placeholder_sigs(RAW_DIR, n=200)

    sig_paths = list(RAW_DIR.glob("*"))
    sig_paths = [p for p in sig_paths if p.suffix.lower() in
                 {".png",".jpg",".jpeg",".bmp",".tif",".tiff"}]

    if not sig_paths:
        print("[!] No signature images found. Aborting."); sys.exit(1)

    print(f"  Using {len(sig_paths)} signature crop(s).")

    # ── Synthesize YOLO dataset ───────────────────────────────────────
    print("\n[2/2] Synthesizing YOLO dataset…")
    synthesize("train", args.n_train, sig_paths, YOLO_DIR)
    synthesize("val",   args.n_val,   sig_paths, YOLO_DIR)
    synthesize("test",  args.n_test,  sig_paths, YOLO_DIR)

    print(f"\nDataset ready at: {YOLO_DIR}")
    print("Next:  python train/train.py")


# ─── Placeholder signature generator (used when --source synthetic) ──────────

def _generate_placeholder_sigs(out_dir: Path, n: int = 200):
    """
    Draw cursive-like squiggles as stand-in signature crops.
    Not realistic, but enough to verify the pipeline end-to-end.
    Replace with real crops for production training.
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    for i in range(n):
        w, h = random.randint(180, 420), random.randint(40, 110)
        img  = np.full((h, w, 3), 255, dtype=np.uint8)

        # Random ink colour (mostly dark)
        ink = (random.randint(0, 60), random.randint(0, 60), random.randint(0, 80))

        pts = []
        x = random.randint(10, 30)
        y = h // 2 + random.randint(-h // 4, h // 4)
        pts.append([x, y])
        while x < w - 20:
            x += random.randint(8, 22)
            y  = h // 2 + random.randint(-h // 3, h // 3)
            pts.append([x, y])

        pts_arr = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(img, [pts_arr], isClosed=False, color=ink,
                      thickness=random.randint(1, 3))

        # Sometimes add a horizontal underline
        if random.random() < 0.4:
            uy = int(h * 0.75)
            cv2.line(img, (10, uy), (w - 10, uy), ink, 1)

        cv2.imwrite(str(out_dir / f"synth_{i:04d}.png"), img)

    print(f"  Generated {n} placeholder signature crops → {out_dir}")


if __name__ == "__main__":
    main()
