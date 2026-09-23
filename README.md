# Geminis Labs Web Page

Sistema de seguimiento GPS en tiempo real construido con SvelteKit y Google Maps.

## Características

- 🔐 **Sistema de autenticación** con página de login
- 🗺️ Mapa de Google Maps a pantalla completa
- 📍 Seguimiento en tiempo real de equipos GPS
- 🎯 Header transparente con navegación por pestañas
- 📱 Diseño responsive y moderno
- ⚡ Actualizaciones en tiempo real
- 🔧 API preparada para integración con backend

## Estructura del Proyecto

```
src/
├── lib/
│   ├── components/
│   │   ├── GoogleMap.svelte    # Componente del mapa
│   │   └── Header.svelte       # Header transparente
│   ├── services/
│   │   └── gpsService.js       # Servicio para API GPS
│   └── styles/
│       ├── base.css            # Estilos base
│       ├── components.css      # Estilos de componentes
│       ├── layout.css          # Estilos de layout
│       ├── utilities.css       # Utilidades CSS
│       └── index.css           # Archivo principal de estilos
├── routes/
│   ├── +layout.svelte          # Layout principal
│   ├── +page.svelte            # Página de login
│   └── tracking/
│       ├── +layout.svelte      # Layout de tracking (con auth)
│       └── +page.svelte        # Página principal de tracking
└── app.css                     # Importación de estilos
static/
├── fonts/                      # Fuentes personalizadas
│   ├── Dune_Rise.otf          # Fuente Dune Rise (OpenType)
│   └── Dune_Rise.ttf          # Fuente Dune Rise (TrueType)
├── img/                        # Imágenes estáticas
└── vid/                        # Videos de fondo
```

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps

# API Base URL (opcional)
VITE_API_BASE_URL=http://localhost:3000/api

# reCAPTCHA v3 Site Key
VITE_RECAPTCHA_SITE_KEY=tu_site_key_de_recaptcha

# Observabilidad (opcional). En local, si no se define, se usa http://localhost:4318.
# Collector local: cd observability/local && docker compose up -d
# OTLP_ENDPOINT=http://localhost:4318
```

### 2. Obtener Google Maps API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Maps JavaScript
4. Crea credenciales (API Key)
5. Restringe la API Key a tu dominio por seguridad

### 3. Configurar reCAPTCHA v3

El formulario de contacto está protegido con reCAPTCHA v3:

1. Ve a [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Crea un nuevo sitio seleccionando **reCAPTCHA v3**
3. Agrega tu dominio
4. Copia la **Site Key** y agrégala a tu archivo `.env` como `VITE_RECAPTCHA_SITE_KEY`
5. Guarda la **Secret Key** para validar en tu backend

**Nota:** La Site Key es pública y se envía al navegador. La Secret Key debe mantenerse segura en el backend.

Para más detalles, consulta [RECAPTCHA_SETUP.md](./RECAPTCHA_SETUP.md).

### 4. Configurar Fuentes Personalizadas

Coloca tus archivos de fuente en `static/fonts/`:

```bash
# Crear directorio de fuentes
mkdir -p static/fonts

# Copiar archivos de fuente
cp ruta/a/tu/Dune_Rise.otf static/fonts/
cp ruta/a/tu/Dune_Rise.ttf static/fonts/
```

**Fuentes soportadas:**

- **Dune Rise**: Aplicada automáticamente solo a elementos h1 (títulos principales)
- **Fuentes del sistema**: Para el resto de elementos (h2, h3, p, etc.)
- **Clases CSS disponibles**:
  - `.font-dune-rise`: Aplica la fuente Dune Rise
  - `.font-dune-rise-title`: Para títulos principales con Dune Rise
  - `.font-dune-rise-subtitle`: Para subtítulos con Dune Rise
  - `.font-dune-rise-h1`: Para elementos h1 con Dune Rise

### 5. Instalar Dependencias

```bash
npm install
```

### 6. Ejecutar en Desarrollo

```bash
npm run dev
```

## Uso

### Autenticación

- **URL de login**: `http://localhost:5173/`
- **Credenciales de prueba**:
  - Email: `admin@example.com`
  - Password: `password`

### Página de Tracking

- **URL**: `http://localhost:5173/tracking`
- **Acceso**: Solo usuarios autenticados
- **Funcionalidades**:
  - Mapa de Google Maps a pantalla completa
  - Header con pestañas: Actual, Live, Grupos
  - Botón de cerrar sesión

### Pestañas Disponibles

- **Actual**: Muestra la posición actual de todos los equipos
- **Live**: Actualización en tiempo real cada 5 segundos
- **Grupos**: Filtra equipos por grupos (funcionalidad preparada)

### API Endpoints Esperados

El sistema está preparado para conectarse a una API con los siguientes endpoints:

```
GET /api/devices - Obtener todos los dispositivos
GET /api/devices/group/:id - Obtener dispositivos por grupo
GET /api/devices/:id/location - Obtener ubicación de un dispositivo
GET /api/groups - Obtener grupos disponibles
GET /api/devices/:id/history - Obtener historial de un dispositivo
POST /api/v1/contact/send-message - Enviar mensaje de contacto
```

#### Endpoint de Contacto

**POST** `/api/v1/contact/send-message`

Envía un mensaje de contacto desde el formulario de la página principal.

**Request Body:**

```json
{
	"nombre": "Juan Pérez",
	"correo_electronico": "juan@example.com",
	"telefono": "+52 123 456 7890",
	"mensaje": "Estoy interesado en sus servicios...",
	"recaptcha_token": "03AGdBq24PBCd9QF..."
}
```

**Validaciones automáticas:**

- `nombre`: Requerido, máximo 200 caracteres
- `mensaje`: Requerido, máximo 5000 caracteres
- `correo_electronico`: Opcional, formato de email válido
- `telefono`: Opcional, entre 7 y 20 dígitos
- Al menos uno de `correo_electronico` o `telefono` debe estar presente
- `recaptcha_token`: Token de reCAPTCHA v3 (generado automáticamente)

**Respuesta exitosa (200 OK):**

```json
{
	"success": true,
	"message": "Mensaje de contacto enviado exitosamente. Nos pondremos en contacto contigo pronto."
}
```

### Formato de Datos Esperado

```json
{
	"id": "1",
	"name": "Equipo 1",
	"lat": 19.4326,
	"lng": -99.1332,
	"lastUpdate": "2024-01-15T10:30:00Z",
	"speed": 45,
	"status": "active",
	"icon": "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
}
```

## Desarrollo

### Comandos Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de producción
npm run lint         # Verificar código
npm run format       # Formatear código
npm run test         # Ejecutar pruebas
```

### Datos de Prueba

Si no tienes una API configurada, el sistema usará datos de prueba automáticamente con 3 equipos simulados en Ciudad de México.

### Estructura de Estilos

Los estilos están organizados en archivos modulares:

- **`base.css`**: Importaciones de Tailwind y estilos base
- **`components.css`**: Estilos específicos de componentes
- **`layout.css`**: Utilidades de layout y estructura
- **`utilities.css`**: Clases utilitarias personalizadas

## Tecnologías

- **SvelteKit**: Framework web
- **Tailwind CSS**: Estilos
- **Google Maps JavaScript API**: Mapas
- **Vite**: Build tool

## Licencia

MIT
