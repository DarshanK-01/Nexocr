'use client';

import { useRef, useState, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, FileUp, Loader2, Video, ScanLine, FileText, FileSpreadsheet, File } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/tiff',
  'application/pdf',
].join(',');

// Types Gemini's API actually supports as inline data
const GEMINI_SUPPORTED = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'image/heic', 'image/heif', 'image/tiff',
  'application/pdf',
]);

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return null; // use image preview
  if (mimeType === 'application/pdf') return <FileText className="h-16 w-16 text-red-400" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return <FileSpreadsheet className="h-16 w-16 text-green-500" />;
  if (mimeType.includes('word')) return <FileText className="h-16 w-16 text-blue-500" />;
  return <File className="h-16 w-16 text-muted-foreground" />;
}

type ImageUploaderProps = {
  onImageReady: (dataUrl: string) => void;
  isLoading: boolean;
  onError?: (message: string) => void;
};

export function ImageUploader({ onImageReady, isLoading, onError }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const getDevices = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error enumerating devices:', err);
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!GEMINI_SUPPORTED.has(file.type)) {
      onError?.(`"${file.type || file.name}" is not supported. Please upload an image (JPEG, PNG, WebP, TIFF) or a PDF.`);
      // reset input so the same file can be re-selected after correction
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setFileMime(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageDataUrl(dataUrl);
      onImageReady(dataUrl);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        await getDevices();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsCameraOn(true);
          setImageDataUrl(null);
          setFileMime(null);
          setFileName(null);
          onImageReady('');
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access the selected camera. Please check permissions and try again.');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const takePicture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImageDataUrl(dataUrl);
      setFileMime('image/jpeg');
      setFileName(null);
      onImageReady(dataUrl);
      stopCamera();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isCameraOn) return;
      if (event.key === 'Enter') { event.preventDefault(); takePicture(); }
      else if (event.key === 'Escape') { event.preventDefault(); stopCamera(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn]);

  const isImage = fileMime?.startsWith('image/') ?? false;
  const fileIcon = fileMime ? getFileIcon(fileMime) : null;

  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Document Input</CardTitle>
        <CardDescription>
          Upload an image (JPEG, PNG, WebP, TIFF) or a PDF — or use your camera.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 relative aspect-[4/5.5] bg-muted/30 flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <span className="sr-only">Extracting data...</span>
          </div>
        )}
        <video ref={videoRef} className={`h-full w-full object-cover ${isCameraOn ? '' : 'hidden'}`} muted playsInline />
        {!isCameraOn && (
          imageDataUrl ? (
            isImage ? (
              <Image
                src={imageDataUrl}
                alt="Document preview"
                fill
                className="object-contain p-4"
                data-ai-hint="document form"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center p-4">
                {fileIcon}
                <p className="font-semibold text-sm text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">{fileMime}</p>
              </div>
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center text-muted-foreground p-4">
              <ScanLine className="h-16 w-16 mb-4 animate-pulse text-primary/50" />
              <p className="font-semibold">Ready to Scan</p>
              <p className="text-sm">Upload a document or capture a form to begin.</p>
            </div>
          )
        )}
      </CardContent>
      <CardFooter className="p-4 flex flex-col gap-4">
        {!isCameraOn && devices.length > 1 && (
          <div className="w-full space-y-2">
            <Label htmlFor="camera-select">Select Camera</Label>
            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
              <SelectTrigger id="camera-select" onClick={getDevices} onFocus={getDevices}>
                <Video className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select a camera" />
              </SelectTrigger>
              <SelectContent>
                {devices.map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${devices.indexOf(device) + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 w-full">
          <Input
            type="file"
            accept={ACCEPTED_TYPES}
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
          {isCameraOn ? (
            <>
              <Button onClick={takePicture} disabled={isLoading} className="bg-accent hover:bg-accent/90">
                <Camera className="mr-2 h-4 w-4" />
                Capture (Enter)
              </Button>
              <Button onClick={stopCamera} variant="outline" disabled={isLoading}>
                Cancel (Esc)
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleUploadClick} disabled={isLoading}>
                <FileUp className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <Button onClick={startCamera} variant="outline" disabled={isLoading}>
                <Camera className="mr-2 h-4 w-4" />
                Use Camera
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
