# Stage 1: Install PHP dependencies
FROM dunglas/frankenphp:1-php8.4 AS composer-builder

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

RUN apt-get update && apt-get install -y --no-install-recommends \
    libzip-dev \
    && docker-php-ext-install zip pcntl bcmath \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

COPY . .

RUN composer dump-autoload --optimize --classmap-authoritative --no-dev --no-scripts


# Stage 2: Final runtime image with FrankenPHP
FROM dunglas/frankenphp:1-php8.4

ARG BUILD_VERSION
ARG GIT_COMMIT
ARG GIT_BRANCH

RUN apt-get update && apt-get install -y --no-install-recommends \
    libzip-dev \
    libxml2-dev \
    libsqlite3-dev \
    libpq-dev \
    default-mysql-client \
    && docker-php-ext-install -j$(nproc) \
    mysqli \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    zip \
    opcache \
    pcntl \
    bcmath \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create user and directories
RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -m -d /app -s /bin/bash appuser && \
    mkdir -p /app/storage /app/bootstrap/cache /data/caddy /config/caddy && \
    chown -R appuser:appuser /app /data/caddy /config/caddy

WORKDIR /app

# Copy PHP configuration
COPY docker/php-custom.ini /usr/local/etc/php/conf.d/php-custom.ini

# Copy Caddyfile configurations for FrankenPHP
COPY docker/Caddyfile.production /etc/caddy/Caddyfile.production
COPY docker/Caddyfile.dev /etc/caddy/Caddyfile.dev
# Default to production
COPY docker/Caddyfile.production /etc/caddy/Caddyfile

# Copy application files
COPY --from=composer-builder --chown=appuser:appuser /app/vendor ./vendor
COPY --chown=appuser:appuser . .

# El frontend compilado (public/build) entra por el COPY de arriba.
RUN test -f /app/public/build/manifest.json || { \
        echo "ERROR: falta public/build/manifest.json en el contexto de build."; \
        exit 1; \
    }

RUN chmod -R 755 /app/storage /app/bootstrap/cache

# Set XDG_CONFIG_HOME to prevent PsySH permission issues
ENV XDG_CONFIG_HOME=/app/storage

EXPOSE 80 443 443/udp

USER appuser

CMD ["sh", "/app/docker/startup.sh"]
