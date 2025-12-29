import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// Complete the auth session when this screen loads
WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth callback handler.
 * 
 * This route handles the redirect from Strava OAuth.
 * The actual token exchange is handled by expo-auth-session in the auth flow,
 * so this screen just shows a loading state while that completes.
 */
export default function AuthCallback() {
    const params = useLocalSearchParams();

    useEffect(() => {
        // The auth session should be completed by maybeCompleteAuthSession()
        // Once that happens, the promptAsync() promise in the auth flow will resolve
        // and handle the token exchange.
        
        // If we somehow land here directly, navigate back to home
        const timeout = setTimeout(() => {
            router.replace("/");
        }, 3000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#4d7a57" />
            <Text style={styles.text}>Completing sign in...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5dc",
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        color: "#4d7a57",
    },
});

