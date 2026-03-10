import { NextResponse } from 'next/server';
import { getHardwareStatus } from '@/lib/serverState';

/**
 * GET /api/status
 * Returns the current Li-Fi hardware connection status.
 */
export async function GET() {
    const hw = getHardwareStatus();
    return NextResponse.json({
        lifiConnected: hw.lifiConnected,
        txConnected: hw.txConnected,
        rxConnected: hw.rxConnected,
        transmissionActive: hw.transmissionActive,
        updatedAt: hw.updatedAt,
    });
}
