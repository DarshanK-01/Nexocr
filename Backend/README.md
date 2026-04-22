# SignatureScan — YOLOv8 Fine-tune Pipeline

Detect and extract handwritten signatures from document images using a fine-tuned YOLOv8 model.

```
data/prepare.py  →  data/yolo/   →  train/train.py  →  best.pt  →  infer.py
(build dataset)     (YOLO fmt)      (fine-tune)        (weights)    (run)
```

---

## Setup

```bash
pip install -r requirements.txt
```

---

## Step 1 — Prepare dataset

### Option A: You have your own signature crop images
```bash
python data/prepare.py --source local --sig-dir /path/to/your/signature/images
```

### Option B: Download from Kaggle (free, ~400 real signatures)
```bash
# Set your Kaggle credentials first
export KAGGLE_USERNAME=darshankakaddsk


export KAGGLE_API_TOKEN=KGAT_d94c303e61a5c3e3114389f82e58f9c8

python data/prepare.py --source kaggle
```

### Option C: Fully synthetic (no external data, good for testing the pipeline)
```bash
python data/prepare.py --source synthetic
```

Control dataset size:
```bash
python data/prepare.py --source kaggle --n-train 3000 --n-val 600 --n-test 300
```

---

## Step 2 — Train

```bash
# Recommended (GPU, ~2-4 hrs)
python train/train.py --model yolov8s.pt --epochs 100

# Lighter (CPU, ~30 min)
python train/train.py --model yolov8n.pt --epochs 50 --batch 8

# Best accuracy (needs strong GPU)
python train/train.py --model yolov8m.pt --epochs 150 --batch 8 --imgsz 1024

# Resume interrupted run
python train/train.py --resume runs/train/sig_v1/weights/last.pt
```

Weights saved to: `runs/train/sig_v1/weights/best.pt`

---

## Step 3 — Infer

```bash
# Single image
python infer.py --image document.jpg

# Whole folder
python infer.py --image docs/ --out results/

# Show windows
python infer.py --image document.jpg --show

# Tune thresholds
python infer.py --image document.jpg --conf 0.25 --iou 0.45
```

Output per image:
```
outputs/
└── document/
    ├── crops/
    │   ├── sig_01.png      ← transparent PNG crop
    │   └── sig_02.png
    ├── annotated.png        ← original with bounding boxes
    └── output_page.png      ← white page, sigs at original coords
```

---

## Model size guide

| Model      | Size  | Speed  | Accuracy | Best for          |
|------------|-------|--------|----------|-------------------|
| yolov8n.pt | ~3 MB | fastest| lower    | CPU / quick tests |
| yolov8s.pt | ~22 MB| fast   | good     | recommended       |
| yolov8m.pt | ~52 MB| medium | better   | GPU, high quality |
| yolov8l.pt | ~87 MB| slow   | best     | max accuracy      |

---

## Tuning tips

| Problem               | Fix                                      |
|-----------------------|------------------------------------------|
| Missing signatures    | Lower `--conf` to 0.20–0.25             |
| False positives       | Raise `--conf` to 0.50+                 |
| Ink clipped in crop   | Increase `--pad` to 12–16               |
| Low mAP after training| Add more real signature crops to data/   |
| Slow on CPU           | Use `yolov8n.pt`, reduce `--imgsz 480`  |
| OOM on GPU            | Reduce `--batch`, use `--imgsz 640`     |

---

## File structure

```
signet/
├── data/
│   ├── prepare.py          download + synthesize YOLO dataset
│   ├── raw/signatures/     collected signature crops
│   └── yolo/               generated YOLO dataset
│       ├── images/{train,val,test}/
│       └── labels/{train,val,test}/
├── train/
│   └── train.py            fine-tuning script
├── configs/
│   └── signature.yaml      YOLO dataset config
├── infer.py                inference + extraction CLI
└── requirements.txt
```
