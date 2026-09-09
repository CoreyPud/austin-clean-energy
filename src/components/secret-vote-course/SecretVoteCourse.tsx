import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCourseAuth } from "@/hooks/use-course-auth";
import "./secret-vote-course.css";
import {
  MODULES,
  QUIZZES,
  GLOSSARY,
  DIAGRAM_DATA,
  type CourseModule,
  type Slide,
  type QuizQuestion,
  type DiagramKey,
  type FlowStep,
  type CompareColumn,
  type SpectrumItem,
  type BarDatum,
  type LinePoint,
  type TimelineEvent,
} from "./secret-vote-course-data";

// ---------------------------------------------------------------------------
// diagrams — each is a pure SVG component; colors are CSS custom properties
// so they follow the host app's light/dark theme automatically
// ---------------------------------------------------------------------------

function DiaFlow({ steps }: { steps: FlowStep[] }) {
  const w = 640,
    h = 150,
    n = steps.length,
    bw = 128;
  const gap = (w - bw * n) / (n + 1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      {steps.map((s, i) => {
        const x = gap + i * (bw + gap);
        const ax2 = x + bw + gap - 6;
        return (
          <g key={i}>
            <rect x={x} y={40} width={bw} height={70} rx={9} fill="var(--sv-surface-2)" stroke="var(--sv-line)" />
            <text x={x + bw / 2} y={70} textAnchor="middle" fontFamily="IBM Plex Sans" fontWeight={600} fontSize={13} fill="var(--sv-ink)">
              {s.label}
            </text>
            {s.sub && (
              <text x={x + bw / 2} y={88} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={10.5} fill="var(--sv-muted)">
                {s.sub}
              </text>
            )}
            {i < n - 1 && (
              <>
                <line x1={x + bw} y1={75} x2={ax2} y2={75} stroke="var(--sv-teal)" strokeWidth={2} />
                <polygon points={`${ax2},69 ${ax2 + 8},75 ${ax2},81`} fill="var(--sv-teal)" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DiaCompareColumn({ x, col }: { x: number; col: CompareColumn }) {
  const colw = 270;
  return (
    <g>
      <rect x={x} y={10} width={colw} height={190} rx={10} fill="var(--sv-surface-2)" stroke="var(--sv-line)" />
      <text x={x + 18} y={38} fontFamily="Newsreader" fontWeight={600} fontSize={15} fill={col.colorVar}>
        {col.title}
      </text>
      {col.items.map((it, i) => (
        <text key={i} x={x + 18} y={64 + i * 24} fontFamily="IBM Plex Sans" fontSize={12.5} fill="var(--sv-ink-soft)">
          {"• " + it}
        </text>
      ))}
    </g>
  );
}

function DiaCompare({ left, right, vs }: { left: CompareColumn; right: CompareColumn; vs?: string }) {
  const w = 640,
    h = 210,
    colw = 270;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      <DiaCompareColumn x={10} col={left} />
      <DiaCompareColumn x={w - 10 - colw} col={right} />
      <circle cx={w / 2} cy={105} r={20} fill="var(--sv-paper)" stroke="var(--sv-line)" />
      <text x={w / 2} y={110} textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight={600} fontSize={11} fill="var(--sv-muted)">
        {vs || "vs"}
      </text>
    </svg>
  );
}

function DiaSpectrum({ items }: { items: SpectrumItem[] }) {
  const w = 660,
    h = 130,
    pad = 30;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      <line x1={pad} y1={70} x2={w - pad} y2={70} stroke="var(--sv-line)" strokeWidth={3} />
      {items.map((it, i) => {
        const x = pad + it.pos * (w - pad * 2);
        return (
          <g key={i}>
            <circle cx={x} cy={70} r={7} fill="var(--sv-teal)" />
            <text x={x} y={52} textAnchor="middle" fontFamily="IBM Plex Sans" fontWeight={600} fontSize={12} fill="var(--sv-ink)">
              {it.label}
            </text>
            <text x={x} y={94} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={10.5} fill="var(--sv-muted)">
              {it.sub}
            </text>
          </g>
        );
      })}
      <text x={pad} y={120} fontFamily="IBM Plex Mono" fontSize={10} fill="var(--sv-muted)">
        {"← always-on, slow to change"}
      </text>
      <text x={w - pad} y={120} textAnchor="end" fontFamily="IBM Plex Mono" fontSize={10} fill="var(--sv-muted)">
        {"fast, but only when the weather (or fuel) allows →"}
      </text>
    </svg>
  );
}

function DiaBars({ data, unit, note }: { data: BarDatum[]; unit: string; note?: string }) {
  const w = 660,
    h = 220,
    pad = 34;
  const bw = ((w - pad * 2) / data.length) * 0.62;
  const gap = (w - pad * 2) / data.length;
  const max = Math.max(...data.map((d) => d.value)) * 1.15;
  const gridLines = [0, 1, 2, 3];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      {gridLines.map((g) => {
        const gy = 20 + g * (150 / 3);
        return <line key={g} x1={pad} y1={gy} x2={w - pad} y2={gy} stroke="var(--sv-line-soft)" strokeWidth={1} />;
      })}
      {data.map((d, i) => {
        const x = pad + i * gap + (gap - bw) / 2;
        const bh = (d.value / max) * 150;
        const y = 170 - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx={3} fill={d.hi ? "var(--sv-amber)" : "var(--sv-teal)"} />
            <text x={x + bw / 2} y={y - 7} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={11} fill="var(--sv-ink-soft)">
              {d.value}
            </text>
            <text x={x + bw / 2} y={188} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={10.5} fill="var(--sv-muted)">
              {d.label}
            </text>
          </g>
        );
      })}
      <text x={pad} y={210} fontFamily="IBM Plex Sans" fontSize={11} fill="var(--sv-muted)">
        {unit}
        {note ? `  ·  ${note}` : ""}
      </text>
    </svg>
  );
}

function DiaLine({
  points,
  ylabel,
  shadeFrom,
  shadeTo,
}: {
  points: LinePoint[];
  ylabel: string;
  shadeFrom?: number;
  shadeTo?: number;
}) {
  const w = 660,
    h = 220,
    pad = 34;
  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys) * 0.9;
  const maxY = Math.max(...ys) * 1.1;
  const X = (i: number) => pad + i * ((w - pad * 2) / (points.length - 1));
  const Y = (v: number) => 170 - ((v - minY) / (maxY - minY)) * 150;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
  const area = `${path} L${X(points.length - 1).toFixed(1)},170 L${X(0).toFixed(1)},170 Z`;
  const gridLines = [0, 1, 2, 3];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      {gridLines.map((g) => {
        const gy = 20 + g * (150 / 3);
        return <line key={g} x1={pad} y1={gy} x2={w - pad} y2={gy} stroke="var(--sv-line-soft)" strokeWidth={1} />;
      })}
      {shadeFrom !== undefined && shadeTo !== undefined && (
        <rect x={X(shadeFrom)} y={20} width={X(shadeTo) - X(shadeFrom)} height={150} fill="var(--sv-teal)" opacity={0.09} />
      )}
      <path d={area} fill="var(--sv-teal)" opacity={0.12} />
      <path d={path} fill="none" stroke="var(--sv-teal)" strokeWidth={2.5} />
      {points.map((p, i) => (
        <text key={i} x={X(i)} y={188} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={10} fill="var(--sv-muted)">
          {p.x}
        </text>
      ))}
      <text x={pad} y={210} fontFamily="IBM Plex Sans" fontSize={11} fill="var(--sv-muted)">
        {ylabel}
      </text>
    </svg>
  );
}

function DiaTimeline({ events }: { events: TimelineEvent[] }) {
  const w = 660,
    rowH = 46;
  const h = events.length * rowH + 30;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      <line x1={70} y1={20} x2={70} y2={h - 20} stroke="var(--sv-line)" strokeWidth={2} />
      {events.map((e, i) => {
        const y = 30 + i * rowH;
        return (
          <g key={i}>
            <circle cx={70} cy={y} r={6} fill={e.hi ? "var(--sv-amber)" : "var(--sv-teal)"} />
            <text x={50} y={y + 4} textAnchor="end" fontFamily="IBM Plex Mono" fontSize={10.5} fill="var(--sv-muted)">
              {e.date}
            </text>
            <text
              x={90}
              y={y + 4}
              fontFamily="IBM Plex Sans"
              fontSize={12.5}
              fontWeight={e.hi ? 600 : 400}
              fill={e.hi ? "var(--sv-amber)" : "var(--sv-ink)"}
            >
              {e.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DiagramView({ diagramKey }: { diagramKey: DiagramKey }) {
  const spec = DIAGRAM_DATA[diagramKey];
  switch (spec.kind) {
    case "flow":
      return <DiaFlow steps={spec.steps} />;
    case "compare":
      return <DiaCompare left={spec.left} right={spec.right} vs={spec.vs} />;
    case "spectrum":
      return <DiaSpectrum items={spec.items} />;
    case "bars":
      return <DiaBars data={spec.data} unit={spec.unit} note={spec.note} />;
    case "line":
      return <DiaLine points={spec.points} ylabel={spec.ylabel} shadeFrom={spec.shadeFrom} shadeTo={spec.shadeTo} />;
    case "timeline":
      return <DiaTimeline events={spec.events} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// slide engine — flatten modules + quizzes into one linear sequence, once,
// at module load (mirrors how the original course built this)
// ---------------------------------------------------------------------------

type SeqItem =
  | { type: "content"; moduleIndex: number; slideIndex: number; module: CourseModule; slide: Slide }
  | { type: "quiz"; afterModule: number; questions: QuizQuestion[] };

const SEQUENCE: SeqItem[] = (() => {
  const seq: SeqItem[] = [];
  MODULES.forEach((m, mi) => {
    m.slides.forEach((s, si) => {
      seq.push({ type: "content", moduleIndex: mi, slideIndex: si, module: m, slide: s });
    });
    const qNum = mi + 1;
    const questions = QUIZZES[qNum];
    if (questions) seq.push({ type: "quiz", afterModule: qNum, questions });
  });
  return seq;
})();

const PROGRESS_KEY = "secretvote-course-progress";

function loadSavedIndex(): number {
  if (typeof window === "undefined") return 0;
  try {
    const v = window.localStorage.getItem(PROGRESS_KEY);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

function isModuleDone(mi: number, cur: number, sequence: SeqItem[]): boolean {
  let lastIdx = -1;
  sequence.forEach((it, i) => {
    if (it.type === "content" && it.moduleIndex === mi) lastIdx = i;
  });
  return cur > lastIdx;
}

// ---------------------------------------------------------------------------
// course sub-views
// ---------------------------------------------------------------------------

function ProgressRail({ sequence, cur, onJump }: { sequence: SeqItem[]; cur: number; onJump: (i: number) => void }) {
  return (
    <div className="sv-progress-rail">
      {sequence.map((item, i) => {
        const classes = ["sv-progress-dot"];
        if (item.type === "quiz") classes.push("sv-quiz");
        if (i < cur) classes.push("sv-done");
        if (i === cur) classes.push("sv-current");
        const title = item.type === "quiz" ? "Check-in" : item.module.title;
        return <div key={i} className={classes.join(" ")} title={title} onClick={() => onJump(i)} />;
      })}
    </div>
  );
}

function ModuleMap({
  modules,
  sequence,
  cur,
  onSelectModule,
}: {
  modules: CourseModule[];
  sequence: SeqItem[];
  cur: number;
  onSelectModule: (seqIndex: number) => void;
}) {
  return (
    <div className="sv-module-map">
      {modules.map((m, mi) => {
        const firstSeqIdx = sequence.findIndex((it) => it.type === "content" && it.moduleIndex === mi);
        const done = isModuleDone(mi, cur, sequence);
        return (
          <div key={mi} className="sv-module-card" onClick={() => onSelectModule(firstSeqIdx)}>
            <div className="sv-part-label">{m.part}</div>
            <div className="sv-m-num">Module {mi + 1}</div>
            <h3>{m.title}</h3>
            {done && <div className="sv-m-done">{"✓ visited"}</div>}
          </div>
        );
      })}
    </div>
  );
}

function SlideContentView({ item }: { item: Extract<SeqItem, { type: "content" }> }) {
  const { module: m, slide: s, moduleIndex } = item;
  return (
    <div className="sv-slide-shell">
      <div className="sv-slide-kicker">
        <span className="sv-part">{m.part}</span> <span>{"·"}</span>{" "}
        <span>
          Module {moduleIndex + 1}: {m.title}
        </span>
      </div>
      <h2 className="sv-slide-heading">{s.heading}</h2>
      <div className="sv-slide-body">
        {s.body.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
        ))}
      </div>
      {s.diagram && (
        <div className="sv-slide-diagram">
          <DiagramView diagramKey={s.diagram} />
        </div>
      )}
      {s.callout && (
        <div className="sv-slide-callout">
          <b>{s.callout.label}:</b> <span dangerouslySetInnerHTML={{ __html: s.callout.text }} />
        </div>
      )}
    </div>
  );
}

type QuizProgress = { qi: number; score: number; answered: boolean; selectedIndex: number | null };

const EMPTY_QUIZ_PROGRESS: QuizProgress = { qi: 0, score: 0, answered: false, selectedIndex: null };

function QuizView({
  item,
  progress,
  onChoice,
  onContinue,
}: {
  item: Extract<SeqItem, { type: "quiz" }>;
  progress: QuizProgress;
  onChoice: (choiceIndex: number) => void;
  onContinue: () => void;
}) {
  if (progress.qi >= item.questions.length) {
    const perfect = progress.score === item.questions.length;
    return (
      <div className="sv-quiz-shell sv-quiz-summary">
        <div className="sv-quiz-badge">Check-in complete</div>
        <div className="sv-score">
          {progress.score}/{item.questions.length}
        </div>
        <div className="sv-score-label">correct</div>
        <p>
          {perfect
            ? "Clean sweep — you've got this section down."
            : "Worth a re-read of anything that felt shaky before moving on — use Back to revisit, or continue to the next module."}
        </p>
      </div>
    );
  }

  const q = item.questions[progress.qi];
  return (
    <div className="sv-quiz-shell">
      <div className="sv-quiz-badge">
        Check-in {"·"} question {progress.qi + 1} of {item.questions.length}
      </div>
      <div className="sv-quiz-q">{q.q}</div>
      <div className="sv-quiz-choices">
        {q.choices.map((choice, ci) => {
          const classes = ["sv-quiz-choice"];
          if (progress.answered) {
            if (ci === q.correct) classes.push("sv-correct");
            else if (ci === progress.selectedIndex) classes.push("sv-wrong");
          }
          return (
            <button key={ci} type="button" className={classes.join(" ")} disabled={progress.answered} onClick={() => onChoice(ci)}>
              {choice}
            </button>
          );
        })}
      </div>
      {progress.answered && (
        <>
          <div className="sv-quiz-explain">
            {progress.selectedIndex === q.correct ? "✓ Correct. " : "✗ Not quite. "}
            {q.explain}
          </div>
          <div className="sv-quiz-continue-row">
            <button type="button" className="sv-nav-btn sv-primary" onClick={onContinue}>
              {"Continue →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function LexiconView({
  search,
  cat,
  onSearchChange,
  onCatChange,
}: {
  search: string;
  cat: string;
  onSearchChange: (v: string) => void;
  onCatChange: (v: string) => void;
}) {
  const cats = useMemo(() => ["All", ...Array.from(new Set(GLOSSARY.map((g) => g.c)))], []);
  const rows = useMemo(() => {
    return GLOSSARY.filter((g) => {
      if (cat !== "All" && g.c !== cat) return false;
      if (search) {
        const hay = (g.t + " " + g.d).toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => a.t.localeCompare(b.t));
  }, [search, cat]);

  return (
    <div className="sv-lexicon-view">
      <div className="sv-panel sv-lex-controls">
        <input
          className="sv-lex-search"
          type="text"
          placeholder={'Search terms, e.g. "basis cost", "LCOE", "executive session"…'}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="sv-lex-pills">
          {cats.map((c) => (
            <div key={c} className={"sv-lex-pill" + (cat === c ? " sv-active" : "")} onClick={() => onCatChange(c)}>
              {c}
            </div>
          ))}
        </div>
      </div>
      <div className="sv-lex-count">
        {rows.length} of {GLOSSARY.length} terms
      </div>
      {rows.length > 0 ? (
        <div className="sv-lex-grid">
          {rows.map((g) => (
            <div key={g.t} className="sv-lex-card">
              <div className="sv-lex-term">{g.t}</div>
              <span className="sv-lex-cat">{g.c}</span>
              <div className="sv-lex-def">{g.d}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="sv-lex-empty">No terms match.</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// main component
// ---------------------------------------------------------------------------

export default function SecretVoteCourse({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<"course" | "lexicon">("course");
  const [screen, setScreen] = useState<"landing" | "slide">(() => {
    const saved = loadSavedIndex();
    return saved > 0 && saved < SEQUENCE.length ? "slide" : "landing";
  });
  const [cur, setCur] = useState<number>(() => {
    const saved = loadSavedIndex();
    return saved > 0 && saved < SEQUENCE.length ? saved : 0;
  });
  const [quizState, setQuizState] = useState<Record<number, QuizProgress>>({});
  const [lexSearch, setLexSearch] = useState("");
  const [lexCat, setLexCat] = useState("All");

  useEffect(() => {
    try {
      window.localStorage.setItem(PROGRESS_KEY, String(cur));
    } catch {
      // private browsing / storage disabled — progress just won't persist
    }
  }, [cur]);

  function goToSlide(seqIndex: number) {
    if (seqIndex < 0) return;
    setCur(seqIndex);
    setScreen("slide");
  }

  function handleNext() {
    if (cur < SEQUENCE.length - 1) {
      setCur(cur + 1);
    } else {
      setScreen("landing");
    }
  }
  function handleBack() {
    if (cur > 0) setCur(cur - 1);
  }

  useEffect(() => {
    if (mode !== "course" || screen !== "slide") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handleBack();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, screen, cur]);

  function handleChoice(seqIndex: number, item: Extract<SeqItem, { type: "quiz" }>, choiceIndex: number) {
    setQuizState((prev) => {
      const p = prev[seqIndex] ?? EMPTY_QUIZ_PROGRESS;
      if (p.answered) return prev;
      const q = item.questions[p.qi];
      const correct = choiceIndex === q.correct;
      return {
        ...prev,
        [seqIndex]: { ...p, answered: true, selectedIndex: choiceIndex, score: p.score + (correct ? 1 : 0) },
      };
    });
  }

  function handleQuizContinue(seqIndex: number) {
    setQuizState((prev) => {
      const p = prev[seqIndex] ?? EMPTY_QUIZ_PROGRESS;
      return { ...prev, [seqIndex]: { ...p, qi: p.qi + 1, answered: false, selectedIndex: null } };
    });
  }

  const currentItem = SEQUENCE[cur];
  const nextLabel = currentItem?.type === "content" ? (cur === SEQUENCE.length - 1 ? "Finish" : "Next →") : "Skip →";

  return (
    <div className={`secret-vote-course ${className}`}>
      <div className="sv-wrap">
        <div className="sv-topbar">
          <div className="sv-brand">
            <div className="sv-eyebrow">{"Secret Vote · Companion Course"}</div>
            <h1>The Grid Primer</h1>
          </div>
          <div className="sv-mode-toggle">
            <button type="button" className={mode === "course" ? "sv-active" : ""} onClick={() => setMode("course")}>
              Course
            </button>
            <button type="button" className={mode === "lexicon" ? "sv-active" : ""} onClick={() => setMode("lexicon")}>
              Lexicon
            </button>
          </div>
        </div>

        {mode === "course" && (
          <div className="sv-course-view">
            {screen === "landing" && (
              <div className="sv-panel sv-landing">
                <p className="sv-landing-intro">
                  Twelve short modules, grid basics to the specifics of Austin's May 2026 vote &mdash; each ends where
                  the next picks up, so start at Module 1 or jump to whatever you need. A 5-question check-in follows
                  every second module. Progress is remembered in this browser.
                </p>
                <ModuleMap modules={MODULES} sequence={SEQUENCE} cur={cur} onSelectModule={goToSlide} />
              </div>
            )}

            {screen === "slide" && currentItem && (
              <div className="sv-panel">
                <div className="sv-progress-rail-wrap">
                  <ProgressRail sequence={SEQUENCE} cur={cur} onJump={goToSlide} />
                </div>
                {currentItem.type === "content" ? (
                  <SlideContentView item={currentItem} />
                ) : (
                  <QuizView
                    item={currentItem}
                    progress={quizState[cur] ?? EMPTY_QUIZ_PROGRESS}
                    onChoice={(ci) => handleChoice(cur, currentItem, ci)}
                    onContinue={() => handleQuizContinue(cur)}
                  />
                )}
                <div className="sv-nav-row-wrap">
                  <div className="sv-nav-row">
                    <button type="button" className="sv-nav-btn" disabled={cur === 0} onClick={handleBack}>
                      {"← Back"}
                    </button>
                    <span className="sv-nav-count">
                      {cur + 1} / {SEQUENCE.length}
                    </span>
                    <button type="button" className="sv-nav-btn sv-primary" onClick={handleNext}>
                      {nextLabel}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "lexicon" && (
          <LexiconView search={lexSearch} cat={lexCat} onSearchChange={setLexSearch} onCatChange={setLexCat} />
        )}

        <footer className="sv-footer sv-panel">
          Built for the <em>Secret Vote</em> documentary project as a plain-language on-ramp to the other tools here
          (Grid Technology Explorer, Load Growth & Pricing Pressure, Battery & Peaker Economics, The Road to the
          Vote, and the rest). Facts and figures are drawn from those tools and their sources &mdash; where a number
          is estimated, disputed, or single-sourced, this course says so rather than smoothing it over. Not legal,
          financial, or investment advice.
        </footer>
      </div>
    </div>
  );
}
