import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
		...FontAwesome.font,
	});
	// Expo Router uses Error Boundaries to catch errors in the navigation tree.
	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);
	
	if (!loaded) {
		return null;
	}
	
	return (
		<ThemeProvider>
			<RootLayoutNav />
		</ThemeProvider>
	);
}

function RootLayoutNav() {
	const { colorMode } = useTheme();

	return (
		<AuthProvider>
			<GluestackUIProvider mode={colorMode}>
				<NavigationThemeProvider value={colorMode === "dark" ? DarkTheme : DefaultTheme}>
					<StatusBar style={colorMode === "dark" ? "light" : "dark"} />
					<Slot />
				</NavigationThemeProvider>
			</GluestackUIProvider>
		</AuthProvider>
	);
}
