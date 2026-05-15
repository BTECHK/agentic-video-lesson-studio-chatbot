export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  accessMode: 'demo' | 'student';
  contentContext?: string;
}

export interface LLMResponse {
  content: string;
  citations: Array<{
    id: string;
    module: string;
    lesson: string;
    tool?: string;
    verifiedDate?: string;
    snippet: string;
  }>;
}

export interface LLMProviderInterface {
  chat(request: LLMRequest): Promise<LLMResponse>;
}
