"use client";

export function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-line bg-card p-6 ${className}`}>{children}</section>;
}

export function PageHeader({ title, desc, right }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">{title}</h1>
        {desc ? <p className="mt-1.5 text-sm text-muted">{desc}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Stat({ label, value, sub }) {
  return (
    <Card>
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-2 text-4xl font-semibold tracking-tight text-ink">{value}</div>
      {sub ? <div className="mt-1 text-xs text-muted">{sub}</div> : null}
    </Card>
  );
}

export function Bar({ label, rate, suffix = "%" }) {
  const p = Math.round((rate || 0) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-inksoft">{label}</span>
        <span className="font-semibold text-ink">{p}{suffix}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export function Btn({ children, variant = "primary", className = "", ...rest }) {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40";
  const styles = {
    primary: "bg-accent text-white hover:opacity-90 active:opacity-80",
    outline: "bg-paper text-ink border border-line hover:bg-line/50",
    ghost: "text-accent hover:opacity-70",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...rest}>{children}</button>;
}
