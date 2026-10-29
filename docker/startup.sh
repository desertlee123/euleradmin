#!/bin/sh

if [ "$APP_ENV" = "production" ] || [ "$APP_ENV" = "staging" ]
then
    php /app/artisan config:clear
    php /app/artisan config:cache
else
    php /app/artisan view:clear &
    php /app/artisan config:clear &
    php /app/artisan route:clear &
    if command -v composer > /dev/null 2>&1; then
        cd /app && composer install &
    fi
    wait
fi

# migrate y el seeder corren aparte, como task de deploy
frankenphp run --config /etc/caddy/Caddyfile &
SERVER_PID=$!

trap 'kill -TERM "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID"' TERM INT

wait "$SERVER_PID"
