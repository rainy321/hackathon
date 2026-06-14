"use client";

export function Card({ children, className = "" }) {
  return <section className={`rounded-lg border border-line bg-card p-5 shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${className}`}>{children}</section>;
}

export function PageHeader({ title, desc, right }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
        {desc ? <p className="mt-1 text-sm text-text2">{desc}</p> : null}
      </div>
      {right}
    </div>
  );
}

// 统计卡:线性图标 + 大数字 + 目标小字
export function Stat({ label, value, sub, icon: Icon }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-text2">{label}</div>
        {Icon ? <Icon size={18} className="text-accent2" strokeWidth={2} /> : null}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-accent">{value}</div>
      {sub ? <div className="mt-1 text-xs text-muted">{sub}</div> : null}
    </Card>
  );
}

export function Bar({ label, rate, suffix = "%" }) {
  const p = Math.round((rate || 0) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-text2">{label}</span>
        <span className="font-semibold text-ink">{p}{suffix}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-line">
        <div className="h-full rounded bg-accent transition-all" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export function Btn({ children, variant = "primary", className = "", ...rest }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-40";
  const styles = {
    primary: "bg-accent text-white hover:bg-[#43a047] active:bg-[#388e3c]",
    outline: "bg-card text-accent border border-accent/50 hover:bg-accentsoft",
    ghost: "text-accent hover:opacity-70",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...rest}>{children}</button>;
}

// 浅绿标签(模板的 tag 样式)
export function Tag({ children }) {
  return <span className="inline-block rounded bg-accentsoft px-2 py-0.5 text-xs font-medium text-accent">{children}</span>;
}
