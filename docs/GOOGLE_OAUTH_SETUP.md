# Google OAuth Setup Guide

## ✅ OAuth Implementation Complete

The Google OAuth login is now properly implemented in your Auth component with:

- ✅ Proper error handling
- ✅ Loading states
- ✅ Redirect configuration
- ✅ User feedback

## 🔧 Supabase Configuration Required

### 1. **Enable Google Provider in Supabase**

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and toggle it **ON**
4. You'll need to configure the OAuth settings

### 2. **Google Cloud Console Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**

### 3. **Configure OAuth Client**

**Application Type**: Web application

**Authorized JavaScript origins**:

```
http://localhost:3000
https://your-project-ref.supabase.co
```

**Authorized redirect URIs**:

```
https://your-project-ref.supabase.co/auth/v1/callback
```

### 4. **Supabase Configuration**

In your Supabase Dashboard → Authentication → Providers → Google:

**Client ID**: Copy from Google Cloud Console
**Client Secret**: Copy from Google Cloud Console

## 📱 React Native Specific Setup

### 1. **Deep Linking Configuration**

For React Native, you need to configure deep linking:

**app.json**:

```json
{
	"expo": {
		"scheme": "your-app-scheme",
		"web": {
			"bundler": "metro"
		}
	}
}
```

### 2. **Redirect URL Configuration**

The current redirect URL in the code:

```typescript
redirectTo: "exp://10.174.54.84:8081/--/tabs/home";
```

**For Production**, update this to:

```typescript
redirectTo: "your-app-scheme://tabs/home";
```

### 3. **Environment Variables**

Add to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🚀 Testing the Implementation

### 1. **Development Testing**

```bash
# Start your app
npx expo start

# Click "Continue with Google" button
# Should open browser/WebView with Google OAuth
```

### 2. **Expected Flow**

```
User clicks "Continue with Google"
→ Loading state shows "Signing in..."
→ Browser opens with Google OAuth
→ User authenticates with Google
→ Redirects back to app
→ User is logged in
```

## 🛠️ Troubleshooting

### Issue: "Invalid redirect URI"

**Solution**:

- Check Google Cloud Console redirect URIs
- Ensure Supabase callback URL is correct
- Verify the redirect URL in the code matches your app scheme

### Issue: OAuth opens but doesn't redirect back

**Solution**:

- Check deep linking configuration
- Verify app scheme in app.json
- Test with `npx expo start --tunnel` for external testing

### Issue: "Provider not enabled"

**Solution**:

- Enable Google provider in Supabase Dashboard
- Verify Client ID and Secret are correct
- Check that Google+ API is enabled

### Issue: App crashes on OAuth

**Solution**:

- Check error logs in console
- Verify all imports are correct
- Ensure Supabase client is properly configured

## 📋 Implementation Checklist

### ✅ **Code Implementation**

- [x] Google OAuth function with error handling
- [x] Loading states and user feedback
- [x] Proper redirect configuration
- [x] Button disabled during loading

### ⏳ **Supabase Setup** (You need to do this)

- [ ] Enable Google provider in Supabase Dashboard
- [ ] Configure Client ID and Secret
- [ ] Set up redirect URIs

### ⏳ **Google Cloud Setup** (You need to do this)

- [ ] Create OAuth 2.0 Client ID
- [ ] Configure authorized origins and redirects
- [ ] Enable Google+ API

### ⏳ **App Configuration** (You need to do this)

- [ ] Update redirect URL for production
- [ ] Configure deep linking scheme
- [ ] Test OAuth flow

## 🔄 Next Steps

1. **Complete Supabase Configuration**: Set up Google provider in your Supabase dashboard
2. **Google Cloud Setup**: Create OAuth credentials in Google Cloud Console
3. **Test OAuth Flow**: Verify the complete authentication flow works
4. **Production Setup**: Update redirect URLs for production deployment

## 📚 Additional Resources

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Expo Deep Linking](https://docs.expo.dev/guides/linking/)

The OAuth implementation is now complete and ready for configuration! 🎉
