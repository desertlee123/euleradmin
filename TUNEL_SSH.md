# Túnel SSH a PostgreSQL (guía del proyecto)

Esta guía explica cómo la aplicación Laravel de este repositorio accede a la base
PostgreSQL `euler_db` que vive en el servidor de la facultad, usando un túnel SSH.

## 1. Qué es y para qué sirve

La aplicación **no** tiene una base de datos local. La base real está en un servidor
remoto, escuchando en `localhost:5432` **de ese servidor**.

Un túnel SSH crea un "puente" entre un puerto de tu máquina y un puerto del servidor
remoto. Todo el tráfico viaja cifrado dentro de la conexión SSH y no hace falta
exponer PostgreSQL a internet.

```
[proceso local] --127.0.0.1:8090--> [cliente ssh] ==== túnel cifrado ====> [sshd remoto] --localhost:5432--> [PostgreSQL]
```

- El puerto `8090` está en **tu máquina**.
- El `localhost:5432` de la derecha lo resuelve **el servidor remoto**.

## 2. Sintaxis de `ssh -L`

```
ssh -L [ip_donde_escucha_mi_ssh:]puerto_local:host_destino:puerto_destino usuario@servidor
```

Ejemplo:

```bash
ssh -L 172.17.0.1:8090:localhost:5432 admin@10.10.9.115
```

- `172.17.0.1:8090` → dónde escucha el ssh **en tu máquina**.
- `localhost:5432` → a dónde se conecta **el servidor remoto** (su propio PostgreSQL).
- `admin@10.10.9.115` → usuario y máquina a la que te conectás por SSH.

Hay dos "localhost" distintos y no son el mismo:

| Lado | Significado |
|------|-------------|
| Izquierda (`8090`) | Tu máquina. Es lo que usan DBeaver o los contenedores para entrar. |
| Derecha (`localhost:5432`) | El servidor remoto. Ahí vive PostgreSQL. |

## 3. Cómo está configurado este proyecto

Archivos relevantes:

- `.env`
  - `DB_CONNECTION=pgsql`
  - `DB_PORT=8090`
  - `DB_DATABASE=euler_db`
  - `DB_USERNAME=postgres`
  - `DB_PASSWORD=...` (está en el `.env`, no se copia acá)
- `docker-compose.yml`
  - La app corre en el contenedor `euleradmin_local` (puerto `3017` en el host).
  - `DB_HOST=host.docker.internal` se define en `environment`, por lo que **pisa**
    el `DB_HOST=127.0.0.1` del `.env`.
  - `extra_hosts: host.docker.internal:host-gateway` hace que dentro del contenedor
    ese nombre apunte a la IP del host en la red de Docker.

En resumen:

- **Desde el host** (DBeaver, `php artisan` sin Docker): `127.0.0.1:8090`.
- **Desde el contenedor** (la app web): `host.docker.internal:8090` → `172.17.0.1:8090`.

## 4. De dónde sale `172.17.0.1`

Docker crea en tu host una interfaz virtual `docker0` con la red `172.17.0.0/16`.
`172.17.0.1` es la IP del host dentro de esa red (el gateway).

Dentro de un contenedor:

- `127.0.0.1` es **el contenedor mismo**, no tu máquina.
- Para llegar a tu máquina tiene que usar `172.17.0.1` (o el nombre
  `host.docker.internal`, que el compose resuelve a esa IP).

Se puede comprobar con:

```bash
docker exec euleradmin_local getent hosts host.docker.internal
# 172.17.0.1      host.docker.internal

docker network inspect bridge -f '{{range .IPAM.Config}}{{.Gateway}}{{end}}'
# 172.17.0.1
```

## 5. Por qué DBeaver funciona con `localhost` y la app no

El ssh, si no se indica IP, escucha **solo en loopback** (`127.0.0.1` y `::1`):

```bash
ssh -L 8090:localhost:5432 divi
ss -ltnp | grep 8090
# LISTEN 127.0.0.1:8090 ...
```

- **DBeaver** corre en tu máquina, así que `localhost:8090` le sirve.
- **El contenedor** intenta `172.17.0.1:8090`; como ahí no hay nadie escuchando,
  obtiene `Connection refused`.

La solución es hacer que el ssh escuche también en `172.17.0.1`:

```bash
ssh -L 172.17.0.1:8090:localhost:5432 ...
ss -ltnp | grep 8090
# LISTEN 172.17.0.1:8090 ...
```

Con ese bind, DBeaver **no** funciona usando `localhost` (a menos que configures
`172.17.0.1` como host). Para tener las dos cosas a la vez, se usan dos `-L`:

```bash
ssh -N -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:8090:localhost:5432 \
  -L 172.17.0.1:8090:localhost:5432 \
  divi
```

## 6. `divi` vs `10.10.9.115`

Son **dos caminos al mismo servidor** (tienen la misma clave de host SSH):

