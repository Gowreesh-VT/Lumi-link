'use client';

// Minimal use-toast hook to satisfy shadcn's toaster.tsx import.
// The app uses 'sonner' for all toasts — this is just a type stub.

import * as React from 'react';

type ToastVariant = 'default' | 'destructive';

export interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: ToastVariant;
    action?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

type ToastInput = Omit<Toast, 'id'>;

interface ToastState {
    toasts: Toast[];
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(toast: Toast) {
    memoryState = { toasts: [...memoryState.toasts, toast] };
    listeners.forEach((l) => l(memoryState));
}

let count = 0;
export function toast(input: ToastInput) {
    const id = String(++count);
    dispatch({ ...input, id, open: true });
    return id;
}

export function useToast() {
    const [state, setState] = React.useState<ToastState>(memoryState);

    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const idx = listeners.indexOf(setState);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }, []);

    return {
        ...state,
        toast,
        dismiss: (id: string) => {
            memoryState = {
                toasts: memoryState.toasts.filter((t) => t.id !== id),
            };
            listeners.forEach((l) => l(memoryState));
        },
    };
}
