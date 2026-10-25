/* ═══════════════════════════════════════════════════════════════
   TECH DEBT DETECTIVE — app.js  (v2 full rebuild)
   Vanilla JS only — no frameworks, no build tools
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════
//  DOM REFS
// ════════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);

const codeInput      = $('codeInput');
const langSelect     = $('langSelect');
const editorGutter   = $('editorGutter');
const btnInvestigate = $('btnInvestigate');
const btnClear       = $('btnClear');
const btnSample      = $('btnSample');
const btnCloseCase   = $('btnCloseCase');
const btnPrint       = $('btnPrint');
const btnCloseModal  = $('btnCloseModal');
const btnDetailClose = $('btnDetailClose');

const statusText     = $('statusText');
const caseNumber     = $('caseNumber');
const metricsStrip   = $('metricsStrip');
const mLoc           = $('mLoc');
const mSmells        = $('mSmells');
const mScore         = $('mScore');
const mVerdict       = $('mVerdict');

const typewriterBox  = $('typewriterBox');
const typewriterText = $('typewriterText');
const suspectsBox    = $('suspectsBox');
const suspectList    = $('suspectList');

const boardIdle      = $('boardIdle');
const boardLoading   = $('boardLoading');
const loadingLine    = $('loadingLine');
const corkboard      = $('corkboard');
let   stringLayer    = $('stringLayer');

const detailIdle     = $('detailIdle');
const detailContent  = $('detailContent');
const detailColTitle = $('detailColTitle');
const detailStamp    = $('detailStamp');
const detailSmell    = $('detailSmell');
const detailLines    = $('detailLines');
const detailSev      = $('detailSev');
const detailNoir     = $('detailNoir');
const detailCode     = $('detailCode');
const detailExplanation = $('detailExplanation');
const detailFix      = $('detailFix');

const reportModal    = $('reportModal');
const rpCaseNo       = $('rpCaseNo');
const rpDate         = $('rpDate');
const rpLang         = $('rpLang');
const rpLines        = $('rpLines');
const rpVerdictBanner = $('rpVerdictBanner');
const rpVerdictIcon  = $('rpVerdictIcon');
const rpVerdictLabel = $('rpVerdictLabel');
const rpScore        = $('rpScore');
const rpTableBody    = $('rpTableBody');
const rpRecs         = $('rpRecs');

const grain          = $('grain');

// ════════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════════
let currentFindings  = [];   // array of finding objects
let cardRegistry     = {};   // id → { el, cx, cy }
let selectedId       = null;

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
document.getElementById('yr').textContent = new Date().getFullYear();
caseNumber.textContent = String(1000 + Math.floor(Math.random() * 8999));
initGrain();
updateGutter();

// ════════════════════════════════════════════════════════════
//  FILM GRAIN
// ════════════════════════════════════════════════════════════
function initGrain() {
  const ctx = grain.getContext('2d');
  function resize() { grain.width = innerWidth; grain.height = innerHeight; }
  resize();
  addEventListener('resize', resize);
  function draw() {
    const w = grain.width, h = grain.height;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i+1] = d[i+2] = v;
      d[i+3] = 10;
    }
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(draw);
  }
  draw();
}

// ════════════════════════════════════════════════════════════
//  EDITOR GUTTER
// ════════════════════════════════════════════════════════════
function updateGutter() {
  const n = codeInput.value.split('\n').length;
  let s = '';
  for (let i = 1; i <= n; i++) s += i + '\n';
  editorGutter.textContent = s;
}
codeInput.addEventListener('input', updateGutter);
codeInput.addEventListener('scroll', () => { editorGutter.scrollTop = codeInput.scrollTop; });
codeInput.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = codeInput.selectionStart, end = codeInput.selectionEnd;
    codeInput.value = codeInput.value.substring(0, s) + '  ' + codeInput.value.substring(end);
    codeInput.selectionStart = codeInput.selectionEnd = s + 2;
    updateGutter();
  }
});

// ════════════════════════════════════════════════════════════
//  SAMPLE EVIDENCE  (deliberately messy 60+ line JS function)
// ════════════════════════════════════════════════════════════
const SAMPLE_CODE = `// UserDataProcessor.js  — legacy service, DO NOT TOUCH
var data = [];
var data2 = [];
var temp = null;
var flag = false;
var x = 0;

// TODO: refactor this entire file someday
// FIXME: magic numbers everywhere

function processUserData(u, d, opts, cb, ctx, extra) {
  // get user
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

  // magic numbers: 1337, 9999, 42
  if (result > 9999) {
    result = 9999;
  }
  if (result < 42) {
    result = 0;
  }

  // TODO: validate cb before calling
  var t = new Date().getTime();
  temp = result;
  data2.push(result);
  data2.push(result2);

  // dead code below
  // var oldCalc = result * 1.15;
  // return oldCalc;
  // if (extra) { result += extra.bonus * 1337; }

  try {
    cb(null, result);
  } catch(e) {}

  return result;
}

function calcTax(v, r) {
  // another magic number
  return v * 0.0875;
}

function calcTax(v, r) {
  // duplicate function definition
  return v * r;
}
`;

btnSample.addEventListener('click', () => {
  codeInput.value = SAMPLE_CODE;
  updateGutter();
});
btnClear.addEventListener('click', () => {
  codeInput.value = '';
  updateGutter();
  resetAll();
});

// ════════════════════════════════════════════════════════════
//  SMELL DETECTION ENGINE
//  Each detector returns an array of finding objects:
//  { id, name, severity, lines[], excerpt, explanation, fix, noirLine, category, score }
// ════════════════════════════════════════════════════════════

let _findingCounter = 0;
function nextId() { return 'f' + (++_findingCounter); }

// ── Helpers ──────────────────────────────────────────────────
function lineOf(code, idx) {
  return code.substring(0, idx).split('\n').length;
}
function getLines(code, startLine, count) {
  const all = code.split('\n');
  return all.slice(startLine - 1, startLine - 1 + count).join('\n');
}
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ════════════════════════════════════════════════════════════
const DETECTORS = [

  // ── 1. LONG FUNCTION ──────────────────────────────────────
  {
    run(code) {
      const findings = [];
      // Match function headers
      const fnRe = /(?:^|\n)([ \t]*)(?:(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()([^{]*)\{/g;
      let m;
      while ((m = fnRe.exec(code)) !== null) {
        const fnName = m[2] || m[3] || '(anonymous)';
        const startIdx = m.index;
        const startLine = lineOf(code, startIdx);
        // count lines until matching closing brace
        const snippet = code.slice(startIdx);
        let depth = 0, endLine = startLine;
        const sLines = snippet.split('\n');
        for (let i = 0; i < sLines.length; i++) {
          depth += (sLines[i].match(/\{/g)||[]).length;
          depth -= (sLines[i].match(/\}/g)||[]).length;
          if (depth <= 0 && i > 0) { endLine = startLine + i; break; }
        }
        const fnLength = endLine - startLine + 1;
        if (fnLength >= 20) {
          findings.push({
            id: nextId(), name: 'Long Function',
            severity: fnLength >= 40 ? 'critical' : 'high',
            lines: [startLine, endLine],
            excerpt: getLines(code, startLine, 4),
            explanation: `Function "${fnName}" spans ${fnLength} lines. Functions should do one thing and fit on a screen (ideally under 20 lines). Long functions are hard to test, debug, and maintain.`,
            fix: `// Break "${fnName}" into smaller, focused helpers:\nfunction ${fnName}() {\n  const data = fetchData();\n  const result = processData(data);\n  return formatResult(result);\n}`,
            noirLine: `${fnLength} lines. That's not a function, kid — that's a novel. And nobody reads the whole novel.`,
            category: 'Design',
            score: Math.min(30, Math.round(fnLength / 2))
          });
        }
      }
      return findings;
    }
  },

  // ── 2. DEEP NESTING ───────────────────────────────────────
  {
    run(code) {
      const findings = [];
      const lines = code.split('\n');
      let maxDepth = 0, maxLine = 0;
      let depth = 0;
      lines.forEach((ln, i) => {
        depth += (ln.match(/[\{\(]/g)||[]).length;
        depth -= (ln.match(/[\}\)]/g)||[]).length;
        if (depth > maxDepth) { maxDepth = depth; maxLine = i + 1; }
      });
      if (maxDepth >= 4) {
        findings.push({
          id: nextId(), name: 'Deep Nesting',
          severity: maxDepth >= 6 ? 'critical' : 'high',
          lines: [maxLine],
          excerpt: getLines(code, Math.max(1, maxLine - 2), 5),
          explanation: `Nesting reaches ${maxDepth} levels deep around line ${maxLine}. Deep nesting signals complex conditional logic that is hard to follow and test. The "arrow anti-pattern" — where code drifts right across the screen — is a hallmark of unrefactored legacy code.`,
          fix: `// Use guard clauses (early returns) to flatten nesting:\nfunction process(user, data) {\n  if (!user) return null;\n  if (!user.active) return null;\n  if (!data?.items?.length) return 0;\n  // main logic here — now at 1 level\n}`,
          noirLine: `Nested ${maxDepth} levels deep. Somebody was hiding something. The deeper you go, the dirtier it gets.`,
          category: 'Complexity',
          score: maxDepth * 5
        });
      }
      return findings;
    }
  },

  // ── 3. MAGIC NUMBERS ──────────────────────────────────────
  {
    run(code) {
      const findings = [];
      const re = /(?<![.\w'"`])(\b(?!0\b|1\b|2\b|-1\b)\d{2,}(?:\.\d+)?\b)(?![.\w'"`])/g;
      const hits = new Map();
      let m;
      while ((m = re.exec(code)) !== null) {
        const num = m[1];
        const ln = lineOf(code, m.index);
        // skip for-loop bounds that are obviously array length
        if (!hits.has(num)) hits.set(num, []);
        hits.get(num).push(ln);
      }
      const interesting = [...hits.entries()].filter(([,lns]) => lns.length >= 1 && parseFloat(lns[0]||0) || true);
      interesting.slice(0, 4).forEach(([num, lns]) => {
        findings.push({
          id: nextId(), name: 'Magic Number',
          severity: 'medium',
          lines: lns.slice(0, 3),
          excerpt: getLines(code, lns[0], 1),
          explanation: `The literal value ${num} appears without a named constant. Magic numbers are unexplained numeric literals — future maintainers won't know if "9999" means a maximum order value, an error code, or an arbitrary cutoff.`,
          fix: `// Replace with a named constant:\nconst MAX_RESULT_VALUE = ${num};\n// ... then use MAX_RESULT_VALUE in your code`,
          noirLine: `"${num}". Just a number floating in the code. No name. No explanation. Where did it come from? Nobody knows.`,
          category: 'Readability',
          score: 8
        });
      });
      return findings;
    }
  },

  // ── 4. DUPLICATED CODE BLOCKS ─────────────────────────────
  {
    run(code) {
      const findings = [];
      const lines = code.split('\n').map(l => l.trim());
      const BLOCK = 4;
      const seen = new Map();
      for (let i = 0; i <= lines.length - BLOCK; i++) {
        const block = lines.slice(i, i + BLOCK)
          .filter(l => l.length > 4 && !l.startsWith('//') && !l.startsWith('*'))
          .join('\n');
        if (block.length < 40) continue;
        if (seen.has(block)) {
          const firstLine = seen.get(block) + 1;
          if (findings.length < 3) {
            findings.push({
              id: nextId(), name: 'Duplicated Code Block',
              severity: 'critical',
              lines: [firstLine, i + 1],
              excerpt: getLines(code, firstLine, BLOCK),
              explanation: `A block of ${BLOCK}+ lines starting at line ${firstLine} is copy-pasted verbatim at line ${i + 1}. Duplicated code means bugs get fixed in one place but not the other. Classic DRY (Don't Repeat Yourself) violation.`,
              fix: `// Extract the shared logic into a function:\nfunction processBlock(items) {\n  // ... shared logic ...\n}\n// Call it in both places`,
              noirLine: `Copy. Paste. The oldest crime in the book. Fix a bug here, forget to fix it there. This one's a ticking clock.`,
              category: 'Maintainability',
              score: 25
            });
          }
        } else {
          seen.set(block, i);
        }
      }
      return findings;
    }
  },

  // ── 5. COMMENTED-OUT DEAD CODE ────────────────────────────
  {
    run(code) {
      const findings = [];
      const lines = code.split('\n');
      let runStart = -1, runCount = 0;
      const runs = [];
      lines.forEach((ln, i) => {
        const t = ln.trim();
        const isDeadCode = /^\/\/\s*(?!TODO|FIXME|HACK|NOTE|@|=+|─+|\*)[^\s]/.test(t) && t.length > 8
          && /[;=\(\)\.\{\}]/.test(t);
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
        findings.push({
          id: nextId(), name: 'Commented-Out Dead Code',
          severity: 'low',
          lines: [r.start, r.start + r.count - 1],
          excerpt: getLines(code, r.start, r.count),
          explanation: `${r.count} lines of code have been commented out starting at line ${r.start}. This is dead code left in "just in case." Use version control (git) instead — delete it and recover it with git log if needed.`,
          fix: `// DELETE the commented code.\n// Your VCS is the undo button.\n// git log --all --full-history -- path/to/file`,
          noirLine: `Somebody left a body in the codebase. Commented out, not deleted. They couldn't bring themselves to bury it properly.`,
          category: 'Hygiene',
          score: 6
        });
      });
      return findings;
    }
  },

  // ── 6. TODO / FIXME LEFTOVERS ─────────────────────────────
  {
    run(code) {
      const findings = [];
      const re = /\/\/\s*(TODO|FIXME|HACK|XXX|BUG)[:\s].{3,}/gi;
      const hits = [];
      let m;
      while ((m = re.exec(code)) !== null) {
        hits.push({ text: m[0].trim(), line: lineOf(code, m.index) });
      }
      if (hits.length > 0) {
        findings.push({
          id: nextId(), name: 'TODO / FIXME Leftovers',
          severity: 'low',
          lines: hits.map(h => h.line),
          excerpt: hits.slice(0, 3).map(h => h.text).join('\n'),
          explanation: `${hits.length} unresolved TODO/FIXME comment${hits.length > 1 ? 's' : ''} found. These are IOUs on the technical debt ledger — promises that were never kept. They signal known problems that were deferred indefinitely.`,
          fix: `// File a real ticket instead:\n// JIRA-1234: Refactor processUserData into smaller functions\n// Then remove the comment — the ticket IS the reminder.`,
          noirLine: `"${hits[0].text.substring(0, 60)}." Somebody knew this was wrong. They wrote it down and walked away. That makes it worse.`,
          category: 'Hygiene',
          score: 4 * hits.length
        });
      }
      return findings;
    }
  },

  // ── 7. POOR / VAGUE NAMING ────────────────────────────────
  {
    run(code) {
      const findings = [];
      // single-letter variables and obvious vague names
      const vague = ['data2','temp','temp2','flag','result2','x','foo','bar','baz','stuff','thing','obj','arr','val'];
      const re = /\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=;]/g;
      const found = [];
      let m;
      while ((m = re.exec(code)) !== null) {
        const name = m[1];
        if (vague.includes(name.toLowerCase()) || /^[a-z]$/.test(name)) {
          const ln = lineOf(code, m.index);
          if (!found.find(f => f.name === name)) found.push({ name, line: ln });
        }
      }
      if (found.length >= 2) {
        findings.push({
          id: nextId(), name: 'Poor Variable Naming',
          severity: 'medium',
          lines: found.slice(0, 5).map(f => f.line),
          excerpt: found.slice(0, 4).map(f => `${f.name} (line ${f.line})`).join(', '),
          explanation: `Vague or cryptic variable names found: ${found.map(f => f.name).join(', ')}. Names like "data2", "temp", and "flag" force every reader to decode intent from context. Code is read 10× more than it's written.`,
          fix: `// Name things for what they ARE:\n// data2    → pendingOrderItems\n// temp     → accumulatedTotal\n// flag     → isAdminUser\n// result2  → extraItemsTotal`,
          noirLine: `"data2". "temp". "flag". The names tell me nothing. In this city, a man without a name is a man with something to hide.`,
          category: 'Readability',
          score: 10
        });
      }
      return findings;
    }
  },

  // ── 8. TOO MANY PARAMETERS ────────────────────────────────
  {
    run(code) {
      const findings = [];
      const re = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()\s*([^)]{30,})\)/g;
      let m;
      while ((m = re.exec(code)) !== null) {
        const params = m[3].split(',').map(p => p.trim()).filter(p => p.length > 0);
        if (params.length >= 5) {
          const fnName = m[1] || m[2] || '(fn)';
          const ln = lineOf(code, m.index);
          findings.push({
            id: nextId(), name: 'Too Many Parameters',
            severity: 'high',
            lines: [ln],
            excerpt: getLines(code, ln, 1),
            explanation: `Function "${fnName}" takes ${params.length} parameters: (${params.slice(0,5).join(', ')}${params.length > 5 ? '…' : ''}). More than 3–4 parameters is a code smell indicating the function does too much or needs a configuration object.`,
            fix: `// Introduce a parameter object:\nfunction ${fnName}(options) {\n  const { user, data, callback, context } = options;\n  // ...\n}`,
            noirLine: `${params.length} parameters. When you need that much to get started, you've already lost the plot.`,
            category: 'Design',
            score: params.length * 4
          });
        }
      }
      return findings;
    }
  },

  // ── 9. DEBUG STATEMENTS ───────────────────────────────────
  {
    run(code) {
      const findings = [];
      const re = /\b(console\.(log|warn|error|debug|info)|debugger\b|alert\s*\()/g;
      const locs = [];
      let m;
      while ((m = re.exec(code)) !== null) locs.push(lineOf(code, m.index));
      if (locs.length > 0) {
        findings.push({
          id: nextId(), name: 'Debug Statements Left In',
          severity: 'medium',
          lines: [...new Set(locs)],
          excerpt: getLines(code, locs[0], 1),
          explanation: `${locs.length} debug statement${locs.length > 1 ? 's' : ''} (console.log, debugger, etc.) found in production code. These clutter logs, expose internals, and signal code that was never properly cleaned up after development.`,
          fix: `// Remove console.logs or replace with a real logger:\nimport { logger } from './logger';\nlogger.debug('Processing item:', item); // controlled by log level`,
          noirLine: `console.log("processing item"). The developer was watching their own shadow. Now everyone else has to read about it.`,
          category: 'Hygiene',
          score: locs.length * 3
        });
      }
      return findings;
    }
  },

  // ── 10. LOOSE EQUALITY ────────────────────────────────────
  {
    run(code) {
      const findings = [];
      const re = /(?<!=|!)={1,2}(?!=)/g;
      const locs = [];
      let m;
      while ((m = re.exec(code)) !== null) {
        const op = m[0];
        if (op === '==' || op === '!=') {
          locs.push(lineOf(code, m.index));
        }
      }
      if (locs.length >= 2) {
        findings.push({
          id: nextId(), name: 'Loose Equality (== / !=)',
          severity: 'medium',
          lines: [...new Set(locs)].slice(0, 5),
          excerpt: getLines(code, locs[0], 1),
          explanation: `${locs.length} loose equality comparisons (== or !=) found. JavaScript's type coercion rules make these treacherous: null == undefined is true, 0 == '' is true, 1 == '1' is true. Use strict equality (=== / !==) always.`,
          fix: `// Always use strict equality:\nif (user !== null) { ... }    // was: user != null\nif (status === 'admin') { ... } // was: status == "admin"`,
          noirLine: `"u != null". Three characters standing between your app and a type-coercion nightmare. In this city, loose is never good.`,
          category: 'Correctness',
          score: locs.length * 4
        });
      }
      return findings;
    }
  },

  // ── 11. SWALLOWED EXCEPTIONS ──────────────────────────────
  {
    run(code) {
      const findings = [];
      const re = /catch\s*\([^)]*\)\s*\{([^}]{0,60})\}/g;
      let m;
      while ((m = re.exec(code)) !== null) {
        const body = m[1].trim();
        if (body === '' || body === '//' || /^\/\/.{0,20}$/.test(body)) {
          const ln = lineOf(code, m.index);
          findings.push({
            id: nextId(), name: 'Swallowed Exception',
            severity: 'high',
            lines: [ln],
            excerpt: getLines(code, ln, 3),
            explanation: `An empty catch block at line ${ln} silently discards all errors. When exceptions are swallowed, failures become invisible — the system appears to work while data is lost or corrupted in the background.`,
            fix: `// Always log or re-throw:\ncatch (err) {\n  logger.error('processUserData failed:', err);\n  throw err; // let the caller decide what to do\n}`,
            noirLine: `catch(e) {}. The perfect crime. An error occurred. Nobody reported it. Nobody investigated. Nobody will ever know.`,
            category: 'Reliability',
            score: 20
          });
        }
      }
      return findings;
    }
  },

  // ── 12. DUPLICATE FUNCTION DECLARATIONS ──────────────────
  {
    run(code) {
      const findings = [];
      const re = /function\s+(\w+)\s*\(/g;
      const seen = {};
      let m;
      while ((m = re.exec(code)) !== null) {
        const name = m[1];
        const ln = lineOf(code, m.index);
        if (seen[name] !== undefined) {
          findings.push({
            id: nextId(), name: 'Duplicate Function Declaration',
            severity: 'critical',
            lines: [seen[name], ln],
            excerpt: getLines(code, ln, 2),
            explanation: `Function "${name}" is declared twice — first at line ${seen[name]}, then at line ${ln}. In JavaScript (non-strict mode) the second definition silently overwrites the first. This is a latent bug waiting to fire.`,
            fix: `// Remove the duplicate. If both are needed,\n// give them different names reflecting their purpose:\nfunction calcTaxStandard(v) { return v * 0.0875; }\nfunction calcTaxCustom(v, rate) { return v * rate; }`,
            noirLine: `"${name}" declared twice. The second one killed the first. Quiet. Clean. Nobody noticed until it was too late.`,
            category: 'Correctness',
            score: 25
          });
        } else {
          seen[name] = ln;
        }
      }
      return findings;
    }
  },

];

// ════════════════════════════════════════════════════════════
//  NOIR NARRATION
// ════════════════════════════════════════════════════════════

const INTROS = [
  "The code landed on my desk at midnight. I lit a cigarette and read the first line. By the third, I already knew we had a problem.",
  "She said it was just a 'quick refactor.' Three hundred lines later, I wasn't laughing.",
  "They called it legacy. I called it a crime scene. Same thing, different paperwork.",
  "Rain hammered the window. I cracked open the file. The smell hit me before the first function.",
  "Another anonymous tip. Another developer who swore the code was 'basically clean.' They always do.",
  "I've been doing this twenty years. Some cases are straightforward. This wasn't one of them.",
];

const VERDICTS = {
  GUILTY:     ['This code is guilty. Multiple counts, no mitigating circumstances. The jury took five minutes.', 'The evidence is damning. There is no version of this story that ends well for the codebase.', 'I\'ve built cases on less. This file is going downtown.'],
  SUSPICIOUS: ['Enough here to keep the case open. Not an arrest — not yet. But I\'m watching.', 'Could be clean. Could be dirty. Right now it\'s sitting in the grey zone, and that\'s where trouble brews.', 'Suspicious. Not convicted. But I\'m not closing the file either.'],
  CLEAN:      ['Nothing. Not a trace. Either this developer knows their craft — or they\'re very good at hiding the evidence.', 'Clean as a whistle. Either that or somebody swept the scene before I arrived.', 'I came looking for a crime and found nothing. That\'s either very good news, or a very good cover-up.'],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ════════════════════════════════════════════════════════════
//  SCORING & SUSPECTS
// ════════════════════════════════════════════════════════════
function severityWeight(s) {
  return { critical: 25, high: 15, medium: 8, low: 3 }[s] ?? 0;
}
function calcDebtScore(findings) {
  return Math.min(100, findings.reduce((acc, f) => acc + (f.score || severityWeight(f.severity)), 0));
}
function verdictFromScore(score) {
  if (score >= 50) return 'GUILTY';
  if (score >= 15) return 'SUSPICIOUS';
  return 'CLEAN';
}
function buildSuspects(findings) {
  // Group by category, sum scores
  const map = {};
  findings.forEach(f => {
    const key = f.category || 'General';
    if (!map[key]) map[key] = { name: key, score: 0, smells: 0 };
    map[key].score += (f.score || severityWeight(f.severity));
    map[key].smells++;
  });
  return Object.values(map).sort((a, b) => b.score - a.score);
}

// ════════════════════════════════════════════════════════════
//  TYPEWRITER ANIMATION
// ════════════════════════════════════════════════════════════
let _typeTimer = null;
function typewrite(text, onDone) {
  clearTimeout(_typeTimer);
  typewriterText.textContent = '';
  typewriterText.classList.add('typewriter-cursor');
  let i = 0;
  function next() {
    if (i < text.length) {
      typewriterText.textContent += text[i++];
      _typeTimer = setTimeout(next, 18 + Math.random() * 12);
    } else {
      typewriterText.classList.remove('typewriter-cursor');
      if (onDone) onDone();
    }
  }
  next();
}

// ════════════════════════════════════════════════════════════
//  CORKBOARD RENDERING
// ════════════════════════════════════════════════════════════

// Inline SVG "photos" — one per category, drawn as simple noir illustrations
const SMELL_PHOTOS = {
  Design: (sev) => `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <rect x="10" y="20" width="134" height="70" rx="2" fill="none" stroke="#3a3020" stroke-width="1"/>
    <!-- Blueprint-style diagram -->
    <line x1="77" y1="20" x2="77" y2="90" stroke="#${sev==='critical'?'8a1a10':sev==='high'?'7a4000':'6a5a00'}" stroke-width="1" stroke-dasharray="4 2"/>
    <rect x="20" y="35" width="40" height="22" rx="1" fill="none" stroke="#c8aa6e" stroke-width="1.5" opacity=".6"/>
    <rect x="94" y="35" width="40" height="22" rx="1" fill="none" stroke="#c8aa6e" stroke-width="1.5" opacity=".6"/>
    <rect x="45" y="65" width="65" height="22" rx="1" fill="none" stroke="#c8aa6e" stroke-width="1" opacity=".4"/>
    <line x1="40" y1="46" x2="94" y2="46" stroke="#c8aa6e" stroke-width="1" opacity=".4"/>
    <line x1="77" y1="57" x2="77" y2="65" stroke="#c8aa6e" stroke-width="1" opacity=".4"/>
    <text x="77" y="8" font-family="monospace" font-size="7" fill="#7a6a50" text-anchor="middle">STRUCTURE</text>
  </svg>`,

  Complexity: () => `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <!-- Nested brackets visualisation -->
    <rect x="10" y="15" width="134" height="80" rx="1" fill="none" stroke="#2a2010" stroke-width="1"/>
    <text x="18" y="32" font-family="monospace" font-size="8" fill="#c8aa6e" opacity=".5">if {</text>
    <text x="28" y="44" font-family="monospace" font-size="8" fill="#c8aa6e" opacity=".5">  if {</text>
    <text x="38" y="56" font-family="monospace" font-size="8" fill="#c0392b" opacity=".7">    if {</text>
    <text x="48" y="68" font-family="monospace" font-size="8" fill="#c0392b" opacity=".85">      if {</text>
    <text x="58" y="80" font-family="monospace" font-size="8" fill="#c0392b">        ...</text>
    <line x1="14" y1="34" x2="14" y2="85" stroke="#c8aa6e" stroke-width="1" opacity=".2"/>
    <line x1="24" y1="46" x2="24" y2="85" stroke="#c8aa6e" stroke-width="1" opacity=".2"/>
    <line x1="34" y1="58" x2="34" y2="85" stroke="#c0392b" stroke-width="1" opacity=".3"/>
    <line x1="44" y1="70" x2="44" y2="85" stroke="#c0392b" stroke-width="1" opacity=".4"/>
  </svg>`,

  Maintainability: () => `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <!-- Two identical blocks = copy paste -->
    <rect x="8" y="20" width="62" height="70" rx="2" fill="#221a10" stroke="#3a3020" stroke-width="1"/>
    <rect x="84" y="20" width="62" height="70" rx="2" fill="#221a10" stroke="#c0392b" stroke-width="1" opacity=".7"/>
    <rect x="14" y="30" width="50" height="4" rx="1" fill="#c8aa6e" opacity=".3"/>
    <rect x="14" y="38" width="38" height="4" rx="1" fill="#c8aa6e" opacity=".3"/>
    <rect x="14" y="46" width="44" height="4" rx="1" fill="#c8aa6e" opacity=".3"/>
    <rect x="90" y="30" width="50" height="4" rx="1" fill="#c8aa6e" opacity=".3"/>
    <rect x="90" y="38" width="38" height="4" rx="1" fill="#c8aa6e" opacity=".3"/>
    <rect x="90" y="46" width="44" height="4" rx="1" fill="#c8aa6e" opacity=".3"/>
    <path d="M70 55 L84 55" stroke="#c0392b" stroke-width="1.5" stroke-dasharray="3 2" marker-end="url(#arr)"/>
    <text x="77" y="50" font-family="monospace" font-size="6" fill="#c0392b" text-anchor="middle">COPY</text>
  </svg>`,

  Hygiene: () => `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <!-- Trash/clutter theme -->
    <rect x="55" y="30" width="44" height="55" rx="2" fill="#221a10" stroke="#3a3020" stroke-width="1.5"/>
    <line x1="55" y1="44" x2="99" y2="44" stroke="#3a3020" stroke-width="1"/>
    <rect x="62" y="36" width="8" height="8" rx="1" fill="none" stroke="#c8aa6e" stroke-width="1" opacity=".4"/>
    <rect x="73" y="36" width="8" height="8" rx="1" fill="none" stroke="#c8aa6e" stroke-width="1" opacity=".4"/>
    <rect x="84" y="36" width="8" height="8" rx="1" fill="none" stroke="#c8aa6e" stroke-width="1" opacity=".4"/>
    <rect x="62" y="50" width="30" height="4" rx="1" fill="#5a5040" opacity=".5"/>
    <rect x="62" y="58" width="22" height="4" rx="1" fill="#5a5040" opacity=".5"/>
    <rect x="62" y="66" width="28" height="4" rx="1" fill="#5a5040" opacity=".5"/>
    <text x="25" y="65" font-family="monospace" font-size="7" fill="#3a5030" opacity=".8">// TODO</text>
    <text x="108" y="50" font-family="monospace" font-size="7" fill="#3a5030" opacity=".8">// FIXME</text>
  </svg>`,

  Readability: () => `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <!-- Magnifying glass over code -->
    <text x="12" y="30" font-family="monospace" font-size="8" fill="#4a4030">var x = 0;</text>
    <text x="12" y="44" font-family="monospace" font-size="8" fill="#4a4030">var temp = null;</text>
    <text x="12" y="58" font-family="monospace" font-size="8" fill="#4a4030">var data2 = [];</text>
    <text x="12" y="72" font-family="monospace" font-size="8" fill="#c0392b" opacity=".8">var flag = false;</text>
    <circle cx="110" cy="55" r="28" fill="none" stroke="#c8aa6e" stroke-width="2" opacity=".5"/>
    <line x1="130" y1="75" x2="144" y2="90" stroke="#c8aa6e" stroke-width="3" stroke-linecap="round" opacity=".5"/>
    <circle cx="110" cy="55" r="18" fill="#c8aa6e" opacity=".05"/>
  </svg>`,

  Correctness: () => `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <!-- == vs === -->
    <text x="20" y="50" font-family="monospace" font-size="22" fill="#c0392b" opacity=".7">==</text>
    <text x="76" y="35" font-family="monospace" font-size="11" fill="#c8aa6e" opacity=".5">≠</text>
    <text x="88" y="50" font-family="monospace" font-size="22" fill="#27ae60" opacity=".7">===</text>
    <line x1="10" y1="65" x2="144" y2="65" stroke="#3a3020" stroke-width="1"/>
    <text x="77" y="82" font-family="monospace" font-size="7" fill="#7a6a50" text-anchor="middle">TYPE COERCION AHEAD</text>
    <line x1="64" y1="10" x2="64" y2="95" stroke="#3a3020" stroke-width="1" stroke-dasharray="3 3" opacity=".5"/>
  </svg>`,

  Reliability: () => `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <!-- Silent exception / black hole -->
    <text x="10" y="28" font-family="monospace" font-size="8" fill="#4a4030">try {</text>
    <text x="20" y="40" font-family="monospace" font-size="8" fill="#4a4030">  doSomething();</text>
    <text x="10" y="52" font-family="monospace" font-size="8" fill="#4a4030">} catch(e) {</text>
    <text x="20" y="64" font-family="monospace" font-size="8" fill="#c0392b" opacity=".8">  // silence</text>
    <text x="10" y="76" font-family="monospace" font-size="8" fill="#4a4030">}</text>
    <circle cx="120" cy="55" r="20" fill="#0d0c0a" stroke="#c0392b" stroke-width="1.5" opacity=".5"/>
    <text x="120" y="59" font-family="monospace" font-size="8" fill="#c0392b" text-anchor="middle" opacity=".7">ERR</text>
    <line x1="82" y1="55" x2="100" y2="55" stroke="#c0392b" stroke-width="1" stroke-dasharray="3 2" opacity=".6"/>
  </svg>`,

  General: () => `<svg viewBox="0 0 154 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="154" height="110" fill="#1a1410"/>
    <circle cx="77" cy="55" r="32" fill="none" stroke="#c8aa6e" stroke-width="1.5" opacity=".4"/>
    <line x1="77" y1="23" x2="77" y2="87" stroke="#c8aa6e" stroke-width="1" opacity=".3"/>
    <line x1="45" y1="55" x2="109" y2="55" stroke="#c8aa6e" stroke-width="1" opacity=".3"/>
    <circle cx="77" cy="55" r="4" fill="#c8aa6e" opacity=".5"/>
  </svg>`
};

function getPhoto(category, severity) {
  const fn = SMELL_PHOTOS[category] || SMELL_PHOTOS.General;
  return fn(severity);
}

// ── Place a polaroid on the corkboard ─────────────────────
function spawnCard(finding, boardW, boardH, index, total) {
  const card = document.createElement('div');
  card.className = 'polaroid';
  card.dataset.id = finding.id;

  // Spread cards across the board in a loose grid with jitter
  const cols = Math.ceil(Math.sqrt(total * 1.5));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const cellW = Math.max(180, boardW / cols);
  const cellH = Math.max(160, boardH / Math.ceil(total / cols));
  const jitterX = (Math.random() - 0.5) * 40;
  const jitterY = (Math.random() - 0.5) * 30;
  const cx = Math.max(90, Math.min(boardW - 90, 20 + col * cellW + cellW / 2 + jitterX));
  const cy = Math.max(80, Math.min(boardH - 80, 30 + row * cellH + cellH / 2 + jitterY));
  const rot = (Math.random() - 0.5) * 12;

  card.style.left    = (cx - 85) + 'px';
  card.style.top     = (cy - 80) + 'px';
  card.style.transform = `rotate(${rot}deg)`;

  // Inner HTML
  card.innerHTML = `
    <div class="pushpin pin--${finding.severity}">
      <div class="pushpin-head"></div>
      <div class="pushpin-shaft"></div>
    </div>
    <div class="polaroid-photo">${getPhoto(finding.category, finding.severity)}</div>
    <div class="polaroid-caption">
      <div class="polaroid-smell">${finding.name}</div>
      <div class="polaroid-lines">Lines: ${finding.lines.join(', ')}</div>
    </div>
    <div class="polaroid-stamp stamp--${finding.severity}">${finding.severity.toUpperCase()}</div>
  `;

  // Click → detail panel
  card.addEventListener('click', (e) => {
    if (card.classList.contains('dragging')) return;
    openDetail(finding.id);
  });

  makeDraggable(card);
  corkboard.appendChild(card);

  // Register center point for string drawing
  cardRegistry[finding.id] = {
    el: card,
    cx, cy,
    rot,
    w: 170, h: 160
  };
}

// ── Dragging ────────────────────────────────────────────────
function makeDraggable(card) {
  let startX, startY, startLeft, startTop, wasDragged;
  card.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    card.setPointerCapture(e.pointerId);
    card.classList.add('dragging');
    wasDragged = false;
    startX = e.clientX; startY = e.clientY;
    startLeft = parseInt(card.style.left);
    startTop  = parseInt(card.style.top);
  });
  card.addEventListener('pointermove', e => {
    if (!card.classList.contains('dragging')) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) wasDragged = true;
    card.style.left = (startLeft + dx) + 'px';
    card.style.top  = (startTop  + dy) + 'px';
    // Update registry center
    const id = card.dataset.id;
    const reg = cardRegistry[id];
    if (reg) {
      reg.cx = startLeft + dx + reg.w / 2;
      reg.cy = startTop  + dy + reg.h / 2;
    }
    updateStrings();
  });
  card.addEventListener('pointerup', e => {
    card.classList.remove('dragging');
    if (wasDragged) e.stopPropagation();
  });
}

// ── String connections ──────────────────────────────────────
function getStringLayer() { return $('stringLayer') || stringLayer; }
function updateStrings() {
  const sl = getStringLayer();
  if (!sl) return;
  // Clear existing strings
  while (sl.firstChild) sl.removeChild(sl.firstChild);

  if (currentFindings.length < 2) return;

  // Connect cards that share lines or share category
  const findings = currentFindings;
  const connected = new Set();

  for (let i = 0; i < findings.length; i++) {
    for (let j = i + 1; j < findings.length; j++) {
      const a = findings[i], b = findings[j];
      // Same category OR overlapping line numbers
      const shareCategory = a.category === b.category;
      const shareLines = a.lines.some(ln => b.lines.includes(ln));
      if (!shareCategory && !shareLines) continue;

      const key = `${a.id}-${b.id}`;
      if (connected.has(key)) continue;
      connected.add(key);

      const regA = cardRegistry[a.id];
      const regB = cardRegistry[b.id];
      if (!regA || !regB) continue;

      // Add slight sag with a quadratic bezier
      const mx = (regA.cx + regB.cx) / 2;
      const my = (regA.cy + regB.cy) / 2 + 18; // sag

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${regA.cx},${regA.cy} Q${mx},${my} ${regB.cx},${regB.cy}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('class', 'string-line');
      if (shareLines) path.style.opacity = '0.85';
      sl.appendChild(path);
    }
  }
}

// ════════════════════════════════════════════════════════════
//  DETAIL PANEL
// ════════════════════════════════════════════════════════════
function openDetail(id) {
  const f = currentFindings.find(x => x.id === id);
  if (!f) return;

  // Deselect previous
  if (selectedId && cardRegistry[selectedId]) {
    cardRegistry[selectedId].el.classList.remove('selected');
  }
  selectedId = id;
  if (cardRegistry[id]) cardRegistry[id].el.classList.add('selected');

  detailIdle.hidden = true;
  detailContent.hidden = false;
  btnDetailClose.hidden = false;
  detailColTitle.textContent = 'FINDING DETAIL';

  detailStamp.textContent = f.severity.toUpperCase();
  detailStamp.className   = `detail-stamp stamp--${f.severity}`;
  detailSmell.textContent = f.name;
  detailLines.textContent = `Lines: ${f.lines.join(', ')}`;
  detailSev.textContent   = f.severity.toUpperCase();
  detailSev.className     = `detail-sev sev--${f.severity}`;
  detailNoir.textContent  = `"${f.noirLine}"`;
  detailCode.textContent  = f.excerpt;
  detailExplanation.textContent = f.explanation;
  detailFix.textContent   = f.fix;
}

btnDetailClose.addEventListener('click', () => {
  detailIdle.hidden = false;
  detailContent.hidden = true;
  btnDetailClose.hidden = true;
  detailColTitle.textContent = 'SELECT A FINDING';
  if (selectedId && cardRegistry[selectedId]) {
    cardRegistry[selectedId].el.classList.remove('selected');
  }
  selectedId = null;
});

// ════════════════════════════════════════════════════════════
//  SUSPECT SIDEBAR
// ════════════════════════════════════════════════════════════
function renderSuspects(suspects, maxScore) {
  suspectList.innerHTML = '';
  suspects.forEach((s, i) => {
    const pct = Math.round((s.score / Math.max(maxScore, 1)) * 100);
    const li = document.createElement('li');
    li.className = 'suspect-item';
    li.innerHTML = `
      <span class="suspect-rank">${i + 1}</span>
      <span class="suspect-name">${s.name}<br><span style="color:var(--text-muted);font-size:.55rem">${s.smells} smell${s.smells > 1 ? 's' : ''}</span></span>
      <div class="suspect-score-bar"><div class="suspect-score-fill" style="width:${pct}%"></div></div>
      <span class="suspect-score-num">${s.score}</span>
    `;
    suspectList.appendChild(li);
  });
  suspectsBox.hidden = false;
  suspectsBox.removeAttribute('hidden');
}

// ════════════════════════════════════════════════════════════
//  RESET
// ════════════════════════════════════════════════════════════
function resetAll() {
  currentFindings = [];
  cardRegistry = {};
  selectedId = null;
  corkboard.innerHTML = '<svg class="string-layer" id="stringLayer" aria-hidden="true"></svg>';
  stringLayer = $('stringLayer');
  boardIdle.hidden = false;
  boardIdle.removeAttribute('hidden');
  corkboard.hidden = true;
  metricsStrip.hidden = true;
  typewriterBox.hidden = true;
  suspectsBox.hidden = true;
  btnCloseCase.hidden = true;
  detailIdle.hidden = false;
  detailContent.hidden = true;
  btnDetailClose.hidden = true;
  detailColTitle.textContent = 'SELECT A FINDING';
  statusText.textContent = 'AWAITING EVIDENCE';
}

// ════════════════════════════════════════════════════════════
//  MAIN INVESTIGATION
// ════════════════════════════════════════════════════════════
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

async function investigate() {
  const code = codeInput.value.trim();
  if (!code) {
    codeInput.style.boxShadow = '0 0 0 2px #c0392b';
    setTimeout(() => codeInput.style.boxShadow = '', 1500);
    return;
  }

  btnInvestigate.disabled = true;
  statusText.textContent  = 'INVESTIGATING…';

  // Reset board
  currentFindings = [];
  cardRegistry    = {};
  boardIdle.hidden = true;
  corkboard.hidden = false;
  corkboard.removeAttribute('hidden');
  // Clear old cards (keep SVG)
  [...corkboard.children].forEach(c => { if (c.id !== 'stringLayer') c.remove(); });
  // Rebuild string layer
  stringLayer = getStringLayer();
  if (stringLayer) stringLayer.innerHTML = '';

  boardLoading.hidden = false;
  boardLoading.removeAttribute('hidden');

  // Typewriter intro
  typewriterBox.hidden = false;
  typewriterBox.removeAttribute('hidden');
  const introText = pick(INTROS);
  typewrite(introText);

  // Animate loading phrases
  let pi = 0;
  loadingLine.textContent = LOADING_PHRASES[0];
  const phraseTimer = setInterval(() => {
    pi = (pi + 1) % LOADING_PHRASES.length;
    loadingLine.textContent = LOADING_PHRASES[pi];
  }, 550);

  await sleep(800 + Math.random() * 400);
  clearInterval(phraseTimer);

  // ── Run all detectors ──────────────────────────────────
  _findingCounter = 0;
  const rawFindings = [];
  DETECTORS.forEach(d => {
    try {
      const results = d.run(code);
      results.forEach(r => rawFindings.push(r));
    } catch (e) { /* detector error — skip */ }
  });

  // Sort critical → high → medium → low
  const order = { critical: 4, high: 3, medium: 2, low: 1 };
  rawFindings.sort((a, b) => (order[b.severity] || 0) - (order[a.severity] || 0));
  currentFindings = rawFindings;

  // ── Metrics ─────────────────────────────────────────
  const loc   = code.split('\n').length;
  const score = calcDebtScore(rawFindings);
  const verd  = verdictFromScore(score);
  mLoc.textContent    = loc;
  mSmells.textContent = rawFindings.length;
  mScore.textContent  = score;
  mVerdict.textContent = verd;
  metricsStrip.hidden = false;
  metricsStrip.removeAttribute('hidden');

  // ── Typewriter conclusion ────────────────────────────
  const conclusionText = pick(VERDICTS[verd]);
  setTimeout(() => {
    typewrite(conclusionText);
  }, 1200);

  // ── Status ──────────────────────────────────────────
  statusText.textContent = rawFindings.length > 0
    ? `${rawFindings.length} SMELL${rawFindings.length !== 1 ? 'S' : ''} — ${verd}`
    : 'CASE CLOSED — CLEAN';
  caseNumber.textContent = String(1000 + Math.floor(Math.random() * 8999));

  // ── Hide loading ─────────────────────────────────────
  boardLoading.hidden = true;

  // ── Spawn polaroid cards ──────────────────────────────
  const boardRect = corkboard.getBoundingClientRect();
  const bw = boardRect.width  || 600;
  const bh = boardRect.height || 500;

  rawFindings.forEach((f, i) => {
    setTimeout(() => {
      spawnCard(f, bw, bh, i, rawFindings.length);
      if (i === rawFindings.length - 1) updateStrings();
    }, i * 120);
  });

  // ── Suspects ─────────────────────────────────────────
  const suspects = buildSuspects(rawFindings);
  renderSuspects(suspects, suspects[0]?.score || 1);

  // ── Close case button ─────────────────────────────────
  btnCloseCase.hidden = false;
  btnCloseCase.removeAttribute('hidden');

  btnInvestigate.disabled = false;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

