import Link from "next/link";
import { content, settings } from "@/lib/content";

export function ForgeMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 2v36M2 20h36M7.3 7.3l25.4 25.4M7.3 32.7 32.7 7.3"
        stroke="currentColor"
        strokeWidth="5"
      />
      <circle cx="20" cy="20" r="8" fill="currentColor" />
      <circle cx="20" cy="20" r="3" className="mark-core" />
    </svg>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href={settings.routes.home}
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label={`${content.brand} ${content.brandSuffix} home`}
    >
      <ForgeMark />
      <span>
        {content.brand}
        <sup>{content.brandSuffix}</sup>
      </span>
    </Link>
  );
}

export function AgentSymbol({ kind }: { kind: string }) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      aria-hidden="true"
      className="agent-symbol"
    >
      {kind === "orbit" ? (
        <>
          <ellipse
            cx="70"
            cy="70"
            rx="49"
            ry="23"
            transform="rotate(-40 70 70)"
          />
          <ellipse
            cx="70"
            cy="70"
            rx="49"
            ry="23"
            transform="rotate(40 70 70)"
          />
          <circle cx="70" cy="70" r="11" />
        </>
      ) : kind === "focus" ? (
        <>
          <rect x="30" y="30" width="80" height="80" rx="40" />
          <rect x="43" y="43" width="54" height="54" rx="27" />
          <path d="M70 12v35m0 46v35M12 70h35m46 0h35" />
        </>
      ) : (
        <>
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M70 15v31" transform={`rotate(${i * 30} 70 70)`} />
          ))}
          <circle cx="70" cy="70" r="14" />
        </>
      )}
    </svg>
  );
}
