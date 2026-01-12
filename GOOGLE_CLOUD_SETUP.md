# Google Cloud Configuration Setup

To use the YouTube uploader with Google Drive integration, you need to set up a Google Cloud project and configure OAuth credentials.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your Project ID

## Step 2: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Enable the following APIs:
   - **YouTube Data API v3**
   - **Google Drive API**

## Step 3: Configure OAuth 2.0 Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required fields:
   - App name: "YouTube Uploader"
   - User support email: your email
   - Developer contact information: your email
4. Add the following scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/drive.readonly`
5. Save and publish the app (you can set it to "Testing" mode)

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure the application:
   - Name: "YouTube Uploader Web"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - Your production domain (if applicable)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/youtube/callback`
     - Your production callback URL (if applicable)
5. Click **Create**
6. Download the JSON file - it will contain:
   - `client_id`
   - `client_secret`
   - `redirect_uris`

## Step 5: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/youtube/callback

# API Scopes
YOUTUBE_SCOPES=https://www.googleapis.com/auth/youtube.upload
DRIVE_SCOPES=https://www.googleapis.com/auth/drive.readonly

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Install Required Dependencies

```bash
bun add google-auth-library googleapis
```

## Important Notes

- **Security**: Never commit your `.env.local` file or credentials to version control
- **Testing Mode**: You can use "Testing" mode for development (only test users can access)
- **Production**: When ready for production, go through Google's verification process
- **Rate Limits**: YouTube API has quotas - monitor your usage in Google Cloud Console
- **Privacy**: Always test with "private" videos first to avoid accidental public uploads

## OAuth Flow

The application uses OAuth 2.0 with PKCE:

1. User clicks "Connect Drive"
2. App redirects to Google OAuth consent screen
3. User grants permissions
4. Google redirects back to `/api/youtube/callback` with authorization code
5. App exchanges code for access and refresh tokens
6. Tokens are stored in session/database for future API calls
7. Tokens are refreshed automatically when expired

## Troubleshooting

**"Invalid redirect_uri" Error:**
- Ensure the redirect URI in Google Cloud Console matches exactly (including trailing slashes)
- Check that `GOOGLE_REDIRECT_URI` in `.env.local` matches

**"Access blocked" Error:**
- Add your email as a test user in OAuth consent screen (for Testing mode)
- Ensure all required scopes are added to the OAuth consent screen

**"401 Unauthorized" API Errors:**
- Tokens may have expired - check token refresh logic
- Verify correct scopes are configured

**"Quota Exceeded" Errors:**
- Check API quotas in Google Cloud Console
- Consider requesting quota increase if needed

## YouTube API Reference

- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
