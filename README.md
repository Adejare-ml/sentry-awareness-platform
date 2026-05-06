# SENTRY v2.0 — Social Engineering Awareness Game

**Final Year Project · Computer Science · Daniel Olubajo · v2.0**

An adaptive, gamified cybersecurity training system built on **Constructivist Learning Theory**.  
1,635 Nigerian-contextualised scenarios · 10 thematic series · 3 difficulty tiers · 5 occupation profiles.

---

## Live Demo — Deploy in Under 2 Minutes

| Platform | Steps |
|---|---|
| **GitHub Pages** | Push repo → Settings → Pages → Source: `main` / `root` → Save |
| **Cloudflare Pages** | New Project → Connect repo → Framework: `None` → Deploy |
| **Vercel** | Import repo → Framework: `Other` → Deploy |
| **Render** | New Static Site → Connect repo → Publish dir: `.` → Deploy |
| **Offline / USB** | Open `SEAG_v2_Portable.html` directly in any modern browser |

---

## Connecting Your Google Sheet (CSV Data Source)

### Step 1 — Set Up the Sheet

1. Create a new Google Sheet
2. Add these exact column headers in **Row 1**:

```
ID | Series | Tier | Occupation | Type | Level | Scenario | OptionA | OptionB | OptionC | CorrectAnswer | Hint | Explanation | PsychPrinciple
```

3. Copy rows from `SEAG_Scenarios.csv` into the sheet (the CSV is already in this format)

### Step 2 — Publish as CSV

1. In the sheet: **File → Share → Publish to web**
2. Select your sheet tab (e.g. "Sheet1")
3. Change format dropdown to: **Comma-separated values (.csv)**
4. Click **Publish** → copy the URL

The URL looks like:
```
https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXXXXXXXX/pub?gid=0&single=true&output=csv
```

### Step 3 — Configure the Game

In `script.js`, line ~46, replace:
```javascript
const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/pub?...';
```

With your published URL. Rebuild `SEAG_v2_Portable.html` by running:
```bash
python3 build.py
```

### Fallback Behaviour

If the CSV URL is unconfigured, the fetch times out (8 sec), or fails for any reason, the game **automatically and silently** falls back to the 25 built-in scenarios in `data_fallback.js`. This ensures the game always works during demos and offline use.

---

## Column Reference

| Column | Values | Description |
|---|---|---|
| `ID` | Integer | Unique scenario ID |
| `Series` | See series list below | Thematic series name |
| `Tier` | `Novice` / `Defender` / `Sentinel` | Difficulty tier |
| `Occupation` | `Student` / `IT Professional` / `Healthcare Worker` / `Government Employee` / `General Public` | Target occupation |
| `Type` | `Phishing` / `Vishing` / `Smishing` / `Pretexting` / `Baiting` | Attack vector |
| `Level` | `1` / `2` / `3` | Numeric difficulty (maps to Tier) |
| `Scenario` | Free text | Full scenario description |
| `OptionA` | Free text | First response option |
| `OptionB` | Free text | Second response option |
| `OptionC` | Free text | Third response option |
| `CorrectAnswer` | Must match OptionA, OptionB, or OptionC exactly | The correct response (case-sensitive) |
| `Hint` | Free text | Pedagogical clue (revealed at −5 XP) |
| `Explanation` | Free text | Red Flag Analysis — explains the attack mechanism |
| `PsychPrinciple` | Free text | Cialdini / manipulation principle(s) used |

---

## The 10 Thematic Series

| # | Series | Icon | Focus |
|---|---|---|---|
| 1 | Banking & Finance | 🏦 | GTBank, Access Bank, UBA, BVN, IPPIS, CBN alerts |
| 2 | Government & Identity | 🏛️ | EFCC, NIMC, NIN, NYSC, IPPIS, DSS impersonation |
| 3 | Education & Academia | 🎓 | JAMB, WAEC, NECO, university portals, NYSC |
| 4 | Healthcare & Medical | 🏥 | NHIS, MDCN, NAFDAC, hospital systems, drug fraud |
| 5 | Corporate & Professional | 💼 | BEC, CEO fraud, vendor impersonation, API theft |
| 6 | Social Media & Digital | 📱 | Facebook, Instagram, TikTok, WhatsApp, LinkedIn |
| 7 | Telecom & Mobile | 📡 | MTN, Airtel, Glo, 9mobile, SIM swap, porting |
| 8 | E-commerce & Shopping | 🛒 | Jumia, Konga, Paystack, marketplace fraud |
| 9 | Physical Security | 🔒 | USB drops, tailgating, ATM baiting, QR attacks |
| 10 | Cryptocurrency & Investment | ₿ | Binance, Luno, Ponzi, exchange phishing, 2FA relay |

