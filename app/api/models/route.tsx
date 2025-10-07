import { SUPPORTED_MODELS } from '@/ai/constants';
import { getAvailableModels } from '@/ai/openrouter';
import { NextResponse } from 'next/server';

export async function GET() {
    const allModels = await getAvailableModels();
    return NextResponse.json({
        models: allModels.filter(model => SUPPORTED_MODELS.includes(model.id)),
    });
}
