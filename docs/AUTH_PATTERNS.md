# Supabase Auth Patterns for React Native

## ✅ Recommended: Global State Management

### Why Global State is Better:

1. **Single Source of Truth**: Session state managed in one place
2. **Consistency**: All components access the same session data
3. **Performance**: Avoids duplicate API calls and state sync issues
4. **Real-time Updates**: Changes reflected everywhere automatically
5. **Easier Testing**: Centralized state is easier to mock and test

### Implementation:

#### 1. AuthContext (`contexts/AuthContext.tsx`)

- Manages global session state
- Handles auth state changes
- Provides `useAuth` hook for components
- Includes loading states and error handling

#### 2. Provider Setup (`app/_layout.tsx`)

- Wrap your app with `AuthProvider`
- Ensures all components have access to auth state

#### 3. Component Usage

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
	const { session, user, loading, signOut } = useAuth();

	if (loading) return <LoadingSpinner />;
	if (!session) return <LoginScreen />;

	return <AuthenticatedContent user={user} />;
}
```

## ❌ Avoid: Per-Tab State Management

### Problems with Local State:

- **Duplicate API calls**: Each tab fetches session independently
- **State inconsistency**: Tabs can have different session states
- **Memory waste**: Multiple copies of the same data
- **Complex synchronization**: Hard to keep all tabs in sync
- **Race conditions**: Multiple components updating auth state

### Example of What NOT to Do:

```tsx
// ❌ DON'T DO THIS - Local state in each component
function Tab1() {
	const [session, setSession] = useState(null);

	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
		});
	}, []);

	// This creates duplicate API calls and state management
}

function Tab2() {
	const [session, setSession] = useState(null);

	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
		});
	}, []);

	// Same code duplicated - not DRY!
}
```

## 🚀 Best Practices

### 1. Use the Auth Context Everywhere

```tsx
// ✅ DO THIS - Use global context
function AnyComponent() {
	const { session, user, loading } = useAuth();
	// Access auth state from anywhere
}
```

### 2. Handle Loading States

```tsx
function ProtectedComponent() {
	const { session, loading } = useAuth();

	if (loading) {
		return <LoadingScreen />;
	}

	if (!session) {
		return <LoginScreen />;
	}

	return <AuthenticatedContent />;
}
```

### 3. Use TypeScript for Type Safety

```tsx
const { session, user, loading, signOut } = useAuth();
// session: Session | null
// user: User | null
// loading: boolean
// signOut: () => Promise<void>
```

### 4. Handle Auth State Changes

The context automatically handles:

- Initial session loading
- Auth state changes (login/logout)
- Token refresh
- Session persistence

### 5. Error Handling

```tsx
const signOut = async () => {
	try {
		await signOut();
	} catch (error) {
		console.error("Sign out failed:", error);
		// Handle error appropriately
	}
};
```

## 📱 React Native Specific Considerations

### 1. App State Management

- Auth context handles app state changes
- Automatically starts/stops token refresh
- Persists session across app restarts

### 2. Deep Linking

- Session state is available immediately
- No need to re-fetch on deep link navigation

### 3. Background/Foreground

- Token refresh handled automatically
- Session state remains consistent

## 🔧 Migration Guide

### From Local State to Global State:

1. **Remove local auth state** from individual components
2. **Import and use** `useAuth` hook
3. **Remove duplicate** `supabase.auth.getSession()` calls
4. **Remove duplicate** `supabase.auth.onAuthStateChange()` listeners
5. **Use global** `session`, `user`, `loading` state

### Before (Local State):

```tsx
function Component() {
	const [session, setSession] = useState(null);

	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
		});
	}, []);

	// Component logic...
}
```

### After (Global State):

```tsx
function Component() {
	const { session, loading } = useAuth();

	// Component logic...
}
```

## 🎯 Summary

**Use global state management with React Context** for Supabase session management in React Native apps. This approach provides:

- ✅ Single source of truth
- ✅ Consistent state across all components
- ✅ Better performance
- ✅ Easier maintenance
- ✅ Type safety
- ✅ Automatic session management

The `AuthContext` pattern is the industry standard for managing authentication state in React applications.
