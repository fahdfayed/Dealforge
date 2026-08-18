export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded border ${className}`}
      style={{ borderColor: 'var(--border-color)', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 px-4 py-3 border-b"
      style={{ borderBottomColor: 'var(--border-light)' }}
    >
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-4 py-3 ${className}`}>{children}</div>;
}
