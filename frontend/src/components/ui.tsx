import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle, CircleHelp } from 'lucide-react';
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
