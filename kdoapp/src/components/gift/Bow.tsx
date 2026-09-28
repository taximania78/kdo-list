export function Bow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 46" className={className} aria-hidden focusable="false">
      <path d="M31 22 C22 4 4 2 5 14 C6 25 22 26 31 22Z" fill="var(--primary)" stroke="var(--primary-deep)" strokeWidth="1.6" />
      <path d="M33 22 C42 4 60 2 59 14 C58 25 42 26 33 22Z" fill="var(--primary)" stroke="var(--primary-deep)" strokeWidth="1.6" />
      <path d="M12 12 C18 15 24 18 30 21 M52 12 C46 15 40 18 34 21" stroke="var(--primary-deep)" strokeWidth="1.2" fill="none" opacity="0.55" />
      <path d="M29 24 L20 44 L25 41 L28 45 L31 25Z M35 24 L44 44 L39 41 L36 45 L33 25Z" fill="var(--primary)" stroke="var(--primary-deep)" strokeWidth="1.4" />
      <rect x="27" y="17" width="10" height="10" rx="3" fill="var(--primary-deep)" />
    </svg>
  );
}
