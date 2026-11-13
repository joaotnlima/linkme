// Decorative "forking paths" background. Pure CSS animation, respects reduced motion.
export function Background() {
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ opacity: "var(--bg-opacity)" }}>
      <svg className="w-full h-full block" viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" fill="none">
        <g stroke="var(--bg-stroke)" strokeWidth="1.5" strokeLinecap="round">
          <path className="bg-path" d="M30 830 C 80 700, 60 560, 120 480 S 200 380, 180 300" />
          <path className="bg-path" d="M30 830 C 120 760, 220 740, 300 700 S 360 640, 350 560" />
          <path className="bg-path" d="M30 830 C 40 650, 20 520, 60 420 S 90 260, 40 180" />
          <path className="bg-path" d="M30 830 C 60 740, 140 720, 160 640 S 120 560, 150 500" />
          <path className="bg-path" d="M30 830 C 150 810, 250 790, 340 800" />
          <path className="bg-path" d="M30 830 C 90 640, 180 600, 240 520 S 330 420, 300 330 S 250 240, 290 160" />
        </g>
        <path className="bg-accent" pathLength={1} d="M30 830 C 90 640, 180 600, 240 520 S 330 420, 300 330 S 250 240, 290 160" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
        {[
          [180, 300, "bg-q"],
          [350, 560, "bg-q bg-q2"],
          [40, 180, "bg-q bg-q3"],
          [150, 500, "bg-q bg-q4"],
          [340, 800, "bg-q bg-q2"],
        ].map(([x, y, cls]) => (
          <g key={`${x}-${y}`} className={String(cls)} stroke="var(--bg-stroke)" strokeWidth="1.5">
            <circle cx={Number(x)} cy={Number(y)} r="11" fill="var(--bg)" />
            <text x={Number(x)} y={Number(y) + 5} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--bg-stroke)" stroke="none">?</text>
          </g>
        ))}
        <circle className="bg-ring" cx="290" cy="160" r="12" stroke="var(--accent)" strokeWidth="1.5" />
        <circle className="bg-dot" cx="290" cy="160" r="7" fill="var(--accent)" />
        <circle cx="30" cy="830" r="4" fill="var(--bg-stroke)" />
      </svg>
    </div>
  );
}
