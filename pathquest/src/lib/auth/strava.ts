import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "./store";

// Ensure the browser is dismissed after auth
WebBrowser.maybeCompleteAuthSession();

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? "";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

// Strava OAuth endpoints
const discovery: AuthSession.DiscoveryDocument = {
    authorizationEndpoint: "https://www.strava.com/oauth/mobile/authorize",
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
    try {
        const response = await fetch(`${API_URL}/api/auth/mobile/strava/exchange`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                code,
                codeVerifier,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Token exchange failed:", response.status, errorText);
            return null;
        }

        return response.json();
    } catch (error) {
        console.error("Token exchange error:", error);
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

        // Get the redirect URI for this app
        const redirectUri = AuthSession.makeRedirectUri({
            scheme: "pathquest",
            path: "auth/callback",
        });

        console.log("Redirect URI:", redirectUri);

        // Create the auth request
        const request = new AuthSession.AuthRequest({
            clientId: STRAVA_CLIENT_ID,
            scopes: ["read", "activity:read", "activity:read_all", "activity:write"],
            redirectUri,
            codeChallenge,
            codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
            responseType: AuthSession.ResponseType.Code,
            extraParams: {
                approval_prompt: "auto",
            },
        });

        // Start the auth flow
        const result = await request.promptAsync(discovery);

        if (result.type === "success" && result.params.code) {
            console.log("Authorization code received");

            // Exchange the code for tokens
            const tokens = await exchangeCodeForTokens(
                result.params.code,
                codeVerifier
            );

            if (tokens) {
                // Save to auth store
                await useAuthStore.getState().login(tokens);
                return true;
            }
        } else if (result.type === "cancel") {
            console.log("Auth flow cancelled by user");
        } else if (result.type === "error") {
            console.error("Auth error:", result.error);
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
    const redirectUri = AuthSession.makeRedirectUri({
        scheme: "pathquest",
        path: "auth/callback",
    });

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: STRAVA_CLIENT_ID,
            scopes: ["read", "activity:read", "activity:read_all", "activity:write"],
            redirectUri,
            codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
            responseType: AuthSession.ResponseType.Code,
            extraParams: {
                approval_prompt: "auto",
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

