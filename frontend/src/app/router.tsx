import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthGate, RoleGuard, UniversityGate } from './Gates';
import { AppShell } from '@/components/shell/AppShell';
import { LoginPage, PublicAuthPage } from '@/pages/AuthPages';
import { env } from '@/config/env';
import { Spinner } from '@/components/ui';

const OverviewPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.OverviewPage })));
const StudentsPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.StudentsPage })));
const StudentDetailPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.StudentDetailPage })));
const RosterPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.RosterPage })));
const ImportPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.ImportPage })));
const PlacementsPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.PlacementsPage })));
const SkillsPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.SkillsPage })));
const DirectoryPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.DirectoryPage })));
const NotificationsPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.NotificationsPage })));
const AccountPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.AccountPage })));
const HelpPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.HelpPage })));
const MissingPage = lazy(() => import('@/pages/PortalPages').then((module) => ({ default: module.MissingPage })));
const PagesFallback = () => <div className="page-loading"><Spinner /></div>;
export function Router() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<PublicAuthPage kind="signup" />} />
    <Route path="/forgot-password" element={<PublicAuthPage kind="forgot" />} />
    <Route path="/reset-password" element={<PublicAuthPage kind="reset" />} />
    <Route path="/auth/callback" element={<PublicAuthPage kind="callback" />} />
    <Route element={<AuthGate />}><Route element={<RoleGuard />}><Route element={<UniversityGate />}>
      <Route element={<AppShell />}>
        <Route index element={<Suspense fallback={<PagesFallback />}><OverviewPage /></Suspense>} />
        <Route path="students" element={<Suspense fallback={<PagesFallback />}><StudentsPage /></Suspense>} />
        <Route path="students/:studentId" element={<Suspense fallback={<PagesFallback />}><StudentDetailPage /></Suspense>} />
        <Route path="roster" element={<Suspense fallback={<PagesFallback />}><RosterPage /></Suspense>} />
        <Route path="roster/import" element={<Suspense fallback={<PagesFallback />}><ImportPage /></Suspense>} />
        <Route path="placements" element={<Suspense fallback={<PagesFallback />}><PlacementsPage /></Suspense>} />
        <Route path="skills" element={<Suspense fallback={<PagesFallback />}><SkillsPage /></Suspense>} />
        <Route path="directory" element={<Suspense fallback={<PagesFallback />}><DirectoryPage /></Suspense>} />
        <Route path="notifications" element={<Suspense fallback={<PagesFallback />}><NotificationsPage /></Suspense>} />
        <Route path="account" element={<Suspense fallback={<PagesFallback />}><AccountPage /></Suspense>} />
        <Route path="help" element={<Suspense fallback={<PagesFallback />}><HelpPage /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<PagesFallback />}><MissingPage /></Suspense>} />
      </Route>
    </Route></Route></Route>
  </Routes>;
}
export const demoEnabled = env.demoMode && env.appEnv !== 'production';
