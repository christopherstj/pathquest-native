import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "./store";

// Ensure the browser is dismissed after auth
WebBrowser.maybeCompleteAuthSession();

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? "";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

// Log config on load (helps debug connection issues)
console.log("[Strava Auth] API_URL configured as:", API_URL || "(not set)");

/**
 * Demo login for Google Play reviewers.
 * Bypasses Strava OAuth with a password-protected endpoint.
 */
export const demoLogin = async (password: string): Promise<boolean> => {
    const url = `${API_URL}/api/auth/mobile/demo-login`;
    console.log("[Demo Auth] Attempting demo login...");
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ password }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Demo Auth] Login failed:", response.status, errorText);
            return false;
        }

        const data = await response.json();
        console.log("[Demo Auth] Login successful, user:", data.user?.name);
        
        await useAuthStore.getState().login(data);
        return true;
    } catch (error) {
        console.error("[Demo Auth] Login error (network?):", error);
        return false;
    }
};

// Strava OAuth endpoints
// Using standard endpoint (not /mobile/authorize) for broader scope support
const discovery: AuthSession.DiscoveryDocument = {
    authorizationEndpoint: "https://www.strava.com/oauth/authorize",
    tokenEndpoint: "https://www.strava.com/oauth/token",
    revocationEndpoint: "https://www.strava.com/oauth/deauthorize",
};

/**
 * Generate a cryptographically random code verifier for PKCE.
 */
const generateCodeVerifier = async (): Promise<string> => {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return base64URLEncode(randomBytes);
};

/**
 * Generate code challenge from code verifier using SHA-256.
 */
const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        verifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    // Convert from standard base64 to base64url
    return digest
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
};

/**
 * Base64 URL encode a Uint8Array.
 */
const base64URLEncode = (buffer: Uint8Array): string => {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
};

/**
 * Exchange the authorization code for PathQuest tokens via our API.
 */
const exchangeCodeForTokens = async (
    code: string,
    codeVerifier: string
): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user: {
        id: string;
        name: string;
        email?: string | null;
        pic?: string | null;
        city?: string | null;
        state?: string | null;
        country?: string | null;
        isPublic?: boolean;
    };
} | null> => {
    const url = `${API_URL}/api/auth/mobile/strava/exchange`;
    console.log("Exchanging code at:", url);
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                code,
                codeVerifier,
            }),
        });

        console.log("Exchange response status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Token exchange failed:", response.status, errorText);
            return null;
        }

        const data = await response.json();
        console.log("Token exchange successful, user:", data.user?.name);
        return data;
    } catch (error) {
        console.error("Token exchange error (network?):", error);
        return null;
    }
};

/**
 * Start the Strava OAuth flow.
 * Returns true if login was successful, false otherwise.
 */
export const startStravaAuth = async (): Promise<boolean> => {
    if (!STRAVA_CLIENT_ID) {
        console.error("EXPO_PUBLIC_STRAVA_CLIENT_ID is not set");
        return false;
    }

    try {
        // Generate PKCE values
        const codeVerifier = await generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // Strava requires a real web domain for callback URLs (custom schemes aren't valid).
        // We use the web app as an intermediary which then redirects to our deep link.
        // Make sure "pathquest.app" is in your Strava API Authorization Callback Domain.
        const redirectUri = "https://pathquest.app/api/auth/mobile/callback";

        console.log("Redirect URI:", redirectUri);

        // Create the auth request
        // Strava expects comma-separated scopes (not space-separated like OAuth2 standard)
        const request = new AuthSession.AuthRequest({
            clientId: STRAVA_CLIENT_ID,
            scopes: [], // Don't use scopes array - Strava needs comma-separated
            redirectUri,
            codeChallenge,
            codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
            responseType: AuthSession.ResponseType.Code,
            extraParams: {
                approval_prompt: "auto",
                scope: "read,activity:read,activity:read_all,activity:write", // Comma-separated!
            },
        });

        // Start the auth flow
        console.log("[Strava Auth] Starting promptAsync...");
        const result = await request.promptAsync(discovery);
        console.log("[Strava Auth] promptAsync result type:", result.type);

        if (result.type === "success" && result.params.code) {
            // This path works when redirectUri matches what expo-auth-session expects
            console.log("[Strava Auth] Authorization code received via promptAsync");

            const tokens = await exchangeCodeForTokens(
                result.params.code,
                codeVerifier
            );

            if (tokens) {
                console.log("[Strava Auth] Token exchange successful!");
                await useAuthStore.getState().login(tokens);
                return true;
            } else {
                console.error("[Strava Auth] Token exchange returned null");
            }
        } else if (result.type === "dismiss") {
            // When using a web intermediary, promptAsync returns "dismiss" but the
            // callback route (auth/callback.tsx) handles the exchange directly.
            // Wait briefly and check if auth succeeded.
            console.log("[Strava Auth] Auth flow dismissed - checking if callback handled auth...");
            
            // Give the callback time to complete the exchange
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (useAuthStore.getState().isAuthenticated) {
                console.log("[Strava Auth] Auth succeeded via callback route!");
                return true;
            }
            console.log("[Strava Auth] Auth not completed after dismiss");
        } else if (result.type === "cancel") {
            console.log("[Strava Auth] Auth flow cancelled by user");
        } else if (result.type === "error") {
            console.error("[Strava Auth] Auth error:", result.error);
        }

        return false;
    } catch (error) {
        console.error("Strava auth error:", error);
        return false;
    }
};

/**
 * Hook-friendly version that returns the auth request and prompt function.
 * Useful if you want more control over the auth flow in a component.
 */
export const useStravaAuth = () => {
    // Strava requires a real web domain - we use the web app as an intermediary
    const redirectUri = "https://pathquest.app/api/auth/mobile/callback";

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: STRAVA_CLIENT_ID,
            scopes: [], // Don't use scopes array - Strava needs comma-separated
            redirectUri,
            codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
            responseType: AuthSession.ResponseType.Code,
            extraParams: {
                approval_prompt: "auto",
                scope: "read,activity:read,activity:read_all,activity:write", // Comma-separated!
            },
        },
        discovery
    );

    return {
        request,
        response,
        promptAsync,
        redirectUri,
    };
};

