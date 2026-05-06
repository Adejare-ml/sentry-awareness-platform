/**
 * ============================================================
 * Social Engineering Awareness Game (SEAG) — Core Game Engine
 * Project:    Social Engineering Awareness Training Game
 * Author:     Daniel Olubajo
 * File:       script.js
 * Version:    2.0.0
 *
 * Description:
 *   Complete game engine for the SEAG system. v2.0 adds:
 *     - Full CSV parser for the expanded 1,635-scenario dataset
 *     - Series-based progression (10 thematic series)
 *     - Tier-based filtering (Novice → Defender → Sentinel)
 *     - Session mode selector (Quick / Standard / Marathon)
 *     - Series progress tracking per session
 *     - Robust CSV column mapping (handles OptionA/B/C and pipe
 *       formats, case-insensitive headers)
 *
 *   Theoretical basis: Constructivist Learning Theory (Vygotsky;
 *   Bruner, 1960). Occupation-adaptive content, immediate Red Flag
 *   Analysis feedback, and hint scaffolding (ZPD) implement the
 *   core principles of active knowledge construction.
 *
 *   CSV Column Structure (v2):
 *     ID | Series | Tier | Occupation | Type | Level |
 *     Scenario | OptionA | OptionB | OptionC | CorrectAnswer |
 *     Hint | Explanation | PsychPrinciple
 *
 *   Data source priority:
 *     1. Google Sheets CSV (Fetch API, 8-second timeout)
 *     2. FALLBACK_SCENARIOS (data_fallback.js) — offline/demo
 *
 * Dependencies: data_fallback.js (must load before this file)
 * ============================================================
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 1: CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Google Sheets published CSV URL.
 * Steps: Google Sheets → File → Share → Publish to web →
 *        Sheet tab → CSV format → Publish → copy URL here.
 * Replace YOUR_SHEET_ID_HERE with the ID from the published URL.
 */
const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/pub?gid=0&single=true&output=csv';

/** XP awarded per correct answer, keyed by Level value from CSV. */
const XP_PER_LEVEL = { '1': 10, '2': 15, '3': 20 };

/** XP floor — the player's score cannot drop below this. */
const XP_FLOOR = 0;

/** XP penalty deducted each time the hint system is used. */
const HINT_PENALTY = 5;

/** Number of consecutive correct answers to trigger a streak bonus. */
const STREAK_THRESHOLD = 3;

/** Bonus XP awarded upon reaching the streak threshold. */
const STREAK_BONUS = 10;

/**
 * Number of scenarios per session, keyed by mode.
 * Quick: fast demo-friendly run.
 * Standard: balanced session.
 * Marathon: deep-learning full run.
 */
const SESSION_LENGTHS = { quick: 5, standard: 10, marathon: 20 };

/**
 * Rank tiers — checked in order, first match wins.
 * @type {Array<{min:number, max:number, name:string, badge:string, icon:string, description:string}>}
 */
const RANKS = [
  { min: 0,   max: 99,       name: 'Cyber Novice',     badge: 'novice',   icon: '🛡️',
    description: 'Building foundational threat awareness. Keep training.' },
  { min: 100, max: 199,      name: 'Digital Defender', badge: 'defender', icon: '⚔️',
    description: 'Solid threat recognition developing. Your vigilance is growing.' },
  { min: 200, max: Infinity, name: 'Security Sentinel', badge: 'sentinel', icon: '🦅',
    description: 'Outstanding situational awareness. You are a security asset.' },
];

/**
 * The ten thematic series in the CSV dataset.
 * Used to display series labels and for series-based filtering.
 */
const ALL_SERIES = [
  'Banking & Finance',
  'Government & Identity',
  'Education & Academia',
  'Healthcare & Medical',
  'Corporate & Professional',
  'Social Media & Digital',
  'Telecom & Mobile',
  'E-commerce & Shopping',
  'Physical Security',
  'Cryptocurrency & Investment',
];

/** Series short icons for the HUD badge display. */
const SERIES_ICONS = {
  'Banking & Finance':           '🏦',
  'Government & Identity':       '🏛️',
  'Education & Academia':        '🎓',
  'Healthcare & Medical':        '🏥',
  'Corporate & Professional':    '💼',
  'Social Media & Digital':      '📱',
  'Telecom & Mobile':            '📡',
  'E-commerce & Shopping':       '🛒',
  'Physical Security':           '🔒',
  'Cryptocurrency & Investment': '₿',
};

/** Occupation list — must match CSV values exactly. */
const OCCUPATIONS = [
  'Student',
  'IT Professional',
  'Healthcare Worker',
  'Government Employee',
  'General Public',
];

/**
 * Minimum occupation-matched scenarios before cascade to General Public.
 * @see filterScenarios()
 */
const MIN_SCENARIOS_THRESHOLD = 5;

/**
 * SENTRY contextual guidance messages, keyed by attack Type.
 */
const SENTRY_GUIDANCE = {
  'Phishing':
    'A suspicious digital communication requires your analysis, Operative. Examine the sender domain, urgency language, and requested action before responding.',
  'Vishing':
    'A voice-channel threat is active. Remember — Caller ID is trivially spoofed. Never disclose data to an unverified caller. Hang up and call back independently.',
  'Smishing':
    'An SMS-based threat has been flagged. Analyse the sender, the urgency claim, and any embedded links before taking action.',
  'Pretexting':
    'A fabricated identity or scenario is in play. Question the motive. Why is this request being made? Why now? Why this channel?',
  'Baiting':
    'A physical or digital lure has been placed. Curiosity is a documented cognitive bias that attackers exploit. Proceed with maximum caution.',
};

/**
 * Simulated breach consequences — displayed on the feedback screen
 * after an incorrect answer to reinforce real-world stakes.
 */
const BREACH_MESSAGES = {
  'Phishing':
    'Your credentials have been harvested. Unauthorised account access is in progress.',
  'Vishing':
    'Sensitive personal data disclosed to an attacker. Identity verification bypassed.',
  'Smishing':
    'Your data has been submitted to an attacker-controlled server. Account takeover imminent.',
  'Pretexting':
    'A false identity was trusted. Sensitive information or system access surrendered.',
  'Baiting':
    'A malicious device connected. Silent compromise is underway. System integrity at risk.',
};

/**
 * Boot sequence terminal lines.
 * Printed character-by-character for cinematic effect while data loads.
 */
const BOOT_LINES = [
  '╔══════════════════════════════════════════════════════╗',
  '║     SENTRY SECURITY AWARENESS SYSTEM v2.0            ║',
  '║     Social Engineering Training Platform             ║',
  '║     1,635 Scenarios · 10 Series · 3 Tiers            ║',
  '╚══════════════════════════════════════════════════════╝',
  '',
  '>  Project: Social Engineering Awareness Training Game',
  '>  Author:  Daniel Olubajo | Computer Science Dept',
  '',
  '>  [INIT] Establishing secure session...',
  '>  [OK]   Session encrypted.',
  '>  [INIT] Loading expanded scenario database...',
  '>  [OK]   1,635 scenarios across 10 thematic series.',
  '>  [INIT] Calibrating occupation adaptive filter...',
  '>  [OK]   5 occupation profiles · cascade logic active.',
  '>  [INIT] Loading tier progression engine...',
  '>  [OK]   Novice → Defender → Sentinel.',
  '>  [INIT] Mapping Cialdini psychological principles...',
  '>  [OK]   Authority · Urgency · Scarcity · Social Proof',
  '>         · Fear · Reciprocity · False Legitimacy.',
  '>  [INIT] Activating SENTRY AI guidance module...',
  '>  [OK]   SENTRY v2.0 online.',
  '',
  '>  ════════════════════════════════════════════════════',
  '>  ALL SYSTEMS OPERATIONAL.',
  '>  AWAITING OPERATIVE REGISTRATION...',
  '>  ▌',
];


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 2: CENTRAL GAME STATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Single source of truth for all mutable game state.
 * All game logic reads from and writes to this object.
 * Key fields are persisted to localStorage via saveToLocalStorage().
 */
let GameState = {
  // Player profile (from registration form)
  playerName:          '',
  playerAge:           '',
  playerOccupation:    '',
  sessionMode:         'standard',   // 'quick' | 'standard' | 'marathon'

  // Data
  allScenarios:        [],           // Full loaded scenario array (CSV or fallback)
  sessionScenarios:    [],           // Filtered + shuffled subset for this session

  // Progress
  currentIndex:        0,
  xp:                  0,
  streak:              0,
  mistakes:            [],           // { scenarioId, type, series, playerAnswer, correctAnswer }
  hintsUsed:           0,
  hintUsedThisRound:   false,
  sessionComplete:     false,

  // Series tracking
  seriesEncountered:   {},           // { "Banking & Finance": 3, ... }

  // Navigation
  currentPhase:        'boot',
};


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 3: BOOT SEQUENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs the cinematic terminal boot animation.
 * Prints each line with a short delay, transitions to registration.
 * Data loading runs concurrently so boot time equals animation time.
 * @returns {Promise<void>}
 */
