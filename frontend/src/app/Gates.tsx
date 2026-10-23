import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useBackend } from './BackendProvider';
import { portalUrl, rootUrl } from '@/config/links';
import { ShieldCheck, Mail } from 'lucide-react';
import { Button } from '@/components/ui';
import { env } from '@/config/env';

export function AuthGate() {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return <div className="gate-loading" aria-label="Loading account"><span className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
export function RoleGuard() {
  const { user } = useAuth();
  if (user?.role === 'university') return <Outlet />;
  if (user?.role === 'student' || user?.role === 'organization') return <main className="system-screen"><div className="system-icon"><ShieldCheck size={24}/></div><h1>Go to your portal</h1><p>This account belongs on another AptoHire site.</p><a className="button button-primary" href={portalUrl(user.role, '/login')}>Continue to your portal</a></main>;
  if (user) return <main className="system-screen"><div className="system-icon"><ShieldCheck size={24}/></div><h1>This account can’t use the university site.</h1><p>Sign in with an account linked to a university.</p><Link to="/login" className="button button-secondary">Back to sign in</Link></main>;
  return null;
}
export function UniversityGate() {
  const backend = useBackend(); const { user, signOut } = useAuth();
  const { data: university, isPending, error } = useQuery({ queryKey: ['university', user?.universityId], queryFn: () => backend.university.getMine(), enabled: user?.role === 'university' });
  if (isPending) return <div className="gate-loading" aria-label="Loading university"><span className="spinner" /></div>;
  if (error) return <main className="system-screen"><h1>We couldn’t load your university</h1><p>Check your connection and try again.</p><Button onClick={() => window.location.reload()}>Retry</Button></main>;
  if (!university) return <main className="system-screen"><div className="system-icon"><Mail size={24}/></div><h1>You’re not linked to a university yet.</h1><p>Apply for access on aptohire.com, then sign up with the email you applied with.</p><div className="system-actions"><a className="button button-primary" href={rootUrl('/apply/university')}>Apply for university access</a><Button variant="secondary" onClick={() => void signOut()}>Sign out</Button></div></main>;
  if (university.status === 'rejected') return <main className="system-screen"><h1>Your application wasn’t approved.</h1><p>{university.status_note || `Contact ${env.supportEmail} if you have questions.`}</p><a href={`mailto:${env.supportEmail}`} className="button button-secondary">Contact support</a><Button variant="ghost" onClick={() => void signOut()}>Sign out</Button></main>;
  return <Outlet context={{ university }} />;
}
