/* ═══════════════════════════════════════════════════════════════════
   TECH DEBT DETECTIVE — script.js
   Vanilla JS only. No frameworks, no external libraries, no build step.
   Open index.html directly in any modern browser.

   Sections:
     §  1  DOM references & module state
     §  2  Initialisation
     §  3  Film-grain canvas
     §  4  Code editor — gutter & keyboard helpers
     §  5  Sample evidence snippet
     §  6  Smell detection engine (12 detectors)
     §  7  Noir narration copy
     §  8  Scoring & suspect ranking
     §  9  Typewriter animation
     § 10  Corkboard — card creation & SVG illustrations
     § 11  Corkboard — drag-and-drop
     § 12  Corkboard — red string connections
     § 13  Detail panel
     § 14  Suspect sidebar
     § 15  Reset & state helpers
     § 16  Main investigation flow
     § 17  Case report modal
     § 18  Event bindings
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   § 1  DOM REFERENCES & MODULE STATE
   ─────────────────────────────────────────────────────────────────*/

/** @param {string} id @returns {HTMLElement} */
const byId = id => document.getElementById(id);

/* ── Intake column ── */
const elCodeInput      = byId('codeInput');
const elLangSelect     = byId('langSelect');
const elGutter         = byId('editorGutter');
const elBtnInvestigate = byId('btnInvestigate');
const elBtnClear       = byId('btnClear');
const elBtnSample      = byId('btnSample');
const elBtnCloseCase   = byId('btnCloseCase');
const elMetricsStrip   = byId('metricsStrip');
const elMloc           = byId('mLoc');
const elMsmells        = byId('mSmells');
const elMscore         = byId('mScore');
const elMverdict       = byId('mVerdict');
const elTypewriterBox  = byId('typewriterBox');
const elTypewriterText = byId('typewriterText');
const elSuspectsSection = byId('suspectsSection');
const elSuspectList    = byId('suspectList');

/* ── Board column ── */
const elBoardIdle      = byId('boardIdle');
const elBoardLoading   = byId('boardLoading');
const elLoadingCaption = byId('loadingCaption');
const elCorkboard      = byId('corkboard');
let   elStringSvg      = byId('stringSvg');   /* let — replaced on reset */

/* ── Detail column ── */
const elDetailIdle     = byId('detailIdle');
const elDetailContent  = byId('detailContent');
const elDetailColTitle = byId('detailColTitle');
const elDetailStamp    = byId('detailStamp');
const elDetailName     = byId('detailSmell');
const elDetailLines    = byId('detailLines');
const elDetailSev      = byId('detailSev');
const elDetailNoir     = byId('detailNoir');
const elDetailCode     = byId('detailCode');
const elDetailExpl     = byId('detailExplanation');
const elDetailFix      = byId('detailFix');
const elBtnDetailClose = byId('btnDetailClose');

/* ── Report modal ── */
const elReportModal    = byId('reportModal');
const elRpCaseNo       = byId('rpCaseNo');
const elRpDate         = byId('rpDate');
const elRpLang         = byId('rpLang');
const elRpLines        = byId('rpLines');
const elRpPrintCaseNo  = byId('rpPrintCaseNo'); /* print masthead mirror */
const elRpPrintDate    = byId('rpPrintDate');   /* print masthead mirror */
const elRpVerdictBanner = byId('rpVerdictBanner');
const elRpVerdictIcon  = byId('rpVerdictIcon');
const elRpVerdictLabel = byId('rpVerdictLabel');
const elRpScore        = byId('rpScore');
const elRpTableBody    = byId('rpTableBody');
const elRpRecs         = byId('rpRecs');
const elRpSignOff      = byId('rpSignOff');
const elBtnPrint       = byId('btnPrint');
const elBtnCloseModal  = byId('btnCloseModal');

/* ── Header status ── */
const elStatusText  = byId('statusText');
const elCaseNumber  = byId('caseNumber');
const elGrainCanvas = byId('grain');

/* ── Module-level state ── */
/** @type {Array<Object>} */
let findings     = [];          /* current investigation results     */
/** @type {Object.<string,{el:HTMLElement,cx:number,cy:number,w:number,h:number}>} */
let cardRegistry = {};          /* id → position info for strings    */
let selectedId   = null;        /* currently highlighted card id     */
let _typeTimer   = null;        /* handle for typewriter setTimeout  */
let _findingSeq  = 0;           /* monotonic id counter              */
let _zTop        = 10;          /* ever-increasing z-index for "bring to front" */

/* ─────────────────────────────────────────────────────────────────
   § 2  INITIALISATION
   ─────────────────────────────────────────────────────────────────*/

/** Boot: runs once after DOM is ready (script is defer-loaded). */
function init() {
  byId('yr').textContent = new Date().getFullYear();
  elCaseNumber.textContent = generateCaseNumber();
  initGrain();
  updateGutter();
  bindEvents();
}

/** Generate a random 4-digit case number string. */
function generateCaseNumber() {
  return String(1000 + Math.floor(Math.random() * 8999));
}

/* ─────────────────────────────────────────────────────────────────
   § 3  FILM-GRAIN CANVAS
   Skips rAF loop when prefers-reduced-motion is active.
   ─────────────────────────────────────────────────────────────────*/

/** Initialise the animated film-grain overlay. */
function initGrain() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; /* CSS sets opacity:0 for reduced-motion; skip rAF */

  const ctx = elGrainCanvas.getContext('2d');

  function resize() {
    elGrainCanvas.width  = window.innerWidth;
    elGrainCanvas.height = window.innerHeight;
  }

  function drawFrame() {
    const w = elGrainCanvas.width;
    const h = elGrainCanvas.height;
    const img = ctx.createImageData(w, h);
    const d   = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 10; /* very low alpha — subtle grain */
    }
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(drawFrame);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  drawFrame();
}

/* ─────────────────────────────────────────────────────────────────
   § 4  CODE EDITOR — GUTTER & KEYBOARD HELPERS
   ─────────────────────────────────────────────────────────────────*/

/** Rebuild the line-number gutter to match current textarea content. */
function updateGutter() {
  const lineCount = elCodeInput.value.split('\n').length;
  let nums = '';
  for (let i = 1; i <= lineCount; i++) nums += i + '\n';
  elGutter.textContent = nums;
}

/** Sync gutter scroll position with editor scroll. */
function syncGutterScroll() {
  elGutter.scrollTop = elCodeInput.scrollTop;
}

/** Handle Tab key: insert two spaces instead of changing focus. */
function handleEditorKeydown(evt) {
  if (evt.key === 'Tab') {
    evt.preventDefault();
    const start = elCodeInput.selectionStart;
    const end   = elCodeInput.selectionEnd;
    elCodeInput.value =
      elCodeInput.value.substring(0, start) + '  ' +
      elCodeInput.value.substring(end);
    elCodeInput.selectionStart = elCodeInput.selectionEnd = start + 2;
    updateGutter();
  }
  /* Ctrl/Cmd+Enter → trigger investigation */
  if ((evt.ctrlKey || evt.metaKey) && evt.key === 'Enter') {
    evt.preventDefault();
    runInvestigation();
  }
}

/* ─────────────────────────────────────────────────────────────────
   § 5  SAMPLE EVIDENCE SNIPPET
   Intentionally messy: 6+ params, deep nesting, magic numbers,
   duplicate blocks, dead code, TODO/FIXME, vague names, console.log,
   empty catch, duplicate function declaration.
   ─────────────────────────────────────────────────────────────────*/

const SAMPLE_CODE = /* js */ `// UserDataProcessor.js  — legacy service, DO NOT TOUCH
var data = [];
var data2 = [];
var temp = null;
var flag = false;
var x = 0;
var user_records = [];    // snake_case mixed in
var order_total = 0;      // snake_case mixed in
var max_retries = 3;      // snake_case mixed in

// TODO: refactor this entire file someday
// FIXME: magic numbers everywhere

function processUserData(u, d, opts, cb, ctx, extra) {
  // get user — touches DOM, network, storage, math, and strings: God Function
  var result = 0;
  var result2 = 0;

  if (u != null) {
    if (u.active == true) {
      if (u.role == "admin") {
        if (d != null) {
          if (d.items != null) {
            if (d.items.length > 0) {
              for (var i = 0; i < d.items.length; i++) {
                if (d.items[i].status == 1) {
                  result += d.items[i].value * 1.08;
                  result2 += d.items[i].value * 1.08;
                  console.log("processing item", d.items[i]);
                  document.getElementById("status").innerHTML = "processing";
                  localStorage.setItem("last_item", JSON.stringify(d.items[i]));
                  fetch("/api/log", { method: "POST", body: JSON.stringify(d.items[i]) });
                  var tag = d.items[i].name.trim().replace(/ /g, "-").toLowerCase();
                }
              }
            }
          }
        }
      }
    }
  }

  // duplicate block — copy-pasted from above
  if (u != null) {
    if (u.active == true) {
      if (u.role == "admin") {
        if (d != null) {
          if (d.extra != null) {
            for (var j = 0; j < d.extra.length; j++) {
              if (d.extra[j].status == 1) {
                result += d.extra[j].value * 1.08;
                console.log("processing extra", d.extra[j]);
              }
            }
          }
        }
      }
    }
  }

  // magic numbers: 9999, 42
  if (result > 9999) { result = 9999; }
  if (result < 42)   { result = 0; }

  // TODO: validate cb before calling
  var t = new Date().getTime();
  temp   = result;
  data2.push(result);
  data2.push(result2);

  // dead code below — left just in case
  // var oldCalc = result * 1.15;
  // return oldCalc;
  // if (extra) { result += extra.bonus * 1337; }

  try {
    cb(null, result);
  } catch(e) {}

  return result;
}

function calcTax(v, r) {
  return v * 0.0875; // magic number
}

function calcTax(v, r) {
  // duplicate function — silently overwrites the one above
  return v * r;
}
`;

