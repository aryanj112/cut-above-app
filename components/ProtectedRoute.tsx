import React from "react";
import { View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useColorScheme } from "react-native";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { session, loading } = useAuth();
	const router = useRouter();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";

	useEffect(() => {
		if (!loading && !session) {
			// Redirect to login if not authenticated
			router.replace("/");
		}
	}, [session, loading, router]);

	// Show loading spinner while checking authentication
	if (loading) {
		return (
			<Box
				className={`flex-1 ${
					isDark ? "bg-gray-950" : "bg-gray-50"
				} justify-center items-center`}
			>
				<Spinner size="large" />
				<Text
					className={`mt-4 text-lg ${isDark ? "text-white" : "text-gray-900"}`}
				>
					Loading...
				</Text>
			</Box>
		);
	}

	// Show unauthorized message if not authenticated
	if (!session) {
		return (
			<Box
				className={`flex-1 ${
					isDark ? "bg-gray-950" : "bg-gray-50"
				} justify-center items-center px-6`}
			>
				<Text
					className={`text-2xl font-bold mb-4 ${
						isDark ? "text-white" : "text-gray-900"
					}`}
				>
					Access Denied
				</Text>
				<Text
					className={`text-lg text-center ${
						isDark ? "text-gray-400" : "text-gray-600"
					}`}
				>
					Please sign in to access this content
				</Text>
			</Box>
		);
	}

	// Render protected content if authenticated
	return <>{children}</>;
}
