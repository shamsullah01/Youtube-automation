import { NextRequest, NextResponse } from 'next/server'
import { getDriveClient, getYouTubeClient } from '@/lib/google-auth'
import { db } from '@/lib/db'
import { Readable } from 'stream'

const DEFAULT_USER_ID = 'default-user'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { driveFileId, title, description, tags, privacyStatus } = body

    // Validate required fields
    if (!driveFileId || !title) {
      return NextResponse.json(
        { message: 'Drive file ID and title are required' },
        { status: 400 }
      )
    }

    // Initialize upload record in database
    const uploadRecord = await db.youTubeUpload.create({
      data: {
        userId: DEFAULT_USER_ID,
        driveFileId,
        title,
        description: description || null,
        tags: tags ? JSON.stringify(tags) : '[]',
        privacyStatus: privacyStatus || 'private',
        status: 'uploading',
        progress: 0
      }
    })

    // Start the upload process asynchronously
    uploadVideoToYouTube(uploadRecord.id).catch(error => {
      console.error('Error in async upload:', error)
    })

    return NextResponse.json({
      success: true,
      uploadId: uploadRecord.id,
      videoId: null
    })
  } catch (error: any) {
    console.error('Error initiating video upload:', error)
    return NextResponse.json(
      { message: 'Failed to initiate video upload' },
      { status: 500 }
    )
  }
}

async function uploadVideoToYouTube(uploadId: string) {
  let youtubeClient: any = null
  try {
    const upload = await db.youTubeUpload.findUnique({
      where: { id: uploadId }
    })

    if (!upload) {
      throw new Error('Upload record not found')
    }

    // Update status to processing
    await db.youTubeUpload.update({
      where: { id: uploadId },
      data: { status: 'processing', progress: 10 }
    })

    // Get API clients
    youtubeClient = await getYouTubeClient()
    const drive = await getDriveClient()

    // Download video file from Drive
    await db.youTubeUpload.update({
      where: { id: uploadId },
      data: { progress: 20 }
    })

    const driveResponse = await drive.files.get({
      fileId: upload.driveFileId,
      alt: 'media'
    }, { responseType: 'stream' })

    // Convert stream to buffer
    const chunks: Buffer[] = []
    const stream = driveResponse.data as Readable

    await new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      stream.on('end', resolve)
      stream.on('error', reject)
    })

    const videoBuffer = Buffer.concat(chunks)

    // Update progress for download
    await db.youTubeUpload.update({
      where: { id: uploadId },
      data: { progress: 40 }
    })

    // Parse tags
    const tagsArray = JSON.parse(upload.tags || '[]')

    // Prepare video metadata
    const videoMetadata = {
      snippet: {
        title: upload.title,
        description: upload.description || '',
        tags: tagsArray,
        categoryId: '22' // People & Blogs category
      },
      status: {
        privacyStatus: upload.privacyStatus,
        selfDeclaredMadeForKids: false
      }
    }

    // Update progress for upload start
    await db.youTubeUpload.update({
      where: { id: uploadId },
      data: { progress: 50 }
    })

    // Upload to YouTube
    const youtubeResponse = await youtubeClient.videos.insert({
      part: 'snippet,status',
      requestBody: videoMetadata,
      media: {
        mimeType: 'video/*',
        body: videoBuffer
      }
    })

    // Get the uploaded video ID
    const videoId = youtubeResponse.data.id

    // Update upload record as completed
    await db.youTubeUpload.update({
      where: { id: uploadId },
      data: {
        youtubeVideoId: videoId,
        status: 'completed',
        progress: 100
      }
    })

    console.log(`Video uploaded successfully. YouTube ID: ${videoId}`)
  } catch (error: any) {
    console.error('Error uploading video to YouTube:', error)

    // Update upload record with error
    await db.youTubeUpload.update({
      where: { id: uploadId },
      data: {
        status: 'error',
        errorMessage: error.message || 'Unknown error occurred'
      }
    })
  }
}