---

## Game Mechanics Summary

| Feature | Detail |
|---|---|
| **XP System** | Level 1: +10 · Level 2: +15 · Level 3: +20 |
| **Hint Penalty** | −5 XP per hint used |
| **Streak Bonus** | +10 XP every 3 correct answers in a row |
| **XP Floor** | Score cannot go below 0 |
| **Ranks** | 🛡️ Cyber Novice (0–99) · ⚔️ Digital Defender (100–199) · 🦅 Security Sentinel (200+) |
| **Session Modes** | ⚡ Quick (5) · ⚙️ Standard (10) · 🏃 Marathon (20) |
| **Tier Filters** | All Tiers / Novice / Defender / Sentinel |
| **Occupation Filter** | Exact match → cascade to General Public if < 5 scenarios |
| **Persistence** | localStorage (survives page refresh) |
| **Report Export** | .txt download with full session analysis + mistake log |
| **Leaderboard** | Top 5 local scores in localStorage |

---

## Dataset Statistics

| Metric | Count |
|---|---|
| Total scenarios | **1,635** |
| Series | 10 |
| Tiers | 3 (Novice / Defender / Sentinel) |
| Attack types | 5 (Phishing · Vishing · Smishing · Pretexting · Baiting) |
| Occupations | 5 |
| Nigerian locale | 100% (JAMB, BVN, MTN, EFCC, GTBank, NYSC, MDCN, IPPIS…) |

---

## File Structure

```
/
├── index.html              HTML shell — 6 screens, all game UI
├── style.css               Cyber-Terminal stylesheet — 16 sections
├── script.js               Game engine — 18 documented sections (v2.0)
├── data_fallback.js        25 hardcoded fallback scenarios (offline/demo)
├── SEAG_Scenarios.csv      1,635 scenarios — import to Google Sheets
├── SEAG_v2_Portable.html   ★ Single-file bundle — CSS + JS inlined
├── README.md               This file
├── _headers                Cloudflare Pages security headers
└── vercel.json             Vercel deployment config
```

---

## Academic Context

This project implements **Constructivist Learning Theory** (Vygotsky, 1978; Bruner, 1960):

- **Active investigation** over passive reading — players make real decisions
- **Immediate Red Flag Analysis** after each choice — names the Cialdini principle used
- **Hint scaffolding** — Zone of Proximal Development support at a measured XP cost
- **Streak mechanics** — variable reward schedule rewards sustained correct engagement
- **Occupation-adaptive content** — increases perceived relevance (Alshammari et al., 2015)
- **Series-based thematic grouping** — builds systematic threat category schema
- **Nigerian localisation** — addresses the gap identified in the literature review

### Psychological Manipulation Principles Modelled (Cialdini, 2006)

`Authority` · `Urgency` · `Scarcity` · `Social Proof` · `Fear` · `Reciprocity` · `False Legitimacy` · `Curiosity` · `Greed` · `Professional Obligation` · `Duty of Care`

### Key References

- Cialdini, R. B. (2006). *Influence: The Psychology of Persuasion*. HarperBusiness.
- Alshammari, A. et al. (2015). Journal of Information Security and Applications, 20, 10–18.
- Bruner, J. (1960). *The Process of Education*. Harvard University Press.
- Deterding, S. et al. (2011). From game design elements to gamefulness. *MindTrek '11*.
- Hu, W., & Looi, C. K. (2019). Computers & Security, 80, 239–254.
- Vygotsky, L. S. (1978). *Mind in Society*. Harvard University Press.

---

**Daniel Olubajo** · Final Year Computer Science · SENTRY v2.0 · Nigeria 🇳🇬