async function runBootSequence() {
  showScreen('boot');
  const bootText = document.getElementById('boot-text');
  bootText.innerHTML = '';

  // Load data concurrently with boot animation
  const dataPromise = loadScenarios();

  for (const line of BOOT_LINES) {
    await delay(80);
    const el = document.createElement('div');
    el.className = 'boot-line' +
      (line.startsWith('╔') || line.startsWith('║') || line.startsWith('╚')
        ? ' boot-border' : '');
    el.textContent = line;
    bootText.appendChild(el);
    bootText.scrollTop = bootText.scrollHeight;
  }

  await dataPromise;
  await delay(900);
  showScreen('registration');
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 4: DATA LOADING & CSV PARSING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Primary data loader.
 * Attempts to fetch scenarios from Google Sheets CSV.
 * Falls back to FALLBACK_SCENARIOS on any failure.
 *
 * Failure triggers:
 *   (a) Sheet ID placeholder not replaced
 *   (b) Network error / timeout (8 seconds)
 *   (c) HTTP error response
 *   (d) CSV parses to 0 scenarios
 *
 * @returns {Promise<void>}
 */
async function loadScenarios() {
  if (GOOGLE_SHEET_CSV_URL.includes('YOUR_SHEET_ID_HERE')) {
    console.info('[SENTRY] Sheet ID not configured — using built-in fallback dataset.');
    GameState.allScenarios = normaliseFallback(FALLBACK_SCENARIOS);
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(GOOGLE_SHEET_CSV_URL, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csvText = await response.text();
    const parsed  = parseCSV(csvText);

    if (parsed.length === 0) throw new Error('CSV returned 0 valid scenarios');

    GameState.allScenarios = parsed;
    console.info(`[SENTRY] Loaded ${parsed.length} scenarios from Google Sheets.`);

  } catch (err) {
    console.warn('[SENTRY] Google Sheets fetch failed — fallback active.', err.message);
    GameState.allScenarios = normaliseFallback(FALLBACK_SCENARIOS);
  }
}

/**
 * Normalises the legacy FALLBACK_SCENARIOS array (from data_fallback.js)
 * into the same schema as CSV-parsed scenarios.
 * Fallback scenarios use a 'options' array instead of optionA/B/C columns.
 *
 * @param {Object[]} fallback - Raw FALLBACK_SCENARIOS array
 * @returns {Object[]} Normalised scenario array
 */
function normaliseFallback(fallback) {
  return fallback.map(s => ({
    id:             s.id,
    series:         s.series || 'Banking & Finance',
    tier:           tierNameFromLevel(String(s.level)),
    occupation:     s.occupation,
    type:           s.type,
    level:          String(s.level),
    scenario:       s.scenario,
    options:        Array.isArray(s.options) ? s.options : [s.optionA, s.optionB, s.optionC].filter(Boolean),
    correctAnswer:  s.correctAnswer,
    hint:           s.hint,
    explanation:    s.explanation,
    psychPrinciple: s.psychPrinciple,
  }));
}

/**
 * Maps a level string ('1'|'2'|'3') to the Tier display name.
 * @param {string} level - CSV level value
 * @returns {string} Tier name
 */
function tierNameFromLevel(level) {
  return { '1': 'Novice', '2': 'Defender', '3': 'Sentinel' }[level] || 'Novice';
}

/**
 * Parses a Google Sheets CSV export into normalised Scenario objects.
 *
 * Handles two CSV formats:
 *   Format A (v2 — preferred):
 *     ID, Series, Tier, Occupation, Type, Level, Scenario,
 *     OptionA, OptionB, OptionC, CorrectAnswer, Hint, Explanation, PsychPrinciple
 *
 *   Format B (v1 legacy):
 *     ID, Scenario, Options (pipe-separated), CorrectAnswer,
 *     Type, Occupation, Level, Hint, Explanation
 *
 * Header detection is case-insensitive and whitespace-tolerant.
 *
 * @param {string} csvText - Raw CSV string from Google Sheets
 * @returns {Object[]} Array of normalised scenario objects
 */
function parseCSV(csvText) {
  const rawRows = splitCSVRows(csvText);
  if (rawRows.length < 2) {
    console.warn('[SENTRY] CSV has fewer than 2 rows.');
    return [];
  }

  // Normalise headers: lowercase, strip spaces/underscores
  const headers = rawRows[0].map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
  console.info('[SENTRY] CSV headers detected:', headers.join(' | '));

  // Detect format by checking for 'optiona' header
  const isV2Format = headers.includes('optiona');

  const scenarios = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (row.every(cell => !cell.trim())) continue; // skip blank rows

    // Map row cells to header keys
    const obj = {};
    headers.forEach((key, idx) => { obj[key] = (row[idx] || '').trim(); });

    // ── Extract options ──────────────────────────────────────────────
    let options = [];

    if (isV2Format) {
      // Format A: separate OptionA, OptionB, OptionC columns
      [obj['optiona'], obj['optionb'], obj['optionc']]
        .filter(v => v && v.trim())
        .forEach(v => options.push(v.trim()));
    } else {
      // Format B: pipe-separated Options column
      const optionsRaw = obj['options'] || '';
      options = optionsRaw.split('|').map(o => o.trim()).filter(Boolean);
    }

    // Require at least a scenario and correct answer
    const sc        = obj['scenario']       || '';
    const correct   = obj['correctanswer']  || obj['correct'] || '';
    if (!sc || !correct) continue;

    scenarios.push({
      id:             parseInt(obj['id'], 10) || i,
      series:         obj['series']         || 'Banking & Finance',
      tier:           obj['tier']           || tierNameFromLevel(obj['level'] || '1'),
      occupation:     obj['occupation']     || 'General Public',
      type:           obj['type']           || 'Phishing',
      level:          obj['level']          || '1',
      scenario:       sc,
      options:        options,
      correctAnswer:  correct,
      hint:           obj['hint']           || 'Examine every detail of this communication carefully.',
      explanation:    obj['explanation']    || 'Refer to your security training materials.',
      psychPrinciple: obj['psychprinciple'] || obj['psych'] || 'Social Engineering',
    });
  }

  console.info(`[SENTRY] Parsed ${scenarios.length} scenarios from CSV (format: ${isV2Format ? 'v2' : 'v1'}).`);
  return scenarios;
}

/**
 * Splits a CSV string into a 2D array of cells.
 * Implements full RFC 4180 compliance for quoted fields
 * (handles commas, escaped quotes, and embedded newlines).
 *
 * @param {string} str - Raw CSV string
 * @returns {string[][]} 2D array: rows × cells
 */
function splitCSVRows(str) {
  const rows = [];
  let current = [], field = '', inQuote = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i], next = str[i + 1];

    if (inQuote) {
      if      (ch === '"' && next === '"') { field += '"'; i++; }  // escaped quote
      else if (ch === '"')                   inQuote = false;       // end quote
      else                                   field += ch;
    } else {
      if      (ch === '"')  inQuote = true;
      else if (ch === ',') { current.push(field); field = ''; }
      else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        current.push(field); rows.push(current); current = []; field = '';
        if (ch === '\r') i++;
      }
      else if (ch === '\r') { current.push(field); rows.push(current); current = []; field = ''; }
      else                   field += ch;
    }
  }
  if (field !== '' || current.length > 0) { current.push(field); rows.push(current); }
  return rows.filter(r => r.some(c => c.trim()));
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 5: ADAPTIVE FILTERING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filters and shuffles the scenario pool for a session.
 *
 * Algorithm:
 *   1. Filter by exact occupation match.
 *   2. If count < MIN_SCENARIOS_THRESHOLD, supplement from 'General Public'.
 *   3. Apply tier filter if selected (does not apply in 'all' mode).
 *   4. Shuffle using Fisher-Yates.
 *   5. Slice to session length.
 *
 * Adaptive design rationale (Alshammari et al., 2015):
 *   Occupation-specific content increases perceived relevance, which
 *   directly improves engagement and retention.
 *
 * @param {string} occupation  - Player occupation from registration
 * @param {string} tierFilter  - 'all' | 'Novice' | 'Defender' | 'Sentinel'
 * @param {string} mode        - 'quick' | 'standard' | 'marathon'
 * @returns {Object[]} Filtered, shuffled, sliced scenario array
 */
