// Generates a self-contained viewer for the decisions dataset (data inlined, no
// external requests) → data/viewer.html. Output is Artifact-ready page content
// (no <!doctype>/<html>/<head>/<body>; those are added at publish time).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Decision, RunMeta } from "./src/schema.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "data");
const decisionsDir = resolve(dataDir, "decisions");

const decisions: Decision[] = readdirSync(decisionsDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(resolve(decisionsDir, f), "utf8")) as Decision)
  .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
const meta: RunMeta = JSON.parse(readFileSync(resolve(dataDir, "_meta.json"), "utf8"));

const DATA = JSON.stringify({ decisions, meta });

const STYLE = `
:root{
  --bg:#F2F4F3; --surface:#FFFFFF; --surface-2:#F7F9F8;
  --ink:#15191B; --ink-soft:#54606A; --ink-faint:#8494A0;
  --line:#DBE2E0; --line-strong:#C2CDCA;
  --accent:#0E6E6E; --accent-ink:#0A5252; --accent-wash:#0E6E6E14;
  --ok:#2E7D51; --ok-wash:#2E7D5115;
  --warn:#8A6412; --warn-wash:#8A641217;
  --crit:#B0463A; --crit-wash:#B0463A16;
  --font-display:ui-serif,Georgia,"Iowan Old Style","Times New Roman",serif;
  --font-ui:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --font-mono:ui-monospace,"Cascadia Code","SFMono-Regular",Menlo,Consolas,monospace;
  --sp:1rem; --radius:7px; --maxw:960px;
}
@media (prefers-color-scheme:dark){
  :root{
    --bg:#0F1417; --surface:#161C20; --surface-2:#1A2126;
    --ink:#E9EEED; --ink-soft:#9DAAB0; --ink-faint:#697680;
    --line:#262F34; --line-strong:#34414A;
    --accent:#4FC7BE; --accent-ink:#7ED9D1; --accent-wash:#4FC7BE1A;
    --ok:#5FB98A; --ok-wash:#5FB98A1E; --warn:#D8A24A; --warn-wash:#D8A24A20;
    --crit:#E4897C; --crit-wash:#E4897C1E;
  }
}
:root[data-theme="light"]{
  --bg:#F2F4F3; --surface:#FFFFFF; --surface-2:#F7F9F8;
  --ink:#15191B; --ink-soft:#54606A; --ink-faint:#8494A0; --line:#DBE2E0; --line-strong:#C2CDCA;
  --accent:#0E6E6E; --accent-ink:#0A5252; --accent-wash:#0E6E6E14;
  --ok:#2E7D51; --ok-wash:#2E7D5115; --warn:#8A6412; --warn-wash:#8A641217; --crit:#B0463A; --crit-wash:#B0463A16;
}
:root[data-theme="dark"]{
  --bg:#0F1417; --surface:#161C20; --surface-2:#1A2126;
  --ink:#E9EEED; --ink-soft:#9DAAB0; --ink-faint:#697680; --line:#262F34; --line-strong:#34414A;
  --accent:#4FC7BE; --accent-ink:#7ED9D1; --accent-wash:#4FC7BE1A;
  --ok:#5FB98A; --ok-wash:#5FB98A1E; --warn:#D8A24A; --warn-wash:#D8A24A20; --crit:#E4897C; --crit-wash:#E4897C1E;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font-ui);line-height:1.5;
  -webkit-font-smoothing:antialiased;font-size:15px}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 20px}

/* masthead */
header.mast{border-bottom:2px solid var(--ink);padding:38px 0 20px;margin-bottom:0}
.eyebrow{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-ink);
  font-weight:600;margin:0 0 10px}
h1{font-family:var(--font-display);font-weight:600;font-size:clamp(2rem,5vw,2.9rem);line-height:1.05;
  margin:0;text-wrap:balance;letter-spacing:-.01em}
.scope{color:var(--ink-soft);margin:14px 0 0;font-size:.92rem}
.scope b{color:var(--ink);font-weight:600}

/* stats strip */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1px;
  background:var(--line);border:1px solid var(--line);border-top:none;
  border-radius:0 0 var(--radius) var(--radius);overflow:hidden;margin-bottom:26px}
.stat{background:var(--surface);padding:16px 18px}
.stat .n{font-family:var(--font-mono);font-size:1.5rem;font-variant-numeric:tabular-nums;
  font-weight:600;color:var(--ink)}
.stat .n.warn{color:var(--warn)} .stat .n.crit{color:var(--crit)}
.stat .k{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-top:3px}

/* filter bar */
.filters{position:sticky;top:0;z-index:5;background:var(--bg);
  border-bottom:1px solid var(--line);padding:12px 0;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.filters input[type=search],.filters select{font:inherit;font-size:.86rem;color:var(--ink);
  background:var(--surface);border:1px solid var(--line-strong);border-radius:var(--radius);padding:7px 10px}
.filters input[type=search]{flex:1;min-width:170px}
.toggle{display:inline-flex;align-items:center;gap:6px;font-size:.82rem;color:var(--ink-soft);cursor:pointer;
  user-select:none;padding:6px 10px;border:1px solid var(--line-strong);border-radius:var(--radius);background:var(--surface)}
.toggle input{accent-color:var(--accent);margin:0}
.count{margin-left:auto;font-size:.8rem;color:var(--ink-faint);font-variant-numeric:tabular-nums}

/* ledger */
.entry{display:grid;grid-template-columns:118px 1fr;gap:22px;padding:22px 0;border-bottom:1px solid var(--line)}
.entry .rail{font-size:.8rem}
.rail .date{font-family:var(--font-mono);color:var(--ink);font-variant-numeric:tabular-nums}
.rail .body{margin-top:6px;color:var(--ink-faint);font-size:.72rem;letter-spacing:.04em;text-transform:uppercase;line-height:1.35}
.entry h2{font-family:var(--font-display);font-weight:600;font-size:1.16rem;line-height:1.25;margin:0 0 8px;
  text-wrap:balance}
.summary{color:var(--ink-soft);margin:0 0 12px;font-size:.92rem;max-width:62ch}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.chip{font-size:.72rem;padding:3px 9px;border-radius:100px;border:1px solid var(--line-strong);
  color:var(--ink-soft);background:var(--surface-2);white-space:nowrap;letter-spacing:.01em}
.chip.topic{color:var(--accent-ink);background:var(--accent-wash);border-color:transparent;font-weight:500}
.chip.hi{color:var(--ink);border-color:var(--ink-soft);font-weight:600}
.chip.ok{color:var(--ok);background:var(--ok-wash);border-color:transparent}
.chip.warn{color:var(--warn);background:var(--warn-wash);border-color:transparent}
.chip.crit{color:var(--crit);background:var(--crit-wash);border-color:transparent}
.meta-row{display:flex;flex-wrap:wrap;gap:14px 22px;align-items:baseline;font-size:.85rem}
.amount{font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-weight:600;color:var(--ink)}
.amount .lbl{font-family:var(--font-ui);font-weight:400;color:var(--ink-faint);font-size:.72rem;
  text-transform:uppercase;letter-spacing:.05em;margin-right:6px}
.votes{display:flex;flex-direction:column;gap:4px}
.vote{font-size:.85rem;color:var(--ink-soft)}
.vote .tally{font-family:var(--font-mono);font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
.vote .against{color:var(--crit)}
.vbadge{font-size:.68rem;letter-spacing:.03em;padding:1px 6px;border-radius:4px;margin-left:4px}
.vbadge.v{color:var(--ok);background:var(--ok-wash)} .vbadge.u{color:var(--warn);background:var(--warn-wash)}
.docs{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.8rem}
.docs a{color:var(--accent-ink);text-decoration:none;border-bottom:1px solid var(--accent-wash)}
.docs a:hover{border-bottom-color:var(--accent)}
a:focus-visible,input:focus-visible,select:focus-visible,.toggle:focus-within{outline:2px solid var(--accent);outline-offset:2px}
footer{color:var(--ink-faint);font-size:.78rem;padding:30px 0 50px;border-top:1px solid var(--line);margin-top:10px;max-width:70ch}
footer code{font-family:var(--font-mono);background:var(--surface-2);padding:1px 5px;border-radius:4px}
@media(max-width:560px){.entry{grid-template-columns:1fr;gap:8px}.rail{display:flex;gap:12px;align-items:baseline}.rail .body{margin-top:0}}
`;

