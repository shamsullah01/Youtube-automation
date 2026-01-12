# YouTube Uploader - Google Drive Integration

A full-stack YouTube video uploader that lets you browse and upload videos directly from your Google Drive to your YouTube channel.

##  Features

- **Google Drive Integration**: Browse and select videos from your Google Drive
- **One-Click Upload**: Upload videos to YouTube with custom metadata
- **Rich Metadata**: Add titles, descriptions, and tags to your videos
- **Privacy Controls**: Choose public, unlisted, or private visibility
- **Upload History**: Track all your uploads with real-time status
- **Progress Tracking**: Monitor upload progress with visual indicators
- **Responsive Design**: Beautiful UI that works on all devices
- **OAuth 2.0 Security**: Secure Google authentication

##  Prerequisites

Before using the YouTube Uploader, you need to set up a Google Cloud project:

### 1. Google Cloud Project Setup

Follow the detailed guide in [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md):

- Create a Google Cloud project
- Enable YouTube Data API v3
- Enable Google Drive API
- Configure OAuth 2.0 consent screen
- Create OAuth client credentials
- Download credentials JSON

### 2. Environment Configuration

Create a `.env.local` file in your project root and add:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/youtube/callback

# Database (already configured)
DATABASE_URL="file:../db/custom.db"
```

**Important**: Never commit your `.env.local` file to version control!

## 🛠️ Installation

1. **Install dependencies** (already done):
```bash
bun install
```

2. **Database setup** (already done):
```bash
bun run db:push
```

3. **Start development server** (already running):
```bash
bun run dev
```

The application will be available at `http://localhost:3000`

##  How to Use

### Step 1: Connect Your Google Account

1. Open the application in your browser
2. Click the **"Connect Drive"** button in the top right
3. You'll be redirected to Google's OAuth consent screen
4. Grant permissions for:
   - YouTube upload access
   - Google Drive read access
5. You'll be redirected back to the application

### Step 2: Browse Your Google Drive

1. Once connected, click **"Refresh"** to load your Drive files
2. The app will display all video files from your Drive
3. Files are sorted by most recently modified

### Step 3: Select and Configure Video

1. Click on a video file from the list to select it
2. The upload form will appear with:
   - **Title**: Auto-filled from filename (you can edit it)
   - **Description**: Add a detailed description of your video
   - **Tags**: Add relevant tags for discoverability
   - **Privacy Status**: Choose visibility (private recommended for testing)

### Step 4: Upload to YouTube

1. Review your video metadata
2. Click **"Upload to YouTube"**
3. Monitor the progress in the upload progress section
4. Once complete, check the **History** tab for your upload status

### Step 5: Check Upload History

1. Click the **"History"** tab
2. View all your recent uploads
3. Check status (uploading, processing, completed, error)
4. Click on completed uploads to view on YouTube

##  Project Structure

```
/home/z/my-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── youtube/
│   │   │       ├── connect-drive/route.ts    # OAuth initiation
│   │   │       ├── callback/route.ts         # OAuth callback handler
│   │   │       ├── drive-files/route.ts      # List Drive videos
│   │   │       ├── upload/route.ts           # Upload to YouTube
│   │   │       └── history/route.ts          # Fetch upload history
│   │   ├── page.tsx                          # Main UI component
│   │   └── globals.css                       # Global styles
│   ├── components/ui/                       # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts                             # Prisma client
│   │   ├── google-auth.ts                    # Google auth utilities
│   │   └── utils.ts                          # Utility functions
│   └── hooks/
│       └── use-toast.ts                     # Toast notifications
├── prisma/
│   └── schema.prisma                         # Database schema
└── GOOGLE_CLOUD_SETUP.md                     # Setup guide
```

##  Database Schema

The application uses SQLite with Prisma ORM:

### GoogleOAuthToken
Stores OAuth tokens for API access:
- `userId`: User identifier
- `accessToken`: Current access token
- `refreshToken`: Refresh token for renewal
- `tokenExpiry`: Token expiration time

### YouTubeUpload
Tracks upload history:
- `driveFileId`: Google Drive file ID
- `youtubeVideoId`: Uploaded video ID
- `title`: Video title
- `description`: Video description
- `tags`: Video tags (JSON array)
- `privacyStatus`: Visibility setting
- `status`: Upload status
- `progress`: Upload progress (0-100)
- `errorMessage`: Error message if failed

##  Security Features

- **OAuth 2.0 with PKCE**: Secure authentication flow
- **CSRF Protection**: State parameters prevent CSRF attacks
- **Token Refresh**: Automatic token renewal
- **Environment Variables**: Sensitive data stored in `.env.local`
- **Access Control**: Read-only Drive access, scoped YouTube upload

##  UI Features

- **Modern Design**: Built with shadcn/ui components
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Supports theme switching
- **Real-time Updates**: Polling for upload progress
- **Toast Notifications**: User feedback for all actions
- **Loading States**: Visual feedback during async operations
- **Error Handling**: Clear error messages and recovery options

##  API Endpoints

### POST /api/youtube/connect-drive
Initiates OAuth flow to connect Google account

### GET /api/youtube/callback
Handles OAuth callback from Google

### GET /api/youtube/drive-files
Returns list of video files from Google Drive

### POST /api/youtube/upload
Uploads selected video to YouTube

### GET /api/youtube/history
Returns upload history

##  Troubleshooting

### OAuth Fails

**Problem**: "OAuth error: access_denied"
- **Solution**: Add your email as a test user in Google Cloud Console

**Problem**: "Invalid redirect_uri"
- **Solution**: Ensure redirect URI in Google Cloud Console matches exactly

### Upload Fails

**Problem**: "Authentication expired"
- **Solution**: Reconnect your Google account

**Problem**: "Quota exceeded"
- **Solution**: Check API quotas in Google Cloud Console

### No Videos in Drive

**Problem**: No videos showing in Drive browser
- **Solution**: Ensure you have video files in your Google Drive root folder

##  Production Deployment

When deploying to production:

1. **Update OAuth credentials**:
   - Add your production domain to authorized JavaScript origins
   - Add your production callback URL to authorized redirect URIs

2. **Configure environment variables**:
   - Update `GOOGLE_REDIRECT_URI` to your production URL
   - Update `NEXT_PUBLIC_APP_URL` if needed

3. **Go through Google verification**:
   - Remove "Testing" mode restrictions
   - Complete Google's app verification process

4. **Use a production database**:
   - Consider using PostgreSQL instead of SQLite
   - Configure proper database backups

##  Notes

- **YouTube API Quotas**: Monitor your API usage in Google Cloud Console
- **Video Size Limits**: YouTube has a 256GB limit per video
- **Upload Speed**: Depends on your internet connection and video size
- **Private Testing**: Always test with "private" videos first

## Support

For issues and questions:
1. Check [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)
2. Review the Google Cloud Console logs
3. Check the browser console for frontend errors
4. Check the server logs for backend errors

## License

This project is for personal use with your own YouTube channel.

## Useful Links

- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
