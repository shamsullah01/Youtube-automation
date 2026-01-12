import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_USER_ID = 'default-user'

export async function GET(req: NextRequest) {
  try {
    // Fetch upload history from database
    const uploads = await db.youTubeUpload.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      uploads: uploads.map(upload => ({
        id: upload.id,
        youtubeVideoId: upload.youtubeVideoId,
        title: upload.title,
        status: upload.status,
        progress: upload.progress,
        timestamp: upload.createdAt,
        errorMessage: upload.errorMessage,
        privacyStatus: upload.privacyStatus
      }))
    })
  } catch (error) {
    console.error('Error fetching upload history:', error)
    return NextResponse.json(
      { message: 'Failed to fetch upload history' },
      { status: 500 }
    )
  }
}
