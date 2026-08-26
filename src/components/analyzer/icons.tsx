/**
 * Hand-drawn icon set for the analyzer UI.
 *
 * Deliberately not a re-export of any stock icon package: the glyphs are
 * drawn for this tool (2px strokes, squared-off geometry, the odd quirk)
 * so the interface has its own drafting-table character.
 */
import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function Search(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m19.5 19.5-4-4" />
    </Svg>
  );
}

export function Loader2(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3a9 9 0 1 1-8.5 6" />
      <path d="M3.5 4.5v4.5H8" />
    </Svg>
  );
}

export function Dna(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 2.5c0 5 8 4.5 8 9.5s-8 4.5-8 9.5" />
      <path d="M16 2.5c0 5-8 4.5-8 9.5s8 4.5 8 9.5" />
      <path d="M9.4 6h5.2M8 12h8M9.4 18h5.2" strokeWidth={1.6} />
    </Svg>
  );
}

export function Download(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5V14" />
      <path d="m8 10.5 4 4 4-4" />
      <path d="M4.5 17.5v2a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-2" />
    </Svg>
  );
}

export function Upload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 14V3.5" />
      <path d="m8 7.5 4-4 4 4" />
      <path d="M4.5 17.5v2a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-2" />
    </Svg>
  );
}

export function Github(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.66.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export function AlertTriangle(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.8 2.8 19.5h18.4L12 3.8Z" />
      <path d="M12 10v4.2" />
      <path d="M12 17.1h.01" strokeWidth={2.6} />
    </Svg>
  );
}

export function CircleAlert(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5" />
      <path d="M12 15.9h.01" strokeWidth={2.6} />
    </Svg>
  );
}

export function Sparkles(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M11 4.5 12.6 9l4.4 1.6-4.4 1.6L11 16.6l-1.6-4.4L5 10.6 9.4 9 11 4.5Z" />
      <path d="M18.5 15.5v4M16.5 17.5h4" strokeWidth={1.7} />
    </Svg>
  );
}

export function Microscope(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 21h13" />
      <path d="m10 6.5 3.2-3.2 4 4-3.2 3.2" />
      <path d="m10.6 11.4-2.4 2.4" />
      <path d="M12.5 17a4.5 4.5 0 0 0 4.5-4.5V9" />
      <path d="M8 17h6" />
    </Svg>
  );
}

export function SlidersHorizontal(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 7h9M17.5 7h3" />
      <circle cx="15" cy="7" r="2" />
      <path d="M3.5 12h3M11.5 12h9" />
      <circle cx="9" cy="12" r="2" />
      <path d="M3.5 17h11M19.5 17h1" />
      <circle cx="17" cy="17" r="2" />
    </Svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />
    </Svg>
  );
}

export function FileText(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 3h6.5L18 7.5V21H7V3Z" />
      <path d="M13.5 3v4.5H18" />
      <path d="M10 12.5h5M10 16h5" strokeWidth={1.7} />
    </Svg>
  );
}

export function FlaskConical(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 3h5" />
      <path d="M10 3v5.8L4.9 18a2 2 0 0 0 1.8 3h10.6a2 2 0 0 0 1.8-3L14 8.8V3" />
      <path d="M7.6 14.5h8.8" strokeWidth={1.7} />
    </Svg>
  );
}

export function ShieldAlert(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 5 5.8v5.4c0 4.4 2.9 7.6 7 8.8 4.1-1.2 7-4.4 7-8.8V5.8L12 3Z" />
      <path d="M12 8.5v4" />
      <path d="M12 15.6h.01" strokeWidth={2.6} />
    </Svg>
  );
}

export function ShieldCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 5 5.8v5.4c0 4.4 2.9 7.6 7 8.8 4.1-1.2 7-4.4 7-8.8V5.8L12 3Z" />
      <path d="m8.8 11.8 2.3 2.3 4.3-4.8" />
    </Svg>
  );
}

export function History(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 1 2.6 6.1" />
      <path d="M3.5 12V8.2M3.5 12h4" />
      <path d="M12 7.8V12l2.9 1.8" />
    </Svg>
  );
}

export function Check(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.8 4.3 4.3L19 7.4" />
    </Svg>
  );
}

export function Copy(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="11.5" height="11.5" rx="1.5" />
      <path d="M5.5 15h-.7a1.3 1.3 0 0 1-1.3-1.3V4.8A1.3 1.3 0 0 1 4.8 3.5h8.9A1.3 1.3 0 0 1 15 4.8v.7" />
    </Svg>
  );
}

export function RefreshCw(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.5 3.5v4.9h-4.9" />
    </Svg>
  );
}

export function FileCode2(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 3h6.5L18 7.5V21H7V3Z" />
      <path d="M13.5 3v4.5H18" />
      <path d="m10.5 11-2 2.6 2 2.6M13.5 11l2 2.6-2 2.6" strokeWidth={1.7} />
    </Svg>
  );
}

