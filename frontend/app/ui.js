"use client";

import Image from "next/image";

export function Card({ children, className = "", tone = "plain" }) {
  const tones = {
    plain: "border-[#e7ddca]/85 bg-[rgba(255,250,242,0.84)]",
    soft: "border-[#eadfce]/85 bg-[rgba(255,252,245,0.78)]",
    accent: "border-accent/20 bg-[rgba(246,251,239,0.82)]",
    info: "border-info/20 bg-[rgba(239,247,244,0.8)]",
    warn: "border-warn/20 bg-[rgba(252,242,224,0.82)]",
  };
  return (
    <section className={`rounded-lg border p-5 shadow-[var(--shadow-card)] backdrop-blur-xl ${tones[tone] || tones.plain} ${className}`}>
      {children}
    </section>
  );
}

export function PageHeader({ kicker, title, desc, right }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker ? <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">{kicker}</div> : null}
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {desc ? <p className="mt-2 max-w-2xl text-sm leading-6 text-text2">{desc}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function SectionTitle({ icon: Icon, title, desc, right }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-accent/15 bg-accentsoft text-accent shadow-[var(--shadow-pressed)]">
            <Icon size={16} />
          </span>
        ) : null}
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink">{title}</div>
          {desc ? <div className="mt-0.5 text-xs leading-5 text-text2">{desc}</div> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

export function Stat({ label, value, sub, icon: Icon, tone = "accent" }) {
  const styles = {
    accent: "bg-accentsoft text-accent",
    info: "bg-infosoft text-info",
    warn: "bg-warnsoft text-warn",
    danger: "bg-dangersoft text-danger",
  };
  return (
    <Card className="min-h-[132px]">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-text2">{label}</div>
        {Icon ? <span className={`flex h-8 w-8 items-center justify-center rounded-md border border-white/60 shadow-[var(--shadow-pressed)] ${styles[tone] || styles.accent}`}><Icon size={17} /></span> : null}
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-ink">{value}</div>
      {sub ? <div className="mt-2 text-xs leading-5 text-muted">{sub}</div> : null}
    </Card>
  );
}

export function Bar({ label, rate, suffix = "%" }) {
  const p = Math.max(0, Math.min(100, Math.round((rate || 0) * 100)));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-text2">{label}</span>
        <span className="font-semibold text-ink">{p}{suffix}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded bg-[#e9deca] shadow-[inset_0_1px_2px_rgba(86,74,54,0.08)]">
        <div className="h-full rounded bg-gradient-to-r from-[#9fb882] to-[#7fa36b] transition-all" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export function Btn({ children, variant = "primary", size = "md", className = "", ...rest }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition disabled:opacity-40";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };
  const styles = {
    primary: "bg-accent text-white shadow-[0_10px_24px_rgba(127,163,107,0.25)] hover:bg-[#72965e] active:bg-[#668a54]",
    outline: "border border-accent/35 bg-[rgba(255,250,242,0.72)] text-accent hover:bg-accentsoft",
    quiet: "border border-line bg-[rgba(255,250,242,0.72)] text-ink hover:border-accent/35 hover:text-accent",
    ghost: "text-accent hover:bg-accentsoft",
    danger: "bg-danger text-white hover:bg-[#b95f51]",
  };
  return <button className={`${base} ${sizes[size] || sizes.md} ${styles[variant] || styles.primary} ${className}`} {...rest}>{children}</button>;
}

export function Tag({ children, tone = "accent", className = "" }) {
  const tones = {
    accent: "bg-accentsoft text-accent",
    info: "bg-infosoft text-info",
    warn: "bg-warnsoft text-warn",
    danger: "bg-dangersoft text-danger",
    neutral: "bg-paper text-text2",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone] || tones.accent} ${className}`}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-paper/55 px-5 py-8 text-center">
      {Icon ? <Icon size={26} className="mb-3 text-accent" /> : null}
      <div className="text-sm font-semibold text-ink">{title}</div>
      {desc ? <div className="mt-1 max-w-sm text-xs leading-5 text-text2">{desc}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function BotanicalAccent({ className = "" }) {
  return <Image src="/botanical-sprig.svg" alt="" width={220} height={180} aria-hidden="true" className={`pointer-events-none select-none ${className}`} />;
}
