<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Services\ConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    public function __construct(
        private ConversationService $conversationService,
    ) {}

    public function index(Request $request): Response
    {
        $pagina = (int) $request->query('page', 1);
        $porPagina = (int) $request->query('per_page', 15);

        return Inertia::render('Conversations/Index', [
            'conversations' => $this->conversationService
                ->listar($pagina, $porPagina)
                ->withQueryString(),
        ]);
    }

    public function show(Conversation $conversation): JsonResponse
    {
        return response()->json(
            $this->conversationService->obtenerDetalle($conversation),
        );
    }
}
