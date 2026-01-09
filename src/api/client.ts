import { RegisterNotification, ActivityNotification, TargetRegistryItem } from './types';

// In development (and potentially production if served correctly), we use the relative path
// to let Vite (or Nginx) handle the proxying to avoid CORS.
const BASE_URL = '/api';

// Check if running in Tauri at runtime (not module load time)
function isTauri(): boolean {
    return '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
}

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

async function invokeTauri<T>(command: string): Promise<T> {
    // Dynamic import to avoid issues when not in Tauri
    const { invoke } = await import('@tauri-apps/api/core');
    console.log(`Invoking Tauri command: ${command}...`);
    try {
        const data = await invoke<T>(command);
        console.log(`Invoked ${command}, received ${Array.isArray(data) ? data.length : 'object'} items`);
        return data;
    } catch (e) {
        console.error(`Tauri invoke error (${command}):`, e);
        throw e;
    }
}

export const api = {
    getRegisterNotifications: async (): Promise<RegisterNotification[]> => {
        console.log('getRegisterNotifications - isTauri:', isTauri());
        if (isTauri()) {
            return invokeTauri<RegisterNotification[]>('fetch_register_notifications');
        }
        return fetchJson<RegisterNotification[]>('/open-data-register-notification');
    },

    getActivityNotifications: async (): Promise<ActivityNotification[]> => {
        console.log('getActivityNotifications - isTauri:', isTauri());
        if (isTauri()) {
            return invokeTauri<ActivityNotification[]>('fetch_activity_notifications');
        }
        return fetchJson<ActivityNotification[]>('/open-data-activity-notification');
    },

    getActivityNotificationsByTerm: async (termId: string): Promise<ActivityNotification[]> => {
        // Note: This endpoint doesn't have a Tauri command yet, falls back to fetch
        return fetchJson<ActivityNotification[]>(`/open-data-activity-notification/term/${termId}`);
    },

    getTargets: async (): Promise<TargetRegistryItem[]> => {
        console.log('getTargets - isTauri:', isTauri());
        if (isTauri()) {
            return invokeTauri<TargetRegistryItem[]>('fetch_targets');
        }
        return fetchJson<TargetRegistryItem[]>('/open-data-target/targets');
    }
};
