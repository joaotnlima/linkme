import type { ReactNode } from "react";

// Decorative homepage backgrounds. All are pure CSS/SVG animation, theme-aware
// (they only use the --bg / --accent / --bg-stroke / --bg-opacity CSS variables,
// so each one works in both light and dark), and reduced-motion safe (globals.css
// disables every animation under `.bg-scene` when the user prefers reduced motion).

function Scene({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="bg-scene absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: "var(--bg-opacity)" }}>
      {children}
    </div>
  );
}

const svg = { className: "w-full h-full block", viewBox: "0 0 390 844", preserveAspectRatio: "xMidYMid slice", fill: "none" } as const;

/** 1 — Forking paths (the original). One route lights up. */
function Paths() {
  const lead = "M30 830 C 90 640, 180 600, 240 520 S 330 420, 300 330 S 250 240, 290 160";
  return (
    <Scene>
      <svg {...svg}>
        <g stroke="var(--bg-stroke)" strokeWidth="1.5" strokeLinecap="round">
          <path className="bg-path" d="M30 830 C 80 700, 60 560, 120 480 S 200 380, 180 300" />
          <path className="bg-path" d="M30 830 C 120 760, 220 740, 300 700 S 360 640, 350 560" />
          <path className="bg-path" d="M30 830 C 40 650, 20 520, 60 420 S 90 260, 40 180" />
          <path className="bg-path" d="M30 830 C 60 740, 140 720, 160 640 S 120 560, 150 500" />
          <path className="bg-path" d="M30 830 C 150 810, 250 790, 340 800" />
          <path className="bg-path" d={lead} />
        </g>
        <path className="bg-accent" pathLength={1} d={lead} stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
        {[[180, 300, ""], [350, 560, "bg-q2"], [40, 180, "bg-q3"], [150, 500, "bg-q4"], [340, 800, "bg-q2"]].map(([x, y, cls]) => (
          <g key={`${x}-${y}`} className={`bg-q ${cls}`} stroke="var(--bg-stroke)" strokeWidth="1.5">
            <circle cx={Number(x)} cy={Number(y)} r="11" fill="var(--bg)" />
            <text x={Number(x)} y={Number(y) + 5} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--bg-stroke)" stroke="none">?</text>
          </g>
        ))}
        <circle className="bg-ring" cx="290" cy="160" r="12" stroke="var(--accent)" strokeWidth="1.5" />
        <circle className="bg-dot" cx="290" cy="160" r="7" fill="var(--accent)" />
      </svg>
    </Scene>
  );
}

/** 2 — Aurora: soft drifting gradient blobs. */
function Aurora() {
  const blob = (bg: string): React.CSSProperties => ({ background: `radial-gradient(closest-side, ${bg}, transparent 70%)` });
  return (
    <Scene>
      <div className="bgx-blob" style={{ ...blob("var(--accent)"), top: "-25%", left: "-15%" }} />
      <div className="bgx-blob bgx-blob2" style={{ ...blob("var(--bg-stroke)"), bottom: "-30%", right: "-15%" }} />
      <div className="bgx-blob bgx-blob3" style={{ ...blob("var(--accent)"), top: "20%", right: "10%" }} />
    </Scene>
  );
}

/** 3 — Drift grid: a dotted grid slowly panning. */
function Grid() {
  return <Scene><div className="bgx-grid absolute inset-0" /></Scene>;
}

/** 4 — Constellation: twinkling stars with a few quiet links. */
const STARS: [number, number][] = [[42, 120], [120, 80], [205, 150], [300, 90], [340, 210], [70, 260], [160, 300], [250, 340], [95, 430], [280, 470], [180, 540], [330, 600], [60, 620], [230, 680], [130, 760]];
function Constellation() {
  const lines: [number, number][] = [[1, 2], [2, 3], [5, 6], [6, 7], [8, 10], [11, 13]];
  return (
    <Scene>
      <svg {...svg}>
        <g stroke="var(--bg-stroke)" strokeWidth="1" opacity="0.5">
          {lines.map(([a, b], i) => <line key={i} x1={STARS[a][0]} y1={STARS[a][1]} x2={STARS[b][0]} y2={STARS[b][1]} />)}
        </g>
        {STARS.map(([x, y], i) => (
          <circle key={i} className="bgx-star" style={{ animationDelay: `${-i * 0.6}s` }} cx={x} cy={y} r={i % 4 === 0 ? 2.8 : 1.8} fill={i % 3 === 0 ? "var(--accent)" : "var(--bg-stroke)"} />
        ))}
      </svg>
    </Scene>
  );
}

