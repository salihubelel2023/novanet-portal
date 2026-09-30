export function NetworkPulse({ className }: { className?: string }) {
  const nodes = [
    { id: "estate", x: 96, y: 96, label: "Estate" },
    { id: "business", x: 544, y: 96, label: "Business" },
    { id: "hotspot", x: 96, y: 324, label: "Hotspot" },
    { id: "starlink", x: 544, y: 324, label: "Starlink" },
  ];
  const core = { x: 320, y: 210 };

  const paths = nodes.map((n) => `M${n.x},${n.y} Q${(n.x + core.x) / 2},${core.y} ${core.x},${core.y}`);

  return (
    <svg
      viewBox="0 0 640 420"
      className={className}
      role="img"
      aria-label="Diagram of NovaNet's network linking estates, businesses, hotspots and Starlink to the NovaNet core"
    >
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--signal))" stopOpacity="0.45" />
          <stop offset="100%" stopColor="hsl(var(--signal))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* connecting paths */}
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
      ))}
      {paths.map((d, i) => (
        <path
          key={`dash-${i}`}
          d={d}
          fill="none"
          stroke="hsl(var(--signal))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 22"
          style={{ strokeDashoffset: 200 }}
          className="animate-dash-travel opacity-70"
        />
      ))}

      {/* traveling packets */}
      {paths.map((d, i) => (
        <circle key={`p-${i}`} r="3.5" fill="hsl(var(--signal))">
          <animateMotion dur={`${2.6 + i * 0.4}s`} repeatCount="indefinite" path={d} />
        </circle>
      ))}

      {/* core hub */}
      <circle cx={core.x} cy={core.y} r="64" fill="url(#coreGlow)" />
      <circle cx={core.x} cy={core.y} r="30" fill="hsl(var(--surface-2))" stroke="hsl(var(--signal))" strokeWidth="1.5" />
      <circle cx={core.x} cy={core.y} r="30" fill="none" stroke="hsl(var(--signal))" strokeOpacity="0.5" strokeWidth="10" className="animate-pulse-signal" />
      <text x={core.x} y={core.y + 4} textAnchor="middle" className="fill-foreground font-display text-[11px] font-semibold">
        Core
      </text>

      {/* outer nodes */}
      {nodes.map((n) => (
        <g key={n.id}>
          <rect x={n.x - 34} y={n.y - 34} width="68" height="68" rx="18" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
          <circle cx={n.x} cy={n.y - 4} r="9" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
          <circle cx={n.x} cy={n.y - 4} r="3" fill="hsl(var(--muted-foreground))" />
          <text x={n.x} y={n.y + 24} textAnchor="middle" className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wide">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
