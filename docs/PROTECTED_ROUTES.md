# Protected Routes Implementation

## Overview

All tab pages are now protected and only accessible when the user is logged in via Supabase. This implementation uses a `ProtectedRoute` component that wraps the entire tab navigation.

## Implementation Details

### 1. ProtectedRoute Component (`components/ProtectedRoute.tsx`)

**Features:**

- ✅ Checks authentication status using global auth context
- ✅ Shows loading spinner while checking authentication
- ✅ Redirects to login page if not authenticated
- ✅ Shows "Access Denied" message for unauthorized access
- ✅ Supports dark/light theme
- ✅ Renders protected content when authenticated

**Behavior:**

- **Loading State**: Shows spinner while checking auth status
- **Unauthenticated**: Redirects to `/` (login page)
- **Authenticated**: Renders the protected content

### 2. Tab Layout Protection (`app/tabs/(tabs)/_layout.tsx`)

**Implementation:**

```tsx
export default function TabLayout() {
	return (
		<ProtectedRoute>
			<Tabs>{/* All tab screens are now protected */}</Tabs>
		</ProtectedRoute>
	);
}
```

**Protected Tabs:**

- 🏠 **Home** - `/tabs/home`
- 📅 **Booking** - `/tabs/booking`
- 👤 **Account** - `/tabs/account`
- 📖 **Book** - `/tabs/book`

### 3. Sign Out Functionality

**Account Page** (`app/tabs/(tabs)/account.tsx`):

- ✅ Uses global auth context
- ✅ Sign out button with error handling
- ✅ Automatically redirects to login after sign out

## User Flow

### 1. **Unauthenticated User**

```
User visits /tabs/* → ProtectedRoute checks auth → Redirects to / (login)
```

### 2. **Authenticated User**

```
User visits /tabs/* → ProtectedRoute checks auth → Shows tab content
```

### 3. **Sign Out Flow**

```
User clicks "Sign Out" → signOut() called → Redirects to / (login)
```

## Security Features

### ✅ **Route Protection**

- All tab routes are protected at the layout level
- No individual route protection needed
- Consistent security across all tabs

### ✅ **Authentication State Management**

- Uses global auth context (single source of truth)
- Real-time auth state updates
- Automatic session persistence

### ✅ **User Experience**

- Smooth loading states
- Clear error messages
- Automatic redirects
- Theme-aware UI

### ✅ **Error Handling**

- Graceful fallbacks for auth errors
- User-friendly error messages
- Retry mechanisms for failed operations

## Testing the Implementation

### 1. **Test Unauthenticated Access**

```bash
# Start the app
npx expo start

# Try to navigate to any tab without logging in
# Should redirect to login page
```

### 2. **Test Authenticated Access**

```bash
# Log in through the login page
# Navigate to any tab
# Should show the tab content
```

### 3. **Test Sign Out**

```bash
# While logged in, go to Account tab
# Click "Sign Out" button
# Should redirect to login page
```

## Customization Options

### 1. **Custom Loading Screen**

```tsx
// In ProtectedRoute.tsx
if (loading) {
	return <YourCustomLoadingComponent />;
}
```

### 2. **Custom Unauthorized Screen**

```tsx
// In ProtectedRoute.tsx
if (!session) {
	return <YourCustomUnauthorizedComponent />;
}
```

### 3. **Add More Protected Routes**

```tsx
// Wrap any component with ProtectedRoute
<ProtectedRoute>
	<YourComponent />
</ProtectedRoute>
```

## File Structure

```
app/
├── _layout.tsx                 # Root layout with AuthProvider
├── index.tsx                   # Login page (public)
└── tabs/
    ├── _layout.tsx            # Tab navigation wrapper
    └── (tabs)/
        ├── _layout.tsx        # Protected tab layout
        ├── home.tsx           # Protected
        ├── booking.tsx        # Protected
        ├── account.tsx        # Protected (with sign out)
        └── book.tsx           # Protected

components/
├── ProtectedRoute.tsx         # Route protection component
└── Auth.tsx                   # Login form

contexts/
└── AuthContext.tsx            # Global auth state management
```

## Benefits

### 🚀 **Security**

- All sensitive routes are protected
- Consistent authentication checks
- No way to bypass protection

### 🎯 **User Experience**

- Smooth navigation flow
- Clear feedback for auth states
- Automatic redirects

### 🔧 **Maintainability**

- Single protection component
- Centralized auth logic
- Easy to modify or extend

### 📱 **React Native Optimized**

- Handles app state changes
- Works with deep linking
- Optimized for mobile performance

## Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"

**Solution**: Ensure `AuthProvider` wraps your app in `app/_layout.tsx`

### Issue: Infinite redirect loop

**Solution**: Check that login page (`/`) is not protected

### Issue: Tabs not showing after login

**Solution**: Verify `ProtectedRoute` is properly wrapping the tab layout

### Issue: Sign out not working

**Solution**: Check that `signOut` function is properly imported from auth context

## Next Steps

1. **Add Role-Based Access**: Extend `ProtectedRoute` to check user roles
2. **Add Route-Specific Permissions**: Different protection levels for different tabs
3. **Add Offline Support**: Handle auth state when offline
4. **Add Biometric Auth**: Integrate fingerprint/face ID for quick access
5. **Add Session Timeout**: Automatically sign out after inactivity
