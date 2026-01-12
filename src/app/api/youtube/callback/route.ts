import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        new URL('/?oauth_error=' + error, req.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?oauth_error=no_code', req.url)
      )
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Google OAuth credentials not configured')
      return NextResponse.redirect(
        new URL('/?oauth_error=credentials_missing', req.url)
      )
    }

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    )

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      console.error('No access token received')
      return NextResponse.redirect(
        new URL('/?oauth_error=no_access_token', req.url)
      )
    }

    // Calculate token expiry time
    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600000) // Default to 1 hour if not provided

    // Use a default user ID (in production, this would come from your auth system)
    const userId = 'default-user'

    // Store or update tokens in database
    await db.googleOAuthToken.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry
      }
    })

    // Redirect back to app with success
    return NextResponse.redirect(
      new URL('/?oauth_success=true', req.url)
    )
  } catch (error) {
    console.error('Error handling OAuth callback:', error)
    return NextResponse.redirect(
      new URL('/?oauth_error=callback_failed', req.url)
    )
  }
}
