import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { db } from '@/lib/db'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

const DEFAULT_USER_ID = 'default-user'

/**
 * Get or refresh the OAuth access token
 */
export async function getOAuthClient(): Promise<OAuth2Client> {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error('Google OAuth credentials not configured')
  }

  // Retrieve token from database
  const tokenRecord = await db.googleOAuthToken.findUnique({
    where: { userId: DEFAULT_USER_ID }
  })

  if (!tokenRecord) {
    throw new Error('No OAuth token found. Please connect your Google account.')
  }

  const oauth2Client = new OAuth2Client(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  )

  // Check if token is expired
  const now = new Date()
  const tokenExpiry = new Date(tokenRecord.tokenExpiry)

  // Add a buffer of 5 minutes to ensure we refresh before actual expiry
  const refreshThreshold = new Date(tokenExpiry.getTime() - 5 * 60 * 1000)

  if (now > refreshThreshold && tokenRecord.refreshToken) {
    // Token is expired or about to expire, refresh it
    oauth2Client.setCredentials({
      refresh_token: tokenRecord.refreshToken
    })

    const { credentials } = await oauth2Client.refreshAccessToken()

    if (credentials.access_token) {
      // Update token in database
      await db.googleOAuthToken.update({
        where: { userId: DEFAULT_USER_ID },
        data: {
          accessToken: credentials.access_token,
          tokenExpiry: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(Date.now() + 3600000)
        }
      })

      oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: tokenRecord.refreshToken
      })
    }
  } else {
    // Token is still valid
    oauth2Client.setCredentials({
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken
    })
  }

  return oauth2Client
}

/**
 * Get authenticated YouTube API client
 */
export async function getYouTubeClient() {
  const oauth2Client = await getOAuthClient()
  return google.youtube({
    version: 'v3',
    auth: oauth2Client
  })
}

/**
 * Get authenticated Drive API client
 */
export async function getDriveClient() {
  const oauth2Client = await getOAuthClient()
  return google.drive({ version: 'v3', auth: oauth2Client })
}
