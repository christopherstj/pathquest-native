import { createApiClient as createSharedApiClient } from "@pathquest/shared/api";
import { useAuthStore } from "../auth/store";

// Development fallback: use localhost:8080 if env var not set
// For physical devices, you'll need to set EXPO_PUBLIC_API_URL to your machine's IP
const rawUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

// Ensure the URL ends with /api (required for PathQuest API routes)
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;

console.log('[API Client] Using API URL:', API_URL);

/**
 * Creates an API client for the mobile app.
 * Automatically injects the access token from the auth store.
 */
export const createApiClient = () => {
    return createSharedApiClient({
        baseUrl: API_URL,
        getAuthHeaders: async (): Promise<Record<string, string>> => {
            const token = await useAuthStore.getState().getValidAccessToken();
            
            if (!token) {
                return {};
            }

            return {
                Authorization: `Bearer ${token}`,
            };
        },
    });
};

/**
 * Singleton API client instance.
 * Use this for most API calls.
 */
let clientInstance: ReturnType<typeof createSharedApiClient> | null = null;

export const getApiClient = () => {
    if (!clientInstance) {
        clientInstance = createApiClient();
    }
    return clientInstance;
};

/**
 * Reset the API client instance (useful after logout).
 */
export const resetApiClient = () => {
    clientInstance = null;
};