const SCRIPT = `
const {decisions,meta}=DATA;
const $=s=>document.querySelector(s), esc=s=>(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const money=n=>n==null?null:'$'+n.toLocaleString('en-US');
const bodyShort=b=>b.replace('Electric Utility Commission','EUC').replace('Joint Sustainability Committee','JSC');
const uniq=a=>[...new Set(a)].sort();
const fill=(sel,vals,label)=>{sel.innerHTML='<option value="">'+label+'</option>'+vals.map(v=>'<option>'+esc(v)+'</option>').join('')};
fill($('#fBody'),uniq(decisions.map(d=>d.body)),'All bodies');
fill($('#fTopic'),uniq(decisions.map(d=>d.topic)),'All topics');

function hasDissent(d){return d.votes.some(v=>v.dissenters&&v.dissenters.length)}
function render(){
  const q=$('#q').value.toLowerCase(), fb=$('#fBody').value, ft=$('#fTopic').value,
    fv=$('#fVer').value, dOnly=$('#dOnly').checked, flOnly=$('#flOnly').checked;
  const rows=decisions.filter(d=>{
    if(fb&&d.body!==fb)return false; if(ft&&d.topic!==ft)return false;
    if(fv&&d.verification!==fv)return false;
    if(dOnly&&!hasDissent(d))return false; if(flOnly&&!d.flags.length)return false;
    if(q){const hay=(d.title+' '+d.summary+' '+d.topic+' '+d.body).toLowerCase();if(!hay.includes(q))return false}
    return true;
  });
  $('#count').textContent=rows.length+' of '+decisions.length+' decisions';
  $('#ledger').innerHTML=rows.map(entry).join('')||'<p style="color:var(--ink-faint);padding:40px 0">No decisions match these filters.</p>';
}
function entry(d){
  const verClass={official:'ok',sealed:'crit',reporting_only:'warn'}[d.verification]||'warn';
  const chips=[
    '<span class="chip topic">'+esc(d.topic)+'</span>',
    d.significance==='high'?'<span class="chip hi">high significance</span>':'',
    '<span class="chip '+verClass+'">'+esc(d.verification.replace('_',' '))+'</span>',
    ...d.flags.map(f=>'<span class="chip warn">⚑ '+esc(f.replace(/_/g,' '))+'</span>')
  ].filter(Boolean).join('');
  const votes=d.votes.map(v=>{
    const badge=v._verified?'<span class="vbadge v">✓ source-verified</span>':'<span class="vbadge u">⚠ unverified</span>';
    const against=v.dissenters&&v.dissenters.length?' · <span class="against">against: '+v.dissenters.map(esc).join(', ')+'</span>':'';
    const t=v.tally?'<span class="tally">'+esc(v.tally)+'</span> ':'';
    return '<div class="vote">'+esc(bodyShort(v.body))+' '+t+esc(v.result)+against+badge+'</div>';
  }).join('');
  const amt=d.dollarAmount!=null?'<div class="amount"><span class="lbl">Amount</span>'+money(d.dollarAmount)+'</div>':'';
  const docs=d.documents.map(x=>'<a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.docType.replace('commission_',''))+' ('+esc(x.edimsId||'')+')</a>').join('');
  const links=d.links.map(l=>'<span class="chip">'+esc(l.relation)+' '+esc(l.toKey)+'</span>').join('');
  return '<article class="entry">'
    +'<div class="rail"><div class="date">'+esc(d.date)+'</div><div class="body">'+esc(bodyShort(d.body))+'</div></div>'
    +'<div class="main"><h2>'+esc(d.title)+'</h2>'
    +'<div class="chips">'+chips+'</div>'
    +(d.summary?'<p class="summary">'+esc(d.summary)+'</p>':'')
    +'<div class="meta-row">'+amt+(votes?'<div class="votes">'+votes+'</div>':'')+'</div>'
    +(links?'<div class="chips" style="margin-top:10px">'+links+'</div>':'')
    +'<div class="docs">'+docs+'</div></div></article>';
}
['#q','#fBody','#fTopic','#fVer'].forEach(s=>$(s).addEventListener('input',render));
['#dOnly','#flOnly'].forEach(s=>$(s).addEventListener('change',render));
render();
`;

