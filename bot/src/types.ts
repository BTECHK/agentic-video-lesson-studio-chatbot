export interface ToolCapability {
  supported: boolean;
  summary?: string;
  limitations?: string[];
}

export interface ToolData {
  id: string;
  name: string;
  vendor: string;
  priority?: string | number;
  description: string;
  url: string;
  capabilities: Record<string, ToolCapability>;
}

export interface Citation {
  module: string;
  lesson: string;
  tool?: string;
  snippet: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface BrainReply {
  text: string;
  citations: Citation[];
}

export interface LLMProvider {
  /** name for logs/health */
  readonly name: string;
  complete(system: string, history: ChatTurn[], maxOutputTokens: number): Promise<string>;
}
