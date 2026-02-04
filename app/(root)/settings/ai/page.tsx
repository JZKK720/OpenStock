"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import AIProviderForm, { type AIProviderFormData } from "@/components/forms/AIProviderForm";
import { getAISettings, updateAISettings, testAIProvider } from "@/lib/actions/ai-settings.actions";

export default function AISettingsPage() {
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState<Partial<AIProviderFormData> | undefined>();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getAISettings();
            setInitialData(settings);
        } catch (error) {
            console.error("Failed to load AI settings:", error);
            toast.error("Failed to load settings");
        }
    };

    const handleSubmit = async (data: AIProviderFormData) => {
        setLoading(true);
        try {
            await updateAISettings(data);
            toast.success("AI settings saved successfully!");
        } catch (error) {
            console.error("Failed to save AI settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async (data: AIProviderFormData) => {
        const result = await testAIProvider(data);
        if (result.success) {
            toast.success("Connection successful!");
        } else {
            toast.error(result.message);
        }
        return result;
    };

    return (
        <div className="container mx-auto max-w-4xl py-10 px-4">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Configuration</h1>
                    <p className="text-muted-foreground mt-2">
                        Configure your AI provider for email generation and market insights
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4 bg-card">
                        <h3 className="font-semibold mb-2">🌐 Cloud Providers</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• <strong>Gemini:</strong> Google's powerful AI (requires API key)</li>
                            <li>• <strong>Siray.ai:</strong> Reliable infrastructure with failover</li>
                        </ul>
                    </div>
                    <div className="rounded-lg border p-4 bg-card">
                        <h3 className="font-semibold mb-2">💻 Local Providers</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• <strong>Ollama:</strong> Run models locally (no API key needed)</li>
                            <li>• <strong>LM Studio:</strong> Local OpenAI-compatible server</li>
                        </ul>
                    </div>
                </div>

                {/* Setup Instructions */}
                <div className="rounded-lg border p-6 bg-muted/50">
                    <h3 className="font-semibold mb-3">📋 Quick Setup Guide</h3>
                    <div className="space-y-3 text-sm">
                        <div>
                            <strong>For Ollama:</strong>
                            <ol className="list-decimal ml-5 mt-1 space-y-1 text-muted-foreground">
                                <li>Install from <a href="https://ollama.ai" target="_blank" className="text-primary underline">ollama.ai</a></li>
                                <li>Run: <code className="bg-background px-2 py-1 rounded">ollama pull llama3.2</code></li>
                                <li>Start server: <code className="bg-background px-2 py-1 rounded">ollama serve</code></li>
                            </ol>
                        </div>
                        <div>
                            <strong>For LM Studio:</strong>
                            <ol className="list-decimal ml-5 mt-1 space-y-1 text-muted-foreground">
                                <li>Download from <a href="https://lmstudio.ai" target="_blank" className="text-primary underline">lmstudio.ai</a></li>
                                <li>Load a model in the UI</li>
                                <li>Enable local server (default: port 1234)</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Configuration Form */}
                <div className="rounded-lg border p-6 bg-card">
                    <h2 className="text-xl font-semibold mb-4">Provider Configuration</h2>
                    {initialData ? (
                        <AIProviderForm
                            onSubmit={handleSubmit}
                            onTest={handleTest}
                            initialData={initialData}
                            loading={loading}
                        />
                    ) : (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                    )}
                </div>

                {/* Environment Variables Info */}
                <div className="rounded-lg border p-6 bg-yellow-50 dark:bg-yellow-950/20">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                        ⚠️ Environment Variables
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Settings configured here are stored in the database. You can also configure AI 
                        providers using environment variables (<code>AI_PROVIDER</code>, <code>GEMINI_API_KEY</code>, etc.) 
                        which will override database settings.
                    </p>
                </div>
            </div>
        </div>
    );
}
