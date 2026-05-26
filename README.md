# SENTRY v2.0 — Social Engineering Awareness Platform
**A Gamified Cybersecurity Training System Based on Constructivist Learning Theory**

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen?style=for-the-badge)](https://SENTRY-Live-URL-Here)
[![Academic](https://img.shields.io/badge/Academic-CS_Final_Project-blue?style=for-the-badge)](https://github.com/Adejare-ml/SENTRY)

## 🛡️ Project Vision
SENTRY is an adaptive, gamified training system designed to combat social engineering attacks by immersing users in realistic, high-stakes scenarios. Instead of passive reading, SENTRY utilizes **Constructivist Learning Theory**—allowing users to "learn by doing" within a safe, simulated environment.

The system is specifically localized for the **Nigerian socio-economic context**, covering over 1,600 scenarios across banking, government, and telecom sectors.

---

## 🏗️ Technical Architecture

### 🎮 The Game Engine (Frontend)
Built as a high-performance, single-page application (SPA).
- **Dynamic Content Loading**: Integrates with Google Sheets via CSV for real-time scenario updates without redeploying code.
- **State Management**: Uses `localStorage` for session persistence and leaderboard tracking.
- **Adaptive Logic**: Implements occupation-based content filtering and a tiered difficulty system (Novice $\rightarrow$ Defender $\rightarrow$ Sentinel).

### 🤖 ML Intelligence (Backend/Research)
Beyond the game, SENTRY includes an ML pipeline for fraud detection:
- **Spam Detection**: A Random Forest classifier trained on Nigerian fraud datasets to identify malicious patterns.
- **Vectorization**: TF-IDF vectorization for text-based threat analysis.
- **Dataset Engineering**: Custom-built datasets mapping psychological manipulation principles (Cialdini) to specific attack vectors.

---

## 📂 Professional Repository Structure
```text
├── src/                    # Game Engine & Application Logic
│   ├── index.html          # Main UI Shell
│   ├── script.js           # Core Game Engine & State Logic
│   ├── style.css           # Cyber-Terminal Design System
│   ├── data_fallback.js    # Offline scenario redundancy
│   └── train_model.py      # ML Model Training Scripts
├── models/                 # Serialized Intelligence
│   ├── sentry_model.pkl    # Primary Fraud Model
│   ├── spam_detector_rf.pkl# Random Forest Spam Classifier
│   └── sentry_vectorizer.pkl# Text Vectorization weights
├── data/                   # Research Datasets
│   ├── SEAG_Scenarios.csv  # 1,600+ Localized Scenarios
│   └── nigerian_fraud_dataset.csv
└── notebooks/              # Research & Analysis
    └── model_training.ipynb # Model evaluation and training logs
```

---

## 🎓 Academic & Psychological Framework
SENTRY is not just a game; it is a pedagogical tool based on:
- **Vygotsky's Zone of Proximal Development**: Using "Hint Scaffolding" to support users just beyond their current ability.
- **Cialdini’s Principles of Persuasion**: Modeling real-world manipulation tactics like *Urgency, Authority, and Social Proof*.
- **Constructivism**: Replacing rote memorization with active investigation and immediate "Red Flag Analysis."

---

## 🚀 Deployment Options
- **Cloud**: Optimized for Vercel, Cloudflare Pages, and GitHub Pages.
- **Portable**: The `src/SEAG_v2_Portable.html` file allows the entire game to run from a single USB stick without internet access.

---
*Developed by Adelugba Adejare as a Final Year Computer Science Project.*
