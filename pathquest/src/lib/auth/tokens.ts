import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "pathquest_access_token";
const REFRESH_TOKEN_KEY = "pathquest_refresh_token";
const TOKEN_EXPIRY_KEY = "pathquest_token_expiry";
const USER_DATA_KEY = "pathquest_user_data";

export interface StoredUser {
    id: string;
    name: string;
    email?: string | null;
    pic?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    isPublic?: boolean;
}

/**
 * Saves the access token to secure storage.
 */
export const saveAccessToken = async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
};

/**
 * Gets the access token from secure storage.
 */
export const getAccessToken = async (): Promise<string | null> => {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

/**
 * Saves the refresh token to secure storage.
 */
export const saveRefreshToken = async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
};

/**
 * Gets the refresh token from secure storage.
 */
export const getRefreshToken = async (): Promise<string | null> => {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

/**
 * Saves the token expiry timestamp to secure storage.
 */
export const saveTokenExpiry = async (expiresAt: number): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, String(expiresAt));
};

/**
 * Gets the token expiry timestamp from secure storage.
 */
export const getTokenExpiry = async (): Promise<number | null> => {
    const expiry = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
};

/**
 * Saves user data to secure storage.
 */
export const saveUserData = async (user: StoredUser): Promise<void> => {
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
};

/**
 * Gets user data from secure storage.
 */
export const getUserData = async (): Promise<StoredUser | null> => {
    const data = await SecureStore.getItemAsync(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
};

/**
 * Saves all auth tokens and user data at once.
 */
export const saveAuthData = async (data: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user: StoredUser;
}): Promise<void> => {
    await Promise.all([
        saveAccessToken(data.accessToken),
        saveRefreshToken(data.refreshToken),
        saveTokenExpiry(data.expiresAt),
        saveUserData(data.user),
    ]);
};

/**
 * Clears all auth data from secure storage (logout).
 */
export const clearAuthData = async (): Promise<void> => {
    await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY),
        SecureStore.deleteItemAsync(USER_DATA_KEY),
    ]);
};

/**
 * Checks if the access token is expired or about to expire (within 1 minute).
 */
export const isTokenExpired = async (): Promise<boolean> => {
    const expiry = await getTokenExpiry();
    if (!expiry) return true;
    
    // Consider expired if less than 1 minute remaining
    const now = Math.floor(Date.now() / 1000);
    return expiry - now < 60;
};

