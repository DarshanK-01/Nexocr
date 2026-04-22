'use client';

import { useRef, useState, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, FileUp, Loader2, Video, ScanLine, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const ACCEPTED_TYPES = [
  'image/jpeg','image/png','image/webp','image/heic','image/heif','image/tiff','application/pdf',
].join(',');

const GEMINI_SUPPORTED = new Set([
  'image/jpeg','image/png','image/webp','image/heic','image/heif','image/tiff','application/pdf',
]);

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
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const vids = all.filter(d => d.kind === 'videoinput');
      setDevices(vids);
      if (vids.length > 0 && !selectedDeviceId) setSelectedDeviceId(vids[0].deviceId);
    } catch {}
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!GEMINI_SUPPORTED.has(file.type)) {
      onError?.(`"${file.name}" is not supported. Upload an image or PDF.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFileName(file.name);
    setFileMime(file.type);
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      setImageDataUrl(url);
      onImageReady(url);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
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
        setImageDataUrl(null); setFileMime(null); setFileName(null);
        onImageReady('');
      }
    } catch { alert('Could not access camera. Check permissions.'); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const takePicture = () => {
    if (!videoRef.current) return;
    const c = document.createElement('canvas');
    c.width = videoRef.current.videoWidth;
    c.height = videoRef.current.videoHeight;
    c.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const url = c.toDataURL('image/jpeg');
    setImageDataUrl(url); setFileMime('image/jpeg'); setFileName(null);
    onImageReady(url); stopCamera();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isCameraOn) return;
      if (e.key === 'Enter') { e.preventDefault(); takePicture(); }
      if (e.key === 'Escape') { e.preventDefault(); stopCamera(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn]);

  const isImage = fileMime?.startsWith('image/') ?? false;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Document Input</CardTitle>
        <CardDescription>Upload an image (JPEG, PNG, WebP, TIFF) or a PDF — or use your camera.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 relative flex-1 bg-muted/30 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}
        <video ref={videoRef} className={`h-full w-full object-cover ${isCameraOn ? '' : 'hidden'}`} muted playsInline />
        {!isCameraOn && (
          imageDataUrl ? (
            isImage ? (
              <Image src={imageDataUrl} alt="Document preview" fill className="object-contain p-4" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6">
                <FileText className="h-16 w-16 text-red-400" />
                <p className="font-semibold text-sm text-center break-all">{fileName}</p>
                <span className="text-xs text-muted-foreground">PDF</span>
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
      <CardFooter className="p-4 flex flex-col gap-4 shrink-0">
        {!isCameraOn && devices.length > 1 && (
          <div className="w-full space-y-2">
            <Label htmlFor="camera-select">Select Camera</Label>
            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
              <SelectTrigger id="camera-select" onClick={getDevices} onFocus={getDevices}>
                <Video className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select a camera" />
              </SelectTrigger>
              <SelectContent>
                {devices.map(d => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${devices.indexOf(d) + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Input type="file" accept={ACCEPTED_TYPES} ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isLoading} />
        <div className="grid grid-cols-2 gap-2 w-full">
          {isCameraOn ? (
            <>
              <Button onClick={takePicture} disabled={isLoading} className="bg-accent hover:bg-accent/90">
                <Camera className="mr-2 h-4 w-4" /> Capture (Enter)
              </Button>
              <Button onClick={stopCamera} variant="outline" disabled={isLoading}>Cancel (Esc)</Button>
            </>
          ) : (
            <>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                <FileUp className="mr-2 h-4 w-4" /> Upload File
              </Button>
              <Button onClick={startCamera} variant="outline" disabled={isLoading}>
                <Camera className="mr-2 h-4 w-4" /> Use Camera
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
