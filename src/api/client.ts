import { RegisterNotification, ActivityNotification, TargetInfo, TargetRegistryItem } from './types';

// In development (and potentially production if served correctly), we use the relative path
// to let Vite (or Nginx) handle the proxying to avoid CORS.
const BASE_URL = '/api';

async function fetchJson<T>(endpoint: string): Promise<T> {
    console.log(`Fetching ${endpoint}...`);
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Fetched ${Array.isArray(data) ? data.length : 'object'} items`);
        return data as T;
    } catch (e) {
        console.error("Fetch error:", e);
        throw e;
    }
}

export const api = {
    getRegisterNotifications: async (): Promise<RegisterNotification[]> => {
        return fetchJson<RegisterNotification[]>('/open-data-register-notification');
    },

    getActivityNotifications: async (): Promise<ActivityNotification[]> => {
        return fetchJson<ActivityNotification[]>('/open-data-activity-notification');
    },

    getActivityNotificationsByTerm: async (termId: string): Promise<ActivityNotification[]> => {
        return fetchJson<ActivityNotification[]>(`/open-data-activity-notification/term/${termId}`);
    },

    getTargets: async (): Promise<TargetRegistryItem[]> => {
        return fetchJson<TargetRegistryItem[]>('/open-data-target/targets');
    }
};
