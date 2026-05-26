/**
 * ============================================================
 * Social Engineering Awareness Game (SEAG) — Fallback Dataset
 * Project:    Social Engineering Awareness Training Game
 * Author:     Daniel Olubajo
 * File:       data_fallback.js
 * Purpose:    Hardcoded scenario data for offline / demo mode.
 *             This mirrors the Google Sheet CSV structure exactly.
 *             All scenarios are localised for a Nigerian context
 *             and categorised by occupation, attack type, and
 *             psychological manipulation principle (Cialdini, 2006).
 *
 * Usage:      Automatically loaded by script.js when the Google
 *             Sheets CSV fetch fails or the Sheet ID is not set.
 * ============================================================
 */

/**
 * @typedef {Object} Scenario
 * @property {number}   id             - Unique scenario identifier
 * @property {string}   scenario       - The scenario description shown to the player
 * @property {string[]} options        - Array of response choices
 * @property {string}   correctAnswer  - The text of the correct choice
 * @property {string}   type           - Attack vector: Phishing|Vishing|Smishing|Baiting|Pretexting
 * @property {string}   occupation     - Target occupation category
 * @property {string}   level          - Difficulty: '1' | '2' | '3'
 * @property {string}   hint           - Pedagogical clue (costs XP to reveal)
 * @property {string}   explanation    - Red Flag Analysis explanation text
 * @property {string}   psychPrinciple - Cialdini / manipulation principle(s) used
 */