function filterScenarios(occupation, tierFilter, mode) {
  let pool = GameState.allScenarios.filter(s => s.occupation === occupation);

  // Cascade: supplement with General Public if pool is thin
  if (pool.length < MIN_SCENARIOS_THRESHOLD) {
    const general = GameState.allScenarios.filter(
      s => s.occupation === 'General Public' && !pool.includes(s)
    );
    pool = [...pool, ...general];
    console.info(`[SENTRY] Cascaded to General Public — pool: ${pool.length}`);
  }

  // Apply tier filter
  if (tierFilter && tierFilter !== 'all') {
    const filtered = pool.filter(s => s.tier === tierFilter);
    if (filtered.length >= MIN_SCENARIOS_THRESHOLD) pool = filtered;
    else console.info(`[SENTRY] Tier filter '${tierFilter}' too restrictive — ignoring.`);
  }

  const shuffled = shuffleArray(pool);
  const length   = SESSION_LENGTHS[mode] || SESSION_LENGTHS.standard;

  return shuffled.slice(0, Math.min(length, shuffled.length));
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 6: REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates registration form and initialises a new game session.
 *
 * Validates:
 *   - Name: non-empty, ≥2 characters
 *   - Age: integer 10–100
 *   - Occupation: selected from OCCUPATIONS list
 *
 * On success: populates GameState, filters scenarios, transitions to game.
 */
function handleRegistration() {
  clearFormErrors();

  const name  = document.getElementById('reg-name').value.trim();
  const age   = document.getElementById('reg-age').value.trim();
  const occ   = document.getElementById('reg-occupation').value;
  const tier  = document.getElementById('reg-tier').value;
  const mode  = document.getElementById('reg-mode').value;

  let valid = true;

  if (!name || name.length < 2) {
    showFormError('reg-name-error', '⚠ Enter your name (minimum 2 characters).');
    valid = false;
  }
  const ageNum = parseInt(age, 10);
  if (!age || isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
    showFormError('reg-age-error', '⚠ Enter a valid age between 10 and 100.');
    valid = false;
  }
  if (!occ) {
    showFormError('reg-occ-error', '⚠ Select your occupation profile.');
    valid = false;
  }
  if (!valid) return;

  // ── Initialise state ───────────────────────────────────────────────
  GameState.playerName        = name;
  GameState.playerAge         = ageNum;
  GameState.playerOccupation  = occ;
  GameState.sessionMode       = mode || 'standard';
  GameState.sessionScenarios  = filterScenarios(occ, tier, mode || 'standard');
  GameState.currentIndex      = 0;
  GameState.xp                = 0;
  GameState.streak            = 0;
  GameState.mistakes          = [];
  GameState.hintsUsed         = 0;
  GameState.hintUsedThisRound = false;
  GameState.sessionComplete   = false;
  GameState.seriesEncountered = {};

  console.info(
    `[SENTRY] Session — Operative: ${name} | Occ: ${occ} | ` +
    `Tier: ${tier || 'all'} | Mode: ${mode} | Scenarios: ${GameState.sessionScenarios.length}`
  );

  saveToLocalStorage();
  document.getElementById('hud-player').textContent = name.split(' ')[0].toUpperCase();
  loadScenario();
  showScreen('game');
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 7: SCENARIO LOADING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders the current scenario into all game-screen UI elements.
 * Called on first scenario load and after every feedback screen dismissal.
 *
 * Populates:
 *   - HUD (XP, rank, streak, series badge)
 *   - SENTRY guidance panel
 *   - Scenario metadata (type badge, tier, level, occupation, series)
 *   - Scenario body text
 *   - Choice buttons (dynamically generated from scenario.options)
 *   - Progress bar & counter
 *   - Hint button & hint box (reset to initial state)
 */
function loadScenario() {
  const scenario = GameState.sessionScenarios[GameState.currentIndex];
  if (!scenario) { endGame(); return; }

  GameState.hintUsedThisRound = false;

  // Track series encounters for session summary
  const sName = scenario.series || 'Unknown';
  GameState.seriesEncountered[sName] = (GameState.seriesEncountered[sName] || 0) + 1;

  // ── HUD ───────────────────────────────────────────────────────────
  updateHUD();

  // ── Series badge in HUD ───────────────────────────────────────────
  const seriesIcon = SERIES_ICONS[sName] || '🔍';
  const seriesEl   = document.getElementById('hud-series');
  if (seriesEl) seriesEl.textContent = `${seriesIcon} ${sName}`;

  // ── SENTRY guidance ───────────────────────────────────────────────
  document.getElementById('sentry-message').textContent =
    SENTRY_GUIDANCE[scenario.type] ||
    'Operative, analyse this situation carefully before committing to a response.';

  // ── Scenario metadata ─────────────────────────────────────────────
  const typeBadge = document.getElementById('scenario-type-badge');
  typeBadge.textContent = scenario.type;
  typeBadge.className   = `type-badge type-${scenario.type.toLowerCase().replace(/\s+/g, '')}`;

  document.getElementById('scenario-level').textContent      = `LVL ${scenario.level}`;
  document.getElementById('scenario-tier-badge').textContent = scenario.tier || 'Novice';
  document.getElementById('scenario-occupation').textContent = scenario.occupation.toUpperCase();
  document.getElementById('scenario-series').textContent     =
    `${seriesIcon} ${sName}`;

  // ── Scenario body ─────────────────────────────────────────────────
  document.getElementById('scenario-text').textContent = scenario.scenario;

  // ── Choice buttons ────────────────────────────────────────────────
  const choicesContainer = document.getElementById('choices-container');
  choicesContainer.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];

  (scenario.options || []).forEach((option, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.setAttribute('data-answer', option);
    btn.innerHTML = `
      <span class="choice-letter">${letters[idx] || (idx + 1)}</span>
      <span class="choice-text">${escapeHTML(option)}</span>
    `;
    btn.addEventListener('click', () => handleChoice(option, scenario));
    choicesContainer.appendChild(btn);
  });

  // ── Hint reset ────────────────────────────────────────────────────
  const hintBtn = document.getElementById('hint-btn');
  const hintBox = document.getElementById('hint-box');
  hintBox.classList.add('hidden');
  document.getElementById('hint-text').textContent = '';
  hintBtn.disabled    = false;
  hintBtn.textContent = `💡 USE HINT  [ −${HINT_PENALTY} XP ]`;
  hintBtn.classList.remove('used');

  // ── Progress ──────────────────────────────────────────────────────
  const total   = GameState.sessionScenarios.length;
  const current = GameState.currentIndex + 1;
  document.getElementById('progress-text').textContent = `SCENARIO ${current} / ${total}`;
  document.getElementById('progress-fill').style.width =
    `${(GameState.currentIndex / total) * 100}%`;
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 8: CHOICE HANDLING & XP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles a player's choice selection.
 *
 * Flow:
 *   1. Disable all choice buttons immediately (prevent double-tap).
 *   2. Apply visual correct/incorrect states.
 *   3. If correct: award XP, increment streak, check streak bonus.
 *   4. If incorrect: reset streak, record mistake.
 *   5. Persist to localStorage.
 *   6. After 700ms visual pause → show feedback screen.
 *
 * @param {string} selectedAnswer - Text of the option selected
 * @param {Object} scenario       - Current scenario object
 */
function handleChoice(selectedAnswer, scenario) {
  const isCorrect = selectedAnswer.trim() === scenario.correctAnswer.trim();

  // Disable and highlight all buttons
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.disabled = true;
    const ans = btn.getAttribute('data-answer');
    if (ans === scenario.correctAnswer) btn.classList.add('correct');
    if (ans === selectedAnswer && !isCorrect) btn.classList.add('incorrect');
  });

  // ── XP logic ──────────────────────────────────────────────────────
  let xpGained = 0, streakBonus = 0;

  if (isCorrect) {
    xpGained = XP_PER_LEVEL[scenario.level] || 10;
    GameState.streak++;
    if (GameState.streak > 0 && GameState.streak % STREAK_THRESHOLD === 0) {
      streakBonus = STREAK_BONUS;
      xpGained   += streakBonus;
    }
    GameState.xp = Math.max(XP_FLOOR, GameState.xp + xpGained);
  } else {
    GameState.streak = 0;
    GameState.mistakes.push({
      scenarioId:    scenario.id,
      type:          scenario.type,
      series:        scenario.series || '—',
      playerAnswer:  selectedAnswer,
      correctAnswer: scenario.correctAnswer,
    });
  }

  saveToLocalStorage();
  setTimeout(() => showFeedback(scenario, isCorrect, xpGained, streakBonus), 700);
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 9: HINT SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reveals the current scenario's pedagogical hint.
 *
 * Design rationale (Vygotsky, ZPD):
 *   The hint provides cognitive scaffolding — it guides reasoning without
 *   revealing the answer, encouraging the learner to construct the correct
 *   schema themselves. The XP cost models a meaningful trade-off.
 *
 * Can only be used once per scenario. Immediately deducts HINT_PENALTY XP.
 */
function useHint() {
  if (GameState.hintUsedThisRound) return;
  const scenario = GameState.sessionScenarios[GameState.currentIndex];
  if (!scenario?.hint) return;

  GameState.hintUsedThisRound = true;
  GameState.hintsUsed++;
  GameState.xp = Math.max(XP_FLOOR, GameState.xp - HINT_PENALTY);
  updateHUD();

  const hintBtn = document.getElementById('hint-btn');
  hintBtn.disabled    = true;
  hintBtn.textContent = '💡 HINT USED';
  hintBtn.classList.add('used');

  document.getElementById('hint-text').textContent = scenario.hint;
  document.getElementById('hint-box').classList.remove('hidden');
  saveToLocalStorage();
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 10: FEEDBACK / RED FLAG ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Populates and displays the post-choice feedback screen.
 *
 * This is the core learning moment (Constructivist principle: immediate
 * contextual feedback builds correct mental schema — Bruner, 1960).
 *
 * The Red Flag Analysis:
 *   - Names the Cialdini psychological principle(s) used
 *   - Explains HOW the attack works mechanically
 *   - Does NOT simply say "wrong" — it explains the manipulation
 *   - For incorrect: shows the simulated breach consequence
 *
 * @param {Object}  scenario      - Current scenario
 * @param {boolean} isCorrect     - Whether player chose correctly
 * @param {number}  xpGained      - Total XP awarded (0 if wrong)
 * @param {number}  streakBonus   - Streak component of xpGained
 */
function showFeedback(scenario, isCorrect, xpGained, streakBonus) {

  // ── Result banner ─────────────────────────────────────────────────
  const banner = document.getElementById('result-banner');
  banner.textContent = isCorrect
    ? '✓  THREAT NEUTRALISED — CORRECT RESPONSE'
    : '✗  THREAT SUCCEEDED — INCORRECT RESPONSE';
  banner.className = `result-banner ${isCorrect ? 'correct' : 'incorrect'}`;

  // ── Breach simulation ─────────────────────────────────────────────
  const breachEl = document.getElementById('breach-warning');
  if (!isCorrect) {
    document.getElementById('breach-details').textContent =
      BREACH_MESSAGES[scenario.type] || 'System security compromised.';
    breachEl.classList.remove('hidden');
  } else {
    breachEl.classList.add('hidden');
  }

  // ── XP change display ─────────────────────────────────────────────
  const xpEl = document.getElementById('xp-change-display');
  if (isCorrect) {
    let msg = `+${xpGained} XP AWARDED`;
    if (streakBonus > 0) msg += `  (includes +${streakBonus} streak bonus)`;
    xpEl.textContent = msg;
    xpEl.className   = 'xp-change positive';
  } else {
    xpEl.textContent = 'NO XP AWARDED — THREAT BYPASSED';
    xpEl.className   = 'xp-change neutral';
  }

  // ── Streak notification ───────────────────────────────────────────
  const streakEl = document.getElementById('streak-notification');
  if (isCorrect && streakBonus > 0) {
    streakEl.textContent = `🔥 ${GameState.streak}-ANSWER STREAK! +${streakBonus} BONUS XP`;
    streakEl.classList.remove('hidden');
  } else {
    streakEl.classList.add('hidden');
  }

  // ── Correct answer reveal (wrong only) ───────────────────────────
  const correctEl = document.getElementById('correct-answer-display');
  if (!isCorrect) {
    correctEl.textContent = `✓ Correct response: "${scenario.correctAnswer}"`;
    correctEl.classList.remove('hidden');
  } else {
    correctEl.classList.add('hidden');
  }

  // ── Series label in feedback ──────────────────────────────────────
  const seriesIcon = SERIES_ICONS[scenario.series] || '🔍';
  const rfaSeriesEl = document.getElementById('rfa-series');
  if (rfaSeriesEl) rfaSeriesEl.textContent = `${seriesIcon} ${scenario.series || '—'}`;

  // ── Red Flag Analysis ─────────────────────────────────────────────
  document.getElementById('attack-type-display').textContent =
    `Attack: ${scenario.type}  |  Series: ${scenario.series || '—'}  |  Level ${scenario.level} (${scenario.tier || 'Novice'})`;

  document.getElementById('psych-principle').textContent =
    scenario.psychPrinciple || 'Psychological Manipulation';

  document.getElementById('red-flag-explanation').textContent =
    scenario.explanation || 'Review your training materials for this attack type.';

  showScreen('feedback');
}

/**
 * Advances to the next scenario or triggers game completion.
 */
function nextScenario() {
  GameState.currentIndex++;
  if (GameState.currentIndex >= GameState.sessionScenarios.length) {
    endGame();
  } else {
    loadScenario();
    showScreen('game');
  }
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 11: GAME COMPLETION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles end-of-session state.
 * Calculates final statistics, updates leaderboard, populates
 * completion screen, and transitions to it.
 */
function endGame() {
  GameState.sessionComplete = true;

  const rank     = getRankByXP(GameState.xp);
  const accuracy = calculateAccuracy();

  // ── Completion screen population ──────────────────────────────────
  document.getElementById('complete-player-name').textContent =
    `Well done, ${GameState.playerName}.`;
  document.getElementById('complete-final-xp').textContent    = GameState.xp;
  document.getElementById('complete-rank-name').textContent   = rank.name;
  document.getElementById('complete-rank-icon').textContent   = rank.icon;
  document.getElementById('complete-rank-desc').textContent   = rank.description;
  document.getElementById('complete-accuracy').textContent    = `${accuracy}%`;
  document.getElementById('complete-mistakes').textContent    = GameState.mistakes.length;
  document.getElementById('complete-hints').textContent       = GameState.hintsUsed;
  document.getElementById('complete-scenarios').textContent   = GameState.sessionScenarios.length;

  // Series coverage summary
  const seriesStr = Object.entries(GameState.seriesEncountered)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${SERIES_ICONS[k] || '🔍'} ${k} (${v})`)
    .join('  ·  ');
  const seriesSummaryEl = document.getElementById('complete-series-summary');
  if (seriesSummaryEl) seriesSummaryEl.textContent = seriesStr || 'No series data';

  // Rank badge styling
  const badgeEl = document.getElementById('complete-rank-badge');
  badgeEl.className = `rank-badge-large badge-${rank.badge}`;

  // ── Leaderboard update ────────────────────────────────────────────
  addToLeaderboard({
    name:       GameState.playerName,
    xp:         GameState.xp,
    rank:       rank.name,
    occupation: GameState.playerOccupation,
    accuracy,
    scenarios:  GameState.sessionScenarios.length,
    date:       new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }),
  });

  showScreen('complete');
}

/**
 * Calculates session accuracy as a percentage (0–100).
 * @returns {number}
 */
function calculateAccuracy() {
  const total = GameState.sessionScenarios.length;
  if (total === 0) return 0;
  return Math.round(((total - GameState.mistakes.length) / total) * 100);
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 12: RANK & XP UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the matching rank object for a given XP total.
 * @param {number} xp
 * @returns {Object} Rank object from RANKS array
 */
function getRankByXP(xp) {
  return RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[RANKS.length - 1];
}

/**
 * Updates all HUD elements to reflect current GameState.
 * Called after every XP change.
 */
function updateHUD() {
  const rank = getRankByXP(GameState.xp);

  document.getElementById('hud-xp').textContent       = GameState.xp;
  document.getElementById('hud-rank').textContent      = rank.name;
  document.getElementById('hud-rank-icon').textContent = rank.icon;
  document.getElementById('hud-streak').textContent    = GameState.streak;

  // XP bar: progress within the current rank band
  const nextRank  = RANKS.find(r => r.min > GameState.xp);
  const bandMax   = nextRank ? nextRank.min : rank.max + 1;
  const bandSize  = bandMax - rank.min;
  const progress  = bandSize > 0 ? Math.min(100, ((GameState.xp - rank.min) / bandSize) * 100) : 100;
  document.getElementById('xp-bar-fill').style.width = `${progress}%`;
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 13: LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds a new entry to the localStorage leaderboard.
 * Maintains only the top 5 entries sorted by XP descending.
 * @param {Object} entry - { name, xp, rank, occupation, accuracy, scenarios, date }
 */
function addToLeaderboard(entry) {
  const board = getLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.xp - a.xp);
  try {
    localStorage.setItem('seag_leaderboard_v2', JSON.stringify(board.slice(0, 5)));
  } catch (e) {
    console.warn('[SENTRY] localStorage write failed.', e);
  }
}

/**
 * Retrieves the leaderboard from localStorage.
 * @returns {Object[]} Array of leaderboard entries
 */
function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem('seag_leaderboard_v2') || '[]');
  } catch { return []; }
}

/**
 * Renders the leaderboard screen with the current top-5 entries.
 */
function renderLeaderboard() {
  const board     = getLeaderboard();
  const container = document.getElementById('leaderboard-entries');
  container.innerHTML = '';

  if (board.length === 0) {
    container.innerHTML =
      '<div class="lb-empty">[ NO ENTRIES YET ] Complete a session to appear here.</div>';
    showScreen('leaderboard');
    return;
  }

  const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
  board.forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = `lb-entry ${idx === 0 ? 'lb-top' : ''}`;
    div.innerHTML = `
      <span class="lb-pos">${medals[idx] || idx + 1}</span>
      <span class="lb-name">${escapeHTML(entry.name)}</span>
      <span class="lb-occ">${escapeHTML(entry.occupation)}</span>
      <span class="lb-accuracy">${entry.accuracy ?? '—'}%</span>
      <span class="lb-xp">${entry.xp} XP</span>
      <span class="lb-rank-name">${escapeHTML(entry.rank)}</span>
      <span class="lb-date">${escapeHTML(entry.date)}</span>
    `;
    container.appendChild(div);
  });

  showScreen('leaderboard');
}

/** Clears all leaderboard data. */
function clearLeaderboard() {
  localStorage.removeItem('seag_leaderboard_v2');
  renderLeaderboard();
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 14: REPORT DOWNLOAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates and triggers download of a plain-text session report.
 *
 * This document serves as academic evidence of system functionality.
 * The mistake log cross-references attack type and series to highlight
 * specific knowledge gaps, supporting the Constructivist feedback loop.
 *
 * Format: UTF-8 plain text (.txt)
 * Filename: SEAG_Report_{PlayerName}_{ISO-Date}.txt
 */
function downloadReport() {
  const rank     = getRankByXP(GameState.xp);
  const accuracy = calculateAccuracy();
  const now      = new Date();
  const sep      = '═'.repeat(64);
  const div      = '─'.repeat(64);

  const seriesBreakdown = Object.entries(GameState.seriesEncountered)
    .map(([k, v]) => `  ${k}: ${v} scenario(s)`)
    .join('\n');

  let report = `
${sep}
   SOCIAL ENGINEERING AWARENESS GAME — SESSION REPORT
              SENTRY System v2.0 | Academic Edition
              1,635 Scenarios · 10 Series · 3 Tiers
${sep}

OPERATIVE PROFILE
${div}
  Full Name    :  ${GameState.playerName}
  Age          :  ${GameState.playerAge}
  Occupation   :  ${GameState.playerOccupation}
  Session Mode :  ${GameState.sessionMode.charAt(0).toUpperCase() + GameState.sessionMode.slice(1)}
  Session Date :  ${now.toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
  Session Time :  ${now.toLocaleTimeString('en-GB')}

SESSION PERFORMANCE
${div}
  Final XP           :  ${GameState.xp}
  Rank Achieved      :  ${rank.icon} ${rank.name}
  Accuracy           :  ${accuracy}%
  Total Scenarios    :  ${GameState.sessionScenarios.length}
  Correct Responses  :  ${GameState.sessionScenarios.length - GameState.mistakes.length}
  Incorrect          :  ${GameState.mistakes.length}
  Hints Used         :  ${GameState.hintsUsed}

RANK PROGRESSION REFERENCE
${div}
  🛡️  Cyber Novice      →    0 –  99 XP   Building foundational awareness
  ⚔️  Digital Defender  →  100 – 199 XP   Developing threat recognition
  🦅  Security Sentinel →  200+     XP   Advanced situational awareness

SERIES COVERAGE THIS SESSION
${div}
${seriesBreakdown || '  No series data recorded.'}

`;

  if (GameState.mistakes.length === 0) {
    report += `MISTAKE LOG
${div}
  ✓ PERFECT SESSION — No mistakes recorded.
    Outstanding threat detection across all scenarios.
`;
  } else {
    report += `MISTAKE LOG  (${GameState.mistakes.length} error(s) identified)
${div}
  Review these attack vectors to strengthen your security awareness.
`;
    GameState.mistakes.forEach((m, i) => {
      report += `
  [${i + 1}]  Scenario ID  :  #${m.scenarioId}
       Series       :  ${m.series}
       Attack Type  :  ${m.type}
       Your Answer  :  ${m.playerAnswer}
       Correct Resp :  ${m.correctAnswer}
`;
    });
  }

  report += `
ACADEMIC CONTEXT
${div}
  This report was generated by the Social Engineering Awareness Game,
  a final-year Computer Science project implementing Constructivist
  Learning Theory (Vygotsky, 1978; Bruner, 1960) through adaptive
  gamified cybersecurity training.

  The game presents 1,635 Nigerian-contextualised social engineering
  scenarios across 10 thematic series and 3 difficulty tiers:
  Phishing · Vishing · Smishing · Pretexting · Baiting

  Psychological manipulation principles mapped (Cialdini, 2006):
  Authority · Urgency · Scarcity · Social Proof · Fear ·
  Reciprocity · False Legitimacy · Curiosity · Greed

${sep}
Generated by SENTRY Social Engineering Awareness Game v2.0
Project: Social Engineering Awareness Training Game
Author:  Daniel Olubajo | Final Year | Computer Science
${sep}
`;

  const blob = new Blob([report.trimStart()], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `SEAG_Report_${GameState.playerName.replace(/\s+/g, '_')}_${now.toISOString().slice(0,10)}.txt`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 15: SCREEN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Activates a named screen and deactivates all others.
 * All screens must have class='screen' and id='screen-{name}'.
 *
 * Valid names: boot | registration | game | feedback | complete | leaderboard
 *
 * @param {string} name - Screen identifier
 */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`screen-${name}`);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  GameState.currentPhase = name;
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 16: LOCALSTORAGE PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persists critical session state to localStorage.
 * Allows the session to survive page refresh (demo resilience).
 *
 * Note: allScenarios and sessionScenarios are NOT persisted —
 * they are large and can be reconstructed from the data source.
 */
function saveToLocalStorage() {
  try {
    localStorage.setItem('seag_session_v2', JSON.stringify({
      playerName:       GameState.playerName,
      playerAge:        GameState.playerAge,
      playerOccupation: GameState.playerOccupation,
      sessionMode:      GameState.sessionMode,
      currentIndex:     GameState.currentIndex,
      xp:               GameState.xp,
      streak:           GameState.streak,
      mistakes:         GameState.mistakes,
      hintsUsed:        GameState.hintsUsed,
      seriesEncountered:GameState.seriesEncountered,
    }));
  } catch (e) {
    console.warn('[SENTRY] localStorage write failed.', e);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 17: UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a Promise that resolves after ms milliseconds. */
const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Fisher-Yates shuffle — returns a new shuffled array, original unchanged.
 * @param {any[]} arr
 * @returns {any[]}
 */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Displays a form validation error message. */
function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

/** Hides and clears all form error messages. */
function clearFormErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = ''; el.classList.add('hidden');
  });
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 18: EVENT LISTENERS & ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // ── Registration ──────────────────────────────────────────────────
  document.getElementById('reg-submit')
    .addEventListener('click', handleRegistration);

  ['reg-name','reg-age'].forEach(id =>
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleRegistration();
    })
  );

  // ── Game ──────────────────────────────────────────────────────────
  document.getElementById('hint-btn')
    .addEventListener('click', useHint);

  // ── Feedback ──────────────────────────────────────────────────────
  document.getElementById('next-btn')
    .addEventListener('click', nextScenario);

  // ── Completion ────────────────────────────────────────────────────
  document.getElementById('download-report-btn')
    .addEventListener('click', downloadReport);
  document.getElementById('play-again-btn')
    .addEventListener('click', () => showScreen('registration'));
  document.getElementById('leaderboard-btn')
    .addEventListener('click', renderLeaderboard);

  // ── Leaderboard ───────────────────────────────────────────────────
  document.getElementById('back-from-leaderboard-btn')
    .addEventListener('click', () => showScreen('complete'));
  document.getElementById('clear-leaderboard-btn')
    ?.addEventListener('click', () => {
      if (confirm('Clear all leaderboard data?')) clearLeaderboard();
    });

  // ── Start ─────────────────────────────────────────────────────────
  runBootSequence();
});


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 19: MESSAGE ANALYZER — SENTRY THREAT SCANNER
//  Two-mode engine:
//    1. Ollama (llama3.2 / mistral) via localhost:11434 — rich LLM analysis
//    2. JS Rule Engine fallback — Nigerian-contextualised pattern matching
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Three-tier config ─────────────────────────────────────────────────────
  // TIER 3 — Custom Nigerian fraud model (FastAPI server, fastest after L1)
  const MODEL_SERVER_BASE    = 'http://localhost:8765';
  const MODEL_SERVER_TIMEOUT = 4000;

  // TIER 2 — Ollama local LLM (deepest reasoning, ~2-15s)
  const OLLAMA_BASE     = 'http://localhost:11434';
  const OLLAMA_TIMEOUT  = 12000;
  const OLLAMA_MODELS   = ['llama3.2', 'llama3.2:1b', 'mistral', 'gemma3:1b', 'llama2'];

  // Borderline zone — if L1 score is in this range, L2/L3 are consulted
  const BORDERLINE_LOW  = 30;
  const BORDERLINE_HIGH = 70;

  // ── Nigerian-contextualised rule engine ───────────────────────────────────

  const URGENCY_PATTERNS = [
    // Bare "now"/"today" excluded — too common in legit messages
    /\b(urgent|urgently|immediately|asap|act\s*now|last\s*chance|limited\s*time|don['"\u2019]?t\s*delay|within\s*\d+\s*(hours?|minutes?|days?))\b/gi,
    /\b(24\s*hours?|48\s*hours?|72\s*hours?|1\s*hour)\b[^.!?]*\b(or|else|otherwise|face|risk|avoid|prevent|forfeited?|cancelled?|void|expire|lose|lost|invalid)\b/gi,
    /\b(expires?\s*(in|today|now|soon)|expiring\s*(in|today|now|soon))\b/gi,
    /\b(deadline\s*(is|of|by|before))/gi,
    /\b(will\s*be\s*(suspended|blocked|terminated|deactivated|closed|locked)|account\s*(suspend|block|lock|terminat)|suspend\s*your\s*account)\b/gi,
    /\b(verify\s*(now|immediately|today|your\s*(bvn|account|identity|details?))|update\s*your\s*(details?|info|bvn|nin|account)|confirm\s*(now|immediately))\b/gi,
  ];

  // Official Nigerian domains — NEVER flagged as suspicious
  const OFFICIAL_DOMAIN_RE = /(?:jamb\.gov\.ng|waecdirect\.org|waec\.org\.ng|nimc\.gov\.ng|nysc\.org\.ng|efcc\.gov\.ng|cbn\.gov\.ng|firs\.gov\.ng|ncc\.gov\.ng|nafdac\.gov\.ng|gtbank\.com|accessbankplc\.com|firstbanknigeria\.com|zenithbank\.com|ubagroup\.com|mtn\.ng|airtel\.com\.ng)/gi;

  const URL_PATTERNS = [
    // HTTP/HTTPS links that are NOT on the official whitelist
    /https?:\/\/(?!(?:www\.)?(?:jamb\.gov\.ng|waecdirect\.org|waec\.org\.ng|nimc\.gov\.ng|nysc\.org\.ng|efcc\.gov\.ng|cbn\.gov\.ng|firs\.gov\.ng|gtbank\.com|accessbankplc\.com|firstbanknigeria\.com|zenithbank\.com|ubagroup\.com|gtbank|accessbank|zenithbank|firstbank|uba|fidelitybank|stanbic|sterling|fcmb|coronation|ecobank)(?:\.com|\.ng|\.com\.ng|\.gov\.ng)?(?:\/|$))[^\s<>"()]+/gi,
    // Shortlink services — always suspicious
    /\b(?:bit\.ly|tinyurl|t\.co|goo\.gl|short\.ly|rb\.gy|is\.gd|ow\.ly|buff\.ly|cutt\.ly|tiny\.cc)[\/\w\-]+/gi,
    // Inline click-here + URL combos
    /(?:click\s*here|tap\s*here|login\s*(?:now|here)|verify\s*(?:here|now|link)|open\s*link)[^.]*http/gi,
  ];

  const BRAND_IMPERSONATION = {
    'Banking':    /\b(gtbank|guaranty\s*trust|access\s*bank|zenith|first\s*bank|uba|sterling|polaris|fidelity|stanbic|opay|palmpay|moniepoint|kuda|carbon|piggyvest|cowrywise|flutterwave|paystack)\b/gi,
    'Telecom':    /\b(mtn|airtel|glo|9mobile|etisalat)\b/gi,
    'Government': /\b(efcc|nimc|firs|cbn|sec|nafdac|nhis|nnpc|nysc|ippis|bvn|nin|tin|cac|ncc)\b/gi,
    'Platform':   /\b(jumia|konga|jiji|paystack|flutterwave|piggyvest|cowrywise|binance|luno|quidax|yellowcard)\b/gi,
    'Education':  /\b(jamb|waec|neco|nabteb|noun|unilag|ui|abu|oau|unn|covenant|babcock|lasu)\b/gi,
  };

  const MONEY_PATTERNS = [
    /(?:₦|NGN|naira)\s*[\d,]+/gi,
    /\b[\d,]+\s*(?:naira|NGN|₦)/gi,
    /\b(?:N|NGN)[\d,]{4,}/gi,
    // International currency — common in advance-fee / prize fraud
    /(?:\$|USD|GBP|£|EUR|€)\s*[\d,]+(?:\.\d{2})?/gi,
    /\b[\d,]+(?:\.\d{2})?\s*(?:dollars?|pounds?|euros?|USD|GBP|EUR)\b/gi,
    /\b(?:won|win|prize|reward|compensation|refund|bonus|lottery|giveaway|award)[^.]*(?:₦|\$|£|€|NGN|\d+[\d,]*)/gi,
    /\bfree\s*(?:data|airtime|credit|money|cash|transfer|recharge)\b/gi,
  ];

  const THREAT_PHRASES = [
    /\b(account\s*(?:will\s*be\s*)?(?:blocked|suspended|closed|terminated|frozen|deactivated))/gi,
    /\b(legal\s*(?:action|consequence|proceedings?)|prosecute|arrest|report\s*to\s*(?:efcc|police|authorities))\b/gi,
    /\b(password|pin|otp|cvv|card\s*number|account\s*(?:number|details?)|bvn|nin|login\s*details?)\b/gi,
    /\b(click\s*(?:the\s*)?(?:link|here|below)|tap\s*(?:the\s*)?(?:link|here|below)|open\s*(?:the\s*)?(?:link|attachment))\b/gi,
  ];

  const PSYCH_MAP = [
    { pattern: /\b(urgent|immediately|now|asap|expire|deadline|limited\s*time|24\s*hours?|act\s*now)\b/gi,      principle: 'Urgency',              weight: 3 },
    { pattern: /\b(authority|official|government|cbn|efcc|nimc|bank|security\s*team|technical\s*team)\b/gi,    principle: 'Authority',            weight: 3 },
    { pattern: /\b(suspend|block|terminate|freeze|legal|prosecute|report|arrested?)\b/gi,                      principle: 'Fear',                 weight: 3 },
    { pattern: /\b(won|win|prize|reward|lottery|giveaway|free|bonus|compensation|award|congratulation)\b/gi,    principle: 'Greed',                weight: 2 },
    { pattern: /\b(only\s*\d+|limited|last\s*chance|running\s*out|few\s*remaining|exclusive)\b/gi,              principle: 'Scarcity',             weight: 2 },
    { pattern: /\b(verify|confirm|update|validate|re-?activate|authenticate)\b/gi,                              principle: 'False Legitimacy',     weight: 2 },
    { pattern: /\b(as\s*many\s*as|thousands?|millions?\s*of\s*(?:customers?|users?|people)|most\s*users?)\b/gi, principle: 'Social Proof',         weight: 1 },
    { pattern: /\b(gift|offer|special\s*(?:offer|deal)|thank\s*you\s*for|appreciate\s*your\s*loyal)\b/gi,       principle: 'Reciprocity',          weight: 1 },
    { pattern: /\b(curiosity|discover|find\s*out|click\s*to\s*(?:learn|see|discover|reveal))\b/gi,              principle: 'Curiosity',            weight: 1 },
    { pattern: /\b(duty|obligation|responsibility|you\s*must|required\s*to|mandatory|compliance)\b/gi,           principle: 'Professional Obligation', weight: 2 },
  ];

  const ATTACK_TYPE_MAP = [
    { type: 'Phishing',   pattern: /\b(email|link|click|login|account\s*(?:verify|update)|http|\.com|\.net|\.org|portal|inbox)\b/gi },
    { type: 'Smishing',   pattern: /\b(sms|text\s*message|msg|mtn|airtel|glo|9mobile|sim|recharge|data|airtime)\b/gi },
    { type: 'Vishing',    pattern: /\b(call|phone|spoke|spoke\s*with|called|rang|caller|voice|calling|dial)\b/gi },
    { type: 'Pretexting', pattern: /\b(posing|impersonat|fake|pretend|acting\s*as|claiming\s*to\s*be|told\s*me|said\s*(?:they|he|she)\s*(?:was|were))\b/gi },
    { type: 'Baiting',    pattern: /\b(usb|device|found|left|plug|free\s*(?:download|software|tool|movie|music)|torrent|crack|keygen)\b/gi },
  ];

  // ── DOM refs ──────────────────────────────────────────────────────────────

  const $ = id => document.getElementById(id);

  let analyzerOriginScreen = 'registration';
  // Tier state
  let ollamaModel        = null;
  let ollamaAvailable    = false;
  let modelServerAvail   = false;   // Tier 3 custom model

  // ── Navigation hooks (injected after DOM ready) ───────────────────────────

  function initAnalyzer() {
    const textarea      = $('analyzer-textarea');
    const charCount     = $('analyzer-char-count');
    const scanBtn       = $('analyzer-scan-btn');
    const clearBtn      = $('analyzer-clear-btn');
    const backBtn       = $('analyzer-back-btn');
    const newBtn        = $('analyzer-new-btn');
    const scanning      = $('analyzer-scanning');
    const results       = $('analyzer-results');
    const regLaunch     = $('reg-analyzer-btn');
    const completeLaunch= $('complete-analyzer-btn');

    if (!textarea) return;

    // Char counter
    textarea.addEventListener('input', () => {
      const n = textarea.value.length;
      charCount.textContent = `${n.toLocaleString()} character${n !== 1 ? 's' : ''}`;
    });

    // Launch from registration
    if (regLaunch) regLaunch.addEventListener('click', () => {
      analyzerOriginScreen = 'registration';
      showScreen('analyzer');
      resetAnalyzer();
      probeAllTiers();
    });

    // Launch from complete screen
    if (completeLaunch) completeLaunch.addEventListener('click', () => {
      analyzerOriginScreen = 'complete';
      showScreen('analyzer');
      resetAnalyzer();
      probeAllTiers();
    });

    // Back
    backBtn.addEventListener('click', () => {
      showScreen(analyzerOriginScreen);
      resetAnalyzer();
    });

    // Analyse another
    newBtn.addEventListener('click', () => {
      resetAnalyzer();
      textarea.focus();
    });

    // Clear
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      charCount.textContent = '0 characters';
      textarea.focus();
    });

    // Scan
    scanBtn.addEventListener('click', () => {
      const text = textarea.value.trim();
      if (!text) {
        textarea.focus();
        textarea.style.borderColor = 'var(--accent-red)';
        setTimeout(() => { textarea.style.borderColor = ''; }, 1200);
        return;
      }
      runAnalysis(text);
    });

    // Also allow Ctrl+Enter to scan
    textarea.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') scanBtn.click();
    });

    // Probe all tiers on first open
    probeAllTiers();
  }

  // ── Ollama probe ──────────────────────────────────────────────────────────

  // ── Tier 3: probe custom model server ────────────────────────────────────

  async function probeModelServer() {
    modelServerAvail = false;
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), MODEL_SERVER_TIMEOUT);
      const res  = await fetch(`${MODEL_SERVER_BASE}/health`, { signal: ctrl.signal });
      if (!res.ok) throw new Error('non-200');
      const data = await res.json();
      modelServerAvail = data.model_loaded === true;
    } catch (_) {
      modelServerAvail = false;
    }
  }

  // ── Tier 2: probe Ollama ──────────────────────────────────────────────────

  let ollamaFailReason = null;  // 'cors' | 'not_running' | 'no_models' | null

  async function probeOllama() {
    ollamaAvailable = false;
    ollamaModel     = null;
    ollamaFailReason = null;

    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 5000);

      let res;
      try {
        res = await fetch(`${OLLAMA_BASE}/api/tags`, {
          signal: ctrl.signal,
          // Some browsers need explicit mode for localhost cross-origin
          mode: 'cors',
        });
      } catch (fetchErr) {
        clearTimeout(tid);
        // Distinguish CORS block from connection refused
        const msg = fetchErr.message || '';
        if (msg.includes('CORS') || msg.includes('cross-origin') ||
            msg.includes('Failed to fetch') || msg.includes('NetworkError') ||
            fetchErr.name === 'TypeError') {
          // Could be CORS or not-running — try a no-cors ping to tell the difference
          try {
            await fetch(`${OLLAMA_BASE}`, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(2000) });
            // If we get here without error, Ollama IS running but CORS is blocking JSON
            ollamaFailReason = 'cors';
          } catch (_) {
            ollamaFailReason = 'not_running';
          }
        } else if (fetchErr.name === 'AbortError') {
          ollamaFailReason = 'not_running';
        } else {
          ollamaFailReason = 'not_running';
        }
        return;
      }

      clearTimeout(tid);
      if (!res.ok) { ollamaFailReason = 'not_running'; return; }

      const data = await res.json();
      if (!data.models?.length) { ollamaFailReason = 'no_models'; return; }

      const available = data.models.map(m => m.name.split(':')[0]);
      for (const pref of OLLAMA_MODELS) {
        const base = pref.split(':')[0];
        if (available.includes(base)) {
          ollamaModel = data.models.find(m => m.name.split(':')[0] === base).name;
          ollamaAvailable = true; break;
        }
      }
      if (!ollamaAvailable) {
        ollamaModel = data.models[0].name;
        ollamaAvailable = true;
      }
    } catch (_) {
      ollamaFailReason = 'not_running';
    }
  }

  // Probe all tiers in parallel
  async function probeAllTiers() {
    renderModelStrip('checking');
    await Promise.all([probeModelServer(), probeOllama()]);
    renderModelStrip(currentTierLabel());
  }

  function currentTierLabel() {
    if (modelServerAvail && ollamaAvailable) return 'all3';
    if (modelServerAvail) return 'model3';
    if (ollamaAvailable)  return 'llama';
    return 'js';
  }

  function renderModelStrip(state) {
    let strip = document.getElementById('analyzer-model-strip');
    if (!strip) {
      strip = document.createElement('div');
      strip.id = 'analyzer-model-strip';
      strip.className = 'analyzer-model-strip';
      strip.style.flexDirection = 'column';
      strip.style.alignItems    = 'stretch';
      const inputPanel = document.querySelector('.analyzer-input-panel');
      if (inputPanel) inputPanel.parentNode.insertBefore(strip, inputPanel);
    }

    if (state === 'checking') {
      strip.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <span class="model-status-dot dot-blue"></span>
          <span>Probing local services — Tier 2 (Ollama) + Tier 3 (model server)...</span>
        </div>`;
      return;
    }

    const t3badge = modelServerAvail
      ? `<span class="llama-badge">🤖 T3: SENTRY MODEL</span>`
      : `<span class="llama-badge offline">T3: offline</span>`;
    const t2badge = ollamaAvailable
      ? `<span class="llama-badge">🦙 T2: ${ollamaModel}</span>`
      : `<span class="llama-badge offline">T2: offline</span>`;
    const t1badge = `<span class="llama-badge offline" style="border-color:rgba(56,189,248,0.4);color:var(--accent-blue)">⚙ T1: JS ENGINE ✓</span>`;

    const retryBtn = `<button onclick="window._sentryRetryProbe()" style="
      font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.1em;font-weight:700;
      padding:3px 10px;border-radius:3px;border:1px solid rgba(56,189,248,0.35);
      color:var(--accent-blue);background:transparent;cursor:pointer;
      transition:all 0.2s;text-transform:uppercase;white-space:nowrap;
    " onmouseover="this.style.background='rgba(56,189,248,0.08)'"
       onmouseout="this.style.background='transparent'">↺ Retry</button>`;

    let fixHtml = '';

    // Show fix panel if Ollama is offline
    if (!ollamaAvailable) {
      const fixes = {
        cors: {
          icon: '🔒',
          title: 'CORS blocked — Ollama is running but the browser is blocking it',
          steps: [
            'Stop Ollama (system tray → Quit, or Ctrl+C in terminal)',
            'Open PowerShell and run:',
            '<code style="display:block;background:rgba(0,0,0,0.4);padding:5px 8px;border-radius:3px;font-size:0.72rem;margin:4px 0;color:var(--accent-green);font-family:var(--font-mono)">$env:OLLAMA_ORIGINS="*"<br>ollama serve</code>',
            'Leave that terminal open, then click Retry above',
            '<em style="color:var(--text-muted);font-size:0.7rem">Or serve the game via: python -m http.server 8080</em>',
          ]
        },
        not_running: {
          icon: '⚡',
          title: 'Ollama not detected on localhost:11434',
          steps: [
            'Check if Ollama is in your system tray — if yes, it may still be loading',
            'Or open a new PowerShell window and run:',
            '<code style="display:block;background:rgba(0,0,0,0.4);padding:5px 8px;border-radius:3px;font-size:0.72rem;margin:4px 0;color:var(--accent-green);font-family:var(--font-mono)">$env:OLLAMA_ORIGINS="*"<br>ollama serve</code>',
            'If not installed: <a href="https://ollama.ai/download" target="_blank" style="color:var(--accent-blue)">ollama.ai/download</a> → Windows installer',
            'Once running, click Retry above',
          ]
        },
        no_models: {
          icon: '📦',
          title: 'Ollama is running but no models are installed',
          steps: [
            'Open PowerShell and pull a model:',
            '<code style="display:block;background:rgba(0,0,0,0.4);padding:5px 8px;border-radius:3px;font-size:0.72rem;margin:4px 0;color:var(--accent-green);font-family:var(--font-mono)">ollama pull llama3.2</code>',
            'That downloads ~2GB — wait for it to complete, then click Retry',
            'Smaller option (800MB): <code style="font-size:0.72rem;color:var(--accent-green)">ollama pull llama3.2:1b</code>',
          ]
        },
      };

      const fix = fixes[ollamaFailReason] || fixes['not_running'];
      const stepsHtml = fix.steps.map(s =>
        `<li style="margin-bottom:5px;color:var(--text-secondary)">${s}</li>`
      ).join('');

      fixHtml = `
        <div id="ollama-fix-panel" style="
          margin-top:10px;padding:12px;border-radius:4px;
          border:1px solid rgba(245,158,11,0.2);
          background:rgba(245,158,11,0.04);
        ">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:1rem">${fix.icon}</span>
            <span style="font-family:var(--font-ui);font-size:0.68rem;font-weight:700;
              letter-spacing:0.08em;color:var(--accent-amber);text-transform:uppercase">
              ${fix.title}
            </span>
          </div>
          <ol style="margin:0;padding-left:18px;font-family:var(--font-mono);font-size:0.73rem;line-height:1.7">
            ${stepsHtml}
          </ol>
        </div>`;
    }

    // Show fix for model server too if offline
    let modelFix = '';
    if (!modelServerAvail) {
      modelFix = `
        <div style="margin-top:6px;font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);
          padding:6px 8px;border-radius:3px;border:1px solid rgba(56,189,248,0.08)">
          T3 offline — run in a second terminal:
          <code style="display:block;margin-top:4px;color:var(--accent-blue);font-size:0.72rem">python model_server.py</code>
        </div>`;
    }

    strip.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="font-size:0.62rem;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase">DETECTION TIERS</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${t3badge}${t2badge}${t1badge}${retryBtn}</div>
      </div>
      ${fixHtml}
      ${modelFix}`;
  }

  // Expose retry to inline onclick
  window._sentryRetryProbe = async () => {
    renderModelStrip('checking');
    await Promise.all([probeModelServer(), probeOllama()]);
    renderModelStrip(currentTierLabel());
  };

  // ── Main analysis router — 3-tier cascade ─────────────────────────────────
  //
  //  Always:  L1 (JS engine) runs immediately for instant baseline
  //  Then:    L3 (custom model) called if available — highest precision
  //           L2 (Ollama) called if: L3 unavailable OR result is borderline
  //  Result:  highest-tier available result wins; lower tiers provide context

  async function runAnalysis(text) {
    const scanning = $('analyzer-scanning');
    const results  = $('analyzer-results');
    const newBtn   = $('analyzer-new-btn');
    const scanBtn  = $('analyzer-scan-btn');

    scanning.classList.remove('hidden');
    results.classList.add('hidden');
    newBtn.classList.add('hidden');
    scanBtn.disabled = true;

    // ── TIER 1 always runs first (instant, no async) ──────────────────────
    resetScanBars();
    updateScanStatus('T1 rule engine scanning...', 1);
    const l1 = await runJSAnalysisInternal(text);

    const borderline = l1.confidence >= BORDERLINE_LOW && l1.confidence <= BORDERLINE_HIGH;

    // ── TIER 3 — custom model (fast, ~50ms) ───────────────────────────────
    let finalResult = l1;
    let tier        = 'L1';

    if (modelServerAvail) {
      updateScanStatus('T3 custom model predicting...', 3);
      const l3 = await runModelServerAnalysis(text, l1);
      if (l3) { finalResult = l3; tier = 'L3'; }
    }

    // ── TIER 2 — Ollama LLM (if T3 unavailable OR borderline) ────────────
    if (ollamaAvailable && (!modelServerAvail || borderline)) {
      updateScanStatus(`T2 ${ollamaModel} reasoning...`, 2);
      const l2 = await runOllamaAnalysis(text, finalResult);
      if (l2) { finalResult = l2; tier = modelServerAvail ? 'L2+L3' : 'L2'; }
    }

    finalResult._tier = tier;
    renderResults(finalResult, tierToSource(tier), text);

    scanning.classList.add('hidden');
    results.classList.remove('hidden');
    newBtn.classList.remove('hidden');
    scanBtn.disabled = false;
  }

  function updateScanStatus(msg, activeTier) {
    const el = $('scan-status-text');
    if (el) el.textContent = msg;
    // Animate tier bars
    ['t1','t2','t3'].forEach((t, i) => {
      const bar = $(`scan-bar-${t}`);
      if (!bar) return;
      const tierNum = i + 1;
      if (activeTier === tierNum) {
        bar.classList.add('active');
      } else if (activeTier > tierNum) {
        bar.classList.remove('active');
        bar.style.width = '100%';
        bar.style.marginLeft = '0';
        bar.style.transition = 'width 0.4s ease';
      } else {
        bar.classList.remove('active');
        bar.style.width = '0%';
      }
    });
  }

  function resetScanBars() {
    ['t1','t2','t3'].forEach(t => {
      const bar = $(`scan-bar-${t}`);
      if (bar) { bar.classList.remove('active'); bar.style.width='0%'; bar.style.marginLeft='0'; }
    });
  }

  function tierToSource(tier) {
    if (tier.includes('L3')) return 'model';
    if (tier.includes('L2')) return 'llm';
    return 'js';
  }

  // ── Tier 3: call custom model server ─────────────────────────────────────

  async function runModelServerAnalysis(text, l1Fallback) {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), MODEL_SERVER_TIMEOUT);
      const res = await fetch(`${MODEL_SERVER_BASE}/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  ctrl.signal,
        body:    JSON.stringify({ text, top_features: true }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const d = await res.json();

      // Blend L3 verdict with L1 red flags (L3 doesn't generate those)
      return {
        verdict:          d.verdict,
        confidence:       d.confidence,
        attack_type:      l1Fallback.attack_type || 'Unknown',
        risk_level:       d.risk_level,
        red_flags:        l1Fallback.red_flags || [],
        psych_principles: l1Fallback.psych_principles || [],
        recommendation:   buildRecommendation(d.verdict, l1Fallback.red_flags || [], l1Fallback.attack_type),
        highlighted_phrases: l1Fallback.highlighted_phrases || [],
        _model_features:  d.top_features || [],
        _latency_ms:      d.latency_ms,
      };
    } catch (e) {
      console.warn('T3 model server failed:', e.message);
      modelServerAvail = false;
      renderModelStrip(currentTierLabel());
      return null;
    }
  }

  // ── Scan status ticker ────────────────────────────────────────────────────

  function tickStatus(steps, intervalMs = 500) {
    const el = $('scan-status-text');
    let i = 0;
    el.textContent = steps[0];
    const tid = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      el.textContent = steps[i];
      if (i === steps.length - 1) clearInterval(tid);
    }, intervalMs);
    return tid;
  }

  // ── Ollama LLM analysis ───────────────────────────────────────────────────

  async function runOllamaAnalysis(text, l1Fallback = {}) {
    const ticker = tickStatus([
      'Routing to Ollama LLM engine...',
      `Loading ${ollamaModel}...`,
      'Analysing threat indicators...',
      'Extracting manipulation vectors...',
      'Generating SENTRY assessment...',
    ], 700);

    const prompt = `You are SENTRY, an expert cybersecurity analyst specialising in Nigerian social engineering fraud. 
Analyse the following message and respond ONLY with a valid JSON object, no markdown, no preamble.

Message:
"""
${text.slice(0, 1800)}
"""

Required JSON structure:
{
  "verdict": "FRAUD" | "SUSPICIOUS" | "LEGITIMATE",
  "confidence": <integer 0-100>,
  "attack_type": "Phishing" | "Smishing" | "Vishing" | "Pretexting" | "Baiting" | "Unknown",
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "red_flags": [
    { "severity": "HIGH" | "MEDIUM" | "LOW", "title": "<short title>", "description": "<1 sentence explanation>" }
  ],
  "psych_principles": ["Urgency", "Authority", "Fear", ...],
  "recommendation": "<2-3 sentence actionable advice for a Nigerian user>",
  "highlighted_phrases": [
    { "phrase": "<exact phrase from text>", "category": "urgent" | "url" | "brand" | "money" | "threat" }
  ]
}

Nigerian context: BVN=Bank Verification Number, NIN=National Identity Number, EFCC=anti-fraud agency, 
GTBank/Access/UBA/Zenith/First Bank=Nigerian banks, MTN/Airtel/Glo/9mobile=Nigerian telcos,
JAMB/WAEC=exam bodies, NYSC=National Youth Service Corps, Naira/NGN/₦=currency.`;

    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), OLLAMA_TIMEOUT);

      const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  ctrl.signal,
        body: JSON.stringify({
          model:  ollamaModel,
          prompt: prompt,
          stream: false,
          options: { temperature: 0.1, num_predict: 900 },
        }),
      });
      clearTimeout(tid);
      clearInterval(ticker);

      if (!res.ok) throw new Error(`Ollama ${res.status}`);
      const data = await res.json();
      const raw  = (data.response || '').trim();

      // Strip possible markdown fences
      const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const parsed  = JSON.parse(jsonStr);

      // Merge L1 red_flags into LLM result if LLM omitted them
      if ((!parsed.red_flags || !parsed.red_flags.length) && l1Fallback.red_flags) {
        parsed.red_flags = l1Fallback.red_flags;
      }
      if (!parsed.highlighted_phrases?.length && l1Fallback.highlighted_phrases) {
        parsed.highlighted_phrases = l1Fallback.highlighted_phrases;
      }
      renderResults(parsed, 'llm', text);
    } catch (err) {
      clearInterval(ticker);
      console.warn('Ollama failed, falling back to JS engine:', err.message);
      ollamaAvailable = false;
      renderModelStrip(currentTierLabel());
      // Fall through — L1 result already shown
    }
  }

  // ── JS rule engine analysis ───────────────────────────────────────────────

  // ── Safety signals — these REDUCE fraud score ────────────────────────────
  // Key insight: real bank messages redirect you to channels THEY DON'T PROVIDE.
  // Fraud always gives you the link/number inline and demands you use it.
  // Legit messages say "call the number on your card" or "visit our official app".

  const SAFETY_PATTERNS = [
    // Redirects to card/official channel — hallmark of legitimate alerts
    { pattern: /(number\s*on\s*(?:the\s*)?(?:back\s*of\s*)?your\s*(?:card|debit|credit)|back\s*of\s*your\s*(?:card|debit))/gi,   weight: 25, label: 'Official card reference' },
    // Named official hotlines with Nigerian format (0700-xxx, 0800-xxx)
    { pattern: /0[78]00[\s\-]\d{3}[\s\-]\d{4}/gi,                                                                                  weight: 18, label: 'Official helpline number' },
    // Redirects to official app — not a link
    { pattern: /((?:mobile\s*)?app|internet\s*banking|ussd|dial\s*\*\d+\*?\d*#)/gi,                                                weight: 12, label: 'Official app/USSD redirect' },
    // Standard legit debit/credit alert format (time + merchant — no link)
    { pattern: /(debited|credited|debit\s*of|credit\s*of)[^.]*(at|from|to)[^.]*\d{1,2}[:\.]\d{2}/gi,                     weight: 20, label: 'Transaction alert format' },
    // Explicit warnings NOT to share credentials — legitimate institutions say this
    { pattern: /(do\s*not\s*share|never\s*share|we\s*(?:will\s*)?never\s*ask\s*(?:for\s*)?(?:your\s*)?(?:pin|otp|password|bvn|nin))/gi, weight: 22, label: 'Anti-fraud disclaimer' },
    // Redirects to official website by typing it directly
    { pattern: /(type|visit|go\s*to|log\s*(?:in\s*)?(?:to|at))[^.]*(app|portal|website)/gi,                                  weight: 10, label: 'Official portal redirect' },
    // Nigerian official govt/regulatory domains
    { pattern: /(?:jamb|waec|nimc|nysc|efcc|cbn|firs)\.(?:gov\.ng|gov|org\.ng|ng)/gi,                                             weight: 15, label: 'Official .gov.ng domain' },
    // "If not you" pattern — standard bank alert language, not a demand
    { pattern: /if\s*(?:this\s*was\s*)?not\s*you/gi,                                                                                weight: 10, label: 'Standard alert disclaimer' },
    // OTP "do not share" — legitimate OTP messages always say this
    { pattern: /(?:do\s*not|never)\s*share\s*(?:this|your)\s*(?:code|otp|pin)/gi,                                                  weight: 20, label: 'OTP security warning' },
  ];

  // Additional fraud amplifiers — signals that ONLY appear in fraud
  const FRAUD_AMPLIFIERS = [
    // Gives you a link/number AND demands you use it — the fraud pattern
    { pattern: /(?:https?:\/\/\S+|bit\.ly\/\S+)[^.]*(?:now|immediately|urgently)/gi,                                                    weight: 20, label: 'Inline link + urgency' },
    // Asks you to reply/respond with credentials
    { pattern: /(?:reply|respond|text\s*back|send\s*(?:us|back))[^.]*(?:bvn|nin|otp|pin|password|account\s*number)/gi,         weight: 30, label: 'Reply-with-credentials demand' },
    // Unsolicited prize/reward + action required
    { pattern: /(?:won|win|awarded|selected|chosen)[^.]*(?:click|call|whatsapp|send|verify|claim)/gi,                           weight: 25, label: 'Prize + action demand' },
    // Prize/lottery + personal info request — classic advance-fee / 419 pattern
    { pattern: /\b(?:prize|reward|lottery|won|winner|selected|congratulations?)\b[^.!?]*\b(?:full\s*name|address|phone|details?|reply\s*with|send\s*(?:us|your))\b/gi, weight: 35, label: 'Prize + personal info harvest' },
    // Unsolicited selection claim
    { pattern: /\b(?:randomly\s*selected|been\s*(?:selected|chosen)|you\s*(?:have\s*)?won|you\s*(?:are\s*(?:a\s*)?)(?:winner|lucky))\b/gi, weight: 20, label: 'Unsolicited selection claim' },
    // Reply-to-claim + deadline — hallmark of advance-fee
    { pattern: /\b(?:reply|respond|contact|email\s*us)\b[^.!?]*\b(?:within|before|by)\b[^.!?]*\b(?:hours?|days?)\b/gi, weight: 25, label: 'Reply deadline demand' },
    // Lookalike domains — contains brand name but wrong TLD/subdomain
    { pattern: /https?:\/\/(?!(?:www\.)?(?:gtbank|accessbankplc|firstbanknigeria|ubagroup|zenithbank|mtn|airtel)\.(?:com|ng|com\.ng))\S*(?:gtbank|access|zenith|firstbank|uba|mtn|airtel)\S*/gi, weight: 35, label: 'Lookalike domain' },
    // Escrow / government account transfer demand
    { pattern: /(?:transfer|move|send)[^.]*(?:escrow|safe(?:ty)?\s*account|government\s*account|holding\s*account)/gi,          weight: 40, label: 'Escrow transfer demand' },
    // "Your BVN/NIN/account has been flagged/flagged" + action in same message
    { pattern: /(?:bvn|nin|account)[^.]*(?:flagged|suspended|compromised|breached)[^.]*(?:click|verify|call|update|login)/gi, weight: 30, label: 'Credential flag + action' },
  ];

  async function runJSAnalysisInternal(text) {
    const ticker = tickStatus([
      'Initialising rule engine...',
      'Scanning urgency signals...',
      'Checking URL patterns...',
      'Analysing safety signals...',
      'Scoring psychological vectors...',
      'Computing threat confidence...',
    ], 400);

    await new Promise(r => setTimeout(r, 2400));
    clearInterval(ticker);

    const flags        = [];
    const safetyFlags  = [];   // positive signals logged separately
    const psychHits    = new Set();
    let   urgencyScore = 0;
    let   urlScore     = 0;
    let   brandScore   = 0;
    let   moneyScore   = 0;
    let   threatScore  = 0;
    let   safetyScore  = 0;    // subtracts from rawScore
    let   ampScore     = 0;    // fraud amplifier bonus

    // ── Positive safety signals (reduce score) ───────────────────────────
    for (const { pattern, weight, label } of SAFETY_PATTERNS) {
      if (pattern.test(text)) {
        safetyScore += weight;
        safetyFlags.push(label);
      }
      pattern.lastIndex = 0;
    }

    // ── Fraud amplifiers (boost score) ───────────────────────────────────
    for (const { pattern, weight, label } of FRAUD_AMPLIFIERS) {
      if (pattern.test(text)) { ampScore += weight; }
      pattern.lastIndex = 0;
    }

    // ── Urgency ──────────────────────────────────────────────────────────
    const urgencyMatches = collectMatches(text, URGENCY_PATTERNS);
    if (urgencyMatches.length) {
      // Dampen urgency if safety signals are present — real alerts can say "immediately"
      urgencyScore = safetyScore > 20
        ? Math.min(urgencyMatches.length * 3, 12)   // dampened
        : Math.min(urgencyMatches.length * 8, 35);  // full weight
      flags.push({ severity: urgencyScore > 15 ? 'HIGH' : 'LOW',
        title: 'Urgency Language',
        description: `Detected urgency phrase(s): "${urgencyMatches.slice(0,3).join('", "')}"${safetyScore > 20 ? ' — dampened by safety signals.' : ''}` });
      psychHits.add('Urgency');
    }

    // ── URLs ─────────────────────────────────────────────────────────────
    const urlMatches = collectMatches(text, URL_PATTERNS);
    if (urlMatches.length) {
      urlScore = 30;
      flags.push({ severity: 'HIGH', title: 'Suspicious Links Detected',
        description: `Found ${urlMatches.length} inline link(s). Legitimate banks never send login links via SMS/email.` });
    }

    // ── Brand mention ─────────────────────────────────────────────────────
    // Only flag brand if NO safety signals — brand alone in a real alert is fine
    const brandHits = [];
    for (const [cat, pattern] of Object.entries(BRAND_IMPERSONATION)) {
      const m = text.match(pattern);
      if (m) { brandHits.push(...m.map(x => `${x} (${cat})`)); }
      pattern.lastIndex = 0;
    }
    if (brandHits.length) {
      if (safetyScore > 15) {
        // Brand present + safety signals = likely legitimate alert
        flags.push({ severity: 'LOW', title: 'Brand Reference (likely legitimate)',
          description: `References ${[...new Set(brandHits)].slice(0,3).join(', ')}. Safety signals suggest this is a genuine alert — verify via official app.` });
        brandScore = 5;  // minimal score — brand alone isn't suspicious here
      } else {
        flags.push({ severity: 'MEDIUM', title: 'Brand/Institution Impersonation Risk',
          description: `References: ${[...new Set(brandHits)].slice(0,4).join(', ')}. No safety signals detected — treat with caution.` });
        brandScore = Math.min(brandHits.length * 12, 25);
        psychHits.add('Authority');
        psychHits.add('False Legitimacy');
      }
    }

    // ── Money ────────────────────────────────────────────────────────────
    const moneyMatches = collectMatches(text, MONEY_PATTERNS);
    if (moneyMatches.length) {
      // In a legit debit alert, money mention is expected — only suspicious without safety signals
      moneyScore = safetyScore > 15 ? 5 : 15;
      if (moneyScore > 5) {
        flags.push({ severity: 'MEDIUM', title: 'Financial Lure Detected',
          description: `Money-related language: "${moneyMatches.slice(0,2).join('", "')}"` });
        psychHits.add('Greed');
      }
    }

    // ── Threats / credential requests ────────────────────────────────────
    const threatMatches = collectMatches(text, THREAT_PHRASES);
    if (threatMatches.length) {
      threatScore = Math.min(threatMatches.length * 7, 28);
      const hasCredReq = threatMatches.some(m => /password|pin|otp|cvv|bvn|nin/.test(m.toLowerCase()));
      if (hasCredReq) {
        // If message ALSO has "do not share" — that's a safety signal, not a request
        const hasAntiShare = SAFETY_PATTERNS[8].pattern.test(text);
        SAFETY_PATTERNS[8].pattern.lastIndex = 0;
        if (!hasAntiShare) {
          flags.push({ severity: 'HIGH', title: 'Credential Harvesting Attempt',
            description: 'Message requests sensitive credentials (OTP, PIN, BVN, NIN, CVV). Legitimate institutions never ask for these.' });
          threatScore += 15;
        } else {
          flags.push({ severity: 'LOW', title: 'Credential Mention (with disclaimer)',
            description: 'Message mentions credentials alongside a "do not share" warning — consistent with a legitimate OTP delivery.' });
          threatScore = 0;
        }
      } else {
        flags.push({ severity: 'HIGH', title: 'Threatening / Coercive Language',
          description: `Coercive phrases detected: "${threatMatches.slice(0,2).join('", "')}"` });
      }
      if (threatScore > 0) psychHits.add('Fear');
    }

    // ── Psych principles ──────────────────────────────────────────────────
    for (const { pattern, principle } of PSYCH_MAP) {
      if (pattern.test(text)) { psychHits.add(principle); }
      pattern.lastIndex = 0;
    }

    // ── Attack type ───────────────────────────────────────────────────────
    // Improved: debit/credit transaction alerts are not Vishing
    let attackType = 'Unknown';
    if (/(debited|credited|transaction\s*alert|debit\s*of|credit\s*of)/i.test(text) && safetyScore > 10) {
      attackType = 'Phishing';  // best fit — or just leave as alert
    } else {
      let bestAtk = 0;
      for (const { type, pattern } of ATTACK_TYPE_MAP) {
        const m = text.match(pattern);
        if (m && m.length > bestAtk) { bestAtk = m.length; attackType = type; }
        pattern.lastIndex = 0;
      }
    }

    // ── Final score ───────────────────────────────────────────────────────
    // rawScore = (fraud signals + amplifiers) - safety discount
    // Safety discount capped at 40 so a very safe message doesn't go negative
    const rawScore   = urgencyScore + urlScore + brandScore + moneyScore + threatScore + ampScore;
    const safetyDiscount = Math.min(safetyScore, 40);
    const adjusted   = Math.max(0, rawScore - safetyDiscount);
    const confidence = Math.min(Math.round(adjusted), 99);

    let verdict, riskLevel;
    if (confidence >= 65)      { verdict = 'FRAUD';      riskLevel = confidence >= 80 ? 'CRITICAL' : 'HIGH'; }
    else if (confidence >= 35) { verdict = 'SUSPICIOUS'; riskLevel = 'MEDIUM'; }
    else                        { verdict = 'LEGITIMATE'; riskLevel = 'LOW'; }

    // Append safety note if signals were found
    if (safetyScore > 15 && verdict !== 'FRAUD') {
      flags.push({ severity: 'LOW', title: '✅ Safety Signals Detected',
        description: `Found: ${safetyFlags.join(', ')}. These reduce fraud likelihood significantly.` });
    }

    const rec = buildRecommendation(verdict, flags, attackType);
    const highlighted = buildHighlights(text);

    return {
      verdict, confidence, attack_type: attackType,
      risk_level: riskLevel, red_flags: flags,
      psych_principles: [...psychHits],
      recommendation: rec,
      highlighted_phrases: highlighted,
      _safety_score: safetyScore,
      _raw_score: rawScore,
    };
  }

  function collectMatches(text, patterns) {
    const hits = [];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) hits.push(...m);
      p.lastIndex = 0;
    }
    return [...new Set(hits)];
  }

  function buildHighlights(text) {
    const highlights = [];
    const addHits = (patterns, category) => {
      for (const p of patterns) {
        const m = text.match(p);
        if (m) m.forEach(phrase => highlights.push({ phrase, category }));
        p.lastIndex = 0;
      }
    };
    addHits(URGENCY_PATTERNS, 'urgent');
    addHits(URL_PATTERNS,     'url');
    addHits(MONEY_PATTERNS,   'money');
    addHits(THREAT_PHRASES,   'threat');
    for (const [, p] of Object.entries(BRAND_IMPERSONATION)) {
      const m = text.match(p);
      if (m) m.forEach(ph => highlights.push({ phrase: ph, category: 'brand' }));
      p.lastIndex = 0;
    }
    return highlights;
  }

  function buildRecommendation(verdict, flags, attackType) {
    const credFlag    = flags.some(f => f.title.includes('Credential'));
    const prizeFlag   = flags.some(f => f.title.includes('Prize') || f.title.includes('personal info'));
    const feeFlag     = flags.some(f => f.title.includes('processing fee') || f.title.includes('fee'));
    const highCount   = flags.filter(f => f.severity === 'HIGH').length;
    const personalFlag = flags.some(f => f.title.toLowerCase().includes('personal info') || f.title.toLowerCase().includes('harvesting'));

    // Override: if high-severity flags exist even at SUSPICIOUS/LEGITIMATE verdict
    const effectiveVerdict = (highCount >= 2 || prizeFlag || feeFlag) ? 'FRAUD' : verdict;

    if (effectiveVerdict === 'FRAUD') {
      if (prizeFlag || personalFlag) {
        return `This is a prize/lottery scam (419 fraud). DO NOT reply with any personal details — your name, address, and phone number will be sold or used for further targeting. No legitimate organisation distributes prizes via unsolicited email. Delete immediately.`;
      }
      if (feeFlag) {
        return `This is an advance-fee fraud. Any "processing fee" or "transfer fee" requested upfront is the scam — no prize or payment will ever arrive after you pay. Block the sender and report to the EFCC Cybercrime Unit at efcc.gov.ng.`;
      }
      if (credFlag) {
        return `DO NOT provide any credentials, OTP, PIN, BVN, or NIN. This is a ${attackType} attack. Delete immediately and report to your bank's fraud line or the EFCC Cybercrime Unit.`;
      }
      return `This message exhibits multiple high-severity fraud indicators consistent with ${attackType}. Do not click any links, call back any number provided, or take any action requested. Report to relevant authorities.`;
    }
    if (effectiveVerdict === 'SUSPICIOUS') {
      return `This message contains suspicious patterns. Verify the sender's identity independently — use an official number or website you already know, not one provided in this message.`;
    }
    // LEGITIMATE — but only say "no indicators" if there are truly zero flags
    if (flags.length === 0) {
      return `No fraud indicators detected. Always remain cautious and verify unexpected requests through official channels.`;
    }
    return `Low fraud probability, but some patterns were noted. If you did not initiate contact with this sender, treat with caution and verify through official channels before taking any action.`;
  }

  // ── Render results ────────────────────────────────────────────────────────

  function renderResults(data, source, originalText) {
    const { verdict, confidence, attack_type, risk_level,
            red_flags, psych_principles, recommendation, highlighted_phrases } = data;

    // Verdict badge
    const badge = $('analyzer-verdict-badge');
    const icons = { FRAUD: '🚨', SUSPICIOUS: '⚠️', LEGITIMATE: '✅' };
    badge.className = `analyzer-verdict-badge verdict-${verdict.toLowerCase()}`;
    $('analyzer-verdict-icon').textContent  = icons[verdict] || '?';
    $('analyzer-verdict-label').textContent = verdict;

    // Confidence bar
    const fill = $('conf-bar-fill');
    fill.style.width = `${Math.min(confidence, 100)}%`;
    fill.className   = 'conf-bar-fill ' + (verdict === 'FRAUD' ? 'fill-red' : verdict === 'SUSPICIOUS' ? 'fill-amber' : 'fill-green');
    $('conf-pct').textContent = `${confidence}%`;

    // Stats
    $('astat-type').textContent       = attack_type || 'Unknown';
    $('astat-flags').textContent      = (red_flags || []).length;
    $('astat-principles').textContent = (psych_principles || []).length;
    const riskEl = $('astat-risk');
    riskEl.textContent = risk_level || 'LOW';
    const riskColour = { CRITICAL: 'var(--accent-red)', HIGH: 'var(--accent-red)', MEDIUM: 'var(--accent-amber)', LOW: 'var(--accent-green)' };
    riskEl.style.color = riskColour[risk_level] || 'var(--accent-green)';

    // Red flags
    const flagsList = $('analyzer-flags-list');
    if (red_flags && red_flags.length) {
      flagsList.innerHTML = red_flags.map((f, i) => {
        const cls = f.severity === 'HIGH' ? 'flag-high' : f.severity === 'MEDIUM' ? 'flag-med' : 'flag-low';
        const ico = f.severity === 'HIGH' ? '🔴' : f.severity === 'MEDIUM' ? '🟡' : '🔵';
        return `<div class="analyzer-flag-item ${cls}" style="animation-delay:${i * 0.07}s">
          <span class="flag-icon">${ico}</span>
          <div class="flag-content">
            <span class="flag-title">${escHTML(f.title)}</span>
            <span class="flag-desc">${escHTML(f.description)}</span>
          </div>
        </div>`;
      }).join('');
    } else {
      flagsList.innerHTML = '<div class="analyzer-no-flags">✅ No red flags detected</div>';
    }

    // Annotated text
    const annotated = $('analyzer-annotated-text');
    annotated.innerHTML = buildAnnotatedHTML(originalText, highlighted_phrases || []);

    // Psych pills
    const pillsEl = $('analyzer-psych-pills');
    if (psych_principles && psych_principles.length) {
      pillsEl.innerHTML = psych_principles.map((p, i) =>
        `<span class="psych-pill" style="animation-delay:${i * 0.06}s">${escHTML(p)}</span>`
      ).join('');
    } else {
      pillsEl.innerHTML = '<span style="font-family:var(--font-ui);font-size:0.75rem;color:var(--text-muted);">None detected</span>';
    }

    // Recommendation
    $('analyzer-rec-text').textContent = recommendation || 'Analysis complete.';

    // Source badge in model strip
    renderModelStrip(source === 'llm' ? 'llama' : 'js');
  }

  function buildAnnotatedHTML(text, highlights) {
    if (!highlights || !highlights.length) return escHTML(text);

    const catClass = { urgent: 'hl-urgent', url: 'hl-url', brand: 'hl-brand', money: 'hl-money', threat: 'hl-threat' };

    // Sort by length descending to avoid partial matches overriding longer ones
    const sorted = [...highlights].sort((a, b) => b.phrase.length - a.phrase.length);
    const seen   = new Set();

    // Build a list of [start, end, cls] ranges
    const ranges = [];
    for (const { phrase, category } of sorted) {
      if (!phrase || seen.has(phrase.toLowerCase())) continue;
      seen.add(phrase.toLowerCase());
      const cls = catClass[category] || '';
      let idx = 0;
      const re = new RegExp(escRegex(phrase), 'gi');
      let match;
      while ((match = re.exec(text)) !== null) {
        ranges.push({ start: match.index, end: match.index + match[0].length, cls, phrase: match[0] });
      }
    }

    // Sort ranges by start position
    ranges.sort((a, b) => a.start - b.start);

    // Build HTML with no overlapping spans
    let html = '', pos = 0;
    for (const r of ranges) {
      if (r.start < pos) continue; // skip overlap
      html += escHTML(text.slice(pos, r.start));
      html += `<mark class="${r.cls}">${escHTML(r.phrase)}</mark>`;
      pos = r.end;
    }
    html += escHTML(text.slice(pos));
    return html;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function resetAnalyzer() {
    const textarea = $('analyzer-textarea');
    if (textarea) { textarea.value = ''; }
    const charCount = $('analyzer-char-count');
    if (charCount) charCount.textContent = '0 characters';

    const scanning = $('analyzer-scanning');
    const results  = $('analyzer-results');
    const newBtn   = $('analyzer-new-btn');
    const scanBtn  = $('analyzer-scan-btn');
    if (scanning) scanning.classList.add('hidden');
    if (results)  results.classList.add('hidden');
    if (newBtn)   newBtn.classList.add('hidden');
    if (scanBtn)  scanBtn.disabled = false;
    $('scan-status-text').textContent = 'Initialising threat detection...';
  }

  function escHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ── Boot hook — wait for DOMContentLoaded ────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalyzer);
  } else {
    initAnalyzer();
  }

})();