import { ChatMessage, Citation } from '@/types/chat';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface StreamCallback {
  onToken: (token: string, fullText: string) => void;
  onCitations: (citations: Citation[]) => void;
  onComplete: (finalMessage: ChatMessage) => void;
  onError: (err: Error) => void;
}

export async function sendChatMessageStream(
  userQuery: string,
  callbacks: StreamCallback,
  sessionId?: string
): Promise<void> {
  const startTime = Date.now();
  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userQuery, sessionId }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: 'Failed to communicate with chat engine' }));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const answerText: string = data.answer || 'No response generated.';
    const citations: Citation[] = data.citations || [];

    // Send citations immediately so UI chips/source list can be populated
    callbacks.onCitations(citations);

    // Stream the tokens smoothly
    const words = answerText.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      currentText += word;
      callbacks.onToken(word, currentText);
      const delay = word.includes('.') || word.includes('\n') ? 35 : 12;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    callbacks.onComplete({
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: answerText,
      timestamp: new Date().toISOString(),
      citations,
      modelUsed: data.modelUsed || 'KnowledgeHub RAG Engine (Atlas Vector / MongoDB)',
      latencyMs: data.latencyMs || Date.now() - startTime,
    });
  } catch (err: any) {
    console.error('[ChatAPI] Error during chat query:', err);
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}
