import { useQuery } from '@tanstack/react-query';
import { useBackend } from '@/app/BackendProvider';
import { useAuth } from '@/app/AuthContext';
export function useOverview() { const backend = useBackend(); const { user } = useAuth(); return useQuery({ queryKey: ['overview', user?.universityId], queryFn: () => backend.analytics.overview(), enabled: Boolean(user?.universityId) }); }
export function useStudents() { const backend = useBackend(); const { user } = useAuth(); return useQuery({ queryKey: ['students', user?.universityId], queryFn: () => backend.students.list(), enabled: Boolean(user?.universityId) }); }
export function useDemand() { const backend = useBackend(); const { user } = useAuth(); return useQuery({ queryKey: ['demand', user?.universityId], queryFn: () => backend.demand.list(), enabled: Boolean(user?.universityId) }); }
