export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
    result?: string;
  }>;
}

export interface ChatRequest {
  content: string;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
