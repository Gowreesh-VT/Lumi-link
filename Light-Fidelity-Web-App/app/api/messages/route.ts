import { NextRequest, NextResponse } from 'next/server';
import {
    getStoredMessages,
    clearStoredMessages,
    addStoredMessage,
} from '@/lib/serverState';

/**
 * GET /api/messages
 * Returns stored messages. Supports optional query filters:
 *   ?direction=sent|received
 *   ?limit=50
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const direction = searchParams.get('direction') as 'sent' | 'received' | null;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 200);

    let msgs = getStoredMessages();
    if (direction) msgs = msgs.filter((m) => m.direction === direction);
    msgs = msgs.slice(-limit);

    return NextResponse.json({ messages: msgs, total: msgs.length });
}

/**
 * POST /api/messages
 * Queues a message to be sent via Li-Fi (also adds it to the store as pending).
 * Body: { message: string }
 *
 * Note: actual serial transmission is handled by the Socket.io layer in
 * server.js.  The frontend should prefer the 'send_message' socket event for
 * hardware transmission.  This REST endpoint is useful for programmatic
 * integrations and testing.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message } = body as { message?: string };

        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json({ error: 'message is required' }, { status: 400 });
        }

        const stored = addStoredMessage({
            content: message.trim(),
            direction: 'sent',
            status: 'pending',
        });

        return NextResponse.json({ success: true, message: stored }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
}

/**
 * DELETE /api/messages
 * Clears the message store.
 */
export async function DELETE() {
    clearStoredMessages();
    return NextResponse.json({ success: true });
}
