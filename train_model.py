"""
================================================================
SENTRY — Nigerian Fraud Classifier Training Script
================================================================
Trains and exports the Tier 3 model for SENTRY's three-tier
fraud detection engine.

Stages:
  Stage 1: TF-IDF + Logistic Regression (baseline — fast, solid)
  Stage 2: TF-IDF + Calibrated Random Forest (better confidence)
  Stage 3: DistilBERT fine-tune (optional, needs GPU + ~3GB VRAM)

Output:
  sentry_vectorizer.pkl      TF-IDF vectorizer
  sentry_model.pkl           Best sklearn model
  sentry_model_meta.json     Metadata + thresholds
  (optional) sentry_bert/    DistilBERT fine-tuned model

Run:
  python3 train_model.py
  python3 train_model.py --bert          # also fine-tune DistilBERT
  python3 train_model.py --dataset path/to/custom.csv
================================================================
"""

import csv, json, argparse, os, sys, time, warnings
import numpy as np
warnings.filterwarnings('ignore')

from pathlib import Path
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (classification_report, confusion_matrix,
                              roc_auc_score, f1_score, precision_recall_curve)
from sklearn.pipeline import Pipeline
import joblib


# ── Load dataset ─────────────────────────────────────────────────────────────

def load_data(csv_path: str):
    texts, labels, attack_types = [], [], []
    with open(csv_path, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            text = row['text'].strip()
            if not text:
                continue
            texts.append(text)
            labels.append(int(row['label']))
            attack_types.append(row.get('attack_type', 'Unknown'))
    return texts, labels, attack_types


# ── Text preprocessing ────────────────────────────────────────────────────────

def preprocess(text: str) -> str:
    """
    Light normalisation:
    - Lowercase
    - Normalise Nigerian currency symbols
    - Normalise phone patterns
    - Keep URLs as tokens (they are signals)
    """
    import re
    text = text.lower()
    text = re.sub(r'₦\s*[\d,]+', ' NAIRA_AMOUNT ', text)
    text = re.sub(r'\b(ngn|naira)\s*[\d,]+', ' NAIRA_AMOUNT ', text)
    text = re.sub(r'https?://\S+', ' SUSPICIOUS_URL ', text)
    text = re.sub(r'\b0[789]\d{9}\b', ' PHONE_NUMBER ', text)
    text = re.sub(r'\b\d{4,}\b', ' NUMERIC ', text)
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# ── Feature engineering ──────────────────────────────────────────────────────

NIGERIAN_FRAUD_VOCAB = [
    # High-signal fraud terms (used as extra features)
    'bvn', 'nin', 'otp', 'pin', 'cvv', 'verify', 'verification',
    'suspend', 'suspended', 'block', 'blocked', 'expire', 'expired',
    'urgent', 'immediately', 'now', 'asap', 'deadline', 'hours',
    'click', 'link', 'login', 'account', 'password', 'credentials',
    'gtbank', 'accessbank', 'zenith', 'firstbank', 'uba', 'sterling',
    'mtn', 'airtel', 'glo', 'efcc', 'cbn', 'nimc', 'nysc', 'jamb',
    'phishing', 'fraud', 'suspicious', 'flagged', 'alert',
    'prize', 'won', 'lottery', 'reward', 'compensation', 'bonus',
    'escrow', 'transfer', 'wire', 'claim', 'collect',
    'legal', 'prosecute', 'arrest', 'court', 'authorities',
    'SUSPICIOUS_URL', 'NAIRA_AMOUNT',
]


# ── Stage 1 & 2: sklearn models ──────────────────────────────────────────────

def train_sklearn_models(X_train, X_test, y_train, y_test):
    """
    Train and evaluate multiple sklearn classifiers.
    Returns best model + vectorizer.
    """

    # TF-IDF vectorizer — bigrams, sublinear TF, tuned for Nigerian SMS/email
    vectorizer = TfidfVectorizer(
        preprocessor=preprocess,
        ngram_range=(1, 3),         # unigrams + bigrams + trigrams
        max_features=15_000,
        min_df=2,                   # at least 2 documents
        sublinear_tf=True,          # log(1+tf) smoothing
        analyzer='word',
        strip_accents='unicode',
    )

    X_tr_vec = vectorizer.fit_transform(X_train)
    X_te_vec = vectorizer.transform(X_test)

    candidates = {
        'LogisticRegression': LogisticRegression(
            C=5.0, max_iter=1000, class_weight='balanced', solver='lbfgs'
        ),
        'CalibratedRF': CalibratedClassifierCV(
            RandomForestClassifier(
                n_estimators=300, max_features='sqrt',
                min_samples_leaf=2, class_weight='balanced',
                n_jobs=-1, random_state=42,
            ),
            method='isotonic', cv=5,
        ),
        'GradientBoosting': GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.1,
            max_depth=4, subsample=0.8, random_state=42,
        ),
    }

    results = {}
    best_model, best_f1 = None, 0.0

    print("\n── Model evaluation ─────────────────────────────────────────")
    for name, clf in candidates.items():
        t0 = time.time()
        clf.fit(X_tr_vec, y_train)
        elapsed = time.time() - t0

        y_pred  = clf.predict(X_te_vec)
        y_proba = clf.predict_proba(X_te_vec)[:, 1]
        f1      = f1_score(y_test, y_pred, average='weighted')
        auc     = roc_auc_score(y_test, y_proba)

        results[name] = {'f1': f1, 'auc': auc, 'time': elapsed}
        print(f"\n  {name}")
        print(f"  F1={f1:.4f}  AUC={auc:.4f}  Train time={elapsed:.1f}s")
        report = classification_report(y_test, y_pred, target_names=['Legit', 'Fraud'])
        print('\n'.join('    ' + l for l in report.splitlines()))

        if f1 > best_f1:
            best_f1   = f1
            best_model = (name, clf)

    print(f"\n✅ Best model: {best_model[0]}  (F1={best_f1:.4f})")
    return best_model[1], vectorizer, results


