<?php

/**
 * FrankenPHP Worker Script
 * Similar a Laravel Octane, mantiene la aplicación en memoria entre requests.
 */

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Kernel::class);

while (frankenphp_handle_request(function () use ($kernel, $app) {
    $request = Request::capture();
    $response = $kernel->handle($request);
    $response->send();
    $kernel->terminate($request, $response);

    // La conexión a la base de datos se mantiene abierta entre requests

    if ($app->bound('cache')) {
        $app->forgetInstance('cache');
    }
    if ($app->bound('events')) {
        $app->forgetInstance('events');
    }
    gc_collect_cycles();
})) {
    // Continue processing requests
}
