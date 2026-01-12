# Quick Start Guide - YouTube Uploader

## 🎯 You're Almost Ready!

Your YouTube Uploader is now fully developed and running at `http://localhost:3000`.

## ⚡ Quick Setup (3 Steps)

### Step 1: Get Google OAuth Credentials (10-15 minutes)

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
   - Create a new project or select existing one

2. **Enable APIs**
   - Go to APIs & Services → Library
   - Enable: "YouTube Data API v3"
   - Enable: "Google Drive API"

3. **Configure OAuth Consent Screen**
   - Go to APIs & Services → OAuth consent screen
   - Choose "External" (for testing, you can keep it in "Testing" mode)
   - Fill in: App name, User support email, Developer contact email
   - Add scopes:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/drive.readonly`
   - Add your email as a test user (in "Testing" mode)

4. **Create OAuth Credentials**
   - Go to APIs & Services → Credentials
   - Click "+ Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "YouTube Uploader"
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/youtube/callback`
   - Click "Create"
   - Copy the **Client ID** and **Client Secret**

### Step 2: Configure Environment Variables (2 minutes)

Create a `.env.local` file in your project root:

```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
```

### Step 3: Start Uploading! (5 minutes)

1. **Open** `http://localhost:3000` in your browser
2. **Click** "Connect Drive" button
3. **Grant** Google permissions (YouTube upload + Drive read)
4. **Click** "Refresh" to load your Drive videos
5. **Select** a video file
6. **Fill in** title, description, tags, and privacy (start with "private"!)
7. **Click** "Upload to YouTube"
8. **Monitor** the progress
9. **Check** the "History" tab for upload status

## 🎉 That's It!

Your YouTube Uploader is now ready to use. You can upload videos from your Google Drive to your YouTube channel with full control over metadata and privacy settings.

## 📚 Additional Resources

- **Full Guide**: See `YOUTUBE_UPLOADER_README.md` for detailed documentation
- **Setup Instructions**: See `GOOGLE_CLOUD_SETUP.md` for detailed Google Cloud setup
- **Environment Template**: See `.env.example` for configuration reference

## ⚠️ Important Reminders

- ✅ **Always start with "private" videos** for testing
- ✅ **Test with small videos first** (under 100MB is ideal)
- ✅ **Keep your credentials secret** - never commit `.env.local`
- ✅ **Monitor API quotas** in Google Cloud Console
- ✅ **Check the History tab** to track all uploads

## 🐛 Having Issues?

1. **OAuth fails?** Check your redirect URI matches exactly
2. **Can't see files?** Make sure you have videos in Drive root
3. **Upload fails?** Try reconnecting your Google account
4. **Need more help?** Check the detailed README files

## 🚀 Ready to Go?

Your application is live and ready to use at **http://localhost:3000**!

Happy uploading! 🎬
