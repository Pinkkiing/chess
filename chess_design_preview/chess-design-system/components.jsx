/* =====================================================================
   CAÏSSA — Composants React (CSS vanilla via classes « c- »)
   Aucune dépendance hors React. Importez les styles une fois au niveau
   racine : import './chess-design-system/styles.css'

   Utilisation (bundler) :
       import { Button, Card, Modal } from './chess-design-system/components.jsx'
   Dans ce projet de démo, les composants sont exposés sur window pour la
   page preview.html (voir le bloc d'export en bas).
   ===================================================================== */

const cx = (...a) => a.filter(Boolean).join(' ');

/* ----------------------------- Button ------------------------------ */
export function Button({ variant = 'secondary', size, block, loading, icon, iconOnly, children, className, ...rest }) {
  return (
    <button
      className={cx('c-btn', `c-btn--${variant}`, size && `c-btn--${size}`,
        block && 'c-btn--block', iconOnly && 'c-btn--icon', loading && 'c-btn--loading', className)}
      {...rest}>
      {icon && <span className="c-btn__icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

/* --------------------------- IconButton ---------------------------- */
export function IconButton({ variant = 'ghost', size, label, children, className, ...rest }) {
  return (
    <button className={cx('c-btn', `c-btn--${variant}`, 'c-btn--icon', size && `c-btn--${size}`, className)}
      aria-label={label} title={label} {...rest}>{children}</button>
  );
}

/* ------------------------------ Card ------------------------------- */
export function Card({ interactive, children, className, ...rest }) {
  return <div className={cx('c-card', interactive && 'c-card--interactive', className)} {...rest}>{children}</div>;
}

/* ------------------------------ Panel ------------------------------ */
export function Panel({ title, action, foot, children, className, ...rest }) {
  return (
    <div className={cx('c-panel', className)} {...rest}>
      {(title || action) && (
        <div className="c-panel__head">
          <span className="c-panel__title">{title}</span>
          {action}
        </div>
      )}
      <div className="c-panel__body">{children}</div>
      {foot && <div className="c-panel__foot">{foot}</div>}
    </div>
  );
}

/* ------------------------------ Badge ------------------------------ */
export function Badge({ tone, dot, children, className, ...rest }) {
  return (
    <span className={cx('c-badge', tone && `c-badge--${tone}`, className)} {...rest}>
      {dot && <span className="c-badge__dot" />}
      {children}
    </span>
  );
}

/* --------------------- Tier (classification) ----------------------- */
/* level: beginner | intermediate | advanced | expert | master | gm */
const TIER_LABEL = { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', expert: 'Expert', master: 'Maître', gm: 'Grand Maître' };
export function Tier({ level = 'beginner', children, className, ...rest }) {
  return (
    <span className={cx('c-tier', `c-tier--${level}`, className)} {...rest}>
      <span className="c-tier__pip" />
      {children || TIER_LABEL[level]}
    </span>
  );
}

/* ------------------------------ Input ------------------------------ */
export function Input({ label, help, error, icon, invalid, id, className, ...rest }) {
  const field = (
    <input id={id} className={cx('c-input', (invalid || error) && 'c-input--invalid', className)}
      aria-invalid={!!(invalid || error)} {...rest} />
  );
  return (
    <div className="c-field">
      {label && <label className="c-label" htmlFor={id}>{label}</label>}
      {icon
        ? <div className="c-input-group"><span className="c-input-group__icon">{icon}</span>{field}</div>
        : field}
      {error ? <span className="c-help c-help--error">{error}</span> : help && <span className="c-help">{help}</span>}
    </div>
  );
}

/* ----------------------------- Textarea ---------------------------- */
export function Textarea({ label, help, id, className, ...rest }) {
  return (
    <div className="c-field">
      {label && <label className="c-label" htmlFor={id}>{label}</label>}
      <textarea id={id} className={cx('c-textarea', className)} {...rest} />
      {help && <span className="c-help">{help}</span>}
    </div>
  );
}

/* ------------------------------ Select ----------------------------- */
export function Select({ label, help, id, children, className, ...rest }) {
  return (
    <div className="c-field">
      {label && <label className="c-label" htmlFor={id}>{label}</label>}
      <select id={id} className={cx('c-select', className)} {...rest}>{children}</select>
      {help && <span className="c-help">{help}</span>}
    </div>
  );
}

/* ------------------------------ Switch ----------------------------- */
export function Switch({ label, checked, onChange, ...rest }) {
  return (
    <label className="c-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange && onChange(e.target.checked)} {...rest} />
      <span className="c-switch__track"><span className="c-switch__thumb" /></span>
      {label && <span className="c-switch__label">{label}</span>}
    </label>
  );
}

/* ----------------------------- Checkbox ---------------------------- */
export function Checkbox({ label, checked, onChange, ...rest }) {
  return (
    <label className="c-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange && onChange(e.target.checked)} {...rest} />
      <span className="c-check__box" />
      {label && <span>{label}</span>}
    </label>
  );
}

/* ------------------------------ Radio ------------------------------ */
export function Radio({ label, ...rest }) {
  return (
    <label className="c-radio">
      <input type="radio" {...rest} />
      <span className="c-radio__box" />
      {label && <span>{label}</span>}
    </label>
  );
}

/* --------------------------- Segmented ----------------------------- */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="c-segment" role="tablist">
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        return (
          <button key={val} role="tab" aria-selected={value === val}
            className={cx('c-segment__btn', value === val && 'c-segment__btn--active')}
            onClick={() => onChange && onChange(val)}>{lab}</button>
        );
      })}
    </div>
  );
}

