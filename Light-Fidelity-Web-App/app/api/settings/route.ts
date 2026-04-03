import { NextRequest, NextResponse } from 'next/server';
import { getWifiSettings, updateWifiSettings } from '@/lib/serverState';

/**
 * GET /api/settings
 * Returns the current Wi-Fi network settings.
 * Password is intentionally omitted from the response.
 */
export async function GET() {
    const settings = getWifiSettings();
    return NextResponse.json({ ssid: settings.ssid });
}

/**
 * POST /api/settings
 * Updates Wi-Fi network settings.
 * Body: { ssid?: string }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ssid } = body as { ssid?: string };

        if (!ssid || typeof ssid !== 'string' || !ssid.trim()) {
            return NextResponse.json({ error: 'ssid is required' }, { status: 400 });
        }

        updateWifiSettings({ ssid: ssid.trim() });
        return NextResponse.json({ success: true, ssid: ssid.trim() });
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
}