def find_best_threshold(clf, vectorizer, X_val, y_val):
    """
    Find optimal decision threshold that maximises F1.
    Default 0.5 is rarely optimal — calibration shifts it.
    """
    X_vec    = vectorizer.transform(X_val)
    y_proba  = clf.predict_proba(X_vec)[:, 1]
    prec, rec, thresholds = precision_recall_curve(y_val, y_proba)

    f1_scores = 2 * prec * rec / (prec + rec + 1e-9)
    best_idx  = np.argmax(f1_scores)
    best_thr  = float(thresholds[min(best_idx, len(thresholds)-1)])

    print(f"\n  Optimal threshold: {best_thr:.3f}  "
          f"(P={prec[best_idx]:.3f}  R={rec[best_idx]:.3f}  F1={f1_scores[best_idx]:.3f})")
    return best_thr


# ── Stage 3: DistilBERT fine-tune (optional) ─────────────────────────────────

def train_bert(X_train, y_train, X_test, y_test, output_dir='sentry_bert'):
    """
    Fine-tune distilbert-base-uncased on Nigerian fraud corpus.
    Needs: transformers, torch, ~3GB VRAM (fits RTX 2070 Super).
    """
    try:
        from transformers import (DistilBertTokenizerFast,
                                   DistilBertForSequenceClassification,
                                   TrainingArguments, Trainer)
        import torch
        from torch.utils.data import Dataset as TorchDataset
    except ImportError:
        print("[!] transformers/torch not installed. Skipping BERT stage.")
        print("    pip install transformers torch --break-system-packages")
        return

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"\n── Stage 3: DistilBERT fine-tune ({device}) ──────────────────")

    tokenizer = DistilBertTokenizerFast.from_pretrained('distilbert-base-uncased')

    class FraudDataset(TorchDataset):
        def __init__(self, texts, labels):
            self.enc = tokenizer(
                texts, truncation=True, padding=True, max_length=256
            )
            self.labels = labels
        def __len__(self): return len(self.labels)
        def __getitem__(self, i):
            item = {k: torch.tensor(v[i]) for k, v in self.enc.items()}
            item['labels'] = torch.tensor(self.labels[i])
            return item

    train_ds = FraudDataset(X_train, y_train)
    test_ds  = FraudDataset(X_test,  y_test)

    model = DistilBertForSequenceClassification.from_pretrained(
        'distilbert-base-uncased', num_labels=2
    ).to(device)

    args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=4,
        per_device_train_batch_size=16,   # fits 8GB VRAM
        per_device_eval_batch_size=32,
        warmup_steps=100,
        weight_decay=0.01,
        learning_rate=2e-5,
        evaluation_strategy='epoch',
        save_strategy='epoch',
        load_best_model_at_end=True,
        fp16=(device == 'cuda'),           # half precision — saves VRAM
        dataloader_num_workers=2,
        logging_steps=50,
        report_to='none',
    )

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        f1  = f1_score(labels, preds, average='weighted')
        auc = roc_auc_score(labels, logits[:, 1])
        return {'f1': f1, 'auc': auc}

    trainer = Trainer(
        model=model, args=args,
        train_dataset=train_ds, eval_dataset=test_ds,
        compute_metrics=compute_metrics,
    )
    trainer.train()
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"\n✅ DistilBERT saved to {output_dir}/")
    print("   Load with: AutoModelForSequenceClassification.from_pretrained('sentry_bert')")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='SENTRY Model Trainer')
    parser.add_argument('--dataset', default='nigerian_fraud_dataset.csv')
    parser.add_argument('--bert',    action='store_true', help='Also fine-tune DistilBERT')
    parser.add_argument('--test-size', type=float, default=0.2)
    args = parser.parse_args()

    if not os.path.exists(args.dataset):
        print(f"[!] Dataset not found: {args.dataset}")
        print("    Run: python3 dataset_builder.py first")
        sys.exit(1)

    print(f"[+] Loading dataset: {args.dataset}")
    texts, labels, attack_types = load_data(args.dataset)
    labels = np.array(labels)
    print(f"    {len(texts)} samples | Fraud: {labels.sum()} | Legit: {(labels==0).sum()}")

    # Split: 60% train / 20% val / 20% test
    X_temp, X_test, y_temp, y_test = train_test_split(
        texts, labels, test_size=args.test_size, stratify=labels, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.25, stratify=y_temp, random_state=42
    )
    print(f"    Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")

    # ── Stage 1 & 2 ───────────────────────────────────────────────────────
    best_clf, vectorizer, eval_results = train_sklearn_models(X_train, X_test, y_train, y_test)

    # Find optimal threshold on validation set
    threshold = find_best_threshold(best_clf, vectorizer, X_val, y_val)

    # Save
    joblib.dump(vectorizer, 'sentry_vectorizer.pkl')
    joblib.dump(best_clf,   'sentry_model.pkl')

    meta = {
        'threshold':      threshold,
        'label_map':      {'0': 'LEGITIMATE', '1': 'FRAUD'},
        'attack_types':   ['Phishing', 'Vishing', 'Smishing', 'Pretexting', 'Baiting'],
        'eval_results':   {k: {kk: round(vv, 4) for kk, vv in v.items()} for k, v in eval_results.items()},
        'dataset_size':   len(texts),
        'trained_on':     args.dataset,
        'version':        '1.0.0',
    }
    with open('sentry_model_meta.json', 'w') as f:
        json.dump(meta, f, indent=2)

    print("\n✅ Saved: sentry_vectorizer.pkl  sentry_model.pkl  sentry_model_meta.json")

    # ── Stage 3 (optional) ────────────────────────────────────────────────
    if args.bert:
        train_bert(X_train, y_train, X_test, y_test)

    # Quick sanity check
    print("\n── Sanity check (5 examples) ─────────────────────────────────")
    test_msgs = [
        "URGENT: Your GTBank BVN has expired. Click http://gtb-bvn-verify.com/login to reactivate within 24 hours or face suspension.",
        "Hi John, your MTN 2GB data bundle of ₦1,500 is now active and expires in 30 days.",
        "CBN Escrow: Transfer your savings to our secure government account to protect from investigation.",
        "Your JAMB result for 2025 is ready. Visit jamb.gov.ng with your reg number to download.",
        "EFCC ALERT: Your account has been linked to money laundering. Send ₦50,000 bail to avoid arrest.",
    ]
    X_sample = vectorizer.transform(test_msgs)
    probas    = best_clf.predict_proba(X_sample)[:, 1]
    preds     = (probas >= threshold).astype(int)
    labels_map = {1: '🚨 FRAUD', 0: '✅ LEGIT'}
    for msg, pred, prob in zip(test_msgs, preds, probas):
        print(f"  {labels_map[pred]} ({prob:.1%})  {msg[:70]}...")


if __name__ == '__main__':
    main()
