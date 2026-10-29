<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property array<string, mixed> $messages
 * @property Carbon $last_activity
 * @property Carbon $expires_at
 */
class Conversation extends Model
{
    protected $table = 'conversations';

    public $timestamps = false;

    protected $fillable = [
        'messages',
        'last_activity',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'messages' => 'array',
            'last_activity' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}
