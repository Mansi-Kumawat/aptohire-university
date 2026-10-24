import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, Building2, ChartNoAxesCombined, ChevronDown, CircleHelp, ClipboardList, Copy, GraduationCap, House, LogOut, Menu, MoreHorizontal, Settings, Users, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/AuthContext';
import { useBackend } from '@/app/BackendProvider';
import { useUniversity } from '@/components/shell/useUniversity';
import { env } from '@/config/env';
import { Chip } from '@/components/ui';
import type { University } from '@aptohire/university-backend';

const primaryNav = [
  { to: '/', label: 'Overview', icon: House, end: true },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/roster', label: 'Roster', icon: ClipboardList },
  { to: '/placements', label: 'Placements', icon: GraduationCap },
  { to: '/skills', label: 'Skills demand', icon: ChartNoAxesCombined }
];
const footerNav = [
  { to: '/directory', label: 'Directory', icon: Building2 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/account', label: 'Account & security', icon: Settings },
  { to: '/help', label: 'Help', icon: CircleHelp }
];
export type UniContext = { university: University };
function Brand() { return <Link to="/" className="brand" aria-label="AptoHire University home"><span className="brand-lockup"><img className="brand-wordmark" src="/aptohire-wordmark.png" alt=""/><img className="brand-symbol" src="/aptohire-mark.png" alt=""/><span className="brand-portal-label">UNIVERSITY</span></span></Link>; }
function RailLink({ item, onClick }: { item: typeof primaryNav[number] | typeof footerNav[number]; onClick?: () => void }) {
  const Icon = item.icon;
  return <NavLink to={item.to} end={'end' in item ? item.end : false} aria-label={item.label} data-tooltip={item.label} onClick={onClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Icon size={19} strokeWidth={1.75}/><span className="nav-text">{item.label}</span></NavLink>;
}
function PendingBanner({ university }: UniContext) {
  const [copied, setCopied] = useState(false);
  if (university.status !== 'pending') return null;
  const copy = async () => { await navigator.clipboard?.writeText(university.reference ?? ''); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  return <div className="pending-banner" role="status"><p>Your application is under review. Reference <strong className="mono">{university.reference ?? '—'}</strong>. You’ll get an email when it’s approved.</p><button className="copy-ref" onClick={() => void copy()} aria-label="Copy application reference"><Copy size={16}/>{copied ? 'Copied' : 'Copy'}</button></div>;
}
function PrototypeNotice() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem('prototype-notice-dismissed'));
  if (!visible || env.appEnv === 'production') return null;
  return <div className="prototype-notice">Prototype. All people, universities and organizations shown are fictional.<button className="icon-button notice-dismiss" aria-label="Dismiss prototype notice" onClick={() => { sessionStorage.setItem('prototype-notice-dismissed','yes'); setVisible(false); }}><X size={16}/></button></div>;
}
function NotificationMenu({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const backend = useBackend();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['notifications', user?.universityId], queryFn: () => backend.notifications.list() });
  const unread = data.filter((note) => !note.read_at).length;
  const markAll = async () => { await backend.notifications.markRead(); await queryClient.invalidateQueries({ queryKey: ['notifications'] }); };
  return <div className="notification-wrap"><button className="icon-button" aria-label={`Notifications, ${unread} unread`} aria-haspopup="dialog" aria-expanded={open} onClick={onToggle}><Bell size={19}/>{unread > 0 ? <span className="notification-count">{unread}</span> : null}</button>{open ? <div className="notification-popover" role="dialog" aria-label="Recent notifications"><div className="section-header"><h3>Notifications</h3><button className="button button-ghost" onClick={() => void markAll()}>Mark all as read</button></div>{data.slice(0, 8).length ? data.slice(0,8).map((note) => <div className="notice-item" key={note.id}><div className="notice-heading">{!note.read_at ? <span className="unread-dot" aria-label="Unread"/> : null}<strong>{note.title}</strong></div><p>{note.detail}</p></div>) : <p className="muted">You’re all caught up.</p>}<Link className="button button-secondary" to="/notifications">View all</Link></div> : null}</div>;
}
function AccountMenu({ university, open, onToggle }: UniContext & { open: boolean; onToggle: () => void }) {
  const { user, signOut } = useAuth();
  return <div className="account-menu-wrap"><button className="account-button" aria-haspopup="dialog" aria-expanded={open} onClick={onToggle}><span className="account-avatar">{user?.displayName.slice(0,1) ?? 'T'}</span><span className="desktop-user-name"><strong>{university.short_name} · {user?.displayName}</strong><br/><span className="university-label">University staff</span></span><ChevronDown size={16}/></button>{open ? <div className="notification-popover account-popover" role="dialog" aria-label="University account menu"><strong>{university.name}</strong><div className="menu-status">{university.status === 'approved' ? <Chip tone="approved">Approved</Chip> : <Chip tone="pending">Pending</Chip>}</div><Link className="nav-link" to="/account"><Settings size={18}/>Account &amp; security</Link><button className="nav-link menu-signout" onClick={() => void signOut()}><LogOut size={18}/>Sign out</button></div> : null}</div>;
}
export function AppShell() {
  const university = useUniversity(); const location = useLocation(); const { signOut } = useAuth(); const [drawerOpen, setDrawerOpen] = useState(false); const [moreOpen, setMoreOpen] = useState(false); const [topMenu, setTopMenu] = useState<'notifications'|'account'|null>(null); const topActionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setDrawerOpen(false); setMoreOpen(false); setTopMenu(null); }, [location.pathname]);
  useEffect(() => { const onPointerDown = (event: PointerEvent) => { if (event.target instanceof Node && !topActionsRef.current?.contains(event.target)) setTopMenu(null); }; document.addEventListener('pointerdown', onPointerDown); return () => document.removeEventListener('pointerdown', onPointerDown); }, []);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setDrawerOpen(false); setMoreOpen(false); setTopMenu(null); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  useEffect(() => { const onResize = () => { if (window.innerWidth >= 1024 || window.innerWidth < 768) setDrawerOpen(false); }; window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, []);
  const ctx = { university };
  const toggleTopMenu = (menu: 'notifications'|'account') => setTopMenu((current) => current === menu ? null : menu);
  const titleByPath: Record<string, string> = { '/': 'Overview', '/students': 'Students', '/roster': 'Roster', '/roster/import': 'Upload roster', '/placements': 'Placements', '/skills': 'Skills demand', '/directory': 'Organizations', '/notifications': 'Notifications', '/account': 'Account & security', '/help': 'Help' };
  const title = location.pathname.startsWith('/students/') ? 'Student details' : titleByPath[location.pathname] ?? 'Page not found';
  const mobileNav = primaryNav.slice(0, 4).map((item) => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : false} className={({ isActive }) => `mobile-tab${isActive ? ' active' : ''}`}><Icon/><span>{item.label}</span></NavLink>; });
  return <div className="app-shell"><Helmet><title>{title} · AptoHire University</title><meta name="robots" content="noindex,nofollow"/></Helmet><a className="skip-link" href="#main-content">Skip to content</a><PrototypeNotice/>
    <aside className={`side-rail${drawerOpen ? ' drawer-open' : ''}`} aria-label="Main navigation"><div className="rail-brand-row"><Brand/>{drawerOpen ? <button className="icon-button drawer-close" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}><X size={20}/></button> : null}</div><nav className="rail-nav" aria-label="Main">{primaryNav.map((item) => <RailLink item={item} key={item.to} onClick={() => setDrawerOpen(false)}/>)}</nav><nav className="rail-footer" aria-label="More pages">{footerNav.map((item) => <RailLink item={item} key={item.to} onClick={() => setDrawerOpen(false)}/>)}</nav></aside>
    <div className={`drawer-scrim${drawerOpen ? ' open' : ''}`} onClick={() => setDrawerOpen(false)} aria-hidden="true"/>
    <div className="shell-main"><header className={`topbar${location.pathname === '/' ? ' topbar-overview' : ''}${drawerOpen ? ' drawer-active' : ''}`}><button className="icon-button nav-toggle" aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={drawerOpen} onClick={() => { setTopMenu(null); setMoreOpen(false); setDrawerOpen(!drawerOpen); }}>{drawerOpen ? <X/> : <Menu/>}</button><div className="topbar-university">{university.short_name} <span>·</span> {university.status === 'approved' ? <Chip tone="approved">Approved</Chip> : <Chip tone="pending">Pending</Chip>}</div><div className="top-actions" ref={topActionsRef}><NotificationMenu open={topMenu === 'notifications'} onToggle={() => toggleTopMenu('notifications')}/><AccountMenu university={university} open={topMenu === 'account'} onToggle={() => toggleTopMenu('account')}/></div></header><PendingBanner university={university}/><main id="main-content" className="app-content"><Outlet context={ctx}/></main></div>
    <nav className="mobile-tabs" aria-label="Primary navigation">{mobileNav}<button className={`mobile-tab${moreOpen ? ' active' : ''}`} aria-expanded={moreOpen} onClick={() => { setTopMenu(null); setDrawerOpen(false); setMoreOpen(!moreOpen); }}><MoreHorizontal/><span>More</span></button></nav>
    {moreOpen ? <div className="more-menu" aria-label="More navigation">{[primaryNav[4]!, ...footerNav].map((item) => <RailLink item={item} key={item.to} onClick={() => setMoreOpen(false)}/>)}<button className="nav-link" onClick={() => void signOut()}><LogOut size={19}/><span>Sign out</span></button></div> : null}
  </div>;
}