/** @type {Scenario[]} */
const FALLBACK_SCENARIOS = [

  // ═══════════════════════════════════════════════════════════
  //  STUDENT SCENARIOS  (5 scenarios, Levels 1–3)
  // ═══════════════════════════════════════════════════════════

  {
    id: 1,
    scenario:
      "You receive an email from 'jamb.gov.ng-registration.com' stating that your UTME result has been withheld pending verification. The email says you must log in via the link and confirm your NIN within 24 hours or your admission will be permanently cancelled.",
    options: [
      "Click the link and enter your NIN immediately",
      "Ignore the email completely",
      "Go directly to jamb.gov.ng in your browser to verify the claim"
    ],
    correctAnswer: "Go directly to jamb.gov.ng in your browser to verify the claim",
    type: "Phishing",
    occupation: "Student",
    level: "1",
    hint:
      "Compare the domain in the email: 'jamb.gov.ng-registration.com' is NOT the same as the official 'jamb.gov.ng'. Attackers register lookalike domains to deceive you.",
    explanation:
      "This is a phishing attack exploiting Authority (JAMB as a trusted government body) and Urgency (24-hour deadline). The attacker registered a lookalike domain to harvest your NIN. Official government portals NEVER communicate admission decisions through email links. Always type the official URL directly into your browser — never follow email links to government portals.",
    psychPrinciple: "Authority + Urgency"
  },

  {
    id: 2,
    scenario:
      "You receive an SMS: 'Congratulations! You have been selected for a ₦500,000 government scholarship. Reply with your full name, school name, matric number, and BVN to claim your award before midnight tonight.' The sender number shows as +234-813-0000-001.",
    options: [
      "Reply immediately with all the requested details before midnight",
      "Forward to fellow students who might also qualify",
      "Delete the SMS and report the number to your institution's cybersecurity desk"
    ],
    correctAnswer: "Delete the SMS and report the number to your institution's cybersecurity desk",
    type: "Smishing",
    occupation: "Student",
    level: "1",
    hint:
      "Legitimate scholarship bodies NEVER request your BVN via SMS. Your BVN is a master key to your banking — sharing it with a stranger is equivalent to handing them your ATM card and PIN.",
    explanation:
      "This is a Smishing (SMS Phishing) attack using Scarcity ('before midnight') and an Appeal to Greed. No legitimate scholarship programme solicits BVN numbers through an unsolicited text. Sharing your BVN exposes you to SIM swaps, fraudulent bank transfers, and identity theft. Forwarding the message amplifies the scam to other potential victims.",
    psychPrinciple: "Scarcity + Greed"
  },

  {
    id: 3,
    scenario:
      "You find a USB drive on a desk near your university's computer lab. It is labelled 'FINAL EXAM ANSWERS 2025 — CONFIDENTIAL'. No one is around to claim it.",
    options: [
      "Plug it into the lab computer to see what files are on it",
      "Take it home and plug it into your personal laptop where it is safer",
      "Hand it in to the faculty office or security desk without plugging it in anywhere"
    ],
    correctAnswer: "Hand it in to the faculty office or security desk without plugging it in anywhere",
    type: "Baiting",
    occupation: "Student",
    level: "2",
    hint:
      "The label is carefully designed to trigger your Curiosity. A USB drive is a physical attack vector — plugging it in can install malware (keyloggers, ransomware) in seconds, even before any file is opened.",
    explanation:
      "This is a classic Baiting attack. The attacker placed the USB device intentionally, leveraging your Curiosity about exam answers. Plugging in an unknown USB can silently install a Remote Access Trojan (RAT), keylogger, or ransomware. There is no 'safe' machine to test unknown USB devices — even personal laptops can be compromised. Always report found storage media to campus security.",
    psychPrinciple: "Curiosity"
  },

  {
    id: 4,
    scenario:
      "You receive a phone call: 'Good afternoon, I'm Officer Yusuf from NYSC Abuja Directorate. We have a critical error in your mobilisation file that will affect your posting. To correct it before today's deadline, I need your NYSC registration number, your state code, and your date of birth right now.' The caller ID on your screen shows 'NYSC'.",
    options: [
      "Provide all the information immediately to protect your mobilisation",
      "Ask for his badge number, then hang up and call the official NYSC helpline independently to verify",
      "Hang up — it's probably a prank call"
    ],
    correctAnswer: "Ask for his badge number, then hang up and call the official NYSC helpline independently to verify",
    type: "Vishing",
    occupation: "Student",
    level: "2",
    hint:
      "Caller ID can be spoofed using free VoIP tools. An attacker can make their call appear to come from 'NYSC', 'CBN', or any institution. Always call back using a number you find yourself on the official website.",
    explanation:
      "This is Vishing (Voice Phishing) with Caller ID Spoofing. The attacker uses Authority (NYSC official) and Urgency (mobilisation deadline) to pressure you into disclosing data without verification. Caller ID spoofing is technically trivial. Offering to call back via an independently sourced number exposes the scammer — a legitimate official will always welcome verification.",
    psychPrinciple: "Authority + Urgency"
  },

  {
    id: 5,
    scenario:
      "You receive a WhatsApp message from an unknown number: 'Hi, it's Chidi from your 400-Level class. I'm at the hospital and my phone died — borrowing a friend's. Please send ₦15,000 urgently to this Opay number: 09012345678. I'll pay you back first thing tomorrow. It's very urgent, please.' You do not have Chidi saved in your contacts.",
    options: [
      "Send the money — a classmate is in distress and needs immediate help",
      "Reply to the message asking for more details before sending",
      "Reach Chidi through a mutual classmate or his known phone number before sending anything"
    ],
    correctAnswer: "Reach Chidi through a mutual classmate or his known phone number before sending anything",
    type: "Pretexting",
    occupation: "Student",
    level: "3",
    hint:
      "Social engineers fabricate emergency stories specifically to bypass your rational thinking. 'Dead phone', 'hospital', and 'tomorrow payback' are classic Pretexting triggers. Always verify identity through a completely separate, trusted channel.",
    explanation:
      "This is a Pretexting attack. The attacker fabricated an emergency scenario using Social Proof (pretending to be a known classmate) and Fear (someone you care about is in danger). The unknown number and 'borrowed phone' are designed to explain why you can't recognise the contact. Always verify via a separate, independently confirmed channel — call a mutual friend — before any financial transaction.",
    psychPrinciple: "Social Proof + Fear + Manufactured Urgency"
  },


  // ═══════════════════════════════════════════════════════════
  //  IT PROFESSIONAL SCENARIOS  (5 scenarios, Levels 1–3)
  // ═══════════════════════════════════════════════════════════

  {
    id: 6,
    scenario:
      "You receive an email marked HIGH PRIORITY from your CEO, Emeka Okonkwo: 'I am in an emergency board session in Lagos. You must transfer ₦2.5 million immediately to this vendor account for a contract payment: GTBank — 0123456789 — Zenith Corp Ltd. Do NOT discuss this with anyone until transfer is confirmed.' The sender email shows: emeka.okonkwo@yourcompany-support.com.",
    options: [
      "Execute the transfer immediately — the CEO has explicitly authorised it",
      "Reply to the email requesting a formal purchase order",
      "Call the CEO directly on his official, pre-saved number to verify before touching anything"
    ],
    correctAnswer: "Call the CEO directly on his official, pre-saved number to verify before touching anything",
    type: "Phishing",
    occupation: "IT Professional",
    level: "2",
    hint:
      "The email domain 'yourcompany-support.com' is NOT your company's registered domain. This is Business Email Compromise (BEC) — one of the most financially costly cybercrimes globally. The 'do not discuss' instruction is a deliberate isolation tactic.",
    explanation:
      "This is a Business Email Compromise (BEC) / CEO Fraud attack. The attacker spoofed the CEO's name on a lookalike domain. Key red flags: lookalike domain, unusual payment channel, extreme urgency, and Secrecy ('do not discuss') — all designed to isolate you from colleagues who would spot the fraud. According to the FBI's IC3 report, BEC attacks caused over $2.9B in losses globally. Always verify financial instructions via a pre-saved phone number — never by replying to the suspicious email.",
    psychPrinciple: "Authority + Urgency + Isolation / Secrecy"
  },

  {
    id: 7,
    scenario:
      "You receive a phone call from someone claiming to be 'IT Support from Lagos HQ'. They say a critical zero-day vulnerability has been discovered and your machine is at immediate risk. They need your Windows admin credentials to remotely deploy an emergency security patch before close of business. 'If we don't patch this today, we could lose all company data.'",
    options: [
      "Provide the credentials — data loss is a critical business risk",
      "Create a temporary account with admin rights just for this patch",
      "Decline, raise a formal ticket through your helpdesk system, and escalate to your CISO"
    ],
    correctAnswer: "Decline, raise a formal ticket through your helpdesk system, and escalate to your CISO",
    type: "Vishing",
    occupation: "IT Professional",
    level: "1",
    hint:
      "Legitimate IT security teams never ask for your personal credentials over a phone call. They use Privileged Access Management (PAM) tools, break-glass accounts, and change management tickets — not verbal credential collection.",
    explanation:
      "This is a Vishing attack targeting IT staff. The attacker exploits Fear (data loss) and Authority (headquarters IT). No legitimate enterprise IT process requires you to verbally disclose your personal credentials. Temporary accounts still create audit liability. Your helpdesk ticketing system creates a documented trail that would immediately expose an unauthorised 'patch' request.",
    psychPrinciple: "Authority + Fear"
  },

  {
    id: 8,
    scenario:
      "You and several colleagues receive an urgent email: 'Your Microsoft 365 licence will expire in 2 hours. Failure to renew will result in immediate loss of access to all company emails, OneDrive files, and Teams channels. Click RENEW NOW to prevent service disruption.' The link in the email leads to 'microsoft365-renewal-ng.com'.",
    options: [
      "Click the link quickly and renew before losing email access",
      "Forward the email to all colleagues so everyone can renew",
      "Log directly into portal.office.com and check the actual licence status in the admin console"
    ],
    correctAnswer: "Log directly into portal.office.com and check the actual licence status in the admin console",
    type: "Phishing",
    occupation: "IT Professional",
    level: "1",
    hint:
      "Microsoft's renewal domain is microsoft.com, not 'microsoft365-renewal-ng.com'. The 2-hour deadline and 'colleagues also received it' detail are social engineering amplifiers — urgency plus social proof.",
    explanation:
      "This attack combines Urgency (2-hour deadline), Fear (losing access to business-critical tools), and Social Proof (colleagues also received it, creating a false sense of legitimacy). The lookalike domain harvests Microsoft 365 credentials. Forwarding would propagate the attack. As an IT professional, the admin portal is always the authoritative source of licence information.",
    psychPrinciple: "Urgency + Fear + Social Proof"
  },

  {
    id: 9,
    scenario:
      "You find a USB drive in your company's car park, near the entrance. It is labelled 'IT DEPT — SALARY REVIEW SPREADSHEET 2025 — CONFIDENTIAL — Do Not Distribute'.",
    options: [
      "Plug it into your work laptop in a sandboxed virtual machine to safely preview the file",
      "Plug it into an isolated offline machine that is not connected to the network",
      "Submit it to the security team as potential hostile hardware without plugging it in anywhere"
    ],
    correctAnswer: "Submit it to the security team as potential hostile hardware without plugging it in anywhere",
    type: "Baiting",
    occupation: "IT Professional",
    level: "2",
    hint:
      "As an IT professional, you should know about BadUSB attacks — where the USB device firmware is reprogrammed to emulate a keyboard and inject keystrokes at the BIOS/OS level. Sandboxed VMs and isolated machines do not protect against BadUSB.",
    explanation:
      "This is a targeted Baiting attack against IT staff. The 'salary' label exploits both Curiosity and Self-Interest — two powerful cognitive triggers. BadUSB devices can emulate HIDs (keyboards/mice), inject commands at OS level, and even exfiltrate data through acoustic or power channels — making sandboxes and isolated machines ineffective defences. Your security team has forensic tools to safely analyse unknown hardware.",
    psychPrinciple: "Curiosity + Self-Interest"
  },

  {
    id: 10,
    scenario:
      "A LinkedIn recruiter sends you a message: 'Hi, I came across your profile and I think you are a great fit for a Senior DevSecOps role at a top Nigerian fintech paying ₦18M per annum plus equity. Please review the attached JD and complete a brief skills assessment at careers-fintechng.io/apply. Takes under 5 minutes.' You are not actively job hunting, but the package is attractive.",
    options: [
      "Complete the assessment — a ₦18M opportunity is worth 5 minutes",
      "Thoroughly research the recruiter profile, company registration, and domain independently before engaging",
      "Share the link with tech colleagues who might be interested"
    ],
    correctAnswer: "Thoroughly research the recruiter profile, company registration, and domain independently before engaging",
    type: "Pretexting",
    occupation: "IT Professional",
    level: "3",
    hint:
      "Fake job offer attacks are well-documented. Check the recruiter's LinkedIn profile creation date, connection count, and endorsements. Verify the company on CAC (Corporate Affairs Commission). Check 'careers-fintechng.io' domain registration age — new domains (under 6 months) are a major red flag.",
    explanation:
      "This is a spear-phishing attack via social media, exploiting Greed (₦18M package) and Flattery ('great fit'). 'Skills assessment portals' are used by attackers to: harvest LinkedIn or GitHub OAuth tokens, deploy malicious JavaScript in the browser, or trick security professionals into installing 'assessment tools' that are Remote Access Trojans. Sharing amplifies the attack. Verify recruiter and company on official channels before clicking any external link.",
    psychPrinciple: "Greed + Flattery"
  },


  // ═══════════════════════════════════════════════════════════
  //  HEALTHCARE WORKER SCENARIOS  (5 scenarios, Levels 1–3)
  // ═══════════════════════════════════════════════════════════

  {
    id: 11,
    scenario:
      "You receive an email that appears to be from the Federal Ministry of Health. It states that all registered healthcare workers must update their credentials on the NHIS portal by end of day or face immediate suspension. The email domain shows 'nhealth-ministry.gov.ng' and the update link points to 'nhis-update-portal.com.ng'.",
    options: [
      "Click the link and update your credentials immediately — suspension is a serious consequence",
      "Forward to your hospital administrator so they can handle it officially",
      "Navigate directly to nhis.gov.ng in your browser to verify whether this announcement exists"
    ],
    correctAnswer: "Navigate directly to nhis.gov.ng in your browser to verify whether this announcement exists",
    type: "Phishing",
    occupation: "Healthcare Worker",
    level: "1",
    hint:
      "The official NHIS website is nhis.gov.ng. Both 'nhealth-ministry.gov.ng' (sender) and 'nhis-update-portal.com.ng' (link) are lookalike domains — neither is an official government domain. Government policy changes appear on official portals first.",
    explanation:
      "This phishing attack uses Authority (Federal Ministry of Health) and Urgency (suspension threat) to panic healthcare workers into clicking without verifying. In healthcare, compromised credentials can expose patient data and violate NDPR/HIPAA obligations, creating severe professional and legal consequences for the worker. Always verify healthcare regulatory announcements via your hospital's official communication channels or the agency's official website.",
    psychPrinciple: "Authority + Urgency + Fear of Professional Consequences"
  },

  {
    id: 12,
    scenario:
      "A caller identifies themselves: 'Good morning, I'm Dr. Biodun Adewale, Head of NHIS Compliance, Abuja. We are currently conducting an audit of your hospital and our records show a discrepancy in your personal NHIS staff registration. To correct this before our report is filed, I need your NIN, staff ID number, and date of birth. This will only take a moment.'",
    options: [
      "Provide the information — an audit discrepancy could affect your employment",
      "Tell the caller you are willing to cooperate but will need to call NHIS Compliance directly first to confirm their identity",
      "Transfer the call to your hospital's HR department to handle"
    ],
    correctAnswer: "Tell the caller you are willing to cooperate but will need to call NHIS Compliance directly first to confirm their identity",
    type: "Vishing",
    occupation: "Healthcare Worker",
    level: "2",
    hint:
      "Legitimate government audit officers send official written notices — letters on ministry letterhead — before requesting personal information over the phone. Unsolicited calls demanding personal data, even from apparent officials, are a Vishing red flag.",
    explanation:
      "This Vishing attack uses Authority (NHIS Compliance officer) and Fear (audit discrepancy affecting employment) to create compliance under psychological pressure. Healthcare workers are high-value targets because stolen credentials can access hospital systems and millions of patient records. A legitimate auditor always welcomes identity verification — a fraudster will resist or create further urgency. Always call back on a number from the official NHIS website.",
    psychPrinciple: "Authority + Fear of Professional Consequences"
  },

  {
    id: 13,
    scenario:
      "You receive an SMS: 'NDPC URGENT ALERT: An unauthorised breach of patient records has been detected linked to your staff profile. Reply YES to verify your identity and begin the protection process. Case Ref: NDPC/2025/7741. Failure to verify within 60 mins may result in regulatory action.'",
    options: [
      "Reply YES immediately — patient data protection is your legal and professional responsibility",
      "Contact your hospital's Data Protection Officer to report the SMS before taking any action",
      "Ignore — it is likely spam"
    ],
    correctAnswer: "Contact your hospital's Data Protection Officer to report the SMS before taking any action",
    type: "Smishing",
    occupation: "Healthcare Worker",
    level: "1",
    hint:
      "The Nigeria Data Protection Commission (NDPC) never sends compliance breach alerts via SMS with reply-to-verify instructions. Replying 'YES' confirms your number is active and may trigger further targeted attacks or premium SMS subscriptions.",
    explanation:
      "This Smishing attack exploits your professional sense of Responsibility and Fear of legal consequences under NDPR. The case reference number creates False Legitimacy. Replying confirms your number as active to the attacker. Regulatory bodies communicate through official correspondence — never unsolicited SMS messages. Your hospital's DPO is the correct escalation point for any data protection concern.",
    psychPrinciple: "Professional Responsibility + Fear + False Legitimacy"
  },

  {
    id: 14,
    scenario:
      "You receive a phone call claiming to be from MDCN (Medical and Dental Council of Nigeria): 'Doctor, our records show your medical practising licence is due for renewal and the window closes at 5pm today. To avoid automatic revocation and suspension from practice, you must pay ₦75,000 processing fee to: Access Bank — 0987654321 — MDCN Renewal Account. I can hold while you transfer.'",
    options: [
      "Make the payment immediately to protect your licence to practise",
      "Ask the caller to email the payment details so you have a written record",
      "Hang up and contact MDCN directly using the phone number listed on mdcn.gov.ng"
    ],
    correctAnswer: "Hang up and contact MDCN directly using the phone number listed on mdcn.gov.ng",
    type: "Vishing",
    occupation: "Healthcare Worker",
    level: "2",
    hint:
      "MDCN renewal processes are published months in advance on their official website. Legitimate renewal deadlines are never communicated via unsolicited same-day phone calls. Asking for an email creates a paper trail that fraudsters avoid.",
    explanation:
      "This Vishing attack weaponises a healthcare professional's greatest fear: losing their licence to practise medicine. It combines Authority (MDCN officer), Urgency (5pm same-day deadline), and Fear of Career Destruction. MDCN licence renewal is a well-documented, multi-step process that is never compressed into a same-day phone call. The offer to 'hold while you transfer' is a pressure tactic to prevent you from independently verifying.",
    psychPrinciple: "Authority + Urgency + Fear of Career Destruction"
  },

  {
    id: 15,
    scenario:
      "You arrive for your morning shift at the hospital ward and find a USB drive on the nurses' station. It is labelled 'PATIENT RECORDS — WARD B — Q3 2025 — PRIVATE'. No one on the shift knows how it got there, and the ward computer might need the files it contains for patient care today.",
    options: [
      "Plug it into the ward computer to check if the files are needed for patient care",
      "Lock it in a drawer to check later from your personal phone or laptop",
      "Report it to the hospital IT/security desk and treat it as potentially hostile hardware"
    ],
    correctAnswer: "Report it to the hospital IT/security desk and treat it as potentially hostile hardware",
    type: "Baiting",
    occupation: "Healthcare Worker",
    level: "3",
    hint:
      "Hospital networks are among the most targeted for ransomware globally. Plugging an unknown USB into any networked ward device could compromise patient monitoring systems, electronic prescribing systems, and radiology equipment — putting lives at risk.",
    explanation:
      "This Baiting attack is precisely engineered for a healthcare environment. The label exploits both your Curiosity and your professional Duty of Care to patients, framing inaction as potentially dangerous to patients. However, a single compromised USB on a networked hospital device could encrypt the entire hospital's electronic health record (EHR) system — a real pattern seen in NHS and Nigerian healthcare ransomware attacks. Unknown physical media is hostile until proven otherwise.",
    psychPrinciple: "Curiosity + Duty of Care"
  },


  // ═══════════════════════════════════════════════════════════
  //  GOVERNMENT EMPLOYEE SCENARIOS  (5 scenarios, Levels 1–3)
  // ═══════════════════════════════════════════════════════════

  {
    id: 16,
    scenario:
      "You receive an email: 'URGENT — OFFICIAL EFCC NOTICE: Your name has been flagged in an ongoing money laundering investigation (Reference: EFCC/2025/ABJ/4421). You are required to submit a clearance statement by clicking the link below within 48 hours or face immediate arrest and asset forfeiture.' The sender is shown as: efcc-clearance@efcc-nigeria.net.",
    options: [
      "Click the link immediately — being investigated by the EFCC is an extremely serious matter",
      "Forward to your ministry's legal department for urgent action",
      "Do NOT click any link. Report the email to EFCC's official complaint line (complaints@efcc.gov.ng) and your ministry's IT security desk"
    ],
    correctAnswer: "Do NOT click any link. Report the email to EFCC's official complaint line (complaints@efcc.gov.ng) and your ministry's IT security desk",
    type: "Phishing",
    occupation: "Government Employee",
    level: "1",
    hint:
      "The EFCC's official domain is efcc.gov.ng — note the .gov.ng suffix. 'efcc-nigeria.net' is a fraudulent lookalike domain. Official EFCC investigation notices are served via formal written correspondence or in person — never through email links.",
    explanation:
      "This is a high-anxiety phishing attack deliberately designed to override rational thinking through extreme Fear (arrest and asset forfeiture) and Authority (EFCC). The .net TLD vs .gov.ng is the critical red flag. EFCC and DSS do not conduct official investigation processes through email hyperlinks. The manufactured terror is the social engineering mechanism — it is designed to make you act before you verify.",
    psychPrinciple: "Fear + Authority"
  },

  {
    id: 17,
    scenario:
      "You receive an SMS: 'URGENT CBN/NIMC ALERT: Your National Identification Number (NIN) has been linked to suspicious financial activity. Your national identity will be SUSPENDED within 2 hours unless you verify at: nimc-verify.com. Act NOW to protect your identity.'",
    options: [
      "Visit the link immediately to prevent your NIN from being suspended",
      "Call the official NIMC helpline (0800-800-0634) to verify whether any action is required",
      "Forward the link to family members so they can also verify their NINs"
    ],
    correctAnswer: "Call the official NIMC helpline (0800-800-0634) to verify whether any action is required",
    type: "Smishing",
    occupation: "Government Employee",
    level: "1",
    hint:
      "NIMC's official portal is nimc.gov.ng. 'nimc-verify.com' is not an official Nigerian government domain. NIMC does not send NIN suspension alerts via SMS with external verification links.",
    explanation:
      "This Smishing attack combines Fear (identity suspension) and Urgency (2 hours) by impersonating NIMC — a trusted government agency. As a government employee, your NIN is also linked to your IPPIS payroll profile. A compromised NIN can enable fraudulent civil service salary diversion, SIM swaps, and identity theft. NIMC communicates through its enrolment centres and official portal — never via unsolicited SMS.",
    psychPrinciple: "Fear + Urgency"
  },

  {
    id: 18,
    scenario:
      "A caller says: 'Good day, this is the IPPIS Helpdesk calling from the Office of the Accountant General of the Federation in Abuja. We have detected a system error in your payroll profile that will cause your salary to be withheld in the next pay cycle. To correct this today before our 4pm processing cutoff, I need to verify your IPPIS number, BVN, and date of birth.'",
    options: [
      "Provide the details quickly — missing a salary payment would be a serious problem",
      "Provide only your IPPIS number but refuse to give your BVN or date of birth",
      "Tell the caller you will call back on the official OAGF number from their website before providing any information"
    ],
    correctAnswer: "Tell the caller you will call back on the official OAGF number from their website before providing any information",
    type: "Vishing",
    occupation: "Government Employee",
    level: "2",
    hint:
      "Providing 'partial' data is not a safe compromise. Your IPPIS number combined with your date of birth is sufficient to initiate fraudulent government benefit claims. Never provide ANY data to an unverified caller — even 'harmless' pieces.",
    explanation:
      "This Vishing attack exploits a government employee's Fear of salary disruption — a visceral, immediate threat. The 'partial information' trap is a classic social engineering tactic to make you feel cautious while still surrendering exploitable data. Legitimate OAGF payroll corrections are initiated through official memos and the IPPIS self-service portal — not unsolicited phone calls. Always call back on a number you find independently.",
    psychPrinciple: "Fear + Urgency"
  },

  {
    id: 19,
    scenario:
      "A well-dressed visitor approaches your desk at the ministry: 'Good morning. I am from the Department of State Services conducting a classified IT security audit of all government workstations. Please log into your computer so I can run a vulnerability scan. This is classified — please do not mention this to your colleagues or supervisor until my report is submitted.' He shows you what appears to be an official ID card.",
    options: [
      "Log in and allow the scan — the DSS has official authority over national security matters",
      "Allow him access but stay close to monitor everything he does on the screen",
      "Politely ask him to wait while you call your ministry's security officer to verify the audit and his identity"
    ],
    correctAnswer: "Politely ask him to wait while you call your ministry's security officer to verify the audit and his identity",
    type: "Pretexting",
    occupation: "Government Employee",
    level: "2",
    hint:
      "ID cards can be forged cheaply and quickly. The 'do not mention to colleagues' instruction is a critical social engineering red flag — it is specifically designed to prevent you from verifying with people who would know about a legitimate audit. Authorised audits are announced through official channels before they occur.",
    explanation:
      "This is a physical Pretexting (social engineering in person) attack combining Authority (DSS), Secrecy ('don't tell colleagues' — which prevents you from verifying with your supervisor or colleagues who would know about a real audit), and Isolation. Allowing an unverified visitor to access a logged-in government workstation could compromise classified documents, install hardware keyloggers, or enable exfiltration of sensitive state data. A legitimate DSS officer will welcome and expect security verification procedures.",
    psychPrinciple: "Authority + Secrecy + Isolation"
  },

  {
    id: 20,
    scenario:
      "After a high-level ministry policy meeting concludes, you notice a USB drive left on one of the conference room chairs. It is labelled: 'DRAFT FEDERAL BUDGET PROPOSAL 2026 — RESTRICTED — NOT FOR CIRCULATION'. As the ministry's budget officer, this document would be directly relevant to your current work.",
    options: [
      "Plug it into your office computer to review — the budget data is relevant to your official duties",
      "Hand it to your director as it may have been accidentally left by one of the meeting attendees",
      "Submit it to the IT security desk as potentially hostile hardware without plugging it into any device"
    ],
    correctAnswer: "Submit it to the IT security desk as potentially hostile hardware without plugging it into any device",
    type: "Baiting",
    occupation: "Government Employee",
    level: "3",
    hint:
      "The label is specifically tailored for a government finance environment to make the device feel 'professionally relevant' to you. Even handing it to your director without security clearance may result in it being plugged in, compromising the ministry network.",
    explanation:
      "This is a precision-targeted Baiting attack for government finance professionals. The label exploits your Professional Identity (this is your domain of responsibility) and Curiosity about sensitive budget data. Government budget systems are prime espionage and ransomware targets. A single compromised workstation can provide lateral access across the entire ministry's network infrastructure, potentially exposing classified financial data to external actors.",
    psychPrinciple: "Curiosity + Professional Identity"
  },


  // ═══════════════════════════════════════════════════════════
  //  GENERAL PUBLIC SCENARIOS  (5 scenarios, Levels 1–3)
  // ═══════════════════════════════════════════════════════════

  {
    id: 21,
    scenario:
      "You receive an SMS: 'URGENT CBN ALERT: Your BVN 2234****99 has been linked to an unauthorised transaction. Your bank account will be FROZEN within 1 hour. Verify your identity immediately at: cbn-bvn-verify.com to restore access. Ignore at your own risk.'",
    options: [
      "Visit the verification link quickly — they already know your partial BVN, so the message must be legitimate",
      "Call your bank's official customer care number (printed on the back of your debit card) to verify",
      "Reply STOP to opt out of the alerts and avoid account freezing"
    ],
    correctAnswer: "Call your bank's official customer care number (printed on the back of your debit card) to verify",
    type: "Smishing",
    occupation: "General Public",
    level: "1",
    hint:
      "Showing partial BVN digits is a deliberate False Legitimacy tactic. Attackers buy partial BVN data from breached datasets. The CBN never contacts individuals directly via SMS about account issues — it communicates through licensed banks.",
    explanation:
      "This sophisticated Smishing attack uses False Legitimacy (partial BVN display from a data breach), Urgency (1-hour account freeze), and Fear (lose access to your money). Seeing your partial BVN creates a false sense that the sender is authorised. Replying 'STOP' could confirm your number as active. CBN communicates with customers through licensed banks — your bank's customer care is the only correct escalation point.",
    psychPrinciple: "False Legitimacy + Urgency + Fear"
  },

  {
    id: 22,
    scenario:
      "You receive an SMS: '🎉 CONGRATULATIONS! You have WON ₦1,000,000 in the MTN Nigeria 40th Anniversary Promo! To process your winnings, please pay a ₦5,000 processing fee to: Opay — 09087654321 — MTN Promo Agent (Ade). Offer expires in 3 hours! Ref: MTN/WIN/4521.'",
    options: [
      "Send the ₦5,000 quickly before the 3-hour window closes — ₦1M is worth it",
      "Call MTN customer care on 180 to verify if this promo is real before paying anything",
      "Share the number in WhatsApp groups so friends and family can also claim their prizes"
    ],
    correctAnswer: "Call MTN customer care on 180 to verify if this promo is real before paying anything",
    type: "Smishing",
    occupation: "General Public",
    level: "1",
    hint:
      "Legitimate prize winnings NEVER require you to pay a fee to collect. 'Pay to claim a prize' is the universal signature of Advance Fee Fraud. MTN official promos are always verifiable via their 180 helpline and official social media pages.",
    explanation:
      "This is an Advance Fee Fraud (419 scam) delivered via Smishing. It uses Greed (₦1M prize), Urgency (3-hour expiry), and False Legitimacy (promo reference number). The ₦5,000 'processing fee' will be collected and the 'prize' will never arrive — often followed by escalating demands for 'tax clearance', 'customs fees', etc. Sharing the link amplifies the scam to your entire social network.",
    psychPrinciple: "Greed + Urgency + False Legitimacy"
  },

  {
    id: 23,
    scenario:
      "You receive an email from 'security-alerts@gtb-onlinebanking.com': 'Dear Valued GTBank Customer, we have detected unusual login activity on your account from an unknown device. Your account has been temporarily limited for your protection. Click SECURE MY ACCOUNT below to restore full access within 24 hours before your account is permanently blocked.'",
    options: [
      "Click 'Secure My Account' immediately — someone may already be accessing your account",
      "Log in to your GTBank account through the official GTBank app or by typing gtbank.com in your browser",
      "Call the number provided in the email to speak with a GTBank agent"
    ],
    correctAnswer: "Log in to your GTBank account through the official GTBank app or by typing gtbank.com in your browser",
    type: "Phishing",
    occupation: "General Public",
    level: "1",
    hint:
      "GTBank's official email domain is @gtbank.com. 'gtb-onlinebanking.com' is a fraudulent lookalike domain. Also: calling any number provided inside a suspicious email connects you directly to the attacker.",
    explanation:
      "This is one of the most common phishing attacks in Nigeria — bank email spoofing. The lookalike domain 'gtb-onlinebanking.com' mimics GTBank's branding. Clicking 'Secure My Account' redirects to a fake login page that steals your internet banking credentials. The Fear (account blocked) and Urgency (24 hours) drive panic. Calling the email's number would connect you to the attacker. Your bank's official app is always the safest way to verify account alerts.",
    psychPrinciple: "Fear + Urgency + Authority Impersonation"
  },

  {
    id: 24,
    scenario:
      "You receive a phone call: 'Good afternoon, this is the Access Bank Fraud Prevention Unit. We have just blocked a suspicious transfer of ₦250,000 from your account to an unknown recipient in Lagos. To confirm it was not you and to reverse the hold, I need to quickly verify your identity. Please provide your 16-digit ATM card number, expiry date, and the 3-digit CVV on the back.'",
    options: [
      "Provide all details quickly to reverse the fraudulent transfer and protect your money",
      "Provide only your account number but not the CVV — that should be enough to verify",
      "Tell the caller you will hang up and call Access Bank directly on 01-2802-900 to resolve this"
    ],
    correctAnswer: "Tell the caller you will hang up and call Access Bank directly on 01-2802-900 to resolve this",
    type: "Vishing",
    occupation: "General Public",
    level: "2",
    hint:
      "Your bank will NEVER call you and ask for your CVV number. The CVV exists specifically to authenticate card-not-present transactions and is designed to be kept secret from everyone — including your bank.",
    explanation:
      "This Vishing attack creates Fear (₦250K leaving your account) and then positions the attacker as your protector, exploiting Reciprocity (they are 'helping' you, so you should help them verify). Providing 'partial' data (account number only) still puts you at risk — card number plus expiry date alone enables many online purchases. Banks categorically never ask for CVV numbers. Hang up and call the number printed on the back of your card.",
    psychPrinciple: "Fear + Reciprocity"
  },

  {
    id: 25,
    scenario:
      "You receive a WhatsApp message from a new, unknown contact: 'Good day, I am a representative of the Dangote Foundation. As part of our 2025 community empowerment programme, we are awarding ₦500,000 cash grants to 100 selected Nigerians this month. Your number was selected from our database. To process your grant, please provide your full name, Local Government Area, bank account number, and NIN. May God bless you and your household.'",
    options: [
      "Send the requested information — the Dangote Foundation is a legitimate, well-known charity",
      "Visit the official Dangote Group website or their verified social media pages to confirm this grant programme",
      "Forward the message to family members who may also benefit from the grant"
    ],
    correctAnswer: "Visit the official Dangote Group website or their verified social media pages to confirm this grant programme",
    type: "Pretexting",
    occupation: "General Public",
    level: "3",
    hint:
      "Legitimate grant organisations publicise their programmes openly on verified official channels before collecting applications. They never solicit applications via unsolicited WhatsApp messages. Combining your bank account number and NIN enables identity theft, SIM swaps, and fraudulent mobile banking transactions.",
    explanation:
      "This Pretexting attack exploits Charitable Trust and Greed by impersonating a well-known Nigerian philanthropic institution. The 'God bless you' phrasing is a deliberate Religious Appeal designed to lower your psychological defences by creating an atmosphere of goodwill. Combining your bank account number, NIN, LGA, and full name enables SIM swap fraud, fraudulent USSD banking, and comprehensive identity theft. Verify any grant through official channels only — legitimate organisations will still be there after you verify.",
    psychPrinciple: "Charitable Trust + Greed + Religious Appeal"
  }

]; // end FALLBACK_SCENARIOS
