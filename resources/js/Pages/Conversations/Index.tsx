import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import Pagination from '@/Components/Pagination';
import { useConversationReadState } from '@/hooks/useConversationReadState';
import Modal, {
    EmptyState,
    ModalError,
    ModalSpinner,
} from '@/Components/Modal';
import {
    Conversation,
    ConversationDetail,
    ConversationMessage,
    Paginator,
} from '@/types';

interface Props {
    conversations: Paginator<Conversation>;
}

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

function isExpired(value: string | null): boolean {
    if (!value) {
        return false;
    }

    return new Date(value).getTime() < Date.now();
}

function roleBadge(role: string): JSX.Element {
    const base =
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase';

    switch (role) {
        case 'user':
        case 'human':
            return (
                <span
                    className={`${base} bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300`}
                >
                    Usuario
                </span>
            );
        case 'assistant':
            return (
                <span
                    className={`${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300`}
                >
                    Euler
                </span>
            );
        default:
            return (
                <span
                    className={`${base} bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300`}
                >
                    {role}
                </span>
            );
    }
}

function ReadIndicator({ unread }: { unread: boolean }) {
    return (
        <span
            role="img"
            aria-label={unread ? 'Sin leer' : 'Leída'}
            title={unread ? 'Sin leer' : 'Leída'}
            className={`block h-2.5 w-2.5 rounded-full ${
                unread
                    ? 'bg-blue-500 ring-4 ring-blue-500/20'
                    : 'bg-emerald-500/70'
            }`}
        />
    );
}

export default function Index({ conversations }: Props) {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [selected, setSelected] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[] | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    const { isUnread, markAsRead } = useConversationReadState();

    const abrirConversacion = useCallback(
        (conversation: Conversation) => {
            setSelected(conversation);
            setMessages(null);
            setError(null);
            setIsOpenModal(true);

            axios
                .get<ConversationDetail>(`/conversations/${conversation.id}`)
                .then(response => {
                    setMessages(response.data.messages ?? []);
                    markAsRead(conversation);
                })
                .catch(() =>
                    setError(
                        'No se pudo cargar el historial de la conversación.',
                    ),
                );
        },
        [markAsRead],
    );

    return (
        <AppLayout title="Conversaciones">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Conversaciones
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Historial de chats guardados por el bot Euler
                        </p>
                    </div>
                    <button
                        onClick={() =>
                            router.reload({ only: ['conversations'] })
                        }
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                        Actualizar
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
                        Sin leer
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                        Leída
                    </span>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="w-12 px-4 py-3">
                                    <span className="sr-only">Estado</span>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Última Actividad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Expiración
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Mensajes
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {conversations.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        No hay conversaciones guardadas.
                                    </td>
                                </tr>
                            )}

                            {conversations.data.map(conversation => {
                                const unread = isUnread(conversation);

                                return (
                                    <tr
                                        key={conversation.id}
                                        onClick={() =>
                                            abrirConversacion(conversation)
                                        }
                                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                    >
                                        <td className="px-4 py-4">
                                            <ReadIndicator unread={unread} />
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            #{conversation.id}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {formatDate(
                                                conversation.last_activity,
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            {isExpired(
                                                conversation.expires_at,
                                            ) ? (
                                                <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                                    {formatDate(
                                                        conversation.expires_at,
                                                    )}
                                                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold dark:bg-red-900/50">
                                                        Expirada
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    {formatDate(
                                                        conversation.expires_at,
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {Number(
                                                conversation.messages_count,
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <Pagination paginator={conversations} />
            </div>

            <Modal
                title={
                    selected ? `Conversación #${selected.id}` : 'Conversación'
                }
                open={isOpenModal}
                onClose={() => setIsOpenModal(false)}
            >
                {error && <ModalError message={error} />}
                {!error && messages === null && <ModalSpinner />}
                {!error && messages !== null && messages.length === 0 && (
                    <EmptyState>
                        Esta conversación no tiene mensajes.
                    </EmptyState>
                )}
                {!error && messages !== null && messages.length > 0 && (
                    <div className="space-y-3">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`rounded-lg border p-4 ${
                                    message.role === 'user' ||
                                    message.role === 'human'
                                        ? 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20'
                                        : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                                }`}
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    {roleBadge(message.role)}
                                    {message.audio && (
                                        <a
                                            href={message.audio}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Audio
                                        </a>
                                    )}
                                </div>
                                <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                                    {message.content}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}
