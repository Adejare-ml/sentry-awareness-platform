"""
================================================================
SENTRY — Nigerian Fraud Detection Dataset Builder
================================================================
Converts SEAG_Scenarios.csv (1,635 fraud scenarios) into a
balanced ML training corpus with synthetic legitimate messages.

Output: nigerian_fraud_dataset.csv
  columns: text, label (1=fraud, 0=legit), attack_type, series,
           tier, psych_principles, source

Run:
    python3 dataset_builder.py --csv SEAG_Scenarios.csv
    python3 dataset_builder.py --csv SEAG_Scenarios.csv --augment --ollama

Three dataset tiers produced:
  Tier A  1,635 fraud + 1,635 legit  = 3,270  (seed corpus)
  Tier B  +synthetic augment          = ~6,500  (augmented)
  Tier C  +Ollama-generated           = ~10,000 (rich corpus)
================================================================
"""

import csv, json, re, random, argparse, os, sys, time
from pathlib import Path
from copy import deepcopy

# ── Legitimate message templates (Nigerian context) ──────────────────────────
# These are GENUINE communications that look superficially similar to fraud
# but are real. The model must learn the difference.

LEGIT_TEMPLATES = {
    'Banking': [
        "Your GTBank account ending {last4} has been credited with ₦{amount} on {date}. Your available balance is ₦{balance}. If you did not initiate this, call 0700-482-6726.",
        "Access Bank: Transaction Alert. Debit of ₦{amount} from your account ending {last4} at {merchant} on {date}. Balance: ₦{balance}. Not you? Call 01-2802500.",
        "Zenith Bank: Your scheduled standing order of ₦{amount} to {beneficiary} has been processed successfully. Ref: {ref}.",
        "UBA: Your salary of ₦{amount} has been credited to your account ending {last4}. Log in to UBA Mobile App to manage your finances.",
        "First Bank: Your BVN linkage has been completed successfully. No further action required. Contact 0700-34357-282 with questions.",
        "Kuda Bank: Your transfer of ₦{amount} to {beneficiary} ({bank}) was successful. Transaction ID: {ref}.",
        "OPay: You have sent ₦{amount} to {phone}. Your new balance is ₦{balance}. If not you, call 01-8880000 immediately.",
        "PiggyVest: Your savings of ₦{amount} has been locked in your Safelock. Target: {date}. Keep saving! 🐷",
    ],
    'Telecom': [
        "MTN: Your {amount}MB data bundle is active and expires {date}. Dial *131# to check balance or buy more data.",
        "Airtel: Your recharge of ₦{amount} was successful. Your bonus {bonus}MB data is now active. Valid for {days} days.",
        "Glo: Your number {phone} has been successfully ported. Your new SIM will be active within 24 hours. Thank you for choosing Glo.",
        "9mobile: Your monthly ₦{amount} data plan renews on {date}. You have {amount}MB remaining. To cancel auto-renewal, dial *244*0#.",
    ],
    'Government': [
        "NYSC: Dear Corps Member, your CDS attendance for {month} has been recorded. Next CDS is {date} at your designated PPA.",
        "JAMB: Your UTME result slip is available. Log in to jamb.gov.ng with your registration number {reg} to download. Results are free.",
        "NIMC: Your NIN enrolment is complete. NIN: {nin_masked}. Visit any NIMC centre with a valid ID if you need a physical card.",
        "FIRS: Your TIN {tin} has been updated in our system. No further action required. Portal: taxpromax.firs.gov.ng",
    ],
    'Education': [
        "Dear student, your course registration for {semester} has been completed. Your student ID is {id}. Portal: {university}.edu.ng",
        "University of Lagos: Your acceptance letter for {course} is ready. Visit the admissions office with your JAMB score of {score} and two passport photos.",
        "WAEC: Your WASSCE result for {year} is available. Log in to waecdirect.org with your exam number. PIN-based result checking is ₦2,500.",
    ],
    'Work': [
        "Hi {name}, the Q3 report is ready for your review. I have shared it to your Google Drive. Please comment before COB Friday.",
        "Team meeting rescheduled to Thursday 2pm in the boardroom. Agenda: Q4 planning, budget review, HR updates. Please confirm attendance.",
        "Your leave request for {date} to {date2} has been approved by HR. Your leave balance is {days} days remaining.",
        "IT Department: Your VPN certificate expires in 7 days. Log in to the company portal to renew. Contact helpdesk@company.ng for assistance.",
    ],
    'Ecommerce': [
        "Jumia: Your order #{order} has been shipped! Expected delivery: {date}. Track at jumia.com.ng/track. Questions? Call 07000-600-000.",
        "Konga: Payment confirmed for order #{order} (₦{amount}). Your item ships within 2 business days. Thank you for shopping with Konga.",
        "Paystack: Payment of ₦{amount} received from {merchant}. Reference: {ref}. Contact support@paystack.com if you did not initiate this.",
    ],
    # ── Hard negatives — look like fraud but are 100% legitimate ──────────────
    # These are the most important samples in the whole dataset.
    # The model MUST learn: real alerts redirect to channels they don't inline-provide.
    'HardNegative_Banking': [
        "GTBank ALERT: Debit of ₦{amount} on your account ending {last4} at {merchant} on {date}. Balance: ₦{balance}. Not you? Call 0700-482-6726 — the number on the back of your card.",
        "ACCESS BANK: Your account was credited ₦{amount} on {date}. If you did not initiate this transfer, call 01-2802500 immediately. We will NEVER ask for your PIN or OTP.",
        "Zenith Bank: Suspicious login attempt on your account at {date}. If not you, secure your account via the Zenith Mobile App NOW. Do NOT share your OTP with anyone.",
        "First Bank ALERT: Your BVN has been successfully linked. No further action required. If you did not authorise this, visit firstbanknigeria.com or call 0700-34357-282.",
        "UBA: We've detected unusual activity on your account. Log in to the UBA Mobile App to review. Do NOT click any links sent to you — we never send login links via SMS.",
        "Kuda: Transaction alert — ₦{amount} sent to {beneficiary} at {date}. Not you? Freeze your card instantly in the Kuda app under Card Controls. Call 0700-000-5832.",
        "OPay: Security alert — your OPay account was accessed from a new device on {date}. If this was not you, change your PIN in the app immediately. Ref: {ref}.",
        "ACCESS BANK: URGENT — your card ending {last4} has been flagged for suspicious activity. Call the number on the back of your card (not this SMS) to dispute. Do not share OTP.",
    ],
    'HardNegative_Govt': [
        "JAMB: Your 2025 UTME result is available. Login at jamb.gov.ng with your registration number. Result checking is FREE — do not pay any agent. Dial 09-0900-8100 for help.",
        "NIMC: Your NIN enrolment is complete. Your NIN is {nin_masked}. Store this safely. NIMC will NEVER ask for payment via SMS to retrieve your NIN.",
        "CBN: NIN-BVN linkage is required for all bank accounts. Visit your bank branch or use your bank's official USSD code. This service is completely FREE of charge.",
        "NYSC: Dear Corps Member, your CDS attendance for {month} has been recorded. Next meeting is {date}. Log in to portal.nysc.org.ng for your PPA details.",
    ],
    'HardNegative_Telecom': [
        "MTN: Your NIN is not linked to your SIM. Your line will be barred after {date} per NCC directive. Dial *785# FREE to link. MTN will NEVER ask for your password via SMS.",
        "Airtel: Your {amount}MB data expires {date}. Dial *140# to check balance. To stop auto-renewal, dial *141*0#. Airtel will never ask for your PIN via SMS.",
        "Glo: This is a reminder that your NIN-SIM linkage deadline is {date}. Visit any Glo office or dial *109# to verify. This service is FREE.",
    ],
    'Social': [
        "Hi! Just wanted to say the meeting went well. Let's catch up tomorrow to discuss the next steps. Let me know if you're free after 3pm.",
        "Your Instagram verification code is {code}. Do not share this with anyone. Instagram will never ask for this code.",
        "LinkedIn: {name} has accepted your connection request. You now have {count} connections. View their profile to start building your network.",
    ],
}

