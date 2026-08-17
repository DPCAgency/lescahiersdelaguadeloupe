export function EditorialSignature({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  return (
    <div
      className={`flex items-center justify-center py-2.5 ${
        variant === 'dark' ? 'bg-ink' : 'border-b border-border bg-background'
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.32em] sm:text-[11px] ${
          variant === 'dark' ? 'text-white/80' : 'text-muted'
        }`}
      >
        Enquêter <span className="text-primary">•</span> Comprendre{' '}
        <span className="text-primary">•</span> Éclairer{' '}
        <span className="text-primary">•</span> Débattre
      </p>
    </div>
  );
}
