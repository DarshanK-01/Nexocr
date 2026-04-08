import { NexScanChat } from '@/components/nexscan-chat';

export default function ChatPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">NexScan AI Agent</h1>
          <p className="text-muted-foreground">
            Chat with our intelligent document assistant. Upload documents, ask questions, 
            and get instant insights.
          </p>
        </div>
        <NexScanChat />
      </div>
    </div>
  );
}
