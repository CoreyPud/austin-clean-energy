// Generates a self-contained viewer for the council decisions register → data/council-viewer.html.
// Reads the full register (council.ndjson); hidden decisions show inline, flagged.
// Each reference shows its locator + verbatim quote, not just a link.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { CouncilDecision } from "./src/schema.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "data");
const decisions: CouncilDecision[] = readFileSync(resolve(dataDir, "council.ndjson"), "utf8")
  .trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as CouncilDecision)
  .filter((d) => d.isClimate) // register view = climate/energy items
  .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate) || Number(a.itemNumber) - Number(b.itemNumber));
const meta = JSON.parse(readFileSync(resolve(dataDir, "council_meta.json"), "utf8"));
const DATA = JSON.stringify({ decisions, meta });
const esc = (s: string) => (s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

const closed = decisions.filter((d) => d.decidedInClosedSession).length;
const genDate = new Date(meta.generatedAt).toISOString().slice(0, 10);
const YEAR = decisions[0]?.meetingDate.slice(0, 4) ?? genDate.slice(0, 4);

const STYLE = `
:root{--bg:#F2F4F3;--surface:#FFF;--surface-2:#F7F9F8;--ink:#15191B;--ink-soft:#54606A;--ink-faint:#8494A0;
--line:#DBE2E0;--line-strong:#C2CDCA;--accent:#0E6E6E;--accent-ink:#0A5252;--accent-wash:#0E6E6E14;
--ok:#2E7D51;--ok-wash:#2E7D5115;--warn:#8A6412;--warn-wash:#8A641217;--crit:#B0463A;--crit-wash:#B0463A16;
--fd:ui-serif,Georgia,"Times New Roman",serif;--fu:system-ui,-apple-system,"Segoe UI",sans-serif;
--fm:ui-monospace,"Cascadia Code",Menlo,Consolas,monospace;--maxw:980px;--r:7px}
@media(prefers-color-scheme:dark){:root{--bg:#0F1417;--surface:#161C20;--surface-2:#1A2126;--ink:#E9EEED;
--ink-soft:#9DAAB0;--ink-faint:#697680;--line:#262F34;--line-strong:#34414A;--accent:#4FC7BE;--accent-ink:#7ED9D1;
--accent-wash:#4FC7BE1A;--ok:#5FB98A;--ok-wash:#5FB98A1E;--warn:#D8A24A;--warn-wash:#D8A24A20;--crit:#E4897C;--crit-wash:#E4897C1E}}
:root[data-theme=light]{--bg:#F2F4F3;--surface:#FFF;--surface-2:#F7F9F8;--ink:#15191B;--ink-soft:#54606A;--ink-faint:#8494A0;--line:#DBE2E0;--line-strong:#C2CDCA;--accent:#0E6E6E;--accent-ink:#0A5252;--accent-wash:#0E6E6E14;--ok:#2E7D51;--ok-wash:#2E7D5115;--warn:#8A6412;--warn-wash:#8A641217;--crit:#B0463A;--crit-wash:#B0463A16}
:root[data-theme=dark]{--bg:#0F1417;--surface:#161C20;--surface-2:#1A2126;--ink:#E9EEED;--ink-soft:#9DAAB0;--ink-faint:#697680;--line:#262F34;--line-strong:#34414A;--accent:#4FC7BE;--accent-ink:#7ED9D1;--accent-wash:#4FC7BE1A;--ok:#5FB98A;--ok-wash:#5FB98A1E;--warn:#D8A24A;--warn-wash:#D8A24A20;--crit:#E4897C;--crit-wash:#E4897C1E}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--fu);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 20px}
header.mast{border-bottom:2px solid var(--ink);padding:36px 0 18px}
.eyebrow{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-ink);font-weight:600;margin:0 0 10px}
h1{font-family:var(--fd);font-weight:600;font-size:clamp(1.9rem,5vw,2.7rem);line-height:1.05;margin:0;letter-spacing:-.01em}
.scope{color:var(--ink-soft);margin:12px 0 0;font-size:.9rem}.scope b{color:var(--ink)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-top:none;border-radius:0 0 var(--r) var(--r);overflow:hidden;margin-bottom:24px}
.stat{background:var(--surface);padding:15px 18px}.stat .n{font-family:var(--fm);font-size:1.45rem;font-weight:600;font-variant-numeric:tabular-nums}
.stat .n.crit{color:var(--crit)}.stat .k{font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-top:3px}
.filters{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:12px 0;display:flex;flex-wrap:wrap;gap:9px;align-items:center}
.filters input,.filters select{font:inherit;font-size:.85rem;color:var(--ink);background:var(--surface);border:1px solid var(--line-strong);border-radius:var(--r);padding:7px 10px}
.filters input[type=search]{flex:1;min-width:160px}
.toggle{display:inline-flex;align-items:center;gap:6px;font-size:.82rem;color:var(--ink-soft);cursor:pointer;padding:6px 10px;border:1px solid var(--line-strong);border-radius:var(--r);background:var(--surface)}
.toggle input{accent-color:var(--accent);margin:0}.count{margin-left:auto;font-size:.8rem;color:var(--ink-faint);font-variant-numeric:tabular-nums}
.entry{display:grid;grid-template-columns:104px 1fr;gap:20px;padding:20px 0;border-bottom:1px solid var(--line)}
.entry.closed{background:linear-gradient(90deg,var(--crit-wash),transparent 60%);margin:0 -14px;padding:20px 14px;border-radius:6px}
.rail .date{font-family:var(--fm);font-size:.8rem;font-variant-numeric:tabular-nums}.rail .item{margin-top:4px;color:var(--ink-faint);font-size:.72rem;text-transform:uppercase;letter-spacing:.04em}
h2{font-family:var(--fd);font-weight:600;font-size:1.1rem;line-height:1.25;margin:0 0 8px}
.summary{color:var(--ink-soft);margin:0 0 10px;font-size:.9rem;max-width:64ch}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 9px}
.chip{font-size:.71rem;padding:3px 9px;border-radius:100px;border:1px solid var(--line-strong);color:var(--ink-soft);background:var(--surface-2);white-space:nowrap}
.chip.topic{color:var(--accent-ink);background:var(--accent-wash);border-color:transparent;font-weight:500}
.chip.ok{color:var(--ok);background:var(--ok-wash);border-color:transparent}
.chip.warn{color:var(--warn);background:var(--warn-wash);border-color:transparent}
.chip.crit{color:var(--crit);background:var(--crit-wash);border-color:transparent;font-weight:600}
.vote{font-size:.85rem;color:var(--ink-soft);margin:2px 0 10px}.vote .tally{font-family:var(--fm);font-weight:600;color:var(--ink)}.vote .against{color:var(--crit)}
details{margin-top:6px;font-size:.82rem}summary{cursor:pointer;color:var(--accent-ink);user-select:none}
.ref{margin:8px 0 0 4px;padding-left:12px;border-left:2px solid var(--line-strong)}
.ref .loc{font-family:var(--fm);font-size:.72rem;color:var(--ink-faint)}
.ref .q{color:var(--ink-soft);font-style:italic;margin:2px 0}.ref a{color:var(--accent-ink);text-decoration:none;font-size:.76rem;border-bottom:1px solid var(--accent-wash)}
a:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
footer{color:var(--ink-faint);font-size:.78rem;padding:28px 0 48px;border-top:1px solid var(--line);margin-top:8px;max-width:72ch}
footer code{font-family:var(--fm);background:var(--surface-2);padding:1px 5px;border-radius:4px}
@media(max-width:560px){.entry{grid-template-columns:1fr;gap:6px}.rail{display:flex;gap:12px}}
`;

const SCRIPT = `
const {decisions}=DATA;const $=s=>document.querySelector(s);
const esc=s=>(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const OUT={approved:'ok',approved_on_consent:'ok',postponed:'warn',withdrawn:'crit',conducted_and_approved:'crit',failed:'crit',no_action:'warn'};
const uniq=a=>[...new Set(a)].filter(Boolean).sort();
const fill=(el,vals,label)=>{el.innerHTML='<option value="">'+label+'</option>'+vals.map(v=>'<option>'+esc(v)+'</option>').join('')};
fill($('#fTopic'),uniq(decisions.map(d=>d.topic)),'All topics');
fill($('#fOut'),uniq(decisions.map(d=>d.outcome)),'Any outcome');
function render(){
  const q=$('#q').value.toLowerCase(),ft=$('#fTopic').value,fo=$('#fOut').value,cl=$('#cl').checked;
  const rows=decisions.filter(d=>{
    if(ft&&d.topic!==ft)return false;if(fo&&d.outcome!==fo)return false;if(cl&&!d.decidedInClosedSession)return false;
    if(q&&!((d.title+' '+d.summary+' '+d.topic).toLowerCase().includes(q)))return false;return true;});
  $('#count').textContent=rows.length+' of '+decisions.length;
  $('#ledger').innerHTML=rows.map(entry).join('')||'<p style="color:var(--ink-faint);padding:40px 0">No matches.</p>';
}
function entry(d){
  const oc=OUT[d.outcome]||'warn';
  const chips=['<span class="chip topic">'+esc(d.topic)+'</span>',
    '<span class="chip '+oc+'">'+esc(d.outcome.replace(/_/g,' '))+'</span>',
    d.decidedInClosedSession?'<span class="chip crit">■ decided in executive session §'+esc((d.closedSession.statutes||[]).join(', '))+'</span>':'',
    ...(d.flags||[]).filter(f=>f!=='approved_in_executive_session').map(f=>'<span class="chip warn">⚑ '+esc(f.replace(/_/g,' '))+'</span>')].filter(Boolean).join('');
  let vote='';
  if(d.vote.recorded)vote='<div class="vote">Vote: <span class="tally">'+esc(d.vote.tally||'')+'</span>'+(d.vote.dissenters&&d.vote.dissenters.length?' · <span class="against">no: '+d.vote.dissenters.map(esc).join(', ')+'</span>':'')+'</div>';
  else vote='<div class="vote">No recorded public vote'+(d.vote.reason?' ('+esc(d.vote.reason.replace(/_/g,' '))+')':'')+'</div>';
  const refs=(d.references||[]).map(r=>'<div class="ref"><div class="loc">'+esc(r.locator)+' · '+esc(r.docType.replace(/_/g,' '))+'</div><div class="q">“'+esc(r.quote)+'”</div><a href="'+esc(r.url)+'" target="_blank" rel="noopener">open source ↗</a></div>').join('');
  return '<article class="entry'+(d.decidedInClosedSession?' closed':'')+'">'+
    '<div class="rail"><div class="date">'+esc(d.meetingDate)+'</div><div class="item">item '+esc(d.itemNumber)+'</div></div>'+
    '<div><h2>'+esc(d.title)+'</h2><div class="chips">'+chips+'</div>'+
    (d.summary?'<p class="summary">'+esc(d.summary)+'</p>':'')+vote+
    '<details><summary>Sources ('+(d.references||[]).length+')</summary>'+refs+'</details></div></article>';
}
['#q','#fTopic','#fOut'].forEach(s=>$(s).addEventListener('input',render));$('#cl').addEventListener('change',render);render();
`;

const HTML = `<title>Austin City Council — Climate &amp; Energy Decisions 2026</title>
<style>${STYLE}</style>
<div class="wrap"><header class="mast">
<p class="eyebrow">Austin City Council · Decisions Register</p>
<h1>Climate &amp; Energy Decisions</h1>
<p class="scope"><b>${YEAR}</b> &middot; ${meta.counts?.meetings ?? "?"} meetings &middot; <b>${decisions.length}</b> climate/energy decisions
(of ${meta.counts?.decisions ?? "?"} total) &middot; <b>${closed}</b> decided in executive session &middot; generated ${genDate}</p>
</header></div>
<div class="wrap"><div class="stats">
<div class="stat"><div class="n">${decisions.length}</div><div class="k">Climate decisions</div></div>
<div class="stat"><div class="n">${meta.counts?.decisions ?? "?"}</div><div class="k">All items (register)</div></div>
<div class="stat"><div class="n crit">${closed}</div><div class="k">Executive session</div></div>
<div class="stat"><div class="n">${meta.counts?.meetings ?? "?"}</div><div class="k">Meetings</div></div>
</div></div>
<div class="wrap">
<div class="filters">
<input type="search" id="q" placeholder="Search…" aria-label="Search">
<select id="fTopic" aria-label="Topic"></select>
<select id="fOut" aria-label="Outcome"></select>
<label class="toggle"><input type="checkbox" id="cl"> Executive-session only</label>
<span class="count" id="count"></span>
</div>
<div id="ledger"></div>
<footer>Complete register of Austin City Council climate/energy decisions, extracted from council <b>minutes</b> (outcome + verbatim disposition), joined to the <b>voting record</b> (per-member votes). Decisions taken behind closed doors are shown inline, flagged “decided in executive session,” matched to the withdrawn public item. Every source carries its exact locator and quote — expand “Sources.” Classification &amp; summaries by <code>${esc(meta.llmModel)}</code>. RCA detail (funding, department, commission recommendation) is a planned enrichment layer.</footer>
</div>
<script>const DATA=${DATA};${SCRIPT}</script>`;

writeFileSync(resolve(dataDir, "council-viewer.html"), HTML, "utf8");
console.log(`wrote data/council-viewer.html (${decisions.length} climate decisions, ${(HTML.length / 1024).toFixed(0)}KB)`);