/* ─────────────────────────────────────────────────────────────────
   § 6  SMELL DETECTION ENGINE
   Each detector returns Finding objects with:
     id, name, severity, lines[], excerpt, explanation, fix,
     noirLine, category, score
   All functions in this section are ≤ 40 lines.
   ─────────────────────────────────────────────────────────────────*/

/** Increment and return the next finding id. */
function nextFindingId() { return 'f' + (++_findingSeq); }

/** Return 1-based line number of a character index in code. */
function lineOf(code, idx) {
  return code.substring(0, idx).split('\n').length;
}

/** Extract `count` lines starting at 1-based `startLine`. */
function extractLines(code, startLine, count) {
  return code.split('\n').slice(startLine - 1, startLine - 1 + count).join('\n');
}

/** Escape HTML special characters for safe text insertion. */
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Detector 1: Long Function ── */
function detectLongFunctions(code) {
  const results = [];
  const fnRe = /(?:^|\n)[ \t]*(?:(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()([^{]*)\{/g;
  let m;
  while ((m = fnRe.exec(code)) !== null) {
    const fnName   = m[1] || m[2] || '(anonymous)';
    const startLn  = lineOf(code, m.index);
    const snippet  = code.slice(m.index).split('\n');
    let depth = 0, endLn = startLn;
    for (let i = 0; i < snippet.length; i++) {
      depth += (snippet[i].match(/\{/g) || []).length;
      depth -= (snippet[i].match(/\}/g) || []).length;
      if (depth <= 0 && i > 0) { endLn = startLn + i; break; }
    }
    const len = endLn - startLn + 1;
    if (len >= 20) {
      results.push({
        id: nextFindingId(), name: 'Long Function',
        severity: len >= 40 ? 'critical' : 'high',
        lines: [startLn, endLn], excerpt: extractLines(code, startLn, 4),
        explanation: `"${fnName}" spans ${len} lines. Functions should do one thing and fit on a screen (≤ 20 lines ideal). Long functions are hard to test and change.`,
        fix: `// Break "${fnName}" into focused helpers:\nfunction ${fnName}() {\n  const data   = loadData();\n  const result = processData(data);\n  return format(result);\n}`,
        noirLine: pickNoirLine('Long Function'),
        category: 'Design', score: Math.min(30, Math.ceil(len / 2))
      });
    }
  }
  return results;
}

/* ── Detector 2: Deep Nesting ── */
function detectDeepNesting(code) {
  const lines = code.split('\n');
  let maxDepth = 0, maxLine = 0, depth = 0;
  lines.forEach((ln, i) => {
    depth += (ln.match(/[\{\(]/g) || []).length;
    depth -= (ln.match(/[\}\)]/g) || []).length;
    if (depth > maxDepth) { maxDepth = depth; maxLine = i + 1; }
  });
  if (maxDepth < 4) return [];
  return [{
    id: nextFindingId(), name: 'Deep Nesting',
    severity: maxDepth >= 6 ? 'critical' : 'high',
    lines: [maxLine],
    excerpt: extractLines(code, Math.max(1, maxLine - 2), 5),
    explanation: `Nesting reaches ${maxDepth} levels deep near line ${maxLine}. Deep nesting (the "arrow anti-pattern") makes logic hard to follow, test, or modify safely.`,
    fix: `// Flatten with guard clauses (early returns):\nfunction process(user, data) {\n  if (!user?.active) return null;\n  if (!data?.items?.length) return 0;\n  // main logic now at depth 1\n}`,
    noirLine: pickNoirLine('Deep Nesting'),
    category: 'Complexity', score: maxDepth * 5
  }];
}

/* ── Detector 3: Magic Numbers ── */
function detectMagicNumbers(code) {
  const results = [];
  const re = /(?<![.\w'"`])(\b(?!0\b|1\b|2\b|-1\b)\d{2,}(?:\.\d+)?\b)(?![.\w'"`])/g;
  const seen = new Map();
  let m;
  while ((m = re.exec(code)) !== null) {
    const num = m[1];
    if (!seen.has(num)) seen.set(num, []);
    seen.get(num).push(lineOf(code, m.index));
  }
  [...seen.entries()].slice(0, 4).forEach(([num, lns]) => {
    results.push({
      id: nextFindingId(), name: 'Magic Number',
      severity: 'medium', lines: lns.slice(0, 3),
      excerpt: extractLines(code, lns[0], 1),
      explanation: `The literal value ${num} appears with no explanation. Future maintainers won't know if it's a limit, a tax rate, or a mistake.`,
      fix: `// Name your constants:\nconst MAX_ORDER_VALUE = ${num};\n// ... then use MAX_ORDER_VALUE`,
      noirLine: pickNoirLine('Magic Number'),
      category: 'Readability', score: 8
    });
  });
  return results;
}

/* ── Detector 4: Duplicated Code Blocks ── */
function detectDuplicateBlocks(code) {
  const results = [];
  const BLOCK  = 4;
  const lines  = code.split('\n').map(l => l.trim());
  const seen   = new Map();
  for (let i = 0; i <= lines.length - BLOCK; i++) {
    const block = lines.slice(i, i + BLOCK)
      .filter(l => l.length > 4 && !l.startsWith('//') && !l.startsWith('*'))
      .join('\n');
    if (block.length < 40) continue;
    if (seen.has(block) && results.length < 3) {
      const first = seen.get(block) + 1;
      results.push({
        id: nextFindingId(), name: 'Duplicated Code Block',
        severity: 'critical', lines: [first, i + 1],
        excerpt: extractLines(code, first, BLOCK),
        explanation: `A block of ${BLOCK}+ lines at line ${first} is copy-pasted at line ${i + 1}. Bugs fixed in one copy won't be fixed in the other.`,
        fix: `// Extract the shared logic:\nfunction processBlock(items, user) {\n  // ... shared code ...\n}\n// Call it in both places`,
        noirLine: pickNoirLine('Duplicated Code Block'),
        category: 'Maintainability', score: 25
      });
    } else if (!seen.has(block)) {
      seen.set(block, i);
    }
  }
  return results;
}

/* ── Detector 5: Commented-Out Dead Code ── */
function detectDeadCode(code) {
  const results = [];
  const lines   = code.split('\n');
  let runStart  = -1, runCount = 0;
  const runs    = [];
  lines.forEach((ln, i) => {
    const t = ln.trim();
    const isDeadCode =
      /^\/\/\s*(?!TODO|FIXME|HACK|NOTE|@|=+|─+|\*)[^\s]/.test(t) &&
      /[;=().{}]/.test(t) && t.length > 8;
    if (isDeadCode) {
      if (runStart < 0) runStart = i + 1;
      runCount++;
    } else {
      if (runCount >= 2) runs.push({ start: runStart, count: runCount });
      runStart = -1; runCount = 0;
    }
  });
  if (runCount >= 2) runs.push({ start: runStart, count: runCount });
  runs.slice(0, 2).forEach(r => {
    results.push({
      id: nextFindingId(), name: 'Commented-Out Dead Code',
      severity: 'low', lines: [r.start, r.start + r.count - 1],
      excerpt: extractLines(code, r.start, r.count),
      explanation: `${r.count} lines of commented-out code from line ${r.start}. This is dead weight — left "just in case". Version control exists for this purpose.`,
      fix: `// Delete it. Recover it later with:\n// git log --all --full-history -- path/to/file`,
      noirLine: pickNoirLine('Commented-Out Dead Code'),
      category: 'Hygiene', score: 6
    });
  });
  return results;
}

/* ── Detector 6: TODO / FIXME Leftovers ── */
function detectTodoFixme(code) {
  const re   = /\/\/\s*(TODO|FIXME|HACK|XXX|BUG)[:\s].{3,}/gi;
  const hits = [];
  let m;
  while ((m = re.exec(code)) !== null) {
    hits.push({ text: m[0].trim(), line: lineOf(code, m.index) });
  }
  if (!hits.length) return [];
  return [{
    id: nextFindingId(), name: 'TODO / FIXME Leftovers',
    severity: 'low', lines: hits.map(h => h.line),
    excerpt: hits.slice(0, 3).map(h => h.text).join('\n'),
    explanation: `${hits.length} unresolved TODO/FIXME comment${hits.length > 1 ? 's' : ''} found. Each is an IOU on the technical debt ledger — a known problem that was deferred indefinitely.`,
    fix: `// File a real ticket instead:\n// JIRA-1234: Refactor processUserData\n// Then delete the comment — the ticket IS the reminder.`,
    noirLine: pickNoirLine('TODO / FIXME Leftovers'),
    category: 'Hygiene', score: hits.length * 4
  }];
}

/* ── Detector 7: Poor Variable Naming ── */
function detectPoorNaming(code) {
  const VAGUE = new Set(['data2','temp','temp2','flag','result2','x','foo','bar','baz','stuff','thing','obj','arr','val']);
  const re    = /\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=;]/g;
  const found = [];
  let m;
  while ((m = re.exec(code)) !== null) {
    const name = m[1].toLowerCase();
    if ((VAGUE.has(name) || /^[a-z]$/.test(m[1])) && !found.find(f => f.name === m[1])) {
      found.push({ name: m[1], line: lineOf(code, m.index) });
    }
  }
  if (found.length < 2) return [];
  return [{
    id: nextFindingId(), name: 'Poor Variable Naming',
    severity: 'medium', lines: found.slice(0, 5).map(f => f.line),
    excerpt: found.slice(0, 4).map(f => `${f.name} (line ${f.line})`).join(', '),
    explanation: `Vague names found: ${found.map(f => f.name).join(', ')}. Names like "data2", "temp", and "flag" force every reader to decode intent from context. Code is read 10× more than it is written.`,
    fix: `// Name things for what they ARE:\n// data2   → pendingOrderItems\n// temp    → accumulatedTotal\n// flag    → isAdminUser\n// result2 → extraItemsTotal`,
    noirLine: pickNoirLine('Poor Variable Naming'),
    category: 'Readability', score: 10
  }];
}

/* ── Detector 8: Too Many Parameters ── */
function detectTooManyParams(code) {
  const results = [];
  const re = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()\s*([^)]{30,})\)/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const params = m[3].split(',').map(p => p.trim()).filter(Boolean);
    if (params.length < 5) continue;
    const fnName = m[1] || m[2] || '(fn)';
    const ln     = lineOf(code, m.index);
    results.push({
      id: nextFindingId(), name: 'Too Many Parameters',
      severity: 'high', lines: [ln],
      excerpt: extractLines(code, ln, 1),
      explanation: `"${fnName}" takes ${params.length} parameters (${params.slice(0, 5).join(', ')}${params.length > 5 ? '…' : ''}). More than 3–4 parameters suggests the function does too much or needs a config object.`,
      fix: `// Introduce a parameter object:\nfunction ${fnName}(opts) {\n  const { user, data, callback, context } = opts;\n}`,
      noirLine: pickNoirLine('Too Many Parameters'),
      category: 'Design', score: params.length * 4
    });
  }
  return results;
}

/* ── Detector 9: Debug Statements ── */
function detectDebugStatements(code) {
  const re   = /\b(console\.(log|warn|error|debug|info)|debugger\b|alert\s*\()/g;
  const locs = [];
  let m;
  while ((m = re.exec(code)) !== null) locs.push(lineOf(code, m.index));
  if (!locs.length) return [];
  return [{
    id: nextFindingId(), name: 'Debug Statements Left In',
    severity: 'medium', lines: [...new Set(locs)],
    excerpt: extractLines(code, locs[0], 1),
    explanation: `${locs.length} debug statement${locs.length > 1 ? 's' : ''} (console.log, debugger, etc.) found. These clutter production logs and expose internals.`,
    fix: `// Replace with a real logger:\nimport { logger } from './logger';\nlogger.debug('Processing:', item);`,
    noirLine: pickNoirLine('Debug Statements Left In'),
    category: 'Hygiene', score: locs.length * 3
  }];
}

/* ── Detector 10: Loose Equality ── */
function detectLooseEquality(code) {
  const re   = /(?<!=|!)={1,2}(?!=)/g;
  const locs = [];
  let m;
  while ((m = re.exec(code)) !== null) {
    const op = m[0];
    if (op === '==' || op === '!=') locs.push(lineOf(code, m.index));
  }
  if (locs.length < 2) return [];
  return [{
    id: nextFindingId(), name: 'Loose Equality (== / !=)',
    severity: 'medium', lines: [...new Set(locs)].slice(0, 5),
    excerpt: extractLines(code, locs[0], 1),
    explanation: `${locs.length} loose equality comparisons found. In JavaScript, null == undefined is true, 0 == '' is true, and 1 == '1' is true. Always use strict === / !==.`,
    fix: `// Use strict equality everywhere:\nif (user !== null)       { ... }\nif (status === 'admin')  { ... }`,
    noirLine: pickNoirLine('Loose Equality (== / !=)'),
    category: 'Correctness', score: locs.length * 4
  }];
}

/* ── Detector 11: Swallowed Exceptions ── */
function detectSwallowedExceptions(code) {
  const results = [];
  const re = /catch\s*\([^)]*\)\s*\{([^}]{0,60})\}/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const body = m[1].trim();
    const isEmpty = body === '' || /^\/\/.{0,20}$/.test(body);
    if (!isEmpty) continue;
    const ln = lineOf(code, m.index);
    results.push({
      id: nextFindingId(), name: 'Swallowed Exception',
      severity: 'high', lines: [ln],
      excerpt: extractLines(code, ln, 3),
      explanation: `An empty catch block at line ${ln} silently discards all errors. When exceptions are swallowed, failures become invisible.`,
      fix: `// Always log or re-throw:\ncatch (err) {\n  console.error('processUserData failed:', err);\n  throw err;\n}`,
      noirLine: pickNoirLine('Swallowed Exception'),
      category: 'Reliability', score: 20
    });
  }
  return results.slice(0, 2);
}

