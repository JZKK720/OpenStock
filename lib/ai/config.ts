/**
 * AI Provider Configuration
 * Supports: Gemini, Ollama, LM Studio (OpenAI API), Siray
 */

export type AIProvider = 'gemini' | 'ollama' | 'lmstudio' | 'siray';

export interface AIProviderConfig {
    provider: AIProvider;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}

export interface AIResponse {
    candidates?: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
}

// Default configurations
export const AI_PROVIDER_DEFAULTS: Record<AIProvider, Partial<AIProviderConfig>> = {
    gemini: {
        model: 'gemini-2.5-flash-lite',
    },
    ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2',
    },
    lmstudio: {
        baseUrl: process.env.LMSTUDIO_BASE_URL || 'http://host.docker.internal:14321/v1',
        model: process.env.LMSTUDIO_MODEL || 'local-model',
    },
    siray: {
        baseUrl: 'https://api.siray.ai/v1',
        model: 'siray-1.0-ultra',
    },
};

/**
 * Get AI provider from environment or use default
 */
export function getAIProvider(): AIProvider {
    const provider = process.env.AI_PROVIDER?.toLowerCase() as AIProvider;
    return ['gemini', 'ollama', 'lmstudio', 'siray'].includes(provider) 
        ? provider 
        : 'gemini';
}

/**
 * Call Ollama API
 */
async function callOllama(prompt: string, config: AIProviderConfig): Promise<AIResponse> {
    const baseUrl = config.baseUrl || AI_PROVIDER_DEFAULTS.ollama.baseUrl;
    const model = config.model || AI_PROVIDER_DEFAULTS.ollama.model;

    const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            prompt,
            stream: false,
        }),
    });

    if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
        candidates: [{
            content: {
                parts: [{ text: data.response }],
            },
        }],
    };
}

/**
 * Call LM Studio API (OpenAI-compatible)
 */
async function callLMStudio(prompt: string, config: AIProviderConfig): Promise<AIResponse> {
    const baseUrl = config.baseUrl || AI_PROVIDER_DEFAULTS.lmstudio.baseUrl;
    const model = config.model || AI_PROVIDER_DEFAULTS.lmstudio.model;

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        throw new Error(`LM Studio API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
        candidates: [{
            content: {
                parts: [{ text: data.choices[0].message.content }],
            },
        }],
    };
}

/**
 * Call Siray API (OpenAI-compatible)
 */
async function callSiray(prompt: string, config: AIProviderConfig): Promise<AIResponse> {
    const apiKey = config.apiKey || process.env.SIRAY_API_KEY;
    if (!apiKey) {
        throw new Error('Siray API Key missing');
    }

    const baseUrl = config.baseUrl || AI_PROVIDER_DEFAULTS.siray.baseUrl;
    const model = config.model || AI_PROVIDER_DEFAULTS.siray.model;

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!response.ok) {
        throw new Error(`Siray API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
        candidates: [{
            content: {
                parts: [{ text: data.choices[0].message.content }],
            },
        }],
    };
}

/**
 * Generic AI inference function that handles all providers
 */
export async function callAIProvider(
    prompt: string,
    providerConfig?: Partial<AIProviderConfig>
): Promise<AIResponse> {
    const provider = providerConfig?.provider || getAIProvider();
    const config: AIProviderConfig = {
        ...AI_PROVIDER_DEFAULTS[provider],
        ...providerConfig,
        provider,
    };

    console.log(`🤖 Using AI Provider: ${provider.toUpperCase()}`);

    switch (provider) {
        case 'ollama':
            return await callOllama(prompt, config);
        
        case 'lmstudio':
            return await callLMStudio(prompt, config);
        
        case 'siray':
            return await callSiray(prompt, config);
        
        case 'gemini':
        default:
            throw new Error('Gemini should be handled via Inngest step.ai.infer()');
    }
}

/**
 * AI inference with automatic fallback
 * Tries primary provider, falls back to Siray if configured
 */
export async function callAIWithFallback(
    prompt: string,
    primaryProvider?: AIProvider,
    enableFallback: boolean = true
): Promise<AIResponse> {
    const provider = primaryProvider || getAIProvider();

    try {
        if (provider === 'gemini') {
            // Gemini should be handled separately via Inngest step.ai.infer
            throw new Error('Use Inngest step.ai.infer() for Gemini');
        }
        
        return await callAIProvider(prompt, { provider });
    } catch (error) {
        console.error(`⚠️ ${provider.toUpperCase()} API failed:`, error);
        
        if (enableFallback && provider !== 'siray' && process.env.SIRAY_API_KEY) {
            console.log('🔄 Falling back to Siray.ai...');
            return await callAIProvider(prompt, { provider: 'siray' });
        }
        
        // Return default response if all fails
        return {
            candidates: [{
                content: {
                    parts: [{ text: 'AI service temporarily unavailable. Please try again later.' }],
                },
            }],
        };
    }
}