const withDissent = decisions.filter((d) => d.votes.some((v) => v.dissenters?.length)).length;
const totalCommitted = decisions.reduce((s, d) => s + (d.dollarAmount ?? 0), 0);
const sealed = decisions.filter((d) => d.verification === "sealed").length;
const genDate = new Date(meta.generatedAt).toISOString().slice(0, 10);
const bodyNames = [...new Set(decisions.map((d) => d.body))].sort();
const fmtM = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${Math.round(n / 1e6)}M` : `$${n}`);

const HTML = `<title>Austin Climate & Energy Decisions — 2026</title>
<style>${STYLE}</style>
<div class="wrap">
  <header class="mast">
    <p class="eyebrow">Austin · Public Decisions Register</p>
    <h1>Climate &amp; Energy Decisions</h1>
    <p class="scope"><b>2026</b> &middot; ${bodyNames.length} commissions &middot;
      <b>${decisions.length}</b> decisions extracted from public agendas &amp; minutes
      &middot; generated ${genDate}<br>${esc(bodyNames.join(" · "))}</p>
  </header>
</div>
<div class="wrap">
  <div class="stats">
    <div class="stat"><div class="n">${decisions.length}</div><div class="k">Decisions</div></div>
    <div class="stat"><div class="n">${fmtM(totalCommitted)}</div><div class="k">Committed / recommended</div></div>
    <div class="stat"><div class="n crit">${withDissent}</div><div class="k">With dissent</div></div>
    <div class="stat"><div class="n warn">${sealed}</div><div class="k">Sealed</div></div>
    <div class="stat"><div class="n warn">${meta.reviewQueue.length}</div><div class="k">Flagged for review</div></div>
  </div>
