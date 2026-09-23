# syntax=docker/dockerfile:1.7

# Usar imagen base de Node.js
FROM node:24-alpine AS builder

# Argumentos para variables de entorno de build
ARG VITE_API_BASE_URL
# El bundle del browser necesita estos dos horneados: el exportador se decide en
# build, no en runtime. Vacio = telemetria de browser apagada, que es el valor
# por defecto a proposito — se enciende poniendo la variable en el repositorio.
ARG OTLP_ENDPOINT=""
ARG DEPLOY_ENV="production"

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm ci --ignore-scripts

# Copiar el código fuente
COPY . .

# Construir la aplicación
RUN --mount=type=secret,id=VITE_RECAPTCHA_SITE_KEY \
	export VITE_API_BASE_URL="$VITE_API_BASE_URL" && \
	export VITE_RECAPTCHA_SITE_KEY="$(cat /run/secrets/VITE_RECAPTCHA_SITE_KEY)" && \
	export OTLP_ENDPOINT="$OTLP_ENDPOINT" && \
	export DEPLOY_ENV="$DEPLOY_ENV" && \
	npm run build

# Instalar solo dependencias de producción para la etapa final
RUN npm ci --only=production --ignore-scripts

# Etapa de producción
FROM node:24-alpine AS runner

# Instalar dumb-init para manejo de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 sveltekit

# Establecer directorio de trabajo
WORKDIR /app

# Cambiar propietario del directorio
RUN chown sveltekit:nodejs /app
USER sveltekit

# Copiar archivos necesarios desde el builder
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./package.json
COPY --from=builder --chown=sveltekit:nodejs /app/static ./static

# Exponer puerto
EXPOSE 3330

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3330
ENV HOST=0.0.0.0

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "build"]
