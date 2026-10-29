<?php

namespace Tests\Feature;

use App\Models\Conversation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_a_successful_response(): void
    {
        $this->get('/')->assertOk();
    }

    public function test_index_lists_conversations_paginated(): void
    {
        Conversation::create([
            'messages' => ['messages' => [
                ['role' => 'user', 'content' => 'Hola'],
                ['role' => 'assistant', 'content' => '¡Hola!'],
            ]],
            'last_activity' => now(),
            'expires_at' => now()->addHour(),
        ]);

        $response = $this->get('/?per_page=10');
        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('Conversations/Index')
                ->has('conversations.data', 1)
                ->where('conversations.data.0.messages_count', 2)
        );
    }

    public function test_index_returns_localized_pagination_labels(): void
    {
        Conversation::create([
            'messages' => ['messages' => [
                ['role' => 'user', 'content' => 'Hola'],
            ]],
            'last_activity' => now(),
            'expires_at' => now()->addHour(),
        ]);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $labels = collect($page->toArray()['props']['conversations']['links'])->pluck('label');

            expect($labels)
                ->toContain('&laquo; Anterior', 'Siguiente &raquo;')
                ->not->toContain('pagination.previous', 'pagination.next');
        });
    }

    public function test_show_returns_conversation_messages_as_json(): void
    {
        $conversation = Conversation::create([
            'messages' => ['messages' => [
                ['role' => 'user', 'content' => 'Hola'],
                ['role' => 'assistant', 'content' => '¡Hola! ¿Cómo estás?'],
            ]],
            'last_activity' => now(),
            'expires_at' => now()->addHour(),
        ]);

        $this->getJson("/conversations/{$conversation->id}")
            ->assertOk()
            ->assertJsonPath('id', $conversation->id)
            ->assertJsonCount(2, 'messages')
            ->assertJsonPath('messages.0.role', 'user');
    }
}
