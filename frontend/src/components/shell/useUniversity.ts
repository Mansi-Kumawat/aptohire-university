import { useOutletContext } from 'react-router-dom';
import type { University } from '@aptohire/university-backend';
export function useUniversity() { return useOutletContext<{ university: University }>().university; }