/* ── Detector 13: God Function ── */
/**
 * Detects a function that does too many unrelated things.
 * Signals: high branch count (if/for/while/switch) AND
 * calls into multiple distinct concern domains detected via
 * keyword clusters (DOM, network, storage, math, string ops).
 */
function detectGodFunction(code) {
  const results = [];
  const fnRe = /(?:^|\n)[ \t]*(?:(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()([^{]*)\{/g;
  const DOMAINS = [
    { name: 'DOM',     re: /\b(document\.|getElementById|querySelector|innerHTML|classList|addEventListener)\b/g },
    { name: 'Network', re: /\b(fetch|XMLHttpRequest|axios|\.get\(|\.post\(|\.put\(|\.delete\()\b/g },
    { name: 'Storage', re: /\b(localStorage|sessionStorage|indexedDB|fs\.|readFile|writeFile)\b/g },
    { name: 'Math',    re: /\b(Math\.|parseInt|parseFloat|toFixed|toPrecision)\b/g },
    { name: 'String',  re: /\b(\.split\(|\.join\(|\.replace\(|\.trim\(|\.match\(|\.slice\()\b/g },
  ];
  let m;
  while ((m = fnRe.exec(code)) !== null) {
    const fnName  = m[1] || m[2] || '(anonymous)';
    const startLn = lineOf(code, m.index);
    const snippet = code.slice(m.index);
    let depth = 0, endIdx = snippet.length;
    for (let i = 0; i < snippet.length; i++) {
      if (snippet[i] === '{') depth++;
      else if (snippet[i] === '}') { depth--; if (depth <= 0) { endIdx = i; break; } }
    }
    const body      = snippet.slice(0, endIdx);
    const branches  = (body.match(/\b(if|for|while|switch|catch)\b/g) || []).length;
    const hitDomains = DOMAINS.filter(d => { d.re.lastIndex = 0; return d.re.test(body); });
    if (branches >= 5 && hitDomains.length >= 2) {
      const endLn = startLn + body.split('\n').length - 1;
      results.push({
        id: nextFindingId(), name: 'God Function',
        severity: hitDomains.length >= 3 ? 'critical' : 'high',
        lines: [startLn, endLn],
        excerpt: extractLines(code, startLn, 3),
        explanation: `"${fnName}" touches ${hitDomains.length} unrelated concerns (${hitDomains.map(d => d.name).join(', ')}) with ${branches} branch points. It violates the Single Responsibility Principle and becomes nearly impossible to test or reuse in isolation.`,
        fix: `// Split by responsibility:\n// 1. fetchData()    — network only\n// 2. renderResult() — DOM only\n// 3. ${fnName}()     — orchestration only`,
        noirLine: pickNoirLine('God Function'),
        category: 'Design', score: branches * 3 + hitDomains.length * 8
      });
    }
  }
  return results.slice(0, 2);
}

/* ── Detector 14: Empty Catch Blocks ── */
/**
 * Flags catch blocks whose body contains NO executable statements
 * (completely empty, or only whitespace / blank lines).
 * More targeted than detectSwallowedExceptions which accepts ≤60 chars.
 */
function detectEmptyCatch(code) {
  const results = [];
  /* Match catch(...) { <optional whitespace only> } */
  const re = /catch\s*\([^)]*\)\s*\{\s*\}/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const ln = lineOf(code, m.index);
    results.push({
      id: nextFindingId(), name: 'Empty Catch Block',
      severity: 'critical', lines: [ln],
      excerpt: extractLines(code, ln, 2),
      explanation: `Completely empty catch block at line ${ln}. All errors thrown inside the try are silently discarded — no logging, no re-throw, no recovery. Failures become invisible, making debugging nearly impossible.`,
      fix: `// At minimum, log and re-throw:\ncatch (err) {\n  console.error('[MyModule] unexpected error:', err);\n  throw err; // let the caller decide\n}`,
      noirLine: pickNoirLine('Empty Catch Block'),
      category: 'Reliability', score: 30
    });
  }
  return results.slice(0, 3);
}

/* ── Detector 15: Inconsistent Naming Convention ── */
/**
 * Detects mixing of camelCase and snake_case identifiers
 * within the same file (≥2 of each style required to fire).
 */
function detectInconsistentNaming(code) {
  const camelRe  = /\b(?:var|let|const|function)\s+([a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*)\b/g;
  const snakeRe  = /\b(?:var|let|const|function)\s+([a-z][a-z0-9]*(?:_[a-z][a-z0-9]*)+)\b/g;
  const camels = [], snakes = [];
  let m;
  while ((m = camelRe.exec(code)) !== null) camels.push({ name: m[1], line: lineOf(code, m.index) });
  while ((m = snakeRe.exec(code)) !== null) snakes.push({ name: m[1], line: lineOf(code, m.index) });
  if (camels.length < 2 || snakes.length < 2) return [];
  const examples = [
    ...camels.slice(0, 2).map(x => `camelCase: "${x.name}" (line ${x.line})`),
    ...snakes.slice(0, 2).map(x => `snake_case: "${x.name}" (line ${x.line})`),
  ];
  const allLines = [...camels, ...snakes].map(x => x.line).sort((a, b) => a - b);
  return [{
    id: nextFindingId(), name: 'Inconsistent Naming Convention',
    severity: 'medium',
    lines: allLines.slice(0, 6),
    excerpt: examples.join('\n'),
    explanation: `The file mixes ${camels.length} camelCase and ${snakes.length} snake_case identifiers. Inconsistent conventions force readers to context-switch and break linter rules. Pick one style and apply it everywhere.`,
    fix: `// JavaScript convention is camelCase.\n// Rename snake_case identifiers:\n// user_data    → userData\n// total_count  → totalCount\n// is_valid     → isValid`,
    noirLine: pickNoirLine('Inconsistent Naming Convention'),
    category: 'Readability', score: snakes.length * 5 + camels.length * 2
  }];
}

/* ── Detector 12: Duplicate Function Declarations ── */
function detectDuplicateFunctions(code) {
  const results = [];
  const re   = /function\s+(\w+)\s*\(/g;
  const seen = {};
  let m;
  while ((m = re.exec(code)) !== null) {
    const name = m[1];
    const ln   = lineOf(code, m.index);
    if (seen[name] !== undefined) {
      results.push({
        id: nextFindingId(), name: 'Duplicate Function Declaration',
        severity: 'critical', lines: [seen[name], ln],
        excerpt: extractLines(code, ln, 2),
        explanation: `"${name}" is declared at line ${seen[name]} and again at line ${ln}. In non-strict JS the second definition silently overwrites the first — a latent bug.`,
        fix: `// Remove the duplicate. Give each a unique descriptive name:\nfunction calcTaxStandard(v) { return v * 0.0875; }\nfunction calcTaxCustom(v, rate) { return v * rate; }`,
        noirLine: pickNoirLine('Duplicate Function Declaration'),
        category: 'Correctness', score: 25
      });
    } else {
      seen[name] = ln;
    }
  }
  return results;
}

/** Run all 15 detectors and return a merged, sorted findings array. */
function runAllDetectors(code) {
  const all = [
    ...detectLongFunctions(code),
    ...detectDeepNesting(code),
    ...detectMagicNumbers(code),
    ...detectDuplicateBlocks(code),
    ...detectDeadCode(code),
    ...detectTodoFixme(code),
    ...detectPoorNaming(code),
    ...detectTooManyParams(code),
    ...detectDebugStatements(code),
    ...detectLooseEquality(code),
    ...detectSwallowedExceptions(code),
    ...detectDuplicateFunctions(code),
    ...detectGodFunction(code),
    ...detectEmptyCatch(code),
    ...detectInconsistentNaming(code),
  ];
  const order = { critical: 4, high: 3, medium: 2, low: 1 };
  return all.sort((a, b) => (order[b.severity] || 0) - (order[a.severity] || 0));
}

/* ─────────────────────────────────────────────────────────────────
   § 7  NOIR NARRATION COPY
   Persona: weary, sarcastic, 1940s. Short punchy sentences.
   Dry metaphors. Every line ≤ 120 characters.
   Three variants per smell — one picked at random per finding.
   ─────────────────────────────────────────────────────────────────*/

/** Pick a random element from an array. */
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* ── Opening monologue — shown while investigation runs ── */
const INTROS = [
  "Another file. Another mess. I poured a drink and got to work.",
  "The code hit my desk at midnight. By line three I needed a second drink.",
  "'Legacy,' they called it. I've got a different word. Several, actually.",
  "Rain on the window. Smoke in the air. Something rotten in the codebase.",
  "'Basically clean,' the developer said. They always say that.",
  "Twenty years in this racket. I still flinch when I open someone else's files.",
];

/* ── Verdict lines — shown after scoring completes ── */
const VERDICTS = {
  GUILTY: [
    "Guilty. Multiple counts. The jury didn't even sit down.",
    "The evidence doesn't lie. The codebase does — just not well enough.",
    "Open and shut. This code was guilty before I lit my first cigarette.",
  ],
  SUSPICIOUS: [
    "Not clean. Not quite dirty. The kind of case that keeps you up at three in the morning.",
    "I'm watching. The smells are there. So is the trail.",
    "Not enough to arrest. More than enough to worry.",
  ],
  CLEAN: [
    "Nothing. Either they're good — or they cleaned up before I arrived.",
    "Clean as a whistle. I don't trust it, but the evidence says what it says.",
    "No findings. I've been wrong before. I don't think I'm wrong now.",
  ],
};

/* ── Case report sign-off lines ── */
const CASE_SIGN_OFFS = [
  "Case closed. The code was guilty all along.",
  "Filed and sealed. Some crimes leave no survivors — just maintainers.",
  "Another case in the books. The smell lingers. It always does.",
  "I've seen cleaner crime scenes. At least those had tape.",
  "Done. Light a cigarette and bill the client. This one earned it.",
];

/*
 * Three noir-voice variants per smell name.
 * Keys must match the `name` field set in each detector exactly.
 * pickNoirLine() selects one at random when a finding is created.
 */
const NOIR_LINES = {
  'Long Function': [
    "That's not a function. That's a confession. And it just kept talking.",
    "Functions should do one thing. This one does everything. Badly.",
    "I counted the lines. Then I counted them again. My cigarette burned down twice.",
  ],
  'Deep Nesting': [
    "Arrow code. Every indent is another door closing behind you.",
    "I went in. Four levels deep. Five. Six. I stopped counting and started praying.",
    "Nested that deep, nobody comes back the same. Guard clauses exist for a reason.",
  ],
  'Magic Number': [
    "A number with no name. No alibi. In this city, nameless things are always trouble.",
    "What's 9999? A limit? A tax rate? A mistake? Nobody left a note.",
    "Literal values with no context. A clue with no case file attached.",
  ],
  'Duplicated Code Block': [
    "Copy. Paste. The oldest crime. Fix a bug here, forget it there.",
    "Twice. The same block. Twice. Somebody was in a hurry. Now we all pay.",
    "DRY. Don't Repeat Yourself. They didn't get the memo. Or they got it twice.",
  ],
  'Commented-Out Dead Code': [
    "Left in. Just in case. That's not caution — that's cowardice.",
    "Commented out, not deleted. They couldn't bury it. So they left it in the wall.",
    "Version control exists. Use it. Dead code doesn't deserve a grave in the source.",
  ],
  'TODO / FIXME Leftovers': [
    "'Fix this later.' Later never came. It never does.",
    "A TODO is an IOU nobody intends to pay. The debt compounds.",
    "They knew it was broken. Wrote it down. Then shipped it anyway. That's worse.",
  ],
  'Poor Variable Naming': [
    "'data2'. 'temp'. 'flag'. A lineup with no faces. Everybody guilty by association.",
    "Names that say nothing. In six months, not even the author will remember.",
    "A good name costs nothing. A bad one costs every developer who comes after.",
  ],
  'Too Many Parameters': [
    "That many parameters means one thing: the function doesn't know what it wants.",
    "A function with six inputs is really three functions hiding in a coat.",
    "More than four arguments and you've lost the plot. This one lost it early.",
  ],
  'Debug Statements Left In': [
    "console.log still in production. The developer left the lights on when they fled.",
    "Somebody was watching the code run. Now everyone else has to watch too.",
    "Debug output in a live system. A witness left behind at their own crime scene.",
  ],
  'Loose Equality (== / !=)': [
    "== in JavaScript. Where null loves undefined and zero courts the empty string.",
    "Two equals signs. The third one exists for a reason. Use it.",
    "Type coercion doesn't care about your feelings. Neither does the production bug.",
  ],
  'Swallowed Exception': [
    "catch(e) {}. The perfect crime. The error happened. Nobody will ever know.",
    "Errors swallowed whole. Silent failures are the hardest kind to find.",
    "An empty catch is a lie told to the runtime. Eventually the runtime tells the truth.",
  ],
  'Duplicate Function Declaration': [
    "Declared twice. The second killed the first. Quiet. Clean. No witnesses.",
    "Two functions, one name. In non-strict JS the second wins. You lose.",
    "A name collision. The kind that works fine — until it doesn't, at 2 a.m.",
  ],
  'God Function': [
    "Does it all — fetches, renders, saves, prays. A one-man crime syndicate.",
    "DOM. Network. Storage. Strings. One function. Every single responsibility.",
    "The bigger the function, the more places it can betray you.",
  ],
  'Empty Catch Block': [
    "catch(e) {}. The criminal escaped. Not even a chalk outline on the floor.",
    "No log. No rethrow. The error walked out the door and nobody filed a report.",
    "An empty catch isn't error handling. It's an accomplice.",
  ],
  'Inconsistent Naming Convention': [
    "Half the names wear suits. The other half wear overalls. Pick a dress code.",
    "camelCase here. snake_case there. A codebase that can't agree on who it is.",
    "Inconsistent naming is a small lie. Small lies compound into big ones.",
  ],
};

/**
 * Return a random noir line for a given smell name.
 * Falls back to a generic quip if the smell isn't in the map.
 * @param {string} smellName
 * @returns {string}
 */
function pickNoirLine(smellName) {
  const variants = NOIR_LINES[smellName];
  if (variants) return pick(variants);
  return "Another smell. Another entry in the ledger. This city never runs out.";
}

/* ─────────────────────────────────────────────────────────────────
   § 8  SCORING & SUSPECT RANKING
   ─────────────────────────────────────────────────────────────────*/

/** Map severity to point weight. */
function severityWeight(sev) {
  return { critical: 25, high: 15, medium: 8, low: 3 }[sev] ?? 0;
}

/** Sum finding scores, capped at 100. */
function calcDebtScore(fArr) {
  return Math.min(100, fArr.reduce((acc, f) => acc + (f.score || severityWeight(f.severity)), 0));
}

/** Derive GUILTY / SUSPICIOUS / CLEAN verdict from numeric score. */
function scoreToVerdict(score) {
  if (score >= 50) return 'GUILTY';
  if (score >= 15) return 'SUSPICIOUS';
  return 'CLEAN';
}

/** Group findings by category and sort by score descending. */
function buildSuspects(fArr) {
  const map = {};
  fArr.forEach(f => {
    const key = f.category || 'General';
    if (!map[key]) map[key] = { name: key, score: 0, count: 0 };
    map[key].score += (f.score || severityWeight(f.severity));
    map[key].count++;
  });
  return Object.values(map).sort((a, b) => b.score - a.score);
}

/* ─────────────────────────────────────────────────────────────────
   § 9  TYPEWRITER ANIMATION
   ─────────────────────────────────────────────────────────────────*/

/**
 * Animate `text` into `elTypewriterText` character by character.
 * No-ops if prefers-reduced-motion: just sets the text instantly.
 */
function typewrite(text) {
  clearTimeout(_typeTimer);
  elTypewriterText.textContent = '';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elTypewriterText.textContent = text;
    return;
  }

  elTypewriterText.classList.add('typewriter-cursor');
  let i = 0;

  function tick() {
    if (i < text.length) {
      elTypewriterText.textContent += text[i++];
      _typeTimer = setTimeout(tick, 18 + Math.random() * 12);
    } else {
      elTypewriterText.classList.remove('typewriter-cursor');
    }
  }
  tick();
}

/* ─────────────────────────────────────────────────────────────────
   § 10  CORKBOARD — CARD CREATION & SVG ILLUSTRATIONS
   ─────────────────────────────────────────────────────────────────*/

/* SVG "photo" illustrations — one per smell category */
const CATEGORY_PHOTOS = {
  Design: `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <line x1="77" y1="20" x2="77" y2="90" stroke="#5a3a10" stroke-width="1" stroke-dasharray="4 2"/>
    <rect x="20" y="35" width="40" height="22" rx="1" fill="none" stroke="#c9a24b" stroke-width="1.5" opacity=".55"/>
    <rect x="94" y="35" width="40" height="22" rx="1" fill="none" stroke="#c9a24b" stroke-width="1.5" opacity=".55"/>
    <rect x="46" y="65" width="63" height="20" rx="1" fill="none" stroke="#c9a24b" stroke-width="1" opacity=".35"/>
    <line x1="40" y1="46" x2="94" y2="46" stroke="#c9a24b" stroke-width="1" opacity=".35"/>
    <line x1="77" y1="57" x2="77" y2="65" stroke="#c9a24b" stroke-width="1" opacity=".35"/>
    <text x="77" y="10" font-family="Courier New,monospace" font-size="7" fill="#6a5a30" text-anchor="middle">STRUCTURE</text>
  </svg>`,

  Complexity: `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <text x="14" y="30"  font-family="Courier New,monospace" font-size="8" fill="#6a5a30">if {</text>
    <text x="24" y="43"  font-family="Courier New,monospace" font-size="8" fill="#6a5a30">  if {</text>
    <text x="34" y="56"  font-family="Courier New,monospace" font-size="8" fill="#b3202a" opacity=".8">    if {</text>
    <text x="44" y="69"  font-family="Courier New,monospace" font-size="8" fill="#b3202a">      if {</text>
    <text x="54" y="82"  font-family="Courier New,monospace" font-size="8" fill="#b3202a">        ···</text>
    <line x1="10" y1="32" x2="10" y2="88" stroke="#6a5a30" stroke-width="1" opacity=".3"/>
    <line x1="20" y1="45" x2="20" y2="88" stroke="#6a5a30" stroke-width="1" opacity=".3"/>
    <line x1="30" y1="58" x2="30" y2="88" stroke="#b3202a" stroke-width="1" opacity=".35"/>
    <line x1="40" y1="71" x2="40" y2="88" stroke="#b3202a" stroke-width="1" opacity=".45"/>
  </svg>`,

  Maintainability: `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <rect x="8"  y="20" width="60" height="68" rx="1" fill="#221a10" stroke="#3a3020" stroke-width="1"/>
    <rect x="86" y="20" width="60" height="68" rx="1" fill="#221a10" stroke="#b3202a" stroke-width="1" opacity=".7"/>
    <rect x="14" y="30" width="48" height="4" rx="1" fill="#c9a24b" opacity=".25"/>
    <rect x="14" y="38" width="36" height="4" rx="1" fill="#c9a24b" opacity=".25"/>
    <rect x="14" y="46" width="42" height="4" rx="1" fill="#c9a24b" opacity=".25"/>
    <rect x="92" y="30" width="48" height="4" rx="1" fill="#c9a24b" opacity=".25"/>
    <rect x="92" y="38" width="36" height="4" rx="1" fill="#c9a24b" opacity=".25"/>
    <rect x="92" y="46" width="42" height="4" rx="1" fill="#c9a24b" opacity=".25"/>
    <text x="77" y="60" font-family="Courier New,monospace" font-size="9" fill="#b3202a" text-anchor="middle" opacity=".7">COPY</text>
  </svg>`,

  Hygiene: `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <rect x="55" y="28" width="44" height="56" rx="2" fill="#221a10" stroke="#3a3020" stroke-width="1.5"/>
    <line x1="55" y1="43" x2="99" y2="43" stroke="#3a3020" stroke-width="1"/>
    <rect x="62" y="35" width="8" height="8" rx="1" fill="none" stroke="#c9a24b" stroke-width="1" opacity=".35"/>
    <rect x="73" y="35" width="8" height="8" rx="1" fill="none" stroke="#c9a24b" stroke-width="1" opacity=".35"/>
    <rect x="84" y="35" width="8" height="8" rx="1" fill="none" stroke="#c9a24b" stroke-width="1" opacity=".35"/>
    <rect x="62" y="50" width="30" height="4" rx="1" fill="#5a5040" opacity=".4"/>
    <rect x="62" y="58" width="22" height="4" rx="1" fill="#5a5040" opacity=".4"/>
    <rect x="62" y="66" width="28" height="4" rx="1" fill="#5a5040" opacity=".4"/>
    <text x="22" y="58" font-family="Courier New,monospace" font-size="7" fill="#304030" opacity=".8">// TODO</text>
    <text x="105" y="52" font-family="Courier New,monospace" font-size="7" fill="#304030" opacity=".8">// FIX</text>
  </svg>`,

  Readability: `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <text x="10" y="28"  font-family="Courier New,monospace" font-size="8" fill="#4a4030">var x = 0;</text>
    <text x="10" y="42"  font-family="Courier New,monospace" font-size="8" fill="#4a4030">var temp = null;</text>
    <text x="10" y="56"  font-family="Courier New,monospace" font-size="8" fill="#4a4030">var data2 = [];</text>
    <text x="10" y="70"  font-family="Courier New,monospace" font-size="8" fill="#b3202a" opacity=".8">var flag = false;</text>
    <circle cx="112" cy="56" r="28" fill="none" stroke="#c9a24b" stroke-width="1.5" opacity=".45"/>
    <line   x1="132" y1="76" x2="146" y2="90" stroke="#c9a24b" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>
    <circle cx="112" cy="56" r="18" fill="#c9a24b" opacity=".04"/>
  </svg>`,

  Correctness: `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <text x="12"  y="52"  font-family="Courier New,monospace" font-size="22" fill="#b3202a" opacity=".7">==</text>
    <text x="72"  y="36"  font-family="Courier New,monospace" font-size="11" fill="#c9a24b" opacity=".45">≠</text>
    <text x="84"  y="52"  font-family="Courier New,monospace" font-size="22" fill="#1e8449" opacity=".7">===</text>
    <line x1="8" y1="65" x2="146" y2="65" stroke="#3a3020" stroke-width="1"/>
    <text x="77"  y="80"  font-family="Courier New,monospace" font-size="7" fill="#6a5a30" text-anchor="middle">TYPE COERCION ZONE</text>
    <line x1="64" y1="10" x2="64" y2="95" stroke="#3a3020" stroke-width="1" stroke-dasharray="3 3" opacity=".5"/>
  </svg>`,

  Reliability: `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <text x="8"  y="28"  font-family="Courier New,monospace" font-size="8" fill="#4a4030">try {</text>
    <text x="18" y="40"  font-family="Courier New,monospace" font-size="8" fill="#4a4030">  doWork();</text>
    <text x="8"  y="52"  font-family="Courier New,monospace" font-size="8" fill="#4a4030">} catch(e) {</text>
    <text x="18" y="64"  font-family="Courier New,monospace" font-size="8" fill="#b3202a" opacity=".8">  // silence…</text>
    <text x="8"  y="76"  font-family="Courier New,monospace" font-size="8" fill="#4a4030">}</text>
    <circle cx="124" cy="56" r="20" fill="#0e0c0a" stroke="#b3202a" stroke-width="1.5" opacity=".55"/>
    <text x="124" y="60"  font-family="Courier New,monospace" font-size="9" fill="#b3202a" text-anchor="middle" opacity=".7">ERR</text>
    <line x1="82" y1="56" x2="104" y2="56" stroke="#b3202a" stroke-width="1" stroke-dasharray="3 2" opacity=".55"/>
  </svg>`,

  General: `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <circle cx="77" cy="55" r="32" fill="none" stroke="#c9a24b" stroke-width="1.5" opacity=".35"/>
    <line x1="77" y1="23" x2="77" y2="87" stroke="#c9a24b" stroke-width="1" opacity=".25"/>
    <line x1="45" y1="55" x2="109" y2="55" stroke="#c9a24b" stroke-width="1" opacity=".25"/>
    <circle cx="77" cy="55" r="4" fill="#c9a24b" opacity=".45"/>
  </svg>`,
};

/** Return the SVG illustration for a finding's category. */
function getPhoto(category) {
  return CATEGORY_PHOTOS[category] || CATEGORY_PHOTOS.General;
}

/**
 * Create and place a polaroid card for one finding on the corkboard.
 * @param {Object} finding
 * @param {number} boardW  corkboard pixel width
 * @param {number} boardH  corkboard pixel height
 * @param {number} index   card index
 * @param {number} total   total number of cards
 */
function spawnCard(finding, boardW, boardH, index, total) {
  /* ── Compute position: loose grid with randomised jitter ── */
  const cols  = Math.ceil(Math.sqrt(total * 1.5));
  const col   = index % cols;
  const row   = Math.floor(index / cols);
  const cellW = Math.max(185, boardW / cols);
  const cellH = Math.max(165, boardH / Math.ceil(total / cols));
  const jx    = (Math.random() - 0.5) * 40;
  const jy    = (Math.random() - 0.5) * 30;
  const cx    = Math.max(90,  Math.min(boardW - 90,  20 + col * cellW + cellW / 2 + jx));
  const cy    = Math.max(80,  Math.min(boardH - 80,  30 + row * cellH + cellH / 2 + jy));
  const rot   = (Math.random() - 0.5) * 12;
  const CARD_W = 174, CARD_H = 162;

  /* ── Build card element ── */
  const card = document.createElement('div');
  card.className  = 'polaroid';
  card.dataset.id = finding.id;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Finding: ${finding.name}, severity ${finding.severity}. Press Enter to view details.`);
  card.style.left      = (cx - CARD_W / 2) + 'px';
  card.style.top       = (cy - CARD_H / 2) + 'px';
  card.style.transform = `rotate(${rot}deg)`;
  card.style.setProperty('--card-rot', `${rot}deg`);

  /* ── Coffee-stain decoration: randomised per card ── */
  card.style.setProperty('--coffee-x',   `${20 + Math.random() * 60}%`);
  card.style.setProperty('--coffee-y',   `${20 + Math.random() * 60}%`);
  card.style.setProperty('--coffee-r',   `${18 + Math.random() * 22}px`);
  card.style.setProperty('--coffee-rot', `${Math.random() * 360}deg`);
  card.style.setProperty('--coffee-sx',  `${0.7 + Math.random() * 0.6}`);

  card.innerHTML = buildCardHTML(finding);

  /* ── Interaction ── */
  /* click is handled inside makeDraggable to avoid double-firing after drag */
  card.addEventListener('keydown', evt => { if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); openDetail(finding.id); } });
  makeDraggable(card, finding.id);

  elCorkboard.appendChild(card);

  /* ── Register centre point for string drawing ── */
  cardRegistry[finding.id] = { el: card, cx, cy, w: CARD_W, h: CARD_H };
}

/** Build the inner HTML for a polaroid card (includes tape corners). */
function buildCardHTML(f) {
  return `
    <div class="polaroid__tape polaroid__tape--tl" aria-hidden="true"></div>
    <div class="polaroid__tape polaroid__tape--tr" aria-hidden="true"></div>
    <div class="polaroid__tape polaroid__tape--bl" aria-hidden="true"></div>
    <div class="polaroid__tape polaroid__tape--br" aria-hidden="true"></div>
    <div class="polaroid__pin pin--${f.severity}" aria-hidden="true">
      <div class="pin__head"></div>
      <div class="pin__shaft"></div>
    </div>
    <div class="polaroid__photo" aria-hidden="true">${getPhoto(f.category)}</div>
    <div class="polaroid__caption">
      <div class="polaroid__smell">${escHtml(f.name)}</div>
      <div class="polaroid__lines">Lines: ${f.lines.slice(0, 3).join(', ')}${f.lines.length > 3 ? '…' : ''}</div>
    </div>
    <div class="polaroid__stamp stamp--${f.severity}" aria-hidden="true">${f.severity.toUpperCase()}</div>
  `;
}

/* ─────────────────────────────────────────────────────────────────
   § 11  CORKBOARD — DRAG AND DROP
   Uses Pointer Events API so mouse, touch and pen all work.
   Red strings are redrawn via requestAnimationFrame — one pending
   frame at a time — so the SVG update is always in sync with the
   browser's paint cycle without queuing redundant frames.
   Cards are clamped inside the board's live bounding rect.
   A Manhattan-distance threshold (> 6 px) distinguishes a click
   from a drag; if no drag occurred the detail panel opens directly
   from pointerup, preventing the subsequent click event from also
   firing by consuming it via a one-shot capture listener.
   ─────────────────────────────────────────────────────────────────*/

/**
 * Attach Pointer Events drag behaviour to a polaroid card.
 * @param {HTMLElement} card
 * @param {string}      findingId  — id used to open the detail panel on click
 */
function makeDraggable(card, findingId) {
  /* Per-drag transient state — reset on every pointerdown */
  let startX, startY, startLeft, startTop;
  let wasDragged  = false;
  let rafId       = 0;           /* pending rAF handle; 0 = none queued  */
  let pendingLeft = 0;           /* latest clamped position for rAF      */
  let pendingTop  = 0;

  /* ── Shared cleanup: fires on pointerup AND pointercancel ── */
  function endDrag(evt) {
    if (!card.classList.contains('is-dragging')) return;
    card.classList.remove('is-dragging');
    card.releasePointerCapture(evt.pointerId);
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    /* Final string redraw at resting position */
    redrawStrings();
  }

  card.addEventListener('pointerdown', evt => {
    /* button 0 = primary (left-mouse / touch / pen contact) */
    if (evt.button !== 0) return;
    evt.preventDefault();
    card.setPointerCapture(evt.pointerId);
    card.classList.add('is-dragging');

    /* Bring this card above all others */
    card.style.zIndex = ++_zTop;

    wasDragged  = false;
    startX      = evt.clientX;
    startY      = evt.clientY;
    startLeft   = parseInt(card.style.left, 10) || 0;
    startTop    = parseInt(card.style.top,  10) || 0;
    pendingLeft = startLeft;
    pendingTop  = startTop;
  });

  card.addEventListener('pointermove', evt => {
    if (!card.classList.contains('is-dragging')) return;

    const dx = evt.clientX - startX;
    const dy = evt.clientY - startY;

    /* Threshold: 6 px Manhattan distance before committing as a drag */
    if (Math.abs(dx) + Math.abs(dy) > 6) wasDragged = true;

    /* Clamp card inside the corkboard's current live boundaries */
    const bRect  = elCorkboard.getBoundingClientRect();
    const bW     = elCorkboard.offsetWidth;
    const bH     = elCorkboard.offsetHeight;
    /* margin = half card dimension so at least half the card stays visible */
    const MARGIN_X = card.offsetWidth  / 2;
    const MARGIN_Y = card.offsetHeight / 2;
    pendingLeft = Math.max(-MARGIN_X, Math.min(bW - MARGIN_X, startLeft + dx));
    pendingTop  = Math.max(-MARGIN_Y, Math.min(bH - MARGIN_Y, startTop  + dy));

    /* Schedule one rAF; skip if one is already pending */
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      card.style.left = pendingLeft + 'px';
      card.style.top  = pendingTop  + 'px';
      updateCardRegistryPos(findingId, pendingLeft, pendingTop);
      redrawStrings();
    });
  });

  card.addEventListener('pointerup', evt => {
    const wasDrag = wasDragged;
    endDrag(evt);

    if (!wasDrag) {
      /*
       * Pure click: open detail panel.
       * Consume the browser's synthetic 'click' event that will fire
       * immediately after this pointerup so the card's own click handler
       * (if any) doesn't double-fire.  We use a one-shot capture listener
       * on the card itself so it intercepts before any bubble target.
       */
      card.addEventListener('click', e => e.stopPropagation(), { capture: true, once: true });
      openDetail(findingId);
    }
  });

  /* pointercancel fires when the browser steals capture (e.g. scroll) */
  card.addEventListener('pointercancel', endDrag);
}

/**
 * Update the registered centre of a card after dragging.
 * @param {string} id   finding id
 * @param {number} left new CSS left value
 * @param {number} top  new CSS top value
 */
function updateCardRegistryPos(id, left, top) {
  const reg = cardRegistry[id];
  if (!reg) return;
  reg.cx = left + reg.w / 2;
  reg.cy = top  + reg.h / 2;
}

/* ─────────────────────────────────────────────────────────────────
   § 12  CORKBOARD — RED STRING CONNECTIONS
   Connects cards that share a category or overlapping line numbers.
   ─────────────────────────────────────────────────────────────────*/

/** Get the live SVG string layer element (re-acquired after reset). */
function getStringSvg() {
  return byId('stringSvg') || elStringSvg;
}

/** Redraw all red string paths between related cards. */
function redrawStrings() {
  const svg = getStringSvg();
  if (!svg) return;
  /* Clear previous paths */
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  if (findings.length < 2) return;

  const drawn = new Set();
  for (let i = 0; i < findings.length; i++) {
    for (let j = i + 1; j < findings.length; j++) {
      drawStringBetween(svg, findings[i], findings[j], drawn);
    }
  }
}

/**
 * Draw a string path between two findings if they are related.
 * @param {SVGElement} svg
 * @param {Object} a
 * @param {Object} b
 * @param {Set}    drawn  guard against duplicate pairs
 */
function drawStringBetween(svg, a, b, drawn) {
  const sameCategory = a.category === b.category;
  const sharedLines  = a.lines.some(ln => b.lines.includes(ln));
  if (!sameCategory && !sharedLines) return;

  const key = `${a.id}:${b.id}`;
  if (drawn.has(key)) return;
  drawn.add(key);

  const ra = cardRegistry[a.id];
  const rb = cardRegistry[b.id];
  if (!ra || !rb) return;

  /* Quadratic Bézier with a visible sag for the string */
  const mx   = (ra.cx + rb.cx) / 2;
  const my   = (ra.cy + rb.cy) / 2 + 38;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M${ra.cx},${ra.cy} Q${mx},${my} ${rb.cx},${rb.cy}`);
  path.setAttribute('class', sharedLines ? 'string-path string-path--strong' : 'string-path');
  svg.appendChild(path);
}

/* ─────────────────────────────────────────────────────────────────
   § 13  DETAIL PANEL
   ─────────────────────────────────────────────────────────────────*/

/**
 * Populate and reveal the right-column detail panel for one finding.
 * @param {string} id  finding id
 */
function openDetail(id) {
  const f = findings.find(x => x.id === id);
  if (!f) return;

  /* Deselect previous card */
  if (selectedId && cardRegistry[selectedId]) {
    cardRegistry[selectedId].el.classList.remove('is-selected');
  }
  selectedId = id;
  if (cardRegistry[id]) cardRegistry[id].el.classList.add('is-selected');

  /* Populate detail panel */
  elDetailColTitle.textContent = 'FINDING DETAIL';
  elDetailStamp.textContent    = f.severity.toUpperCase();
  elDetailStamp.className      = `detail-stamp stamp--${f.severity}`;
  elDetailName.textContent     = f.name;
  elDetailLines.textContent    = `Lines: ${f.lines.join(', ')}`;
  elDetailSev.textContent      = f.severity.toUpperCase();
  elDetailSev.className        = `detail-sev sev--${f.severity}`;
  elDetailNoir.textContent     = f.noirLine;
  elDetailCode.textContent     = f.excerpt;
  elDetailExpl.textContent     = f.explanation;
  elDetailFix.textContent      = f.fix;

  elDetailIdle.hidden    = true;
  elDetailContent.hidden = false;
  elBtnDetailClose.hidden = false;

  /* Move focus into the panel for keyboard users */
  elDetailName.setAttribute('tabindex', '-1');
  elDetailName.focus();
}

/** Close detail panel and restore idle state. */
function closeDetail() {
  if (selectedId && cardRegistry[selectedId]) {
    cardRegistry[selectedId].el.classList.remove('is-selected');
  }
  selectedId = null;
  elDetailIdle.hidden     = false;
  elDetailContent.hidden  = true;
  elBtnDetailClose.hidden = true;
  elDetailColTitle.textContent = 'SELECT A FINDING';
}

/* ─────────────────────────────────────────────────────────────────
   § 14  SUSPECT SIDEBAR
   ─────────────────────────────────────────────────────────────────*/

/**
 * Render the ranked suspect list in the intake column.
 * @param {Array<{name:string,score:number,count:number}>} suspects
 */
function renderSuspects(suspects) {
  if (!suspects.length) return;
  const maxScore = suspects[0].score;
  elSuspectList.innerHTML = '';

  suspects.forEach((s, i) => {
    const pct = Math.round((s.score / Math.max(maxScore, 1)) * 100);
    const li  = document.createElement('li');
    li.className = 'suspect-item';
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `#${i + 1} ${s.name}: score ${s.score}, ${s.count} smell${s.count > 1 ? 's' : ''}`);
    li.innerHTML = `
      <span class="suspect-rank" aria-hidden="true">${i + 1}</span>
      <span class="suspect-name">
        ${escHtml(s.name)}
        <span class="suspect-cat-meta">
          <span class="suspect-count-badge" aria-label="${s.count} finding${s.count > 1 ? 's' : ''}">${s.count}</span>
          <span class="suspect-count-label">${s.count === 1 ? 'smell' : 'smells'}</span>
        </span>
      </span>
      <div class="suspect-bar-wrap" aria-hidden="true">
        <div class="suspect-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="suspect-score" aria-hidden="true">${s.score}</span>
    `;
    elSuspectList.appendChild(li);
  });

  elSuspectsSection.hidden = false;
  elSuspectsSection.removeAttribute('hidden');
}

/* ─────────────────────────────────────────────────────────────────
   § 15  RESET & STATE HELPERS
   ─────────────────────────────────────────────────────────────────*/

/** Show or hide an element using the `hidden` attribute. */
function setHidden(el, hide) {
  if (hide) {
    el.setAttribute('hidden', '');
    el.hidden = true;
  } else {
    el.removeAttribute('hidden');
    el.hidden = false;
  }
}

/** Set the header status text and regenerate the case number. */
function setStatus(text) {
  elStatusText.textContent = text;
}

/** Clear all investigation state and reset UI to idle. */
function resetAll() {
  findings     = [];
  cardRegistry = {};
  selectedId   = null;
  _findingSeq  = 0;

  /* Rebuild corkboard (wipes cards, recreates the SVG layer) */
  elCorkboard.innerHTML = '<svg class="string-svg" id="stringSvg" aria-hidden="true" focusable="false"></svg>';
  elStringSvg = byId('stringSvg');

  setHidden(elBoardIdle,   false);
  elBoardIdle.removeAttribute('aria-hidden');
  setHidden(elCorkboard,   true);
  setHidden(elMetricsStrip, true);
  setHidden(elTypewriterBox, true);
  setHidden(elSuspectsSection, true);
  setHidden(elBtnCloseCase, true);
  setHidden(elDetailContent, true);
  setHidden(elBtnDetailClose, true);
  setHidden(elDetailIdle, false);

  elDetailColTitle.textContent = 'SELECT A FINDING';
  setStatus('AWAITING EVIDENCE');
}

/** Return a promise that resolves after `ms` milliseconds. */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/* ─────────────────────────────────────────────────────────────────
   § 16  MAIN INVESTIGATION FLOW
   ─────────────────────────────────────────────────────────────────*/

const LOADING_PHRASES = [
  'Lighting a cigarette…',
  'Examining the evidence…',
  'Running prints through the database…',
  'Cross-referencing prior offenses…',
  'Dusting for code smells…',
  'Interrogating the syntax…',
  'Checking the usual suspects…',
  'Following the paper trail…',
];

/**
 * Entry point: validate input, show loading state, run detectors,
 * render board and sidebar, show results.
 */
async function runInvestigation() {
  const code = elCodeInput.value.trim();
  if (!code) {
    flashError(elCodeInput);
    return;
  }

  /* ── Lock UI, show loading ── */
  elBtnInvestigate.disabled = true;
  setStatus('INVESTIGATING…');
  setHidden(elBoardIdle,     true);
  setHidden(elCorkboard,     false);
  elCorkboard.removeAttribute('aria-hidden');
  setHidden(elBoardLoading,  false);

  /* Clear any old cards (keep the SVG layer) */
  [...elCorkboard.children].forEach(c => { if (c.id !== 'stringSvg') c.remove(); });
  elStringSvg = byId('stringSvg') || elStringSvg;
  if (elStringSvg) elStringSvg.innerHTML = '';

  /* ── Typewriter intro ── */
  setHidden(elTypewriterBox, false);
  typewrite(pick(INTROS));

  /* ── Animate loading phrase ── */
  let pi = 0;
  elLoadingCaption.textContent = LOADING_PHRASES[0];
  const phraseInterval = setInterval(() => {
    pi = (pi + 1) % LOADING_PHRASES.length;
    elLoadingCaption.textContent = LOADING_PHRASES[pi];
  }, 550);

  await sleep(750 + Math.random() * 350);
  clearInterval(phraseInterval);

  /* ── Run detectors ── */
  _findingSeq = 0;
  findings = runAllDetectors(code);

  /* ── Metrics ── */
  const loc     = code.split('\n').length;
  const score   = calcDebtScore(findings);
  const verdict = scoreToVerdict(score);

  elMloc.textContent     = loc;
  elMsmells.textContent  = findings.length;
  elMscore.textContent   = score;
  elMverdict.textContent = verdict;
  setHidden(elMetricsStrip, false);

  /* ── Typewriter conclusion (delayed) ── */
  setTimeout(() => typewrite(pick(VERDICTS[verdict])), 1400);

  /* ── Status ── */
  setStatus(findings.length > 0
    ? `${findings.length} SMELL${findings.length !== 1 ? 'S' : ''} — ${verdict}`
    : 'CASE CLOSED — CLEAN');
  elCaseNumber.textContent = generateCaseNumber();

  /* ── Hide loading ── */
  setHidden(elBoardLoading, true);

  /* ── Spawn cards with staggered animation ── */
  const boardRect = elCorkboard.getBoundingClientRect();
  const bw = boardRect.width  || 600;
  const bh = boardRect.height || 500;

  findings.forEach((f, i) => {
    setTimeout(() => {
      spawnCard(f, bw, bh, i, findings.length);
      if (i === findings.length - 1) redrawStrings();
    }, i * 110);
  });

  /* ── Suspects sidebar ── */
  renderSuspects(buildSuspects(findings));

  /* ── Show Close Case button ── */
  setHidden(elBtnCloseCase, false);

  elBtnInvestigate.disabled = false;
}

/** Briefly flash a red outline on an element to indicate an error. */
function flashError(el) {
  el.style.outline = '2px solid #b3202a';
  setTimeout(() => (el.style.outline = ''), 1400);
}

/* ─────────────────────────────────────────────────────────────────
   § 17  CASE REPORT MODAL
   ─────────────────────────────────────────────────────────────────*/

/** Populate and open the printable case report modal. */
function openCaseReport() {
  const code    = elCodeInput.value.trim();
  const score   = parseInt(elMscore.textContent, 10) || 0;
  const verdict = elMverdict.textContent || 'CLEAN';
  const lang    = elLangSelect.options[elLangSelect.selectedIndex].text;
  const date    = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  /* ── Header ── */
  elRpCaseNo.textContent      = elCaseNumber.textContent;
  elRpDate.textContent        = date;
  elRpLang.textContent        = lang;
  elRpLines.textContent       = code.split('\n').length;
  elRpScore.textContent       = score;
  /* Mirror case number + date into print-only masthead spans */
  elRpPrintCaseNo.textContent = elCaseNumber.textContent;
  elRpPrintDate.textContent   = date;

  /* ── Verdict banner ── */
  populateVerdictBanner(verdict);

  /* ── Findings table ── */
  populateReportTable();

  /* ── Recommendations ── */
  populateReportRecs();

  /* ── Sign-off line ── */
  elRpSignOff.textContent = pick(CASE_SIGN_OFFS);

  setHidden(elReportModal, false);
  /* Move focus to modal for keyboard navigation */
  byId('modalHeading').setAttribute('tabindex', '-1');
  byId('modalHeading').focus();
}

/** Set verdict banner colour class and label text. */
function populateVerdictBanner(verdict) {
  elRpVerdictBanner.className = 'rpt-verdict';
  const config = {
    GUILTY:     { cls: 'rpt-verdict--guilty',     icon: '⚖️', label: '● GUILTY AS CHARGED' },
    SUSPICIOUS: { cls: 'rpt-verdict--suspicious',  icon: '🔍', label: '◑ UNDER SUSPICION'  },
    CLEAN:      { cls: 'rpt-verdict--clean',       icon: '✓',  label: '○ CASE CLOSED — CLEAN' },
  };
  const c = config[verdict] || config.CLEAN;
  elRpVerdictBanner.classList.add(c.cls);
  elRpVerdictIcon.textContent  = c.icon;
  elRpVerdictLabel.textContent = c.label;
}

/** Build the findings table rows in the report. */
function populateReportTable() {
  elRpTableBody.innerHTML = '';
  if (!findings.length) {
    elRpTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:.75rem;font-style:italic">No findings — code appears clean.</td></tr>';
    return;
  }
  findings.forEach((f, i) => {
    const briefFix = f.fix.split('\n').find(ln => ln.trim() && !ln.trim().startsWith('//')) || f.fix.split('\n')[0];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escHtml(f.name)}</td>
      <td>${f.lines.slice(0, 3).join(', ')}${f.lines.length > 3 ? '…' : ''}</td>
      <td class="rt--${f.severity}">${f.severity.toUpperCase()}</td>
      <td>${escHtml(briefFix.substring(0, 85))}${briefFix.length > 85 ? '…' : ''}</td>
    `;
    elRpTableBody.appendChild(tr);
  });
}

/** Build the recommendations list in the report. */
function populateReportRecs() {
  const REC_MAP = {
    Design:          'Apply SOLID principles — Single Responsibility above all. Each function should do one thing.',
    Complexity:      'Use guard clauses and early returns to flatten deeply nested conditionals.',
    Maintainability: "Follow DRY (Don't Repeat Yourself). Extract duplicated logic into shared, named functions.",
    Hygiene:         'Run a linter (ESLint, Pylint) on every commit. Remove debug statements before merging.',
    Readability:     'Name variables semantically. Avoid abbreviations and single-letter names outside loop counters.',
    Correctness:     'Use strict equality (===) throughout. Consider TypeScript for type safety.',
    Reliability:     'Never silently swallow exceptions. Always log or re-throw errors with context.',
  };
  elRpRecs.innerHTML = '';
  const cats = [...new Set(findings.map(f => f.category))];
  if (!cats.length) {
    elRpRecs.innerHTML = '<li>No specific recommendations — continue applying clean code principles.</li>';
    return;
  }
  cats.forEach(cat => {
    if (!REC_MAP[cat]) return;
    const li = document.createElement('li');
    li.innerHTML = `<strong>${escHtml(cat)}:</strong> ${escHtml(REC_MAP[cat])}`;
    elRpRecs.appendChild(li);
  });
}

/** Close the report modal. */
function closeReportModal() {
  setHidden(elReportModal, true);
  /* Return focus to the button that opened it */
  elBtnCloseCase.focus();
}

/* ─────────────────────────────────────────────────────────────────
   § 18  EVENT BINDINGS
   All event handlers are registered here — no inline HTML handlers.
   ─────────────────────────────────────────────────────────────────*/

/** Register all application event listeners. */
function bindEvents() {
  /* ── Editor ── */
  elCodeInput.addEventListener('input',   updateGutter);
  elCodeInput.addEventListener('scroll',  syncGutterScroll, { passive: true });
  elCodeInput.addEventListener('keydown', handleEditorKeydown);

  /* ── Intake toolbar ── */
  elBtnClear.addEventListener('click', () => {
    elCodeInput.value = '';
    updateGutter();
    resetAll();
  });
  elBtnSample.addEventListener('click', () => {
    elCodeInput.value = SAMPLE_CODE;
    updateGutter();
  });
  elBtnInvestigate.addEventListener('click', runInvestigation);

  /* ── Detail panel ── */
  elBtnDetailClose.addEventListener('click', closeDetail);

  /* ── Case report ── */
  elBtnCloseCase.addEventListener('click',   openCaseReport);
  elBtnCloseModal.addEventListener('click',  closeReportModal);
  elBtnPrint.addEventListener('click',       () => window.print());

  /* Close modal on overlay backdrop click */
  elReportModal.addEventListener('click', evt => {
    if (evt.target === elReportModal) closeReportModal();
  });

  /* ── Global keyboard shortcuts ── */
  document.addEventListener('keydown', evt => {
    if (evt.key === 'Escape' && !elReportModal.hidden) closeReportModal();
  });
}

/* ─────────────────────────────────────────────────────────────────
   BOOTSTRAP — script is loaded with defer, so DOM is ready here.
   ─────────────────────────────────────────────────────────────────*/
init();
