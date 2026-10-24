import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode, type KeyboardEvent } from 'react';
import { Check, ChevronDown, CircleHelp, LoaderCircle } from 'lucide-react';

export function Button({ variant = 'primary', loading = false, className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'accent'|'ghost'|'danger'; loading?: boolean }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{loading ? <LoaderCircle size={17} className="spin-icon" aria-hidden="true"/> : null}{children}</button>;
}
export function Chip({ tone = 'muted', children }: { tone?: 'verified'|'roster'|'pending'|'muted'|'outline'|'dropout'|'enrolled'|'approved'; children: ReactNode }) { return <span className={`chip chip-${tone}`}>{children}</span>; }
export function SampleBadge() { return <span className="badge-sample"><span aria-hidden="true">●</span> Sample data</span>; }
export function Spinner() { return <span className="spinner" role="status" aria-label="Loading" />; }
export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <header className="page-heading"><div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{actions ? <div className="page-actions">{actions}</div> : null}</header>;
}
export function EmptyState({ title, action, onAction, icon }: { title: string; action?: string; onAction?: () => void; icon?: ReactNode }) {
  return <div className="empty-state"><div className="empty-orbit">{icon ?? <CircleHelp size={24}/>}</div><p>{title}</p>{action && onAction ? <Button variant="accent" onClick={onAction}>{action}</Button> : null}</div>;
}
export function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="preview-note" role="alert">We couldn’t reach AptoHire. Check your connection and try again. <button className="button button-secondary" onClick={onRetry}>Retry</button></div>; }
export function StatRow({ items }: { items: { label: string; value: string | number; detail?: string }[] }) {
  return <div className="stat-row">{items.map((item) => <div className="stat" key={item.label}><span className="stat-value">{item.value}</span><span className="stat-label">{item.label}{item.detail ? <span className="block"> · {item.detail}</span> : null}</span></div>)}</div>;
}

export type SelectOption = { value: string; label: string; hint?: string };
export function SelectMenu({ id, label, value, options, onChange, className = '' }: { id?: string; label: string; value: string; options: SelectOption[]; onChange: (value: string) => void; className?: string }) {
  const generatedId = useId().replace(/:/g, '');
  const triggerId = id ?? `select-${generatedId}`;
  const listId = `${triggerId}-options`;
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) { setOpenAbove(false); return; }
    const measurePlacement = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const boundary = root.current?.closest('.modal')?.getBoundingClientRect();
      const boundaryTop = Math.max(0, boundary?.top ?? 0);
      const boundaryBottom = Math.min(window.innerHeight, boundary?.bottom ?? window.innerHeight);
      const predictedHeight = Math.min(330, options.length * 44 + 12, window.innerHeight * 0.55);
      const below = boundaryBottom - rect.bottom - 12;
      const above = rect.top - boundaryTop - 12;
      setOpenAbove(below < predictedHeight && above > below);
    };
    measurePlacement();
    window.addEventListener('resize', measurePlacement);
    window.addEventListener('scroll', measurePlacement, true);
    return () => { window.removeEventListener('resize', measurePlacement); window.removeEventListener('scroll', measurePlacement, true); };
  }, [open, options.length]);

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    trigger.current?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setActiveIndex(selectedIndex);
        setOpen(true);
      } else {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex((index) => (index + direction + options.length) % options.length);
      }
    } else if (event.key === 'Home' && open) {
      event.preventDefault(); setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault(); setActiveIndex(Math.max(0, options.length - 1));
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault(); choose(activeIndex);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault(); setOpen(false);
    } else if (event.key === 'Tab' && open) {
      setOpen(false);
    }
  };

  return <div ref={root} className={`select-menu${open ? ' is-open' : ''} ${className}`}>
    <button ref={trigger} id={triggerId} type="button" className="select-trigger" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined} onClick={() => { if (open) setOpen(false); else { setActiveIndex(selectedIndex); setOpen(true); } }} onKeyDown={onKeyDown}>
      <span className="select-trigger-label">{selected?.label ?? label}</span>
      <ChevronDown className={`select-chevron${open ? ' is-open' : ''}`} size={17} aria-hidden="true"/>
    </button>
    {open ? <div className={`select-popover${openAbove ? ' open-up' : ''}`} role="listbox" id={listId} aria-label={label}>
      {options.map((option, index) => <button type="button" role="option" aria-selected={option.value === value} tabIndex={-1} id={`${listId}-option-${index}`} className={`select-option${option.value === value ? ' selected' : ''}${index === activeIndex ? ' active' : ''}`} key={`${option.value}-${option.label}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(index)}>
        <span className="select-option-copy"><span className="select-option-label">{option.label}</span>{option.hint ? <span className="select-option-hint">{option.hint}</span> : null}</span>
        {option.value === value ? <Check className="select-option-check" size={16} aria-hidden="true"/> : null}
      </button>)}
    </div> : null}
  </div>;
}
