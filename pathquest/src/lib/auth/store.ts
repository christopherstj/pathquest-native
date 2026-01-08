import { create } from "zustand";
import {
    StoredUser,
    getAccessToken,
    getUserData,
    saveAuthData,
    saveUserData,
    clearAuthData,
    isTokenExpired,
    getRefreshToken,
    saveAccessToken,
    saveTokenExpiry,
} from "./tokens";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: StoredUser | null;
    accessToken: string | null;

    // Actions
    initialize: () => Promise<void>;
    login: (data: {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        user: StoredUser;
    }) => Promise<void>;
    logout: () => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
    getValidAccessToken: () => Promise<string | null>;
    updateUser: (updates: Partial<StoredUser>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    accessToken: null,

    /**
     * Initialize auth state from secure storage on app startup.
     */
    initialize: async () => {
        set({ isLoading: true });

        try {
            const [accessToken, user] = await Promise.all([
                getAccessToken(),
                getUserData(),
            ]);

            if (accessToken && user) {
                set({
                    isAuthenticated: true,
                    user,
                    accessToken,
                    isLoading: false,
                });
            } else {
                set({
                    isAuthenticated: false,
                    user: null,
                    accessToken: null,
                    isLoading: false,
                });
            }
        } catch (error) {
            console.error("Failed to initialize auth state:", error);
            set({
                isAuthenticated: false,
                user: null,
                accessToken: null,
                isLoading: false,
            });
        }
    },

    /**
     * Save auth data after successful login/token exchange.
     */
    login: async (data) => {
        await saveAuthData(data);
        set({
            isAuthenticated: true,
            user: data.user,
            accessToken: data.accessToken,
        });
    },

    /**
     * Clear auth data on logout.
     */
    logout: async () => {
        await clearAuthData();
        set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
        });
    },

    /**
     * Refresh the access token using the refresh token.
     * Returns true if successful, false otherwise.
     */
    refreshAccessToken: async () => {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            console.warn("No refresh token available");
            return false;
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                console.error("Token refresh failed:", response.status);
                // If refresh fails with 401, the refresh token is invalid - logout
                if (response.status === 401) {
                    await get().logout();
                }
                return false;
            }

            const data = await response.json();
            await saveAccessToken(data.accessToken);
            await saveTokenExpiry(data.expiresAt);
            set({ accessToken: data.accessToken });

            return true;
        } catch (error) {
            console.error("Token refresh error:", error);
            return false;
        }
    },

    /**
     * Get a valid access token, refreshing if necessary.
     */
    getValidAccessToken: async () => {
        const expired = await isTokenExpired();
        
        if (expired) {
            const refreshed = await get().refreshAccessToken();
            if (!refreshed) {
                return null;
            }
        }

        return get().accessToken;
    },

    /**
     * Update user data in both state and secure storage.
     * Used when settings are changed.
     */
    updateUser: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates };
        await saveUserData(updatedUser);
        set({ user: updatedUser });
    },
}));