- `admin@10.10.9.115`
  - IP privada de la facultad.
  - Solo funciona estando en la red de la facultad (o por VPN).
  - Es la ruta directa y la más confiable ahí.
- `divi`
  - Alias definido en `~/.ssh/config`:
    ```sshconfig
    Host divi
        Hostname divi.veloso.net.ar
        User admin
        ProxyCommand cloudflared access ssh --hostname %h
    ```
  - Pasa por Cloudflare (`cloudflared`), por lo que funciona desde cualquier red.
  - Es la opción para usar fuera de la facultad.

El `usuario@host` solo indica **a qué máquina entrás por SSH**. No tiene nada que ver
con el usuario/clave de PostgreSQL (`postgres` + la clave del `.env`), que son otra
capa de autenticación.

## 7. Comandos según el lugar

### En la facultad

```bash
ssh -N -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:8090:localhost:5432 \
  -L 172.17.0.1:8090:localhost:5432 \
  admin@10.10.9.115
```

Si `divi` no está bloqueado por la red, también sirve cambiando el destino por `divi`.

### Fuera de la facultad (casa, cualquier red)

```bash
ssh -N -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:8090:localhost:5432 \
  -L 172.17.0.1:8090:localhost:5432 \
  divi
```

Pide la contraseña de `admin@divi`. Hay que **dejar la terminal abierta**; `-N`
significa "no ejecutar comandos, solo el túnel".

### Solo para DBeaver (sin contenedor)

```bash
ssh -L 8090:localhost:5432 divi
# DBeaver: host localhost, puerto 8090, db euler_db, user postgres
```

### Solo para la app (sin DBeaver)

```bash
ssh -L 172.17.0.1:8090:localhost:5432 divi
```

### Alternativa: escuchar en todas las interfaces

```bash
ssh -L 0.0.0.0:8090:localhost:5432 divi
```

Sirve para el contenedor y para cualquier IP, pero mientras el túnel esté abierto
el puerto también queda accesible desde otros equipos de tu red. Usarlo con cuidado.

## 8. Cómo verificar que el túnel está bien

```bash
# 1. Ver en qué dirección escucha
ss -ltnp | grep 8090
```

- `127.0.0.1:8090` → solo el host (DBeaver).
- `172.17.0.1:8090` → solo el contenedor.
- `0.0.0.0:8090` → todas las interfaces.

```bash
# 2. Probar desde el contenedor de la app
docker exec euleradmin_local php -r '$f=@fsockopen("host.docker.internal",8090,$e,$m,3); echo $f ? "OK\n" : "FAIL: $m\n";'
```

```bash
# 3. Probar desde el host (si hay psql instalado)
psql -h 127.0.0.1 -p 8090 -U postgres -d euler_db -c 'select count(*) from conversations;'
```

## 9. Problemas comunes

### `Connection refused ... "host.docker.internal" (172.17.0.1), port 8090`

El túnel no escucha en `172.17.0.1`. Revisar `ss -ltnp | grep 8090` y volver a
levantarlo con `-L 172.17.0.1:8090:...` (o `0.0.0.0`).

### `Permission denied (publickey,password)`

El ssh llegó al servidor pero no se autenticó. Hay que escribir la contraseña o
tener la clave correspondiente. No es un problema del túnel ni de PostgreSQL.

### `tls: failed to verify certificate: x509: certificate signed by unknown authority`

`cloudflared` no pudo validar el certificado, típicamente porque la red (por ejemplo
la de la facultad) intercepta TLS. En ese caso usar la ruta directa por IP si estás
en la facultad.

### `bind: Address already in use`

Ya hay otro proceso (u otro túnel) escuchando en ese puerto. Cerrarlo o usar otro
puerto. Para que el ssh avise y no arranque a medias:

```bash
-o ExitOnForwardFailure=yes
```

### `kex_exchange_identification: Connection closed by remote host`

La conexión SSH no llegó a establecerse (proxy, Cloudflare o red bloqueando).
Probar la ruta alternativa (`divi` o la IP directa).

### El túnel se corta solo

Agregar keepalive:

```bash
-o ServerAliveInterval=30 -o ServerAliveCountMax=3
```

## 10. Aclaraciones rápidas

- `admin@10.10.9.115` / `divi` → **a qué servidor entrás por SSH**.
- `172.17.0.1` vs `127.0.0.1` → **quién puede usar el puerto local**.
- `localhost:5432` a la derecha del `-L` → **PostgreSQL en el servidor remoto**.
- Las credenciales de PostgreSQL (`postgres` / clave del `.env`) son independientes
  de las credenciales SSH.
- `10.10.9.115` es una IP privada: no existe fuera de la red de la facultad.
- `divi` usa Cloudflare y funciona desde cualquier lado.
- El puerto `3017` es la app web; el `8090` es el túnel a la base. No son lo mismo.
