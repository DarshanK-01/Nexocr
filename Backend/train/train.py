"""
train/train.py
──────────────
Fine-tunes YOLOv8 on the signature dataset produced by data/prepare.py.

Usage
-----
  # recommended starting point (GPU)
  python train/train.py

  # lighter run for CPU / quick test
  python train/train.py --model yolov8n.pt --epochs 30 --imgsz 640

  # full-quality run
  python train/train.py --model yolov8m.pt --epochs 150 --batch 8

  # resume interrupted training
  python train/train.py --resume runs/train/sig_v1/weights/last.pt

Model size guide
----------------
  yolov8n   nano   ~3 MB    fastest, CPU-friendly, lower accuracy
  yolov8s   small  ~22 MB   good balance — recommended default
  yolov8m   medium ~52 MB   better accuracy, needs GPU
  yolov8l   large  ~87 MB   highest accuracy, needs strong GPU

Outputs
-------
  runs/train/sig_v1/weights/best.pt   ← best checkpoint (use for inference)
  runs/train/sig_v1/weights/last.pt   ← latest checkpoint (use for --resume)
  runs/train/sig_v1/results.png       ← loss / mAP curves
"""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


# ─── Argument parsing ────────────────────────────────────────────────────────

def get_args():
    p = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    # Model
    p.add_argument("--model", default="yolov8s.pt",
                   choices=["yolov8n.pt","yolov8s.pt","yolov8m.pt","yolov8l.pt"],
                   help="Pretrained backbone.")
    p.add_argument("--resume", default=None, metavar="CKPT",
                   help="Resume from checkpoint (overrides --model).")

    # Data
    p.add_argument("--data", default=str(ROOT / "configs" / "signature.yaml"))
    p.add_argument("--imgsz", type=int, default=640,
                   help="Input resolution (square). 640 is standard; use 1024 for small sigs.")

    # Training schedule
    p.add_argument("--epochs",   type=int, default=100)
    p.add_argument("--batch",    type=int, default=16,
                   help="Batch size. Use -1 for auto-batch (GPU only).")
    p.add_argument("--patience", type=int, default=20,
                   help="Early-stop: stop if no improvement for N epochs.")

    # Optimiser
    p.add_argument("--lr0",      type=float, default=0.01,  help="Initial learning rate.")
    p.add_argument("--lrf",      type=float, default=0.01,  help="Final LR = lr0 * lrf.")
    p.add_argument("--momentum", type=float, default=0.937)
    p.add_argument("--wd",       type=float, default=0.0005, dest="weight_decay")
    p.add_argument("--warmup",   type=int,   default=3,     help="Warmup epochs.")

    # Hardware
    p.add_argument("--device",   default="",
                   help="'' = auto-detect, 'cpu', '0' = first GPU, '0,1' = multi-GPU.")
    p.add_argument("--workers",  type=int, default=4)

    # Augmentation (signature-aware defaults)
    p.add_argument("--degrees",  type=float, default=5.0,
                   help="Max rotation ±deg. Keep low — sigs rarely rotate >10°.")
    p.add_argument("--mosaic",   type=float, default=0.8,
                   help="Mosaic augmentation probability.")
    p.add_argument("--mixup",    type=float, default=0.1)

    # Output
    p.add_argument("--name",    default="sig_v1")
    p.add_argument("--project", default="runs/train")
    p.add_argument("--save-period", type=int, default=10,
                   help="Save checkpoint every N epochs (0 = only best/last).")

    return p.parse_args()


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    args = get_args()

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[!] ultralytics not installed.\n    Run: pip install ultralytics")
        sys.exit(1)

    # ── Load model ────────────────────────────────────────────────────
    if args.resume:
        ckpt = Path(args.resume)
        if not ckpt.exists():
            print(f"[!] Checkpoint not found: {ckpt}")
            sys.exit(1)
        print(f"Resuming from: {ckpt}")
        model = YOLO(str(ckpt))
    else:
        print(f"Starting from pretrained backbone: {args.model}")
        model = YOLO(args.model)   # downloads backbone from ultralytics hub if needed

    # ── Verify dataset ────────────────────────────────────────────────
    data_yaml = Path(args.data)
    if not data_yaml.exists():
        print(f"[!] Dataset config not found: {data_yaml}")
        print("    Run: python data/prepare.py  first.")
        sys.exit(1)

    train_images = ROOT / "data" / "yolo" / "images" / "train"
    if not train_images.exists() or not any(train_images.iterdir()):
        print(f"[!] Training images missing: {train_images}")
        print("    Run: python data/prepare.py  first.")
        sys.exit(1)

    n_train = len(list(train_images.iterdir()))
    print(f"Dataset: {n_train} training images found.")

    # ── Print config ──────────────────────────────────────────────────
    print("\n" + "─" * 52)
    print(f"  model     {args.model if not args.resume else args.resume}")
    print(f"  imgsz     {args.imgsz}")
    print(f"  epochs    {args.epochs}  (patience={args.patience})")
    print(f"  batch     {args.batch}")
    print(f"  lr0       {args.lr0}  →  lrf={args.lrf}")
    print(f"  device    {args.device or 'auto'}")
    print(f"  output    {args.project}/{args.name}")
    print("─" * 52 + "\n")

    # ── Train ─────────────────────────────────────────────────────────
    results = model.train(
        data         = str(data_yaml),
        epochs       = args.epochs,
        imgsz        = args.imgsz,
        batch        = args.batch,
        patience     = args.patience,
        # optimiser
        lr0          = args.lr0,
        lrf          = args.lrf,
        momentum     = args.momentum,
        weight_decay = args.weight_decay,
        warmup_epochs= args.warmup,
        # hardware
        device       = args.device if args.device else None,
        workers      = args.workers,
        # augmentation — tuned for document signatures
        hsv_h        = 0.010,   # slight hue shift (ink colour variation)
        hsv_s        = 0.3,
        hsv_v        = 0.4,     # brightness variation (scanner exposure)
        degrees      = args.degrees,
        translate    = 0.08,
        scale        = 0.25,
        shear        = 1.5,
        perspective  = 0.0001,
        flipud       = 0.0,     # sigs are never upside-down
        fliplr       = 0.2,     # left-hand signers
        mosaic       = args.mosaic,
        mixup        = args.mixup,
        copy_paste   = 0.05,
        # nms
        iou          = 0.5,
        # output
        project      = args.project,
        name         = args.name,
        exist_ok     = True,
        save         = True,
        save_period  = args.save_period,
        plots        = True,
        verbose      = True,
    )

    # ── Validation on best weights ────────────────────────────────────
    best = Path(args.project) / args.name / "weights" / "best.pt"
    if best.exists():
        print("\n── Final validation (best.pt) ──────────────────────────")
        val_model = YOLO(str(best))
        metrics   = val_model.val(
            data    = str(data_yaml),
            imgsz   = args.imgsz,
            conf    = 0.001,   # low conf for mAP calculation
            iou     = 0.5,
            verbose = False,
        )
        print(f"  mAP@50      : {metrics.box.map50:.4f}")
        print(f"  mAP@50-95   : {metrics.box.map:.4f}")
        print(f"  Precision   : {metrics.box.mp:.4f}")
        print(f"  Recall      : {metrics.box.mr:.4f}")
        print(f"\n  Best weights: {best}")
    else:
        print(f"[!] best.pt not found at {best} — check training logs.")


if __name__ == "__main__":
    main()