</div>
<div class="wrap">
  <div class="filters">
    <input type="search" id="q" placeholder="Search decisions…" aria-label="Search decisions">
    <select id="fBody" aria-label="Filter by body"></select>
    <select id="fTopic" aria-label="Filter by topic"></select>
    <select id="fVer" aria-label="Filter by verification">
      <option value="">Any verification</option><option value="official">official</option>
      <option value="sealed">sealed</option><option value="reporting_only">reporting only</option>
    </select>
    <label class="toggle"><input type="checkbox" id="dOnly"> Dissent only</label>
    <label class="toggle"><input type="checkbox" id="flOnly"> Flagged only</label>
    <span class="count" id="count"></span>
  </div>
  <div id="ledger"></div>
  <footer>
    Decisions are extracted from Austin's public commission agendas &amp; minutes (EDIMS). Structural facts —
    dollar amounts, vote tallies, dissenters — are harvested by code from the source text and marked
    <b>source-verified</b>; anything the model asserted that code could not confirm is marked
    <b>unverified</b> and listed in the review queue. Classification and summaries are model-generated.
    Model: <code>${esc(meta.llmModel)}</code>. POC covering ${bodyNames.length} advisory commissions; City Council decisions not yet included.
  </footer>
</div>
<script>const DATA=${DATA};${SCRIPT}</script>`;

function esc(s: string) {
  return (s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

const out = resolve(dataDir, "viewer.html");
writeFileSync(out, HTML, "utf8");
console.log(`wrote ${out} (${decisions.length} decisions, ${(HTML.length / 1024).toFixed(0)}KB)`);
