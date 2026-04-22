'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ScanSearch, ShieldCheck, ShieldX } from 'lucide-react';

interface SignatureResult {
  id: number;
  conf: number;
  x: number;
  y: number;
  w: number;
  h: number;
  cropBase64: string;
}

interface SignaturePanelProps {
  imageDataUrl: string | null;
}

export function SignaturePanel({ imageDataUrl }: SignaturePanelProps) {
  const [loading, setLoading] = useState(false);
  const [signatures, setSignatures] = useState<SignatureResult[]>([]);
  const [annotated, setAnnotated] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check backend health on mount
  useEffect(() => {
    fetch('/api/signatures')
      .then(r => r.json())
      .then(d => setBackendOnline(d.status === 'ok' && d.modelLoaded))
      .catch(() => setBackendOnline(false));
  }, []);

  // Run detection whenever a new image arrives
  useEffect(() => {
    if (!imageDataUrl || !backendOnline) return;

    setLoading(true);
    setSignatures([]);
    setAnnotated(null);
    setError(null);

    fetch('/api/signatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: imageDataUrl }),
    })
      .then(r => r.json())
      .then(data => {
        setSignatures(data.signatures ?? []);
        setAnnotated(data.annotatedBase64 || null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [imageDataUrl, backendOnline]);

  // ── Offline state ──────────────────────────────────────────────────────────
  if (backendOnline === false) {
    return (
      <Card className="flex-1 flex flex-col justify-center items-center min-h-[300px] border-dashed">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ShieldX className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Signature Detection Offline</CardTitle>
          <CardDescription className="text-xs">
            Start the Python backend to enable signature detection:
            <code className="block mt-2 bg-muted rounded px-2 py-1 text-left">
              uvicorn backend.api:app --port 8000
            </code>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // ── No image yet ───────────────────────────────────────────────────────────
  if (!imageDataUrl) {
    return (
      <Card className="flex-1 flex flex-col justify-center items-center min-h-[300px] border-dashed">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ScanSearch className="h-10 w-10 text-muted-foreground/50 animate-pulse" />
          </div>
          <CardTitle className="text-lg">Signature Detection</CardTitle>
          <CardDescription>Upload a document to detect signatures automatically.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Signature Detection
            </CardTitle>
            <CardDescription>YOLOv8 — auto-detected from document</CardDescription>
          </div>
          {!loading && (
            <Badge variant={signatures.length > 0 ? 'default' : 'outline'}>
              {signatures.length} found
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Detecting signatures…
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Annotated image */}
        {annotated && (
          <div className="relative w-full rounded-md overflow-hidden border aspect-[4/3]">
            <Image src={annotated} alt="Annotated document" fill className="object-contain" />
          </div>
        )}

        {/* Individual crops */}
        {signatures.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Extracted Signatures
            </p>
            <div className="grid grid-cols-2 gap-2">
              {signatures.map(sig => (
                <div key={sig.id} className="border rounded-md p-2 space-y-1 bg-muted/30">
                  <div className="relative w-full aspect-[3/1] bg-white rounded">
                    <Image
                      src={sig.cropBase64}
                      alt={`Signature ${sig.id}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">sig_{sig.id}</span>
                    <Badge variant="outline" className="text-xs">
                      {(sig.conf * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && signatures.length === 0 && !error && imageDataUrl && (
          <p className="text-sm text-muted-foreground">No signatures detected in this document.</p>
        )}
      </CardContent>
    </Card>
  );
}
