import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "@/src/lib/auth";

// Try to complete the auth session (for cases where promptAsync is waiting)
WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/**
 * OAuth callback handler.
 * 
 * This route handles the redirect from Strava OAuth via our web intermediary.
 * Since the web redirect breaks expo-auth-session's session tracking,
 * we handle the token exchange directly here.
 */
export default function AuthCallback() {
    const params = useLocalSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        const handleAuth = async () => {
            console.log("[AuthCallback] Received params:", JSON.stringify(params));
            
            const code = params.code as string | undefined;
            const error = params.error as string | undefined;

            if (error) {
                console.error("[AuthCallback] OAuth error:", error);
                setStatus("error");
                setErrorMessage(error);
                setTimeout(() => router.replace("/"), 3000);
                return;
            }

            if (!code) {
                console.log("[AuthCallback] No code received");
                setStatus("error");
                setErrorMessage("No authorization code received");
                setTimeout(() => router.replace("/"), 3000);
                return;
            }

            console.log("[AuthCallback] Got authorization code, exchanging for tokens...");

            try {
                // Exchange the code for PathQuest tokens
                const response = await fetch(`${API_URL}/api/auth/mobile/strava/exchange`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code }),
                });

                console.log("[AuthCallback] Exchange response status:", response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("[AuthCallback] Token exchange failed:", errorText);
                    setStatus("error");
                    setErrorMessage("Failed to complete sign in");
                    setTimeout(() => router.replace("/"), 3000);
                    return;
                }

                const tokens = await response.json();
                console.log("[AuthCallback] Token exchange successful, user:", tokens.user?.name);

                // Save to auth store
                await useAuthStore.getState().login(tokens);
                
                setStatus("success");
                
                // Navigate to home after a brief success message
                setTimeout(() => router.replace("/"), 1000);
            } catch (err) {
                console.error("[AuthCallback] Network error during exchange:", err);
                setStatus("error");
                setErrorMessage("Network error during sign in");
                setTimeout(() => router.replace("/"), 3000);
            }
        };

        handleAuth();
    }, []);

    return (
        <View className="flex-1 justify-center items-center bg-background">
            {status === "loading" && (
                <>
                    <ActivityIndicator size="large" color="#5B9167" />
                    <Text className="mt-4 text-base text-primary">Completing sign in...</Text>
                </>
            )}
            {status === "success" && (
                <>
                    <Text className="text-5xl text-primary">✓</Text>
                    <Text className="mt-4 text-base text-primary">Sign in successful!</Text>
                </>
            )}
            {status === "error" && (
                <>
                    <Text className="text-5xl text-destructive">✗</Text>
                    <Text className="mt-4 text-base text-foreground">Sign in failed</Text>
                    <Text className="mt-2 text-sm text-muted-foreground">{errorMessage}</Text>
                </>
            )}
        </View>
    );
}
