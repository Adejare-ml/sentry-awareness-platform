# SENTRY v2.0 — Social Engineering Awareness Platform
**A Gamified Cybersecurity Training System Based on Constructivist Learning Theory**

[![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge)](https://github.com/Adejare-ml/SENTRY)
[![Academic](https://img.shields.io/badge/Academic-CS_Final_Project-blue?style=for-the-badge)](https://github.com/Adejare-ml/SENTRY)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://python.org)

## 🛡️ Project Vision

SENTRY is an adaptive, gamified training system designed to combat social engineering attacks by immersing users in realistic, high-stakes scenarios. Instead of passive reading, SENTRY uses **Constructivist Learning Theory** — allowing users to "learn by doing" within a safe, simulated environment.

Specifically localized for the **Nigerian socio-economic context**, covering over 1,600 scenarios across banking, government, and telecom sectors.

---

## 🏗️ Technical Architecture

### 🎮 The Game Engine (Frontend)
Built as a high-performance, single-page application (SPA).
- **Dynamic Content Loading**: Integrates with Google Sheets via CSV for real-time scenario updates without redeploying.
- **State Management**: Uses `localStorage` for session persistence and leaderboard tracking.
- **Adaptive Logic**: Occupation-based content filtering and a tiered difficulty system (Novice → Defender → Sentinel).

### 🤖 ML Intelligence (Research)
SENTRY includes a fraud detection ML pipeline:
- **Spam Detection**: Random Forest classifier trained on Nigerian fraud datasets.
- **Vectorization**: TF-IDF with lemmatization and stopword removal.
- **Dataset**: Custom-built, mapping Cialdini's persuasion principles to specific attack vectors.

---

## 📂 Repository Structure

```
SENTRY/
│
├── models/                         # Serialized ML models
│   ├── sentry_model.pkl            # Primary fraud detection model
│   ├── sentry_model_meta.json      # Model metadata, thresholds, eval results
│   ├── sentry_vectorizer.pkl       # TF-IDF vectorizer weights (fraud model)
│   ├── spam_detector_rf.pkl        # Random Forest spam classifier
│   └── spam_tfidf_vectorizer.pkl   # TF-IDF vectorizer weights (spam model)
│
├── notebooks/
│   └── model_training.ipynb        # Model training, evaluation, and export
│
├── _headers                        # Cloudflare Pages security headers
├── vercel.json                     # Vercel deployment config (routes)
├── .gitignore
└── README.md
```

> **Note:** Frontend source files (`index.html`, `script.js`, `style.css`) are maintained separately and deployed via Cloudflare Pages.

---

## 🤖 ML Model Details

| Model | Algorithm | Dataset | F1 | AUC |
|---|---|---|---|---|
| Fraud Detector | Logistic Regression | Nigerian Fraud Dataset (9,810 samples) | — | — |
| Spam Classifier | Random Forest (100 trees) | SMS Spam Collection | — | — |

> Evaluation metrics are recorded per run in `models/sentry_model_meta.json`.

---

## 🚀 Running the Notebook

```bash
# Install dependencies
pip install pandas numpy scikit-learn nltk joblib seaborn matplotlib

# Download NLTK data
python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet')"

# Place datasets in data/ directory (not tracked by git):
#   data/enron_data_fraud_labeled.csv
#   data/spam.csv
#   data/nigerian_fraud_dataset.csv

# Open notebook
jupyter notebook notebooks/model_training.ipynb
```

---

## 🎓 Academic Framework

SENTRY is built on three pedagogical pillars:

- **Vygotsky's Zone of Proximal Development** — Hint scaffolding supports users just beyond their current ability.
- **Cialdini's Principles of Persuasion** — Models real-world manipulation: Urgency, Authority, Social Proof.
- **Constructivism** — Active investigation replaces rote memorization. Immediate "Red Flag Analysis" after every decision.

---

## 📦 Deployment

| Platform | Config File | Status |
|---|---|---|
| Cloudflare Pages | `_headers` | Primary |
| Vercel | `vercel.json` | Secondary |

---

*Developed by Adelugba Adejare — Final Year Computer Science Project, Landmark University.*
