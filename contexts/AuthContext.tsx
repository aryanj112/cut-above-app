import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";

interface AuthContextType {
	session: Session | null;
	user: User | null;
	loading: boolean;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		// Get initial session
		const getInitialSession = async () => {
			try {
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();
				if (error) {
					console.error("Error getting session:", error);
				} else {
					setSession(session);
					setUser(session?.user ?? null);
				}
			} catch (error) {
				console.error("Error in getInitialSession:", error);
			} finally {
				setLoading(false);
			}
		};

		getInitialSession();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log("Auth state changed:", event, session?.user?.email);
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const signOut = async () => {
		try {
			setLoading(true);
			const { error } = await supabase.auth.signOut();
			if (error) {
				console.error("Error signing out:", error);
				throw error;
			}
		} catch (error) {
			console.error("Sign out error:", error);
			throw error;
		} finally {
			setLoading(false);
      router.push("/");
		}
	};

	const value = {
		session,
		user,
		loading,
		signOut,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
