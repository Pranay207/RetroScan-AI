export default function RetroScanLogo({ className = '', compact = false }) {
  return (
    <div className={`relative overflow-hidden rounded-[22%] bg-[#141c2e] shadow-[0_16px_40px_rgba(20,28,46,0.28)] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,140,74,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
      <svg viewBox="0 0 128 128" className="relative h-full w-full" aria-hidden="true">
        <defs>
          <filter id="retro-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M33 30c11 7 18 2 31-2c13 4 20 9 31 2v29c0 23-15 38-31 49C48 97 33 82 33 59V30Z"
          fill="none"
          stroke="#FF9A52"
          strokeWidth="2.3"
          strokeLinejoin="round"
          filter="url(#retro-glow)"
        />
        <path d="M33 52h62" stroke="#FF9A52" strokeWidth="2.1" strokeLinecap="round" opacity="0.92" />
        <path d="M47 30c0 8 2 14 6 21" stroke="#FF9A52" strokeWidth="2.1" strokeLinecap="round" opacity="0.92" />
        <path d="M81 30c0 8-2 14-6 21" stroke="#FF9A52" strokeWidth="2.1" strokeLinecap="round" opacity="0.92" />
        <circle cx="64" cy="67" r={compact ? '8' : '10'} fill="#FF9A52" filter="url(#retro-glow)" />
        <path d="M64 77v30" stroke="#FF9A52" strokeWidth="2.1" strokeLinecap="round" />
        <path d="M64 77L42 99" stroke="#FF9A52" strokeWidth="2.1" strokeLinecap="round" />
        <path d="M64 77L86 99" stroke="#FF9A52" strokeWidth="2.1" strokeLinecap="round" />
      </svg>
    </div>
  );
}