/** 5 — Orbits: concentric rings with points circling. */
function Orbits() {
  const cx = 300, cy = 250, rings = [140, 240, 340];
  return (
    <Scene>
      <svg {...svg}>
        {rings.map((r) => <circle key={r} cx={cx} cy={cy} r={r} stroke="var(--bg-stroke)" strokeWidth="1" opacity="0.5" />)}
        {rings.map((r, i) => (
          <g key={`o${r}`} className="bgx-orbit" style={{ transformBox: "view-box", transformOrigin: `${cx}px ${cy}px`, animationDuration: `${16 + i * 9}s`, animationDirection: i % 2 ? "reverse" : "normal" }}>
            <circle cx={cx} cy={cy - r} r={i === 0 ? 5.5 : 3.5} fill="var(--accent)" />
          </g>
        ))}
        <circle cx={cx} cy={cy} r="4" fill="var(--accent)" />
      </svg>
    </Scene>
  );
}

/** 6 — Waves: layered sine waves sliding. */
function Waves() {
  const d = (y: number) => `M-20 ${y} c 48 -26 96 -26 144 0 s 96 26 144 0 s 96 -26 144 0 s 96 26 144 0 s 96 -26 144 0`;
  const rows = [{ y: 540, c: "var(--bg-stroke)", dur: 26, o: 0.6 }, { y: 630, c: "var(--accent)", dur: 20, o: 0.55 }, { y: 720, c: "var(--bg-stroke)", dur: 32, o: 0.4 }];
  return (
    <Scene>
      <svg {...svg}>
        {rows.map((w, i) => <path key={i} className="bgx-wave" style={{ animationDuration: `${w.dur}s`, opacity: w.o }} d={d(w.y)} stroke={w.c} strokeWidth="2" strokeLinecap="round" />)}
      </svg>
    </Scene>
  );
}

/** 7 — Ripple: pulses radiating from a point. */
function Ripple() {
  const cx = 195, cy = 300;
  return (
    <Scene>
      <svg {...svg}>
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} className="bgx-ripple" style={{ transformBox: "view-box", transformOrigin: `${cx}px ${cy}px`, animationDelay: `${-i * 1.75}s` }} cx={cx} cy={cy} r="40" stroke="var(--accent)" strokeWidth="2" fill="none" />
        ))}
        <circle cx={cx} cy={cy} r="5" fill="var(--accent)" />
      </svg>
    </Scene>
  );
}

/** 8 — Streams: data streaks falling. */
function Streams() {
  return (
    <Scene>
      <svg {...svg}>
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 24 + i * 44;
          return <line key={i} className="bgx-stream" style={{ animationDuration: `${7 + (i % 4) * 2.5}s`, animationDelay: `${-i * 0.9}s` }} x1={x} y1="-240" x2={x} y2="-20" stroke={i % 3 === 0 ? "var(--accent)" : "var(--bg-stroke)"} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />;
        })}
      </svg>
    </Scene>
  );
}

/** 9 — Bokeh: soft blurred orbs drifting. */
function Bokeh() {
  const orbs: [number, number, number][] = [[12, 22, 72], [32, 62, 44], [56, 28, 94], [76, 70, 52], [88, 16, 64], [45, 86, 36], [20, 92, 48], [66, 46, 78], [8, 55, 40]];
  return (
    <Scene>
      {orbs.map(([l, t, s], i) => (
        <div key={i} className="bgx-bokeh" style={{ left: `${l}%`, top: `${t}%`, width: s, height: s, background: i % 2 ? "var(--accent)" : "var(--bg-stroke)", animationDuration: `${13 + i * 1.6}s`, animationDelay: `${-i * 1.5}s` }} />
      ))}
    </Scene>
  );
}

/** 10 — Mesh: a slow-shifting gradient mesh. */
function Mesh() {
  return <Scene><div className="bgx-mesh absolute inset-0" /></Scene>;
}

export type BackgroundKey =
  | "paths" | "aurora" | "grid" | "constellation" | "orbits" | "waves" | "ripple" | "streams" | "bokeh" | "mesh";

export const BACKGROUNDS: { key: BackgroundKey; label: string; Component: () => ReactNode }[] = [
  { key: "paths", label: "Forking paths", Component: Paths },
  { key: "aurora", label: "Aurora", Component: Aurora },
  { key: "grid", label: "Drift grid", Component: Grid },
  { key: "constellation", label: "Constellation", Component: Constellation },
  { key: "orbits", label: "Orbits", Component: Orbits },
  { key: "waves", label: "Waves", Component: Waves },
  { key: "ripple", label: "Ripple", Component: Ripple },
  { key: "streams", label: "Streams", Component: Streams },
  { key: "bokeh", label: "Bokeh", Component: Bokeh },
  { key: "mesh", label: "Mesh", Component: Mesh },
];

export const BACKGROUND_KEYS = BACKGROUNDS.map((b) => b.key) as [BackgroundKey, ...BackgroundKey[]];
export const DEFAULT_BACKGROUND: BackgroundKey = "paths";

const BY_KEY = Object.fromEntries(BACKGROUNDS.map((b) => [b.key, b.Component])) as Record<BackgroundKey, () => ReactNode>;

/** Render a background by key, falling back to the default. */
export function renderBackground(key: string | null | undefined) {
  const C = BY_KEY[(key as BackgroundKey)] ?? BY_KEY[DEFAULT_BACKGROUND];
  return <C />;
}