# ── Filler values for template substitution ──────────────────────────────────
FILLERS = {
    'last4':       ['4521', '8832', '0017', '7743', '2291'],
    'amount':      ['15,000', '45,000', '120,000', '3,500', '250,000', '8,750'],
    'balance':     ['87,320.50', '12,445.00', '302,000.00', '55,890.75'],
    'date':        ['15 July 2025', '3 August 2025', '22 June 2025', 'Thursday 24 July'],
    'date2':       ['20 July 2025', '10 August 2025', '30 June 2025'],
    'merchant':    ['Shoprite Ikeja', 'Total Filling Station', 'GTBank ATM Lekki', 'NNPC Abuja'],
    'beneficiary': ['John Adeyemi', 'Fatima Bello', 'Chukwuemeka Obi', 'Amaka Nwosu'],
    'bank':        ['Access Bank', 'First Bank', 'Zenith Bank', 'UBA'],
    'ref':         ['TRF20250714881', 'PAY-2025-0034521', 'ZB0847291', 'ACC-TXN-88721'],
    'phone':       ['08012345678', '07098765432', '09034567890'],
    'bonus':       ['500', '1,024', '2,048', '200'],
    'days':        ['7', '14', '30', '3'],
    'month':       ['June', 'July', 'August'],
    'reg':         ['97283421AA', '04193827HK', '87634520CB'],
    'nin_masked':  ['XXXX-XXXX-7821', 'XXXX-XXXX-3345'],
    'tin':         ['12345678-0001', '98765432-0002'],
    'semester':    ['2024/2025 First Semester', '2025/2026 Second Semester'],
    'id':          ['190401023', '210501087', '200302154'],
    'university':  ['unilag', 'ui', 'abu', 'oau', 'unn'],
    'course':      ['Computer Science', 'Medicine', 'Law', 'Engineering'],
    'score':       ['312', '287', '254', '301'],
    'year':        ['2024', '2023', '2025'],
    'name':        ['Adebayo', 'Ngozi', 'Emeka', 'Halima', 'Seun'],
    'order':       ['NG-2025-44821', 'KG-881234', 'JM-003421'],
    'count':       ['342', '1,204', '87', '512'],
    'code':        ['847291', '334521', '991023'],
    'days_leave':  ['12', '8', '15'],
    'nin':         ['12345678901'],
}


