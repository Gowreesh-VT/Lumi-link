import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Simple liveness probe for the server.
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
}
