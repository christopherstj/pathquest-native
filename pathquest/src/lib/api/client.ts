import { createApiClient as createSharedApiClient } from "@pathquest/shared/api";
import { useAuthStore } from "../auth/store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/**
 * Creates an API client for the mobile app.
 * Automatically injects the access token from the auth store.
 */
export const createApiClient = () => {
    return createSharedApiClient({
        baseUrl: API_URL,
        getAuthHeaders: async () => {
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

