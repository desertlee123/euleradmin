import { useCallback, useEffect, useState } from 'react';
import { Conversation } from '@/types';

const STORAGE_KEY = 'euleradmin.conversations.read';

interface StoredReadState {
    firstVisitAt: string | null;
    read: Record<string, string>;
}

function emptyState(): StoredReadState {
    return { firstVisitAt: null, read: {} };
}

function loadState(): StoredReadState {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return emptyState();
        }

        const parsed = JSON.parse(raw) as Partial<StoredReadState>;

        return {
            firstVisitAt:
                typeof parsed.firstVisitAt === 'string'
                    ? parsed.firstVisitAt
                    : null,
            read:
                typeof parsed.read === 'object' && parsed.read !== null
                    ? parsed.read
                    : {},
        };
    } catch {
        return emptyState();
    }
}

function saveState(state: StoredReadState): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // localStorage puede estar bloqueado: el estado de lectura queda en memoria.
    }
}

export function useConversationReadState() {
    const [state, setState] = useState<StoredReadState>(loadState);

    useEffect(() => {
        if (state.firstVisitAt !== null) {
            return;
        }

        setState(current => {
            const next = {
                ...current,
                firstVisitAt: new Date().toISOString(),
            };

            saveState(next);

            return next;
        });
    }, [state.firstVisitAt]);

    const isUnread = useCallback(
        (conversation: Conversation): boolean => {
            const lastActivity = conversation.last_activity
                ? new Date(conversation.last_activity).getTime()
                : null;

            if (lastActivity === null) {
                return false;
            }

            const readAt = state.read[String(conversation.id)];

            if (readAt) {
                return lastActivity > new Date(readAt).getTime();
            }

            if (!state.firstVisitAt) {
                return false;
            }

            return lastActivity > new Date(state.firstVisitAt).getTime();
        },
        [state],
    );

    const markAsRead = useCallback((conversation: Conversation): void => {
        const lastActivity = conversation.last_activity;

        if (!lastActivity) {
            return;
        }

        setState(current => {
            const next = {
                ...current,
                read: {
                    ...current.read,
                    [String(conversation.id)]: lastActivity,
                },
            };

            saveState(next);

            return next;
        });
    }, []);

    return { isUnread, markAsRead };
}
