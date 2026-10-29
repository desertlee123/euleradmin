<?php

use App\Http\Controllers\ConversationController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ConversationController::class, 'index'])->name('conversations.index');
Route::get('/conversations/{conversation}', [ConversationController::class, 'show'])->name('conversations.show');