btnInvestigate.addEventListener('click', investigate);
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); investigate(); }
  if (e.key === 'Escape') { closeModal(); }
});

// ════════════════════════════════════════════════════════════
//  CASE REPORT MODAL
// ════════════════════════════════════════════════════════════
function openCaseReport() {
  if (!currentFindings.length && mSmells.textContent === '—') return;

  const code  = codeInput.value.trim();
  const score = parseInt(mScore.textContent) || 0;
  const verd  = mVerdict.textContent || 'CLEAN';
  const caseNo = caseNumber.textContent;
  const lang  = langSelect.options[langSelect.selectedIndex].text;
  const loc   = mLoc.textContent;
  const date  = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  rpCaseNo.textContent = caseNo;
  rpDate.textContent   = date;
  rpLang.textContent   = lang;
  rpLines.textContent  = loc;
  rpScore.textContent  = score;

  // Verdict banner
  const rp = rpVerdictBanner;
  rp.className = 'report-verdict-banner';
  if (verd === 'GUILTY') {
    rp.classList.add('rp--guilty');
    rpVerdictIcon.textContent  = '⚖️';
    rpVerdictLabel.textContent = '● GUILTY AS CHARGED';
  } else if (verd === 'SUSPICIOUS') {
    rp.classList.add('rp--warning');
    rpVerdictIcon.textContent  = '🔍';
    rpVerdictLabel.textContent = '◑ UNDER SUSPICION';
  } else {
    rp.classList.add('rp--clean');
    rpVerdictIcon.textContent  = '✓';
    rpVerdictLabel.textContent = '○ CASE CLOSED — CLEAN';
  }

  // Table
  rpTableBody.innerHTML = '';
  currentFindings.forEach((f, i) => {
    const tr = document.createElement('tr');
    const briefFix = f.fix.split('\n')[1]?.trim().replace(/^\/\//,'').trim() || f.fix.split('\n')[0];
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${f.name}</td>
      <td>${f.lines.slice(0,3).join(', ')}${f.lines.length > 3 ? '…' : ''}</td>
      <td class="rt--${f.severity}">${f.severity.toUpperCase()}</td>
      <td>${escHtml(briefFix.substring(0, 80))}${briefFix.length > 80 ? '…' : ''}</td>
    `;
    rpTableBody.appendChild(tr);
  });
  if (!currentFindings.length) {
    rpTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:.75rem;color:#7a6a55;font-style:italic">No findings — code appears clean.</td></tr>';
  }

  // Recommendations
  rpRecs.innerHTML = '';
  const cats = [...new Set(currentFindings.map(f => f.category))];
  const recMap = {
    Design:          'Apply SOLID principles — especially Single Responsibility. Each function should do exactly one thing.',
    Complexity:      'Use guard clauses and early returns to flatten nested conditionals.',
    Maintainability: 'Follow DRY (Don\'t Repeat Yourself). Extract duplicated logic into shared functions.',
    Hygiene:         'Run a linter (ESLint / Pylint) on every commit. Remove debug statements before merging.',
    Readability:     'Name variables and functions semantically. Avoid abbreviations and single-letter names outside loops.',
    Correctness:     'Use strict equality (===) throughout. Enable TypeScript or add runtime type checks.',
    Reliability:     'Never silently swallow exceptions. Log all errors and re-throw when appropriate.',
  };
  const addedRecs = new Set();
  cats.forEach(cat => {
    if (recMap[cat] && !addedRecs.has(cat)) {
      addedRecs.add(cat);
      const li = document.createElement('li');
      li.innerHTML = `<strong>${cat}:</strong> ${recMap[cat]}`;
      rpRecs.appendChild(li);
    }
  });
  if (!cats.length) {
    const li = document.createElement('li');
    li.textContent = 'No specific recommendations — continue applying clean code principles.';
    rpRecs.appendChild(li);
  }

  reportModal.hidden = false;
  reportModal.removeAttribute('hidden');
}

function closeModal() {
  reportModal.hidden = true;
}

btnCloseCase.addEventListener('click', openCaseReport);
btnCloseModal.addEventListener('click', closeModal);
btnPrint.addEventListener('click', () => window.print());
reportModal.addEventListener('click', e => { if (e.target === reportModal) closeModal(); });
