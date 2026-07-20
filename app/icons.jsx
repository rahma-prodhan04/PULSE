// Shared stroke-icon set (lucide-style) used in place of emoji throughout the app.
// Every icon takes { size = 16, strokeWidth = 1.75, ...props } and forwards
// remaining props (className, style, onClick…) to the underlying <svg>.

function Base({ size = 16, strokeWidth = 1.75, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconGrid(props) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Base>
  );
}

export function IconUsers(props) {
  return (
    <Base {...props}>
      <path d="M17 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 5 18.5V20" />
      <circle cx="9.5" cy="8" r="3.25" />
      <path d="M16 8.3a2.75 2.75 0 1 1 1.1 5.28" />
      <path d="M19.5 20v-1.4a3 3 0 0 0-1.9-2.8" />
    </Base>
  );
}

export function IconClock(props) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Base>
  );
}

export function IconScatter(props) {
  return (
    <Base {...props}>
      <path d="M3 20V4" />
      <path d="M3 20h18" />
      <circle cx="8" cy="15" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="7" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconTrendingUp(props) {
  return (
    <Base {...props}>
      <path d="M3 17l5.5-5.5 4 4L21 7" />
      <path d="M15 7h6v6" />
    </Base>
  );
}

export function IconTrendingDown(props) {
  return (
    <Base {...props}>
      <path d="M3 7l5.5 5.5 4-4L21 17" />
      <path d="M15 17h6v-6" />
    </Base>
  );
}

export function IconLogOut(props) {
  return (
    <Base {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15.5 16.5L20 12l-4.5-4.5" />
      <path d="M20 12H9" />
    </Base>
  );
}

export function IconAlertTriangle(props) {
  return (
    <Base {...props}>
      <path d="M10.6 3.7a1.6 1.6 0 0 1 2.8 0l8.2 14.6a1.6 1.6 0 0 1-1.4 2.4H3.8a1.6 1.6 0 0 1-1.4-2.4z" />
      <path d="M12 9.5v4.2" />
      <circle cx="12" cy="17" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="2" />
    </Base>
  );
}

export function IconDownload(props) {
  return (
    <Base {...props}>
      <path d="M12 3v12.5" />
      <path d="M7.5 11l4.5 4.5L16.5 11" />
      <path d="M4 17.5v1.8A1.7 1.7 0 0 0 5.7 21h12.6a1.7 1.7 0 0 0 1.7-1.7v-1.8" />
    </Base>
  );
}

export function IconLoader(props) {
  return (
    <Base {...props}>
      <path d="M12 3v3.2" opacity="1" />
      <path d="M12 17.8V21" opacity="0.25" />
      <path d="M4.9 4.9l2.3 2.3" opacity="0.85" />
      <path d="M16.8 16.8l2.3 2.3" opacity="0.4" />
      <path d="M3 12h3.2" opacity="0.7" />
      <path d="M17.8 12H21" opacity="0.55" />
      <path d="M4.9 19.1l2.3-2.3" opacity="0.1" />
      <path d="M16.8 7.2l2.3-2.3" opacity="0.7" />
    </Base>
  );
}

export function IconZap(props) {
  return (
    <Base {...props}>
      <path d="M12.5 2.5L4 14h6.2l-1.2 7.5L20 10h-6.4z" />
    </Base>
  );
}

export function IconBriefcase(props) {
  return (
    <Base {...props}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8.5 7.5V5.8A1.8 1.8 0 0 1 10.3 4h3.4a1.8 1.8 0 0 1 1.8 1.8V7.5" />
      <path d="M3 12.7c2.7 1.3 5.8 2 9 2s6.3-.7 9-2" />
    </Base>
  );
}

export function IconHeart(props) {
  return (
    <Base {...props}>
      <path d="M12 20.2S3.6 15 3.6 8.9A4.4 4.4 0 0 1 12 6.7a4.4 4.4 0 0 1 8.4 2.2c0 6.1-8.4 11.3-8.4 11.3z" />
    </Base>
  );
}

export function IconTarget(props) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconTrophy(props) {
  return (
    <Base {...props}>
      <path d="M7 4h10v5.2A5 5 0 0 1 12 14a5 5 0 0 1-5-4.8z" />
      <path d="M7 5.5H4.5A2.5 2.5 0 0 0 4.5 10c.5 0 1-.1 1.4-.3" />
      <path d="M17 5.5h2.5A2.5 2.5 0 0 1 19.5 10c-.5 0-1-.1-1.4-.3" />
      <path d="M12 14v3.2" />
      <path d="M8.5 21h7" />
      <path d="M9.7 17.2h4.6l.6 2.4a1 1 0 0 1-1 1.4H10.1a1 1 0 0 1-1-1.4z" />
    </Base>
  );
}

export function IconCheckCircle(props) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.3 12.3l2.4 2.4 5-5.4" />
    </Base>
  );
}

export function IconBattery(props) {
  return (
    <Base {...props}>
      <rect x="2.5" y="8" width="16" height="8" rx="1.8" />
      <path d="M21.5 10.5v3" />
      <rect x="4.5" y="10" width="5" height="4" rx="0.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconBarChart(props) {
  return (
    <Base {...props}>
      <path d="M4 20V10" />
      <path d="M11 20V4" />
      <path d="M18 20v-7" />
      <path d="M2.5 20.5h19" />
    </Base>
  );
}

export function IconInbox(props) {
  return (
    <Base {...props}>
      <path d="M3.5 12.5h4.7l1.4 2.4h4.8l1.4-2.4h4.7" />
      <path d="M5.3 6.2h13.4a1.6 1.6 0 0 1 1.5 1.1l1.8 5.6v5.5a1.6 1.6 0 0 1-1.6 1.6H4a1.6 1.6 0 0 1-1.6-1.6v-5.5l1.8-5.6a1.6 1.6 0 0 1 1.5-1.1z" />
    </Base>
  );
}

export function IconInfo(props) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.3" />
      <circle cx="12" cy="8" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="2" />
    </Base>
  );
}

export function IconChevronUp(props) {
  return (
    <Base {...props}>
      <path d="M6 15l6-6 6 6" />
    </Base>
  );
}

export function IconChevronDown(props) {
  return (
    <Base {...props}>
      <path d="M6 9l6 6 6-6" />
    </Base>
  );
}

export function IconChevronsUpDown(props) {
  return (
    <Base {...props}>
      <path d="M7 15l5 4 5-4" />
      <path d="M7 9l5-4 5 4" />
    </Base>
  );
}

export function IconCalendar(props) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.8h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </Base>
  );
}
