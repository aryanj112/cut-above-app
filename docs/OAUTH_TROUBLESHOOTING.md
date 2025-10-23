# OAuth Button Troubleshooting Guide

## 🔍 Debugging Steps

### 1. **Check Console Logs**

After adding the debug logs, press the Google OAuth button and check your console for:

```
🔘 Button pressed - starting Google OAuth
🚀 Google sign-in button pressed
📡 Calling Supabase OAuth...
```

**If you don't see these logs:**

- The button isn't being pressed
- Check if the button is disabled or covered by another element

**If you see the logs but nothing happens:**

- Check for error messages after "📡 OAuth response:"
- Look for any red error messages

### 2. **Common Issues & Solutions**

#### Issue: "Provider not enabled"

**Error Message**: `Provider not enabled`
**Solution**:

1. Go to Supabase Dashboard → Authentication → Providers
2. Find Google and toggle it ON
3. Add your Google OAuth credentials

#### Issue: "Invalid redirect URI"

**Error Message**: `Invalid redirect URI`
**Solution**:

1. Check Google Cloud Console redirect URIs
2. Ensure Supabase callback URL is correct
3. Update the redirect URL in the code

#### Issue: "No response from OAuth"

**Symptoms**: Button shows loading but nothing happens
**Solution**:

1. Check if Google provider is enabled in Supabase
2. Verify your Supabase URL and keys are correct
3. Check network connectivity

#### Issue: Button doesn't respond at all

**Symptoms**: No console logs when pressed
**Solution**:

1. Check if button is disabled (`disabled={loading}`)
2. Verify TouchableOpacity is not covered by another element
3. Check if there are any JavaScript errors

### 3. **Quick Tests**

#### Test 1: Button Functionality

```typescript
// Replace the onPress temporarily with:
onPress={() => {
  console.log("Button works!");
  Alert.alert("Test", "Button is working!");
}}
```

#### Test 2: Supabase Connection

```typescript
// Add this test function:
const testSupabase = async () => {
	try {
		const { data, error } = await supabase.auth.getSession();
		console.log("Supabase test:", { data, error });
	} catch (err) {
		console.error("Supabase error:", err);
	}
};
```

#### Test 3: OAuth Provider Status

```typescript
// Check if Google provider is available:
const checkProviders = async () => {
	try {
		const { data } = await supabase.auth.getUser();
		console.log("Current user:", data);
	} catch (err) {
		console.error("Provider check error:", err);
	}
};
```

### 4. **Environment Check**

Verify your Supabase configuration:

```typescript
// Add this to your Auth component temporarily:
useEffect(() => {
	console.log("Supabase URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
	console.log(
		"Supabase Key:",
		process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing"
	);
}, []);
```

### 5. **Step-by-Step Debugging**

1. **Press the button** and check console
2. **Look for error messages** in the console
3. **Check Supabase Dashboard** - is Google provider enabled?
4. **Verify environment variables** are loaded
5. **Test with a simple alert** first

### 6. **Expected Console Output**

**Successful OAuth initiation:**

```
🔘 Button pressed - starting Google OAuth
🚀 Google sign-in button pressed
📡 Calling Supabase OAuth...
📡 OAuth response: { error: null }
✅ OAuth initiated successfully
```

**With error:**

```
🔘 Button pressed - starting Google OAuth
🚀 Google sign-in button pressed
📡 Calling Supabase OAuth...
📡 OAuth response: { error: { message: "Provider not enabled" } }
❌ OAuth error: { message: "Provider not enabled" }
```

### 7. **Quick Fixes**

#### Fix 1: Enable Google Provider

1. Go to Supabase Dashboard
2. Authentication → Providers
3. Toggle Google ON
4. Add Client ID and Secret

#### Fix 2: Update Redirect URL

```typescript
// Try this simpler redirect first:
redirectTo: "exp://localhost:8081";
```

#### Fix 3: Test Without Redirect

```typescript
// Remove redirect temporarily:
const { error } = await supabase.auth.signInWithOAuth({
	provider: "google",
});
```

### 8. **Next Steps**

1. **Run the app** and press the Google OAuth button
2. **Check console logs** for the debug messages
3. **Share the console output** so I can help identify the specific issue
4. **Check Supabase Dashboard** for Google provider status

## 🚨 Most Common Issues

1. **Google provider not enabled** in Supabase (90% of cases)
2. **Missing OAuth credentials** in Supabase
3. **Invalid redirect URI** configuration
4. **Environment variables** not loaded properly

Let me know what you see in the console when you press the button! 🔍