/* ------------------------------ Slider ----------------------------- */
export function Slider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange, ...rest }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="c-slider">
      {(label != null) && (
        <div className="c-slider__top">
          <span className="c-label">{label}</span>
          <span className="c-slider__value">{value}{unit}</span>
        </div>
      )}
      <input type="range" className="c-range" min={min} max={max} step={step} value={value}
        style={{ '--c-range-fill': pct + '%' }}
        onChange={(e) => onChange && onChange(Number(e.target.value))} {...rest} />
    </div>
  );
}

/* ------------------------------- Tabs ------------------------------ */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="c-tabs" role="tablist">
      {tabs.map((tb) => {
        const val = typeof tb === 'string' ? tb : tb.value;
        const lab = typeof tb === 'string' ? tb : tb.label;
        return (
          <button key={val} role="tab" aria-selected={value === val}
            className={cx('c-tab', value === val && 'c-tab--active')}
            onClick={() => onChange && onChange(val)}>{lab}</button>
        );
      })}
    </div>
  );
}

/* ------------------------------ Avatar ----------------------------- */
export function Avatar({ name = '?', size, status, gradient, className, ...rest }) {
  return (
    <span className={cx('c-avatar', size && `c-avatar--${size}`, className)}
      style={gradient ? { background: gradient } : undefined} {...rest}>
      {name.slice(0, 1).toUpperCase()}
      {status && <span className={cx('c-avatar__status', status === 'online' && 'c-avatar__status--online')} />}
    </span>
  );
}

/* ------------------------------ Modal ------------------------------ */
export function Modal({ open, onClose, title, children, footer }) {
  const React_ = window.React;
  React_.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="c-overlay" onClick={onClose}>
      <div className="c-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="c-modal__head">
          <span className="c-modal__title">{title}</span>
          <button className="c-modal__close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className="c-modal__body">{children}</div>
        {footer && <div className="c-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------ Toast ------------------------------ */
export function Toast({ tone, children }) {
  return (
    <div className={cx('c-toast', tone && `c-toast--${tone}`)}>
      <span className="c-toast__accent" />
      {children}
    </div>
  );
}

/* ----------------------------- Progress ---------------------------- */
export function Progress({ value = 0 }) {
  return <div className="c-progress"><div className="c-progress__fill" style={{ width: Math.max(0, Math.min(100, value)) + '%' }} /></div>;
}

/* ---------------------- Export pour preview.html ------------------- */
/* (Sans bundler : les composants sont exposés sur window.) */
if (typeof window !== 'undefined') {
  Object.assign(window, {
    Button, IconButton, Card, Panel, Badge, Tier, Input, Textarea, Select,
    Switch, Checkbox, Radio, Segmented, Slider, Tabs, Avatar, Modal, Toast, Progress,
  });
}
