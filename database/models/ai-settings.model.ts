import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface IAISettings extends Document {
    provider: 'gemini' | 'ollama' | 'lmstudio' | 'siray';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    enableFallback: boolean;
    fallbackProvider?: 'siray' | 'ollama' | 'lmstudio';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AISettingsSchema = new Schema<IAISettings>({
    provider: {
        type: String,
        enum: ['gemini', 'ollama', 'lmstudio', 'siray'],
        required: true,
        default: 'gemini',
    },
    apiKey: {
        type: String,
        required: false,
    },
    baseUrl: {
        type: String,
        required: false,
    },
    model: {
        type: String,
        required: false,
    },
    enableFallback: {
        type: Boolean,
        default: true,
    },
    fallbackProvider: {
        type: String,
        enum: ['siray', 'ollama', 'lmstudio'],
        required: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Ensure only one active settings document exists
AISettingsSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export const AISettings: Model<IAISettings> = 
    (models?.AISettings as Model<IAISettings>) || model<IAISettings>('AISettings', AISettingsSchema);
