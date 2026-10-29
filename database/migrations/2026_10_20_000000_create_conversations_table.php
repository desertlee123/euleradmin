<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// La tabla `conversations` vive en la MariaDB de euler-backend y se gestiona
// con Alembic; esta migración existe solo para los tests (sqlite en memoria).
// El guard hace que sea inocua si alguien corre `migrate` contra esa base.
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('conversations')) {
            return;
        }

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->json('messages');
            $table->dateTime('last_activity');
            $table->dateTime('expires_at');
            $table->index('last_activity');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
