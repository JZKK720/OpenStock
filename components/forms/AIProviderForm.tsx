"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AIProvider } from "@/lib/ai/config";

interface AIProviderFormProps {
    onSubmit: (data: AIProviderFormData) => Promise<void>;
    onTest?: (data: AIProviderFormData) => Promise<{ success: boolean; message: string }>;
    initialData?: Partial<AIProviderFormData>;
    loading?: boolean;
}

export interface AIProviderFormData {
    provider: AIProvider;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    enableFallback: boolean;
    fallbackProvider?: 'siray' | 'ollama' | 'lmstudio';
}

export default function AIProviderForm({ onSubmit, onTest, initialData, loading }: AIProviderFormProps) {
    const [formData, setFormData] = useState<AIProviderFormData>({
        provider: 'gemini',
        enableFallback: true,
        fallbackProvider: 'siray',
        ...initialData,
    });

    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...formData, ...initialData });
        }
    }, [initialData]);

    const handleProviderChange = (provider: AIProvider) => {
        setFormData({ ...formData, provider });
        setTestResult(null);
    };

    const handleTest = async () => {
        if (!onTest) return;
        
        setTesting(true);
        setTestResult(null);
        
        try {
            const result = await onTest(formData);
            setTestResult(result);
        } catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Test failed',
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const providerDescriptions: Record<AIProvider, string> = {
        gemini: 'Google Gemini API - Cloud-based AI with high performance',
        ollama: 'Ollama - Run local models on your machine',
        lmstudio: 'LM Studio - Local model server with OpenAI-compatible API',
        siray: 'Siray.ai - Reliable AI infrastructure with high availability',
    };

    const showApiKey = formData.provider === 'gemini' || formData.provider === 'siray';
    const showBaseUrl = formData.provider === 'ollama' || formData.provider === 'lmstudio';
    const showModel = formData.provider !== 'gemini';

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* AI Provider Selection */}
            <div className="space-y-2">
                <Label htmlFor="provider">AI Provider</Label>
                <Select
                    value={formData.provider}
                    onValueChange={handleProviderChange}
                >
                    <SelectTrigger id="provider">
                        <SelectValue placeholder="Select AI provider" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="ollama">Ollama (Local)</SelectItem>
                        <SelectItem value="lmstudio">LM Studio (Local)</SelectItem>
                        <SelectItem value="siray">Siray.ai</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    {providerDescriptions[formData.provider]}
                </p>
            </div>

            {/* API Key (Gemini, Siray) */}
            {showApiKey && (
                <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                        id="apiKey"
                        type="password"
                        value={formData.apiKey || ''}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        placeholder={`Enter ${formData.provider === 'gemini' ? 'Gemini' : 'Siray'} API key`}
                    />
                </div>
            )}

            {/* Base URL (Ollama, LM Studio) */}
            {showBaseUrl && (
                <div className="space-y-2">
                    <Label htmlFor="baseUrl">Base URL</Label>
                    <Input
                        id="baseUrl"
                        type="url"
                        value={formData.baseUrl || ''}
                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                        placeholder={
                            formData.provider === 'ollama'
                                ? 'http://host.docker.internal:11434'
                                : 'http://host.docker.internal:14321/v1'
                        }
                    />
                    <p className="text-sm text-muted-foreground">
                        {formData.provider === 'ollama'
                            ? 'Default: http://host.docker.internal:11434'
                            : 'Default: http://host.docker.internal:14321/v1'}
                    </p>
                </div>
            )}

            {/* Model Name */}
            {showModel && (
                <div className="space-y-2">
                    <Label htmlFor="model">Model Name</Label>
                    <Input
                        id="model"
                        value={formData.model || ''}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder={
                            formData.provider === 'ollama'
                                ? 'llama3.2'
                                : formData.provider === 'lmstudio'
                                ? 'local-model'
                                : 'siray-1.0-ultra'
                        }
                    />
                </div>
            )}

            {/* Enable Fallback */}
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="enableFallback"
                        checked={formData.enableFallback}
                        onChange={(e) => setFormData({ ...formData, enableFallback: e.target.checked })}
                        className="h-4 w-4"
                    />
                    <Label htmlFor="enableFallback" className="cursor-pointer">
                        Enable automatic fallback
                    </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                    Automatically switch to a backup provider if the primary fails
                </p>
            </div>

            {/* Fallback Provider */}
            {formData.enableFallback && (
                <div className="space-y-2">
                    <Label htmlFor="fallbackProvider">Fallback Provider</Label>
                    <Select
                        value={formData.fallbackProvider}
                        onValueChange={(value) =>
                            setFormData({ ...formData, fallbackProvider: value as 'siray' | 'ollama' | 'lmstudio' })
                        }
                    >
                        <SelectTrigger id="fallbackProvider">
                            <SelectValue placeholder="Select fallback provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {formData.provider !== 'siray' && <SelectItem value="siray">Siray.ai</SelectItem>}
                            {formData.provider !== 'ollama' && <SelectItem value="ollama">Ollama</SelectItem>}
                            {formData.provider !== 'lmstudio' && <SelectItem value="lmstudio">LM Studio</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Test Result */}
            {testResult && (
                <div
                    className={`p-4 rounded-md ${
                        testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}
                >
                    <p className="font-medium">{testResult.success ? '✅ Success' : '❌ Failed'}</p>
                    <p className="text-sm mt-1">{testResult.message}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
                {onTest && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTest}
                        disabled={testing || loading}
                    >
                        {testing ? 'Testing...' : 'Test Connection'}
                    </Button>
                )}
                <Button type="submit" disabled={loading || testing}>
                    {loading ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>
        </form>
    );
}
