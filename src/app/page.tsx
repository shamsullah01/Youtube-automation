'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/theme-toggle'
import { toast } from '@/hooks/use-toast'
import {
  Youtube,
  HardDrive,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Clock,
  Lock,
  Globe,
  Users,
  X,
  Plus
} from 'lucide-react'

type VideoFile = {
  id: string
  name: string
  size: number
  mimeType: string
  thumbnailUrl?: string
  modifiedTime: string
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

type UploadHistory = {
  id: string
  videoId: string
  title: string
  status: UploadStatus
  progress: number
  timestamp: string
  driveFileId: string
}

type PrivacyStatus = 'public' | 'unlisted' | 'private'

export default function YouTubeUploader() {
  const [isDriveConnected, setIsDriveConnected] = useState(false)
  const [driveFiles, setDriveFiles] = useState<VideoFile[]>([])
  const [isLoadingDrive, setIsLoadingDrive] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [privacy, setPrivacy] = useState<PrivacyStatus>('private')

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleConnectDrive = async () => {
    setIsLoadingDrive(true)
    try {
      const response = await fetch('/api/youtube/connect-drive', {
        method: 'POST'
      })
      const data = await response.json()

      if (response.ok && data.authUrl) {
        window.location.href = data.authUrl
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: data.message || 'Failed to connect to Google Drive'
        })
      }
    } catch (error) {
      console.error('Error connecting to Drive:', error)
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'An unexpected error occurred'
      })
    } finally {
      setIsLoadingDrive(false)
    }
  }

  const handleLoadDriveFiles = async () => {
    setIsLoadingDrive(true)
    try {
      const response = await fetch('/api/youtube/drive-files')
      const data = await response.json()

      if (response.ok) {
        setDriveFiles(data.files || [])
        setIsDriveConnected(true)
        toast({
          title: 'Success',
          description: `Loaded ${data.files?.length || 0} video files from Drive`
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Load Files',
          description: data.message || 'Could not load files from Google Drive'
        })
      }
    } catch (error) {
      console.error('Error loading Drive files:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load files from Drive'
      })
    } finally {
      setIsLoadingDrive(false)
    }
  }

  const loadUploadHistory = async () => {
    try {
      const response = await fetch('/api/youtube/history')
      const data = await response.json()

      if (response.ok) {
        setUploadHistory(data.uploads || [])
      }
    } catch (error) {
      console.error('Error loading upload history:', error)
    }
  }

  // Load upload history on component mount
  useEffect(() => {
    loadUploadHistory()
  }, [])

  // Poll for upload updates when there are active uploads
  useEffect(() => {
    const hasActiveUploads = uploadHistory.some(
      u => u.status === 'uploading' || u.status === 'processing'
    )

    if (hasActiveUploads) {
      const interval = setInterval(() => {
        loadUploadHistory()
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(interval)
    }
  }, [uploadHistory])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSelectVideo = (video: VideoFile) => {
    setSelectedVideo(video)
    setTitle(video.name.replace(/\.[^/.]+$/, '')) // Remove file extension
  }

  const handleUpload = async () => {
    if (!selectedVideo || !title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a video and enter a title'
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('uploading')

    try {
      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driveFileId: selectedVideo.id,
          title,
          description,
          tags,
          privacyStatus: privacy
        })
      })

      const data = await response.json()

      if (response.ok) {
        setUploadStatus('processing')
        toast({
          title: 'Upload Started',
          description: 'Your video is being uploaded to YouTube'
        })

        // Simulate progress (in real app, this would be WebSocket/polling)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return prev
            }
            return prev + 10
          })
        }, 1000)

        // Add to history
        const newHistoryItem: UploadHistory = {
          id: Date.now().toString(),
          videoId: data.videoId || 'pending',
          title,
          status: 'processing',
          progress: 0,
          timestamp: new Date().toISOString(),
          driveFileId: selectedVideo.id
        }
        setUploadHistory(prev => [newHistoryItem, ...prev])
      } else {
        setUploadStatus('error')
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: data.message || 'Failed to upload video'
        })
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      setUploadStatus('error')
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'An unexpected error occurred during upload'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getPrivacyIcon = (status: PrivacyStatus) => {
    switch (status) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'unlisted':
        return <Users className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: UploadStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'uploading':
        return <Badge variant="default" className="bg-blue-500">Uploading</Badge>
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Idle</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-br from-red-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-red-600 to-red-700 p-2.5 rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 hover:scale-105">
                <Youtube className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">YouTube Uploader</h1>
                <p className="text-sm text-muted-foreground">Upload videos from Google Drive seamlessly</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isDriveConnected ? (
                <div className="flex items-center gap-2.5 text-sm bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-500 animate-pulse" />
                  <span className="text-green-700 dark:text-green-400 font-medium">Drive Connected</span>
                </div>
              ) : (
                <Button
                  onClick={handleConnectDrive}
                  disabled={isLoadingDrive}
                  variant="outline"
                  className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  {isLoadingDrive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <HardDrive className="h-4 w-4" />
                  )}
                  Connect Drive
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto bg-muted/50 backdrop-blur-sm p-1.5 h-auto shadow-sm">
            <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:shadow-md transition-all duration-300 py-2.5">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:shadow-md transition-all duration-300 py-2.5">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-8 animate-in fade-in-50 duration-500">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Drive Files Panel */}
              <Card className="lg:col-span-1 border-2 hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-1.5 rounded-lg">
                        <HardDrive className="h-4 w-4 text-white" />
                      </div>
                      Google Drive
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadDriveFiles}
                      disabled={isLoadingDrive || !isDriveConnected}
                      className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    >
                      {isLoadingDrive ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Refresh'
                      )}
                    </Button>
                  </div>
                  <CardDescription>
                    {isDriveConnected
                      ? `${driveFiles.length} video files found`
                      : 'Connect Drive to browse videos'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isDriveConnected ? (
                    <Alert className="border-dashed">
                      <HardDrive className="h-4 w-4" />
                      <AlertDescription className="ml-2">
                        Connect your Google Drive to browse and select videos
                      </AlertDescription>
                    </Alert>
                  ) : driveFiles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileVideo className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No video files found</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-3">
                        {driveFiles.map((file, index) => (
                          <Card
                            key={file.id}
                            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 animate-in fade-in-50 slide-in-from-left-2 ${
                              selectedVideo?.id === file.id
                                ? 'border-primary border-2 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md'
                                : 'hover:border-primary/40'
                            }`}
                            onClick={() => handleSelectVideo(file)}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg flex-shrink-0 transition-all duration-300 ${
                                  selectedVideo?.id === file.id
                                    ? 'bg-primary/20'
                                    : 'bg-muted'
                                }`}>
                                  <FileVideo className={`h-5 w-5 ${
                                    selectedVideo?.id === file.id ? 'text-primary' : ''
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-2">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1.5">
                                    {formatFileSize(file.size)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(file.modifiedTime)}
                                  </p>
                                </div>
                                {selectedVideo?.id === file.id && (
                                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 animate-in zoom-in-50" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Upload Configuration Panel */}
              <Card className="lg:col-span-2 border-2 hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-1.5 rounded-lg">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                    Upload Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your video metadata and upload options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!selectedVideo ? (
                    <div className="text-center py-16">
                      <FileVideo className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-semibold mb-2">No Video Selected</h3>
                      <p className="text-muted-foreground mb-6">
                        Choose a video from your Google Drive to upload
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Selected Video Preview */}
                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-5 border-2 border-primary/20 shadow-sm animate-in fade-in-50 slide-in-from-top-2">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl shadow-lg shadow-primary/20">
                            <FileVideo className="h-8 w-8 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{selectedVideo.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span>{formatFileSize(selectedVideo.size)}</span>
                              <Separator orientation="vertical" className="h-4" />
                              <span>{formatDate(selectedVideo.modifiedTime)}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVideo(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Upload Form */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            placeholder="Enter video title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                          />
                          <p className="text-xs text-muted-foreground text-right">
                            {title.length}/100 characters
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Enter video description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            maxLength={5000}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground text-right">
                            {description.length}/5000 characters
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="privacy">Privacy Status</Label>
                          <Select value={privacy} onValueChange={(value: PrivacyStatus) => setPrivacy(value)}>
                            <SelectTrigger id="privacy">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="private">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-4 w-4" />
                                  <span>Private</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="unlisted">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>Unlisted</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="public">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span>Public</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {privacy === 'private' && 'Only you can see this video'}
                            {privacy === 'unlisted' && 'Anyone with the link can see this video'}
                            {privacy === 'public' && 'Everyone can search for and see this video'}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tags">Tags</Label>
                          <div className="flex gap-2">
                            <Input
                              id="tags"
                              placeholder="Add a tag"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddTag()
                                }
                              }}
                            />
                            <Button type="button" variant="secondary" onClick={handleAddTag}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="gap-1">
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Upload Progress */}
                        {isUploading && (
                          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {uploadStatus === 'uploading' && (
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                )}
                                {uploadStatus === 'processing' && (
                                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                                )}
                                {uploadStatus === 'completed' && (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                                {uploadStatus === 'error' && (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm font-medium">
                                  {uploadStatus === 'uploading' && 'Uploading...'}
                                  {uploadStatus === 'processing' && 'Processing on YouTube...'}
                                  {uploadStatus === 'completed' && 'Upload Complete!'}
                                  {uploadStatus === 'error' && 'Upload Failed'}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {uploadProgress}%
                              </span>
                            </div>
                            <Progress value={uploadProgress} />
                          </div>
                        )}

                        {/* Upload Button */}
                        <Button
                          onClick={handleUpload}
                          disabled={isUploading || !title.trim()}
                          className="w-full h-14 text-base bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 hover:scale-[1.02] font-semibold"
                          size="lg"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-5 w-5 mr-2" />
                              Upload to YouTube
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                          By uploading, you agree to YouTube's Terms of Service
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-8 animate-in fade-in-50 duration-500">
            <Card className="border-2 hover:border-primary/20 transition-all duration-300 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-1.5 rounded-lg">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  Upload History
                </CardTitle>
                <CardDescription>
                  Track your recent YouTube uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadHistory.length === 0 ? (
                  <div className="text-center py-16">
                    <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">No Upload History</h3>
                    <p className="text-muted-foreground">
                      Your uploaded videos will appear here
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {uploadHistory.map((item, index) => (
                        <Card key={item.id} className="hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:scale-[1.01] animate-in fade-in-50 slide-in-from-bottom-2" style={{ animationDelay: `${index * 50}ms` }}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold line-clamp-1 text-base">{item.title}</h4>
                                <div className="flex items-center gap-3 mt-2.5 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(item.timestamp)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm mt-auto relative z-10">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Built with <span className="text-primary font-medium">Next.js</span> and <span className="text-primary font-medium">YouTube Data API v3</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