export function Terminal(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 8 4 4-4 4" />
      <path d="M12 17.5h7" />
    </Svg>
  );
}

export function Braces(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 3.5c-2.2 0-2.8 1.1-2.8 2.7v3.1c0 1.5-1 2.7-2.7 2.7 1.7 0 2.7 1.2 2.7 2.7v3.1c0 1.6.6 2.7 2.8 2.7" />
      <path d="M15 3.5c2.2 0 2.8 1.1 2.8 2.7v3.1c0 1.5 1 2.7 2.7 2.7-1.7 0-2.7 1.2-2.7 2.7v3.1c0 1.6-.6 2.7-2.8 2.7" />
    </Svg>
  );
}

export function FileSpreadsheet(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 3h6.5L18 7.5V21H7V3Z" />
      <path d="M13.5 3v4.5H18" />
      <path d="M7 12.2h11M7 16.6h11M12.2 10.2V21" strokeWidth={1.6} />
    </Svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h15.5" />
      <path d="m13.5 6 6 6-6 6" />
    </Svg>
  );
}

export function ArrowDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v15.5" />
      <path d="m6 13.5 6 6 6-6" />
    </Svg>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 17.5 17.5 6.5" />
      <path d="M9 6.5h8.5V15" />
    </Svg>
  );
}

export function BadgeCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.4 12.2 2.5 2.5 4.7-5.2" />
    </Svg>
  );
}

export function Crosshair(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 2.2v4M12 17.8v4M2.2 12h4M17.8 12h4" strokeWidth={1.7} />
    </Svg>
  );
}

export function Database(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
      <path d="M4.5 5.5v13c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8v-13" />
      <path d="M4.5 12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8" />
    </Svg>
  );
}

export function Shuffle(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 6.5h4L17 17.5h3.5" />
      <path d="M3.5 17.5h4l3.2-3.6" />
      <path d="M13.9 10.1 17 6.5h3.5" />
      <path d="m17.8 3.8 2.7 2.7-2.7 2.7M17.8 14.8l2.7 2.7-2.7 2.7" strokeWidth={1.7} />
    </Svg>
  );
}

export function Workflow(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
      <path d="M10 6.5h3.5a2 2 0 0 1 2 2V14" />
    </Svg>
  );
}

export function BarChart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 20.5h17" />
      <path d="M7 20.5v-6.5M12 20.5V8M17 20.5V11" />
    </Svg>
  );
}

export function CalendarClock(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="13" height="15.5" rx="1.8" />
      <path d="M8 3v4M11 3v4M3 10.5h13" strokeWidth={1.7} />
      <circle cx="17.5" cy="17.5" r="4.2" />
      <path d="M17.5 15.6v1.9l1.3 1.1" strokeWidth={1.7} />
    </Svg>
  );
}

export function PieChart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12V3.5Z" />
      <path d="M15.5 3.7a8.5 8.5 0 0 1 4.8 4.8h-4.8V3.7Z" />
    </Svg>
  );
}

export function ExternalLink(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 5h5v5" />
      <path d="m19 5-8.5 8.5" />
      <path d="M18 13.5V19H5V6h5.5" />
    </Svg>
  );
}

export function Eraser(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m8.7 20-4.2-4.2a1.8 1.8 0 0 1 0-2.6l8-8a1.8 1.8 0 0 1 2.6 0l4.4 4.4a1.8 1.8 0 0 1 0 2.6l-6.4 6.4a1.8 1.8 0 0 1-1.3.5H6.5" />
      <path d="m9.4 9.4 6.4 6.4" strokeWidth={1.7} />
      <path d="M6 20h15" strokeWidth={1.7} />
    </Svg>
  );
}

export function Play(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 5.3v13.4L19 12 8 5.3Z" />
    </Svg>
  );
}

export function TextQuote(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 7.5C9.5 6 8.3 5 6.9 5S4 6.1 4 7.7c0 1.4 1.1 2.5 2.5 2.5.2 0 .5 0 .7-.1-.4 2.6-1.6 4.4-3.2 5.6" strokeWidth={1.7} />
      <path d="M19.5 7.5c0-1.5-1.2-2.5-2.6-2.5s-2.9 1.1-2.9 2.7c0 1.4 1.1 2.5 2.5 2.5.2 0 .5 0 .7-.1-.4 2.6-1.6 4.4-3.2 5.6" strokeWidth={1.7} />
    </Svg>
  );
}

export function MapPin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21.5S5.5 15.9 5.5 10.8a6.5 6.5 0 0 1 13 0c0 5.1-6.5 10.7-6.5 10.7Z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </Svg>
  );
}

export function Globe2(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.4 3.7 5.3 3.7 8.5s-1.3 6.1-3.7 8.5c-2.4-2.4-3.7-5.3-3.7-8.5s1.3-6.1 3.7-8.5Z" />
    </Svg>
  );
}

export function X(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}
