import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { message: 'Google OAuth credentials not configured' },
        { status: 500 }
      )
    }

    // Generate a random state parameter for CSRF protection
    const state = Buffer.from(Date.now().toString()).toString('base64')

    // Define scopes for YouTube upload and Drive read-only access
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/drive.readonly'
    ]

    // Construct the OAuth authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', scopes.join(' '))
    authUrl.searchParams.append('access_type', 'offline')
    authUrl.searchParams.append('prompt', 'consent')
    authUrl.searchParams.append('state', state)

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state
    })
  } catch (error) {
    console.error('Error initiating OAuth flow:', error)
    return NextResponse.json(
      { message: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}
