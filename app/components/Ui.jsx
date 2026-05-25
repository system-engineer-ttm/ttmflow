"use client";
import { Icon } from "./Icon";
import { i18n } from "../lib/data";

export const cls = (...xs) => xs.filter(Boolean).join(" ");

export function Avatar({ user, size = 32 }) {
  if (!user) return null;
  return (
    <div
      className="ttm-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), background: user.color }}
      title={user.nameTh || user.nameEn}
    >
      {user.avatar}
    </div>
  );
}

export function Badge({ kind = "neutral", children, dot = false, className = "", ...rest }) {
  return (
    <span className={cls("ttm-badge", `ttm-badge-${kind}`, className)} {...rest}>
      {dot && <span className="ttm-badge-dot" />}
      {children}
    </span>
  );
}

export const STATUS_KIND = {
  draft: "neutral",
  pending: "amber",
  approved: "blue",
  rejected: "red",
  inProgress: "violet",
  done: "green",
  cancelled: "neutral",
};

export function StatusPill({ status, lang }) {
  const label = i18n[lang].status[status] || status;
  return <Badge kind={STATUS_KIND[status] || "neutral"} dot>{label}</Badge>;
}

export function Button({ variant = "primary", size = "md", icon, children, className = "", ...rest }) {
  return (
    <button className={cls("ttm-btn", `ttm-btn-${variant}`, `ttm-btn-${size}`, className)} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 15 : 17} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, size = 17, title, className = "", ...rest }) {
  return (
    <button className={cls("ttm-icon-btn", className)} title={title} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}

export function Card({ children, className = "", as = "div", ...rest }) {
  const Comp = as;
  return <Comp className={cls("ttm-card", className)} {...rest}>{children}</Comp>;
}

export function SectionTitle({ title, sub, right }) {
  return (
    <div className="ttm-section-title">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {right && <div className="ttm-section-right">{right}</div>}
    </div>
  );
}

export function Field({ label, required, hint, children, span = 1, className = "" }) {
  return (
    <label className={cls("ttm-field", `ttm-span-${span}`, className)}>
      <span className="ttm-field-label">
        {label}
        {required && <em className="ttm-req">*</em>}
      </span>
      {children}
      {hint && <span className="ttm-field-hint">{hint}</span>}
    </label>
  );
}

export function Input(props) {
  return <input className="ttm-input" {...props} />;
}
export function Textarea(props) {
  return <textarea className="ttm-input ttm-textarea" rows={3} {...props} />;
}
export function Select({ children, ...rest }) {
  return (
    <div className="ttm-select-wrap">
      <select className="ttm-input ttm-select" {...rest}>{children}</select>
      <Icon name="chevron-down" size={16} className="ttm-select-chev" />
    </div>
  );
}

export function Check({ label, checked, onChange, name, value, disabled, radio = false }) {
  return (
    <label className={cls("ttm-check", checked && "is-checked", disabled && "is-disabled")}>
      <input
        type={radio ? "radio" : "checkbox"}
        checked={!!checked} onChange={onChange} name={name} value={value} disabled={disabled}
      />
      <span className={cls("ttm-check-box", radio && "is-radio")}>
        {checked && <Icon name="check" size={13} stroke={2.5} />}
      </span>
      <span className="ttm-check-label">{label}</span>
    </label>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="ttm-switch">
      <input type="checkbox" checked={!!checked} onChange={onChange} />
      <span className="ttm-switch-track"><span className="ttm-switch-thumb" /></span>
      {label && <span className="ttm-switch-label">{label}</span>}
    </label>
  );
}

export function Tabs({ value, onChange, items }) {
  return (
    <div className="ttm-tabs">
      {items.map(it => (
        <button
          key={it.id}
          className={cls("ttm-tab", value === it.id && "is-active")}
          onClick={() => onChange(it.id)}
        >
          {it.icon && <Icon name={it.icon} size={15} />}
          {it.label}
          {it.count != null && <span className="ttm-tab-count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ steps, current }) {
  return (
    <ol className="ttm-stepper">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={i} className={cls("ttm-step", done && "is-done", active && "is-active")}>
            <span className="ttm-step-mark">{done ? <Icon name="check" size={13} stroke={2.5} /> : i + 1}</span>
            <span className="ttm-step-label">{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Spark({ values, w = 120, h = 32, color = "var(--brand)" }) {
  const max = Math.max(...values, 1);
  const step = w / (values.length - 1 || 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="ttm-spark">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Toast({ title, body, kind = "info" }) {
  return (
    <div className={cls("ttm-toast", `ttm-toast-${kind}`)}>
      <Icon name={kind === "success" ? "check-circle" : "bell"} size={18} />
      <div>
        <div className="ttm-toast-title">{title}</div>
        {body && <div className="ttm-toast-body">{body}</div>}
      </div>
    </div>
  );
}
