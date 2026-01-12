import { NextRequest, NextResponse } from 'next/server'
import { getDriveClient } from '@/lib/google-auth'

export async function GET(req: NextRequest) {
  try {
    const drive = await getDriveClient()

    // Query for video files in Google Drive
    const response = await drive.files.list({
      q: "mimeType contains 'video/'",
      fields: 'files(id,name,size,modifiedTime,mimeType,thumbnailLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    })

    const files = response.data.files?.map(file => ({
      id: file.id || '',
      name: file.name || '',
      size: file.size ? parseInt(file.size) : 0,
      mimeType: file.mimeType || '',
      thumbnailUrl: file.thumbnailLink,
      modifiedTime: file.modifiedTime || new Date().toISOString()
    })) || []

    return NextResponse.json({ files })
  } catch (error: any) {
    console.error('Error listing Drive files:', error)

    // Check if it's an authentication error
    if (error.code === 401 || error.code === 403) {
      return NextResponse.json(
        {
          message: 'Authentication expired. Please reconnect your Google account.',
          error: 'AUTH_EXPIRED'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to list Drive files' },
      { status: 500 }
    )
  }
}
