export type AiProviderId = 'openai' | 'anthropic' | 'google' | 'local';

export interface AiProviderConfig {
  id: AiProviderId;
  model: string;
  /** Server-only. Never expose to the client. */
  apiKeyEnvVar: string;
}

export interface AiProvider {
  readonly config: AiProviderConfig;
  chat(request: AiChatRequest): Promise<AiChatResponse>;
}

export interface AiChatRequest {
  conversationId: string;
  message: string;
  userId: string;
  attachments?: Array<{ name: string; mimeType: string; url?: string }>;
}

export interface AiChatResponse {
  message: string;
  suggestedActions?: Array<{
    id: string;
    label: string;
    toolName: string;
    params: Record<string, unknown>;
    requiresConfirmation: boolean;
  }>;
}

export interface AiToolDefinition {
  name: string;
  description: string;
  requiresConfirmation: boolean;
  inputSchema: Record<string, unknown>;
}

export interface AiToolContext {
  userId: string;
  conversationId: string;
  requestId: string;
}

export interface AiToolResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}
