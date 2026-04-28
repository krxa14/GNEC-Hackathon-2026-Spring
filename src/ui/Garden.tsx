export function Garden({ entryCount, streakDays }: { entryCount: number; streakDays: number }) {
  const stage =
    entryCount >= 30 ? 5 :
    entryCount >= 15 ? 4 :
    entryCount >= 7  ? 3 :
    entryCount >= 3  ? 2 :
    entryCount >= 1  ? 1 :
    0;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 120 90"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        role="img"
        aria-label={`Garden stage ${stage}`}
      >
        {/* Ground */}
        <rect x="0" y="74" width="120" height="16" fill="#1a0f06" />

        {/* Stage 1+: Center seedling */}
        {stage >= 1 && (
          <g>
            {/* Center stem */}
            <line x1="60" y1="74" x2="60" y2="62" stroke="#2a4e24" strokeWidth="1.5" strokeLinecap="round" />
            {/* Left leaf */}
            <ellipse cx="55" cy="65" rx="4" ry="2" fill="#3a6e30" transform="rotate(-30 55 65)" />
            <ellipse cx="55.5" cy="64.5" rx="3" ry="1.2" fill="#4d8f42" transform="rotate(-30 55.5 64.5)" />
            {/* Right leaf */}
            <ellipse cx="65" cy="65" rx="4" ry="2" fill="#3a6e30" transform="rotate(30 65 65)" />
            <ellipse cx="64.5" cy="64.5" rx="3" ry="1.2" fill="#4d8f42" transform="rotate(30 64.5 64.5)" />
          </g>
        )}

        {/* Stage 2+: Center grows taller + left sprout */}
        {stage >= 2 && (
          <g>
            {/* Extend center stem higher */}
            <line x1="60" y1="62" x2="60" y2="50" stroke="#2a4e24" strokeWidth="1.5" strokeLinecap="round" />
            {/* Bigger center leaves at new height */}
            <ellipse cx="53" cy="54" rx="5.5" ry="2.5" fill="#3a6e30" transform="rotate(-35 53 54)" />
            <ellipse cx="53.5" cy="53.5" rx="4" ry="1.5" fill="#4d8f42" transform="rotate(-35 53.5 53.5)" />
            <ellipse cx="67" cy="54" rx="5.5" ry="2.5" fill="#3a6e30" transform="rotate(35 67 54)" />
            <ellipse cx="66.5" cy="53.5" rx="4" ry="1.5" fill="#4d8f42" transform="rotate(35 66.5 53.5)" />

            {/* Left sprout at x=32 */}
            <line x1="32" y1="74" x2="32" y2="66" stroke="#2a4e24" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="28" cy="68" rx="3.5" ry="1.5" fill="#3a6e30" transform="rotate(-25 28 68)" />
            <ellipse cx="36" cy="68" rx="3.5" ry="1.5" fill="#3a6e30" transform="rotate(25 36 68)" />
          </g>
        )}

        {/* Stage 3+: All three plants, medium height */}
        {stage >= 3 && (
          <g>
            {/* Center grows to y=38 */}
            <line x1="60" y1="50" x2="60" y2="38" stroke="#2a4e24" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="52" cy="43" rx="6" ry="2.5" fill="#3a6e30" transform="rotate(-38 52 43)" />
            <ellipse cx="52.5" cy="42.5" rx="4.5" ry="1.6" fill="#4d8f42" transform="rotate(-38 52.5 42.5)" />
            <ellipse cx="68" cy="43" rx="6" ry="2.5" fill="#3a6e30" transform="rotate(38 68 43)" />
            <ellipse cx="67.5" cy="42.5" rx="4.5" ry="1.6" fill="#4d8f42" transform="rotate(38 67.5 42.5)" />

            {/* Left plant grows: x=32, to y=58 */}
            <line x1="32" y1="66" x2="32" y2="58" stroke="#2a4e24" strokeWidth="1.3" strokeLinecap="round" />
            <ellipse cx="27" cy="61" rx="4.5" ry="2" fill="#3a6e30" transform="rotate(-30 27 61)" />
            <ellipse cx="37" cy="61" rx="4.5" ry="2" fill="#3a6e30" transform="rotate(30 37 61)" />
            <ellipse cx="27.5" cy="60.5" rx="3" ry="1.2" fill="#4d8f42" transform="rotate(-30 27.5 60.5)" />
            <ellipse cx="36.5" cy="60.5" rx="3" ry="1.2" fill="#4d8f42" transform="rotate(30 36.5 60.5)" />

            {/* Right plant at x=88, medium height to y=62 */}
            <line x1="88" y1="74" x2="88" y2="62" stroke="#2a4e24" strokeWidth="1.3" strokeLinecap="round" />
            <ellipse cx="83" cy="65" rx="4.5" ry="2" fill="#3a6e30" transform="rotate(-30 83 65)" />
            <ellipse cx="93" cy="65" rx="4.5" ry="2" fill="#3a6e30" transform="rotate(30 93 65)" />
            <ellipse cx="83.5" cy="64.5" rx="3" ry="1.2" fill="#4d8f42" transform="rotate(-30 83.5 64.5)" />
            <ellipse cx="92.5" cy="64.5" rx="3" ry="1.2" fill="#4d8f42" transform="rotate(30 92.5 64.5)" />
          </g>
        )}

        {/* Stage 4+: Flowers appear, plants taller */}
        {stage >= 4 && (
          <g>
            {/* Center plant to y=30, gold flower */}
            <line x1="60" y1="38" x2="60" y2="30" stroke="#2a4e24" strokeWidth="1.5" strokeLinecap="round" />
            {/* Center flower petals */}
            <circle cx="60" cy="28" r="4.5" fill="#c68b5a" opacity="0.35" />
            <circle cx="60" cy="28" r="2.5" fill="#c68b5a" />
            <circle cx="60" cy="23.5" r="1.8" fill="#c68b5a" opacity="0.6" />
            <circle cx="64.5" cy="26.5" r="1.8" fill="#c68b5a" opacity="0.6" />
            <circle cx="55.5" cy="26.5" r="1.8" fill="#c68b5a" opacity="0.6" />
            <circle cx="55.5" cy="29.5" r="1.8" fill="#c68b5a" opacity="0.6" />
            <circle cx="64.5" cy="29.5" r="1.8" fill="#c68b5a" opacity="0.6" />

            {/* Left plant taller to y=50, small flower */}
            <line x1="32" y1="58" x2="32" y2="50" stroke="#2a4e24" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="32" cy="48" r="3" fill="#c68b5a" opacity="0.3" />
            <circle cx="32" cy="48" r="1.8" fill="#c68b5a" />

            {/* Right plant taller to y=52, small flower */}
            <line x1="88" y1="62" x2="88" y2="52" stroke="#2a4e24" strokeWidth="1.3" strokeLinecap="round" />
            <ellipse cx="83" cy="56" rx="5" ry="2" fill="#3a6e30" transform="rotate(-30 83 56)" />
            <ellipse cx="93" cy="56" rx="5" ry="2" fill="#3a6e30" transform="rotate(30 93 56)" />
            <circle cx="88" cy="50" r="3" fill="#c68b5a" opacity="0.3" />
            <circle cx="88" cy="50" r="1.8" fill="#c68b5a" />
          </g>
        )}

        {/* Stage 5: Full garden — moon, stars, corner bushes */}
        {stage >= 5 && (
          <g>
            {/* Crescent moon top-right */}
            <circle cx="102" cy="11" r="6" fill="#a8b0bb" opacity="0.55" />
            <circle cx="105" cy="9" r="5.5" fill="#0c0c10" />

            {/* Stars scattered */}
            <circle cx="18" cy="8" r="0.9" fill="#a8b0bb" opacity="0.7" />
            <circle cx="35" cy="14" r="0.7" fill="#a8b0bb" opacity="0.5" />
            <circle cx="72" cy="6" r="0.8" fill="#a8b0bb" opacity="0.6" />
            <circle cx="50" cy="20" r="0.6" fill="#a8b0bb" opacity="0.45" />
            <circle cx="85" cy="18" r="0.7" fill="#a8b0bb" opacity="0.5" />

            {/* Left corner bush */}
            <ellipse cx="10" cy="74" rx="10" ry="5" fill="#1e3a1a" />
            <ellipse cx="10" cy="72" rx="7" ry="3.5" fill="#2a4e24" />

            {/* Right corner bush */}
            <ellipse cx="110" cy="74" rx="10" ry="5" fill="#1e3a1a" />
            <ellipse cx="110" cy="72" rx="7" ry="3.5" fill="#2a4e24" />

            {/* Additional left plant leaves (stage 5 fuller) */}
            <ellipse cx="27" cy="53" rx="5" ry="2" fill="#3a6e30" transform="rotate(-35 27 53)" />
            <ellipse cx="37" cy="53" rx="5" ry="2" fill="#3a6e30" transform="rotate(35 37 53)" />
          </g>
        )}
      </svg>

      <p className={`text-[9px] tracking-[0.15em] uppercase ${entryCount === 0 ? "text-ink-700" : "text-ink-600"}`}>
        {entryCount === 0
          ? "Your garden awaits"
          : `${entryCount} entries · ${streakDays}d`}
      </p>
    </div>
  );
}
