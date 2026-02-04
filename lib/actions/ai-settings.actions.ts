"use server";

import { connectToDatabase } from "@/database/mongoose";
import { AISettings } from "@/database/models/ai-settings.model";
import type { AIProvider } from "@/lib/ai/config";

export interface AISettingsParams {
    provider: AIProvider;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    enableFallback?: boolean;
    fallbackProvider?: 'siray' | 'ollama' | 'lmstudio';
}

/**
 * Get the active AI settings
 */
export async function getAISettings() {
    try {
        await connectToDatabase();
        const settings = await AISettings.findOne({ isActive: true });
        
        if (!settings) {
            // Return default settings if none exist
            return {
                provider: 'gemini' as AIProvider,
                enableFallback: true,
                fallbackProvider: 'siray' as const,
                isActive: true,
            };
        }

        return {
            provider: settings.provider,
            apiKey: settings.apiKey,
            baseUrl: settings.baseUrl,
            model: settings.model,
            enableFallback: settings.enableFallback,
            fallbackProvider: settings.fallbackProvider,
            isActive: settings.isActive,
        };
    } catch (error) {
        console.error('Error fetching AI settings:', error);
        throw error;
    }
}

/**
 * Update or create AI settings
 */
export async function updateAISettings(params: AISettingsParams) {
    try {
        await connectToDatabase();

        // Deactivate all existing settings
        await AISettings.updateMany({}, { isActive: false });

        // Create or update the new active settings
        const settings = await AISettings.findOneAndUpdate(
            { isActive: true },
            {
                ...params,
                isActive: true,
            },
            {
                new: true,
                upsert: true,
            }
        );

        return {
            success: true,
            settings: {
                provider: settings.provider,
                apiKey: settings.apiKey,
                baseUrl: settings.baseUrl,
                model: settings.model,
                enableFallback: settings.enableFallback,
                fallbackProvider: settings.fallbackProvider,
            },
        };
    } catch (error) {
        console.error('Error updating AI settings:', error);
        throw error;
    }
}

/**
 * Test AI provider connection
 */
export async function testAIProvider(params: AISettingsParams) {
    try {
        const { callAIProvider } = await import('@/lib/ai/config');
        
        const response = await callAIProvider(
            'Say "Connection successful" if you can read this.',
            params
        );

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        
        return {
            success: true,
            message: 'Connection successful',
            response: text,
        };
    } catch (error) {
        console.error('Error testing AI provider:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Connection failed',
        };
    }
}

/**
 * Get AI settings for Inngest functions (combines DB and env variables)
 */
export async function getAIProviderConfig() {
    try {
        const dbSettings = await getAISettings();
        
        // Override with environment variables if set
        const provider = (process.env.AI_PROVIDER as AIProvider) || dbSettings.provider;
        
        return {
            provider,
            apiKey: process.env.GEMINI_API_KEY || dbSettings.apiKey,
            baseUrl: 
                provider === 'ollama' ? process.env.OLLAMA_BASE_URL || dbSettings.baseUrl :
                provider === 'lmstudio' ? process.env.LMSTUDIO_BASE_URL || dbSettings.baseUrl :
                dbSettings.baseUrl,
            model: 
                provider === 'ollama' ? process.env.OLLAMA_MODEL || dbSettings.model :
                provider === 'lmstudio' ? process.env.LMSTUDIO_MODEL || dbSettings.model :
                dbSettings.model,
            enableFallback: dbSettings.enableFallback,
            fallbackProvider: dbSettings.fallbackProvider,
        };
    } catch (error) {
        console.error('Error getting AI provider config:', error);
        // Return safe defaults
        return {
            provider: 'gemini' as AIProvider,
            enableFallback: true,
            fallbackProvider: 'siray' as const,
        };
    }
}
