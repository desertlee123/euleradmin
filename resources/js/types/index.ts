export interface Conversation {
    id: number;
    last_activity: string | null;
    expires_at: string | null;
    messages_count: number | string;
}

export interface ConversationMessage {
    role: string;
    content: string;
    audio?: string;
}

export interface ConversationDetail {
    id: number;
    last_activity: string | null;
    expires_at: string | null;
    messages: ConversationMessage[];
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginator<T> {
    data: T[];
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    path: string;
    per_page: number;
    to: number | null;
    total: number;
}
