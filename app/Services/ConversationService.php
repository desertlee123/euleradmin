<?php

namespace App\Services;

use App\Models\Conversation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ConversationService
{
    private const DEFAULT_PER_PAGE = 15;

    private const MAX_PER_PAGE = 100;

    /**
     * @param int $pagina Página a resolver (1-based)
     * @param int $porPagina Tamaño de página
     * @return LengthAwarePaginator<int, Conversation>
     */
    public function listar(int $pagina = 1, int $porPagina = self::DEFAULT_PER_PAGE): LengthAwarePaginator
    {
        $pagina = max($pagina, 1);
        $porPagina = min(max($porPagina, 1), self::MAX_PER_PAGE);

        // El JSON guardado por euler-backend es {"messages": [...]};
        // se cuenta el array interno, con fallback al array raíz.
        // MariaDB/MySQL usan JSON_LENGTH/JSON_EXTRACT, SQLite json_array_length
        // y PostgreSQL json_typeof/json_array_length sobre el operador `->`.
        $driver = (new Conversation)->getConnection()->getDriverName();

        $messagesCount = match ($driver) {
            'sqlite' => "COALESCE(json_array_length(messages, '\$.messages'), json_array_length(messages))",
            'pgsql' => <<<'SQL'
                CASE
                    WHEN json_typeof(messages -> 'messages') = 'array' THEN json_array_length(messages -> 'messages')
                    WHEN json_typeof(messages) = 'array' THEN json_array_length(messages)
                    ELSE 0
                END
                SQL,
            default => 'COALESCE(JSON_LENGTH(JSON_EXTRACT(messages, "$.messages")), JSON_LENGTH(messages))',
        };

        return Conversation::query()
            ->select(['id', 'last_activity', 'expires_at'])
            ->selectRaw("{$messagesCount} as messages_count")
            ->orderByDesc('last_activity')
            ->paginate($porPagina, ['*'], 'page', $pagina);
    }

    /**
     * @return array{
     *     id: int,
     *     last_activity: string|null,
     *     expires_at: string|null,
     *     messages: array<int, mixed>
     * }
     */
    public function obtenerDetalle(Conversation $conversation): array
    {
        $payload = $conversation->messages;

        $messages = isset($payload['messages']) && is_array($payload['messages'])
            ? $payload['messages']
            : [];

        return [
            'id' => $conversation->id,
            'last_activity' => $conversation->last_activity->toIso8601String(),
            'expires_at' => $conversation->expires_at->toIso8601String(),
            'messages' => array_values($messages),
        ];
    }
}