def fill_template(template: str) -> str:
    """Substitute all {placeholders} with random realistic Nigerian values."""
    result = template
    for key, choices in FILLERS.items():
        result = result.replace('{' + key + '}', random.choice(choices))
    # Remove any unfilled placeholders
    result = re.sub(r'\{[^}]+\}', '', result)
    return result.strip()


def augment_fraud_text(text: str) -> list[str]:
    """
    Create 2 augmented variants of a fraud scenario:
    - Paraphrase (rearrange opening, change formatting)
    - Shortened (first 2 sentences only)
    """
    variants = []

    # Variant 1: prepend a social hook
    hooks = [
        "IMPORTANT NOTICE: ",
        "ACTION REQUIRED — ",
        "Dear Valued Customer, ",
        "SECURITY ALERT: ",
        "[AUTOMATED MESSAGE] ",
        "Ref: SEC/2025/0084 — ",
    ]
    variants.append(random.choice(hooks) + text)

    # Variant 2: truncate + trailing CTA
    sentences = re.split(r'(?<=[.!?])\s+', text)
    short = ' '.join(sentences[:max(2, len(sentences)//2)])
    ctas = [
        " Click the link below to act now.",
        " Reply STOP to opt out or proceed now.",
        " Do not ignore this message.",
        " Failure to comply will result in restrictions.",
    ]
    variants.append(short + random.choice(ctas))

    return variants


def build_dataset(csv_path: str, augment: bool = False, ollama: bool = False) -> list[dict]:
    rows = []

    # ── FRAUD samples from SEAG CSV ───────────────────────────────────────
    with open(csv_path, encoding='utf-8') as f:
        scenarios = list(csv.DictReader(f))

    print(f"[+] Loaded {len(scenarios)} fraud scenarios from CSV")

    for s in scenarios:
        text = s['Scenario'].strip()
        if not text:
            continue
        rows.append({
            'text':             text,
            'label':            1,
            'attack_type':      s.get('Type', 'Unknown'),
            'series':           s.get('Series', ''),
            'tier':             s.get('Tier', ''),
            'psych_principles': s.get('PsychPrinciple', ''),
            'source':           'seag_csv',
        })

        if augment:
            for aug in augment_fraud_text(text):
                rows.append({
                    'text':             aug,
                    'label':            1,
                    'attack_type':      s.get('Type', 'Unknown'),
                    'series':           s.get('Series', ''),
                    'tier':             s.get('Tier', ''),
                    'psych_principles': s.get('PsychPrinciple', ''),
                    'source':           'seag_augmented',
                })

    fraud_count = len([r for r in rows if r['label'] == 1])
    print(f"[+] Fraud samples: {fraud_count}")

    # ── LEGIT samples from templates ──────────────────────────────────────
    legit_count = 0
    target_legit = fraud_count  # balanced 1:1

    for category, templates in LEGIT_TEMPLATES.items():
        per_template = max(1, target_legit // sum(len(v) for v in LEGIT_TEMPLATES.values()))
        for tmpl in templates:
            for _ in range(per_template + 2):
                rows.append({
                    'text':             fill_template(tmpl),
                    'label':            0,
                    'attack_type':      'None',
                    'series':           category,
                    'tier':             'Legit',
                    'psych_principles': '',
                    'source':           'template_legit',
                })
                legit_count += 1
                if legit_count >= target_legit:
                    break
            if legit_count >= target_legit:
                break

    print(f"[+] Legit samples: {legit_count}")

    # ── Optional: Ollama-generated samples ───────────────────────────────
    if ollama:
        ollama_rows = generate_ollama_samples(scenarios[:50])
        rows.extend(ollama_rows)
        print(f"[+] Ollama-generated samples: {len(ollama_rows)}")

    random.shuffle(rows)
    print(f"[+] Total dataset size: {len(rows)}")
    return rows


def generate_ollama_samples(scenarios: list[dict]) -> list[dict]:
    """
    Call Ollama to generate additional fraud + legit variants.
    Requires ollama running on localhost:11434 with llama3.2 or mistral.
    """
    try:
        import urllib.request, json as _json
    except ImportError:
        return []

    rows = []
    models_to_try = ['llama3.2', 'mistral', 'llama3.2:1b']
    model = None

    # Probe
    try:
        with urllib.request.urlopen('http://localhost:11434/api/tags', timeout=3) as r:
            tags = _json.loads(r.read())
            available = [m['name'].split(':')[0] for m in tags.get('models', [])]
            for m in models_to_try:
                if m.split(':')[0] in available:
                    model = m
                    break
    except Exception:
        print("[!] Ollama not available — skipping LLM generation")
        return []

    print(f"[+] Using Ollama model: {model}")

    for i, s in enumerate(scenarios[:30]):
        prompt = f"""Generate 3 realistic Nigerian SMS/email fraud messages similar to this pattern:
"{s['Scenario']}"
Attack type: {s['Type']}
Series: {s['Series']}

Also generate 2 LEGITIMATE Nigerian messages that could be confused with fraud but are genuine.

Respond ONLY with JSON:
{{
  "fraud": ["message1", "message2", "message3"],
  "legit": ["message1", "message2"]
}}
No markdown, no preamble."""

        try:
            payload = _json.dumps({
                'model': model,
                'prompt': prompt,
                'stream': False,
                'options': {'temperature': 0.7, 'num_predict': 600}
            }).encode()

            req = urllib.request.Request(
                'http://localhost:11434/api/generate',
                data=payload,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=20) as r:
                resp = _json.loads(r.read())
                raw = resp.get('response', '').strip()
                raw = re.sub(r'^```(?:json)?\s*', '', raw)
                raw = re.sub(r'\s*```\s*$', '', raw).strip()
                parsed = _json.loads(raw)

                for txt in parsed.get('fraud', []):
                    rows.append({
                        'text': txt, 'label': 1,
                        'attack_type': s['Type'], 'series': s['Series'],
                        'tier': 'Synthetic', 'psych_principles': '',
                        'source': 'ollama_generated',
                    })
                for txt in parsed.get('legit', []):
                    rows.append({
                        'text': txt, 'label': 0,
                        'attack_type': 'None', 'series': s['Series'],
                        'tier': 'Legit', 'psych_principles': '',
                        'source': 'ollama_legit',
                    })

                print(f"  [{i+1}/{len(scenarios[:30])}] Generated {len(parsed.get('fraud',[]))+len(parsed.get('legit',[]))} samples")
        except Exception as e:
            print(f"  [{i+1}] Failed: {e}")
        time.sleep(0.3)

    return rows


def save_dataset(rows: list[dict], output_path: str):
    fields = ['text', 'label', 'attack_type', 'series', 'tier', 'psych_principles', 'source']
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    fraud = sum(1 for r in rows if r['label'] == 1)
    legit = sum(1 for r in rows if r['label'] == 0)
    print(f"\n✅ Saved {len(rows)} samples to {output_path}")
    print(f"   Fraud: {fraud} | Legit: {legit} | Ratio: {fraud/max(legit,1):.2f}")


def print_stats(rows: list[dict]):
    from collections import Counter
    attack_dist = Counter(r['attack_type'] for r in rows if r['label'] == 1)
    source_dist = Counter(r['source'] for r in rows)
    print("\n── Attack type distribution (fraud) ──")
    for k, v in attack_dist.most_common():
        print(f"  {k:20s}  {v}")
    print("\n── Source distribution ──")
    for k, v in source_dist.most_common():
        print(f"  {k:25s}  {v}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='SENTRY Dataset Builder')
    parser.add_argument('--csv',     default='SEAG_Scenarios.csv', help='Path to SEAG CSV')
    parser.add_argument('--output',  default='nigerian_fraud_dataset.csv')
    parser.add_argument('--augment', action='store_true', default=True, help='Add augmented fraud variants (default: ON)')
    parser.add_argument('--no-augment', dest='augment', action='store_false', help='Disable augmentation')
    parser.add_argument('--ollama',  action='store_true', help='Use Ollama to generate extra samples')
    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"[!] CSV not found: {args.csv}")
        sys.exit(1)

    rows = build_dataset(args.csv, augment=args.augment, ollama=args.ollama)
    print_stats(rows)
    save_dataset(rows, args.output)