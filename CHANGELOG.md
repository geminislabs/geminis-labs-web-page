# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Cadena de linting a ESLint 10 (`eslint`, `@eslint/js` 10, `@eslint/compat` 2), más `globals` 17, `lint-staged` 17 y `commitlint` 21. Las majors van juntas porque `@eslint/js` 10 exige `eslint` ^10: sueltas no se sostienen

### Added

- Observabilidad con OpenTelemetry oficial en `src/lib/observability/` (`init`, `scrubber`, `journey`, `capture`): traces, métricas y logs OTLP/HTTP. Sin `OTLP_ENDPOINT` no se registran providers (API no-op). Journeys de login, contacto y billing; `FetchInstrumentation` en el browser y `HttpInstrumentation` en Node; `GET /health`; proxy same-origin `/internal/otlp` para que el browser no tenga que POST al collector. Stack LGTM local y dashboards Grafana en `observability/` — Grafana anónimo Admin es solo local

### Changed

- `apiClient`, autenticación, billing y el formulario de contacto emiten señales de observabilidad. El comportamiento de dominio no cambia: si el SDK falla, la petición sigue
- El cliente propio y el paquete `@geminislabs/observability` se sustituyen por el SDK oficial de OpenTelemetry (`@opentelemetry/*`)
- Los dashboards Grafana consultan el contrato OTel/Prometheus (`http_server_duration_milliseconds_*`, `http_client_duration_milliseconds_*`, `http_client_errors_total`, `journey_outcome_total`, `js_errors_total`) con temporality cumulative, buckets explícitos y labels `service_name`/`deployment_environment`

### Removed

- Paquete local `@geminislabs/observability` (sinks, OTLP JSON propio e `instrumentedFetch`)
- `Dockerfile.simple` y `Dockerfile.fallback`: no los construía nadie — `docker-compose.yml` y el workflow de deploy usan `Dockerfile` — y seguían pidiendo actualizaciones de base (`ubuntu:22.04`, `node:20`) que había que triar

### Changed

- Node 24 LTS en los cuatro sitios que fijaban versión: `Dockerfile` (las dos etapas), `.nvmrc`, `engines` y los dos jobs de CI. La imagen de producción corría `node:20-alpine`, sin soporte desde abril, y con una CI que probaba en 22 — producción usaba una versión que ninguna prueba tocaba

### Fixed

- `ProfileStarfield`: el `requestAnimationFrame` del parallax no guardaba su handle, así que el `cancelAnimationFrame` del cleanup nunca cancelaba nada y el bucle seguía vivo tras desmontar el componente
- `billingService`: el error de red original se perdía al sustituirlo por el mensaje amable; ahora viaja en `cause`

### Security

- `devalue` 5.9.2 vía override (`GHSA-9rgm-9g3h-6x36` / CVE-2026-81176). OSV-Scanner lo marca como Medium y el job `security` de CI falla si queda 5.8.1

## [1.14.0] — 2026-09-11

### Changed

- El cambio de capacidad se hace en dos tiempos: primero se desvanece lo que hay y solo cuando está invisible se sustituye por lo nuevo, que entra apareciendo. Además de suavizar, esconde el salto de maquetación: como las capacidades varían cientos de píxeles de alto, el desplazamiento de lo que va debajo ocurre ahora con el contenido en opacidad cero y deja de leerse como un tirón
- Se retiran las tres notas de las capacidades. Una negaba un servicio que sí se presta —pentesting y red team— y las otras dos repetían lo que la página ya dice en otro sitio: que Nexus es la prueba de la cadena completa está en el cierre, y que build vs buy se contrata solo está en su propio CTA
- El detalle de cada capacidad se absorbe en el panal en vez de vivir en otra página. Los seis paneles van en el DOM con cinco `hidden`, no uno renderizado a la vez: si el HTML servido llevara solo la capacidad activa, un Ctrl+F por «LoRaWAN» no lo encontraría salvo que IoT estuviera encendida, y la sección estaría diciendo que absorbió 171 ítems mientras sirve 28. Verificado: los 171 están en el HTML
- Los grupos van en una banda a ancho completo debajo del panal y no en la columna del lado. Ahí las capacidades varían 500 px de alto, y el panal —centrado verticalmente— se desplazaba bajo el cursor en el mismo clic que lo activaba. A ancho completo el rango deja de ser un problema de altura y pasa a ser uno de número de columnas, que la rejilla resuelve sola: el peor caso baja de ~1150 px a 491
- El CTA de cada capacidad deja de navegar. «Ver <capacidad>» perdió su referente al tener el detalle delante —sería un botón que hace scroll a algo que ya se ve—, así que asciende `entrada` («Empieza con un diagnóstico»), que ya estaba escrita como texto de botón y se pintaba como párrafo gris, apuntando al formulario de la misma página
- «Soluciones Integrales» se pinta como cadena y no como grupos: sus ítems son pasos ordenados del dispositivo al dashboard y el orden es lo único que significan. Se ramifica por un campo del dato y no por el slug
- La ronda automática del panal pasa de 3.4 a 4.4 segundos y cambia con el mismo relevo desvanecido que el clic. Se detiene al entrar el puntero o el foco en la sección ENTERA y no solo en la fila del panal: la banda de detalle es hermana de esa fila, y quien esté leyendo sus 171 ítems ya está interactuando aunque no haya tocado una celda
- Las seis capacidades de `/servicios` dejan de ser una lista y pasan a ser un panal: cinco hexágonos alrededor de uno, con el detalle al lado. Las filas anteriores medían lo mismo hasta el decimal —148.1 px las seis, mismo eje, mismo acento—, así que para distinguir una de otra había que leerla y el bloque se leía como un solo ladrillo gris. «Soluciones Integrales» va en el centro porque no es una capacidad hermana, son las otras cinco juntas, y los hexágonos teselan —encajan sin dejar huecos— que es literalmente lo que esa capacidad promete. El hueco que sobra del anillo se deja a la derecha, mirando al panel de detalle
- Cada celda lleva una figura dibujada en SVG que no representa la cosa sino el CAMBIO DE ESTADO que la capacidad produce: una placa extraída de una pila, una retícula vieja redibujada un nivel arriba, puntos dispersos resueltos en un trazo, anillos que decrecen vistos desde el dispositivo, máquinas distintas sobre una sola barra de medición, y cinco placas atravesadas por un hilo sin cortes. Cada celda es una ilustración hexagonal que la ocupa entera: en reposo baja al 42% y manda el rótulo, encendida sube a plena luz, crece y se adelanta sobre sus vecinas. Las figuras dibujadas quedan como reserva para una capacidad sin ilustración. Van rellenas y con trazo grueso porque a 130 px la línea no existe, y el color de cada celda sale de una rampa por POSICIÓN —del azul de las luces del hero en el anillo al hielo del centro— y no de un color por significado: con un solo cian no caben seis escalones legibles. Unos 6 KB de vector, ninguna imagen nueva
- El panal se recorre solo hasta que alguien lo toca y entonces se detiene para siempre. No es un carrusel: un carrusel sigue girando mientras lees y te mueve el texto a media frase. El gesto del visitante —puntero o foco, en el módulo entero— es la pausa, y con `prefers-reduced-motion` no hay ronda

### Removed

- Las seis páginas `/servicios/<slug>`. Su contenido —171 ítems en 2–5 grupos por capacidad, más la introducción y la nota— vive ahora en la propia sección del panal, así que dejaron de tener nada que la página principal no tuviera. Nadie tenía esos enlaces, así que no llevan redirección

### Fixed

- Bajo `prefers-reduced-motion`, la sección de capacidades se ocultaba entera en vez de quedarse quieta: las propias filas estaban en la misma lista de `display: none` que el pulso del diagrama

## [1.13.0] — 2026-09-10

### Added

- La fotografía del hero de `/servicios` se desplaza con el cursor, en contra y a la mitad de velocidad que el árbol: lo que la vista lee como profundidad es el desplazamiento relativo entre los dos planos, no el de cada uno. Siete píxeles como máximo, con una transición casi el doble de lenta —esa pereza es la que le da peso de plano lejano— y un 3% de escala que paga la sobremedida, porque sin ella el desplazamiento destaparía fondo en el borde contrario. No hay recorte del sujeto ni mapa de profundidad: se mueve la imagen entera
- `$lib/contacto.js`: el saneado, la validación, el reCAPTCHA y la llamada al API del formulario, que vivían incrustados en la landing y sin una sola prueba. Los usan los dos formularios del sitio, porque dos copias de esas reglas es cómo se acaba con uno que valida el teléfono y otro que no, o con uno que perdió el token de reCAPTCHA en un refactor. 29 pruebas nuevas y la cobertura global sube de 88.4% a 91.7%
- Despiece de Nexus en el cierre de `/servicios`: la carcasa, su plano, la electrónica y el equipo terminado, con la conectividad, los mapas y los tableros saliendo de él. El párrafo afirma que «Nexus es la prueba: dispositivo, conectividad, streaming, geoproceso, alertas, panel»; la imagen es esa prueba, y la mitad derecha de la sección estaba vacía. El archivo trae alfa de verdad —63.5% transparente— así que no necesita máscara ni velo, y se recortó a la caja del dibujo porque el 36.9% de su ancho era aire vacío a la izquierda: ahí estaba la separación que se veía entre el texto y la pieza. Gira con el puntero, 4° en horizontal y nada en vertical, acompañados de un desplazamiento lateral en el mismo sentido: rotar una lámina sobre su centro mueve sus dos mitades en sentidos opuestos, y eso es lo que delata que detrás no hay un objeto. La perspectiva va lejos, en el contenedor. 182 KB en webp desde 1.2 MB en PNG, en diferido
- Suelo en perspectiva bajo las puertas de «por dónde empezar»: la página entera transcurre sobre una superficie —la mesa del hero, las plataformas del Lab— y las dos tarjetas eran lo único flotando en el vacío. Va como SVG generado por fórmula (~2 KB, sin imagen que descargar) y las tarjetas pasan de translúcidas al 3% a vidrio al 74% con desenfoque de fondo: la rejilla se lee a través de ellas como una superficie tras un cristal, que es el lenguaje del resto de la página
- Atmósfera y señal en «por dónde empezar»: cada puerta lleva un resplandor teal detrás de su prueba —en un punto distinto cada una, para que las dos filas no se lean como la misma tarjeta repetida— y el índice del documento se enciende apartado por apartado, como se escribe. Era la sección más plana de la página, entre un hero con fotografía y un Lab con resplandor propio. El color sale de rango dentro del cian y no de otro tono: el verde es de Nexus, la plata de Orion y el rojo de Signum, y cualquiera de los tres aquí haría que el sitio se leyera como tres empresas. Al puntero la tarjeta sube la luz sin levantarse ni cambiar el cursor, porque lo pulsable es el botón de dentro
- «Por dónde empezar» pasa de dos columnas a dos filas de ancho completo, cada oferta con su texto a un lado y su prueba al otro. Las dos traen volúmenes muy distintos —una acaba en un botón y la otra lleva un diagrama—, así que en columnas la corta dejaba medio metro de hueco debajo; estirarlas a la misma altura abría el mismo vacío pero dentro de la tarjeta. Los seis apartados del diagnóstico dejan de ser una cadena de flechas partida en dos líneas y pasan a ser el índice del documento que se entrega, que dice lo mismo, se lee de un vistazo y le da a esa puerta el peso visual que la otra ya tenía
- Ilustración del recorrido completo en el Innovation Lab de `/servicios`: del boceto de una idea a la electrónica, el dispositivo, la nube y los tableros. Ocupa el ancho del contenedor, el final del texto se monta sobre su banda superior —vacía de lado a lado— y las cinco fases van encima de su borde inferior, cada nombre sobre el tramo que le toca y cubriendo de paso la franja donde el archivo se funde con la sección. El archivo no tiene fondo plano sino un resplandor ancho —de `#01131e` en los costados a `#012c40` en el centro, y sostenido hacia abajo—, así que la sección recibe ese mismo resplandor y la imagen se desvanece con máscara: la diferencia de atmósfera, y no el corte, es lo que dibujaba el rectángulo. 110 KB en webp desde 1.6 MB en PNG, en diferido porque vive al final de la página y no debe competir con el LCP
- Señal animada en el riel de proceso de `/servicios`: una sola partícula lo recorre de «entendemos» a «operamos», tramo por tramo, y a su paso se encienden el nodo, el rótulo y su descripción. Lo que recorre el riel no es un adorno: es la lectura del proceso paso por paso. Una por tramo corriendo a la vez leería los cinco pasos como simultáneos, que es justo lo que un proceso no es. El ciclo se reparte en cinco franjas para cuatro tramos: la quinta es la pausa del final, sin la cual el recorrido se leería como un bucle sin principio. Se apaga con `prefers-reduced-motion`
- Parallax y foco en el árbol de `/servicios`: el puntero mueve cada nodo según tres factores —su capa, su altura en el árbol y su cercanía al puntero— y el nodo más cercano se enciende junto con la rama que lo alimenta. El foco no usa `:hover` porque las piezas son PNG con resplandor transparente alrededor y sus cajas se solapan: el puntero picaría el rectángulo de un vecino invisible antes que el dibujo visible, así que se ilumina el nodo cuyo centro está más cerca. Las coordenadas se escriben como custom properties sobre el contenedor y no como estado, un `requestAnimationFrame` por fotograma como máximo. La altura ancla el árbol a la mesa —la raíz se desplaza 0.9 px y las hojas de la copa 14— y la cercanía lo vuelve local: la pieza bajo el cursor recorre unos 6 px y las del extremo opuesto menos de 1, en vez de desplazarse las quince en bloque. En táctil no se activa —el dedo no tiene hover— y con `prefers-reduced-motion` se va el desplazamiento y se queda el foco
- Árbol tecnológico en el hero de `/servicios`: quince piezas y nueve ramas montadas sobre la fotografía, en un sistema de coordenadas 0–100 que vive en `arbolNodos` y `arbolRamas`, no en el marcado. La silueta crece por niveles —la copa alcanza x≈20/78 y la base x≈−11/101— porque es esa progresión, y no el tamaño de las piezas, la que hace que se lea como un árbol; las ramas bajan al alejarse del tronco, que horizontales dejaban el conjunto como candelabro. Las ocho imágenes vienen recoloreadas al cian de marca en el archivo (RGB→HLS con el tono fijo en 189°, conservando saturación y luminosidad) y no con `hue-rotate`, que es una aproximación matricial y sobre verdes saturados devuelve morados. 400 KB en webp. El pulso que recorre las ramas se apaga con `prefers-reduced-motion`
- Fotografía en el hero de `/servicios`: alguien colocando una pieza sobre una mesa, con la ciudad de noche detrás. La metáfora es la que se vende — tú decides, nosotros construimos — y la mitad derecha queda reservada, ya como celda de la rejilla, para el árbol tecnológico que viene después. 73 KB en webp desde 1.6 MB en PNG, servida como `<img>` con `fetchpriority="high"` por ser el elemento mayor de la primera pantalla
- Diagrama del CTO as a Service en `/servicios`: tu empresa entra por arriba, la decisión pasa por una sola cabeza técnica y sale hacia los tres frentes donde se pierde el dinero — equipo, proveedores y tecnología. Va como SVG en línea y no como imagen: escala sin pixelarse, hereda la paleta de la sección y se anima con el mismo pulso de señal que la landing. Es decorativo —lo que dice ya está en la lista de arriba— así que queda fuera del árbol de accesibilidad, y el pulso se apaga con `prefers-reduced-motion`
- Checkout Stripe with server-quoted prices, tax profile, and on-demand CFDI in the billing panel
- Data Processing Agreement (`docs/legal/05-Convenio-de-Tratamiento-de-Datos-Personales`), signed with each client as Annex E of the Master Agreement. It is what contractually sustains the processor role the privacy notice describes; without it, the obligations placed on the client are a unilateral statement
- Retention specification for the team implementing data purging (`docs/legal/retencion-plazos-declarados.md`): the periods already published, four technical constraints found in the code, and acceptance criteria
- Third scenario in the privacy notice for individuals contracting for personal or household use, where Geminis Labs is the controller of everything including geolocation. Mexican data protection law does not reach individuals processing data for exclusively personal use, so no obligation can be passed to them
- Fourth scenario for partners reselling or white-labelling the platform, who act as controllers towards their own end customers
- Consumer carve-out in the jurisdiction clauses of the terms and the legal notice, mirroring clause 22.2 of the Master Agreement: a consumer may choose between their own domicile and Geminis Labs', and may turn to PROFECO
- `/legal/cookies` page, with a per-identifier inventory of everything NEXUS and Signum store in the browser. There was no cookie policy at all; the privacy notice covered the topic in two lines
- Single-source generation for the legal documents: one generator emits both the `.docx` under `docs/legal/` that counsel reviews and the content modules under `src/routes/legal/content/` that the site renders, so the published page and the reviewed document cannot drift apart
- `LegalDocument.svelte`, a shared renderer for the four legal pages (hero, sticky TOC, numbered sections, tables, callouts). Inline markup is tokenised rather than passed through `{@html}`
- Table and ordered-list styles in `legal.css`. Tables scroll inside their own box instead of forcing the page to scroll horizontally on a phone
- Product annexes in the privacy notice: NEXUS (geolocation processed on the client's behalf), Signum (health data published openly), Orion (system-to-system infrastructure)
- Signum as a third product on the landing page, with its own theme, background, and ECG animation behind the chips
- Product rail on the landing: the three brands are always visible, each with logo, name, and a functional descriptor. Replaces the tab selector that kept two of the three products hidden
- `src/lib/data/products.js` as the single source for the product catalogue, plus its unit tests
- E2E regression tests for product discoverability, including keyboard reachability of all three products
- "Zona de peligro" card in the profile view, with account-deletion confirmation modal
- Phase 3 quality gates: coverage thresholds (90% lines/statements/functions on `src/lib/**`), blocking e2e and audit CI jobs
- Dependabot version updates for npm, GitHub Actions, and Docker (`.github/dependabot.yml`)
- OSV-Scanner dependency scan (`scripts/osv-scan.sh`, `npm run scan:osv`)
- `.github/CODEOWNERS` and `docs/GOVERNANCE.md` (branch protection checklist)
- Coverage artifact upload in CI
- Expanded unit tests for services, stores, and utils (~150 tests)
- Engineering foundation docs: `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.editorconfig`, `.nvmrc`

### Changed

- El diagnóstico tecnológico deja de ser una página aparte y se integra al final de `/servicios`, con su formulario propio. El embudo eran tres navegaciones —servicios, diagnóstico, contacto— antes de que nadie pudiera escribir una letra. De la página vieja se conserva lo que el hub no podía decir —las seis situaciones en las que el visitante se reconoce y los ocho frentes que se revisan— y se descarta lo que ya repetía: los apartados del entregable viven en la puerta de «por dónde empezar» y los ocho frentes se solapaban con las seis capacidades. `/servicios/diagnostico` queda como redirección 301 al ancla nueva, porque la URL está en enlaces que no controlamos y en lo que Google ya indexó
- Declared two processors that were missing, both verified in code: **Amazon Cognito** for identity management (`siscom-admin-api`, user pool in us-east-1) and **KORE Wireless (SuperSIM)** for cellular connectivity and SMS commands to units (`app/services/kore.py`). Mobile network operators are described as carriers of the communication, which is what they are
- Corrected a false statement in the privacy notice: passwords are not "protected by key derivation functions", they are **not stored at all**. Authentication has been fully delegated to Cognito since migration `004` of siscom-admin-api. The real posture is better than the one being declared
- Legal pages rewritten under the LFPDPPP published in the DOF on 20 March 2025, with the Secretaría Anticorrupción y Buen Gobierno as the supervisory authority. The previous text predated the reform and named neither
- Geolocation is no longer described as "possibly sensitive depending on use". Article 3 of the LFPDPPP lists sensitive data exhaustively and location is not on it. The privacy notice and the terms said different things about the same category
- Privacy notice now distinguishes when Geminis Labs acts as **responsable** (account holders' data) from when it acts as **encargado** (fleet geolocation, where the client is the responsable). The obligations that fall on the client — issuing its own notice, obtaining written consent from drivers, limiting monitoring to working hours — follow from that distinction
- Named the actual processors and where they run: AWS EC2/S3 and SES (us-east-1), Google Maps, Firebase Cloud Messaging, Apple APNs and Stripe, all in the United States. The previous text said "may be processed outside your country of residence"
- Stated retention periods: 3 months for raw telemetry, 12 for per-device aggregates and audit logs, 5 years for tax records and consent records. The previous text said periods "may vary by product"
- Privacy enquiries now point at `privacidad@geminislabs.com` instead of `contacto@`
- Jurisdiction set to Querétaro, Querétaro; ARCO deadlines (20 working days plus 15) and the supervisory authority spelled out
- Terms keep their existing commercial scope — third-party telemetry, APIs/TCP/MQTT, partner and white-label, alerts, indemnity — and add lawful-monitoring obligations and a cross-reference to Signum's own terms
- Product card is 13% shorter and matches the width of the "El futuro que estamos construyendo" card (1280px); it previously stretched to 2400px on large monitors
- Arrow-key navigation on the product selector now cycles the catalogue; the previous binary ternary made a third product unreachable by keyboard
- Nexus CTA now uses dark ink: white on `#5fd158` measured 1.95:1, an AA failure on the section's conversion element
- Product logo is no longer a focusable link inside an `aria-hidden` subtree
- Signum listed in the footer alongside Nexus and Orion
- Hero particle canvas is not mounted on mobile (≤600px), where only the static logo is shown
- `npm run validate` now runs `test:coverage` with enforced thresholds
- CI `e2e` and `audit` jobs are blocking (removed `continue-on-error`)
- `apiClient.delete()` for organization user removal
- CI guardrails workflow: lint, type-check, coverage, audit, Gitleaks, Semgrep
- Separate `deploy.yml` for tag-based EC2 deployments
- Phase 2 (soft): DevContainer, `npm run validate`, unit test scaffolding, Playwright smoke e2e (informational CI)
- ADRs (`docs/adr/`), threat model (`docs/security/threat-model.md`), GitHub issue templates
- `sessionExpiredHandler` to isolate 401 handling from `apiClient`
- Split monolithic GitHub Actions workflow into `ci.yml` (quality gates) and `deploy.yml` (releases)
- Enriched pull request template with changelog and base-branch checks
- Updated deploy GitHub Actions to current major versions (`actions/checkout@v5`, `docker/setup-buildx-action@v4`, `docker/build-push-action@v7`) to align with Node 24 runtime
- Renamed deploy Docker image/container from `tracker-web(-test)` to `geminislabs-web` in EC2 deployment flow
- Refactored Docker build to inject `VITE_RECAPTCHA_SITE_KEY` via BuildKit secrets instead of `ARG`/`ENV` in `Dockerfile`

### Removed

- Dead scoped CSS from `src/routes/+page.svelte` (zero `css_unused_selector` build warnings)
- Unused `.alert--demo` styles from billing payment-methods page

### Fixed

- Las etiquetas de tecnologías y los ocho frentes del diagnóstico dejan de mostrar cursor de texto. Una píldora con borde se lee como control, y el cursor de texto encima la hace parecer a la vez seleccionable y pulsable, que no es ninguna de las dos
- Las tarjetas de «por dónde empezar» se estiraban a la misma altura, así que la de diagnóstico —más corta— quedaba con un vacío enorme entre su texto y el botón, que va anclado abajo. Ahora cada una toma su alto natural
- Deploy no longer runs `docker container prune` and `docker volume prune` on the EC2 host. Both sweep the entire machine, which is shared with `siscom-api`, `siscom-admin-api` and a Valkey container holding data-token scope state, and neither reclaimed anything belonging to this project: the web container is already removed by name a few lines above, and the image is static and creates no volumes. `docker image prune` stays, since dangling images are where the disk actually goes
- Nexus product page CTAs now point to `/#contacto` (the contact form lives on the home page; `#contacto` on `/products/nexus` was a dead hash). Fleet CTA label is "Solicitar una demo". Fleet ROI card no longer mentions Excel
- Account-deletion confirmation dialog is keyboard-accessible: `tabindex`, Escape to dismiss, and an `aria-labelledby` title

### Security

- Cleared eight advisories that CI started reporting after `v1.11.0` shipped, without a single source change: `qs` 6.15.2 → 6.16.0, `fast-uri` 4.1.2 → 4.1.4, `postcss-selector-parser` 7.1.1 → 7.1.6 and `@humanfs/node` 0.16.7 → 0.16.8. `npm audit fix` resolved all of them without `--force` and without a major bump, so only `package-lock.json` changed. `qs` is the one that sits in the production dependency tree (`pixi.js` → `@pixi/utils` → `url`); the other three are build tooling
- Raised the `nanoid` override to `^3.3.18` (GHSA-2v37-7h3g-55p8). The lockfile resolved to 3.3.16, which made `npm run audit --audit-level=high` fail
- Raised the `fast-uri` override from `>=3.1.4` to `>=4.1.2`. The former resolved to 4.1.1, affected by GHSA-7p8r-x3mc-p8w7, which made `npm run audit` fail on every pull request — all four open Dependabot PRs were red for a reason unrelated to what they were bumping
- Added `.claude/` to `.prettierignore`. It is in `.gitignore` but Prettier still checked it, so `prettier --check .` failed locally on an unversioned file and, because the lint script chains with `&&`, eslint never ran at all
- Cleared all 13 known dependency vulnerabilities reported by `npm audit` and OSV-Scanner (1 critical, 10 high, 2 medium), all in dev dependencies
- Bumped `@sveltejs/kit` to `^2.69.1` and the `vitest` family (`vitest`, `@vitest/coverage-v8`, `@vitest/browser`) to `^3.2.7`
- Added `overrides` for `brace-expansion`, `minimatch`, `fast-uri`, `js-yaml`, and raised the `postcss` floor to `>=8.5.18`. `minimatch` has to move to `>=10.2.6` alongside `brace-expansion@>=5`, since v5 switched from a default to a named export and older `minimatch` calls it as a default

## [1.12.1] — 2026-09-10

### Added

- 48 tests nuevos sobre las rutas de error de `billingService`, `authStore` y `userStore`: qué ocurre cuando el backend responde mal, cuando el servicio lanza y cuando el cuerpo no es JSON. En un módulo de pagos ese es el comportamiento que no puede romperse en silencio. También quedan cubiertos los stores derivados, que son los que consumen los componentes

### Changed

- Vitest 4 mide la cobertura con remapeo AST y no admite volver al método anterior, así que las métricas bajaron con el mismo código. En vez de recalibrar los umbrales de [GOVERNANCE.md](docs/GOVERNANCE.md) se escribieron los tests que faltaban: statements 83.6% → 91.03%, funciones 83.92% → 92.94%, líneas 88.8% → 94.64%
- El `include` de cobertura pasa de `src/lib/**` a `src/lib/**/*.{js,ts}`: vitest 4 intentaba parsear los `.css` y `.md` de `src/lib/styles` y emitía un `PARSE_ERROR` por cada uno

### Security

- `maplibre-gl` eliminada. Resolvía [GHSA-jrc7-96c5-q579](https://osv.dev/GHSA-jrc7-96c5-q579) (CVSS 10.0, bypass del sanitizador XSS) sin subir a la major 6.x: la dependencia no se importaba en ningún archivo del repositorio, los mapas usan `@googlemaps/js-api-loader`
- `vitest` y `@vitest/coverage-v8` a 4.x, que resuelve [GHSA-82fw-gwwq-j7x9](https://osv.dev/GHSA-82fw-gwwq-j7x9) (path traversal, solo desarrollo). `npm audit` y OSV quedan ambos limpios

### Removed

- `@vitest/browser`, `vitest-browser-svelte`, `vitest-setup-client.js` y `src/routes/page.svelte.spec.js`. Fijaban los peers de vitest en la 3.x e impedían la actualización, y eran andamiaje: browser mode nunca estuvo configurado (`vite.config.js` usa `happy-dom`) y ese spec —el demo que trae SvelteKit— estaba excluido por config, así que nunca llegó a ejecutarse

## [1.12.0] — 2026-09-10

### Added

- Module docs for the new routes (`docs/architecture/modules/servicios.md`, `products-nexus-partners.md`), plus the index diagram and `home.md` brought up to date with the new section order, the shared data sources, and the two unscoped global stylesheets a future author needs to know about before adding an `nx-*` class
- `/servicios/[slug]`: one template serving all six capability pages, with the full detail the grouping hides — the source document's thirteen areas survive here, 100+ services across the six. An unknown slug is a real 404, not an empty shell that Google would index. Each page links to its neighbours with wraparound, so the six can be toured without returning to the hub
- `/servicios`: the consulting hub. The thirteen areas of the source document grouped into six capabilities, presented as full-bleed rows that expand rather than a third grid — the landing already has the 2×2 technology layers and the five area badges, and one more grid would read as more of the same. The ENTENDEMOS → OPERAMOS flow is a 1px process rail, not five more cards
- `/servicios/diagnostico`: the commercial entry point. What gets reviewed, who it is for, and the deliverable the source document specifies — state, risks, opportunities, recommended architecture, roadmap, investment estimate
- `src/lib/data/services.js`: the six capabilities with promises written in customer language, plus the process steps. Its test asserts jargon stays out of the promise — the reader is an operations director, not an architect
- Services teaser on the landing between the technology and product sections, and a Servicios column in the footer. The narrative now runs: what we are → what we can do → what we do for you → what we have built
- `src/lib/styles/tokens.css`, now that there is something to consume it: the services palette belongs to neither the landing nor `nexus.css`. The deep blue-teal is deliberately none of the three product blacks — green, silver and red belong to Nexus, Orion and Signum, and a services page wearing one would read as a different company
- `/products/nexus/partners`: the technical page for integrators. Protocols (TCP, MQTT, REST, webhooks) with what each one is for, accepted payload formats, what white-label actually includes, and the onboarding timeline. The partner story existed only inside the Nexus product page — two clicks and 1200 lines of scroll down, with no URL of its own — so it could not be sent to a prospect
- `src/lib/data/nexusModels.js`: the three ways to have Nexus (subscription, Nexus Connect, Nexus Platform) as a single source read by the landing card, the Nexus page and the partners route. The copy now lives in two pages by design, so shared data is what keeps them from drifting apart
- Contract-model band in the landing product panel. It is a fixed slot in all three products and only the number of pills varies, so SaaS and white-label sit at the same hierarchical level as Signum's "one-time purchase" instead of being the eleventh chip
- Audience line ("para quién") on each product rail cell. The rail is the only place a visitor reads all three products at once

### Changed

- Services section moved below Products and rebuilt around an annotated isometric illustration (`static/img/servicios-cadena.webp`, 149 KB). The illustration ships with a real alpha channel: its background was removed from the file itself, deriving transparency from luminance against a per-block model of the artwork's own background gradient. Matching the section colour could never work — the artwork carries its own gradient, from #000911 in one corner to #001b29 in another, so no flat backdrop matches the whole rectangle at once. With alpha there is no rectangle to hide, and the section can be recoloured later without the seam coming back. Costs 352 KB against 145 KB opaque, lazy-loaded below the fold. The text column overlaps the illustration, which slides underneath it. A signal pulse travels down each leader line from label to drawing, the rings beat in phase with it, and a faint second glow drifts behind the scene — the section was the only one on the landing with no motion at all, and a pulse of telemetry moving from device to dashboard is what the platform actually does. All three stop under `prefers-reduced-motion`. Five callouts anchored in percentages over the image so they scale with it — each opens with a ring, hangs its label to the right of the guide line, and the line fades out as it reaches the illustration rather than ending in a marker; below 1200px they turn off and the same content reads as a list. The 3×2 capability grid is gone — it repeated the reading gesture of "Tecnologías que convergen" directly above it, and three of the six capabilities mirrored those layers, so the section carried no new information at that point in the scroll. The position matters for the copy too: "También construimos la tecnología de otros" needs the visitor to have seen the products for "también" to have an antecedent
- Process rail (Entendemos → Diseñamos → Construimos → Integramos → Operamos) added to the landing as a full-width row. It is the one piece of the services story that is not duplicated elsewhere on the page, and it is what demonstrates the "un solo equipo, de la estrategia a producción" the lead promises
- Services teaser CTAs: "Ver las seis capacidades" and "Empezar por un diagnóstico". The previous secondary read "¿Prefieres empezar con un diagnóstico?" — a CTA offers, it does not ask permission
- Landing product panel rebuilt around what a visitor actually asks, in order: what it is (`oneLiner`, twelve words or fewer), whether it is for them (`problem`), what they would have to do (`howItWorks`, three steps), how it is bought (`models`) and whether it is real (`proof`). The previous schema — a 45-word subtitle over twelve chips of identical weight — answered none of them well, and left the three panels with the same silhouette
- Commercial names for the partner modalities: Nexus Connect (own hardware) and Nexus Platform (own brand). "Telemetry as a Service" is not what a buyer searches for, and it forced explaining two brands to sell one. The acronym stays as the technical term in the detail line, never as the hook — all three modalities are SaaS, so labelling only Connect as such reads imprecise
- FAQ answers for Geminis TaaS and white-label now carry the commercial names and link to `/products/nexus/partners`, and the footer points Signum at its own route instead of straight off-domain
- Nexus product page partner card: commercial names and a "Ver detalles técnicos" link, reusing the sub-note pattern the family card already uses. The three-card section is otherwise untouched
- Navbar labels now match the sections they point to, and the stray `#servicios` anchor inside "¿Qué es Geminis Labs?" is renamed `#nosotros`, freeing `/servicios` for the consulting page

### Fixed

- Landing product panel painted a white block on hover over "Explorar Nexus". `nexus.css` is a plain global stylesheet, and SvelteKit preloads a route's CSS when the pointer enters a link to it, so hovering the CTA loaded the Nexus page's styles site-wide. Its `.nx-proof` (the product page's social-proof band, `background: #f2f4f7`) then painted over the landing's own `.nx-proof`. Svelte's scoping stops a component's styles leaking out, not global styles leaking in. The landing's two colliding classes are renamed `.nx-evidence` and `.nx-slide`; `nexus.css` is left untouched. The second collision, `.nx-panel`, was latent since before this change and was also forcing `overflow: hidden` and `cursor: pointer` onto the active product panel
- Hero CTA promised "Descubre Nuestros Servicios" and anchored to the "¿Qué es Geminis Labs?" section. It now points at `/servicios`, which exists
- `.nx-kicker` contrast: `rgba(10,37,64,.55)` on `#eceff2` at 0.72rem is ≈4.3:1, below AA
- Services teaser stretched to a full viewport height with its content floating in the middle, from the unscoped `section { min-height: 100vh; display: flex; align-items: center }` in `login-page.css` leaking site-wide. The new pages already neutralised it; the landing section did not
- Contract-model pills showed a text cursor and lifted on hover, reading as clickable when they are not
- Capability detail rows kept their link in the tab order while collapsed. `grid-template-rows: 0fr` clips the content but does not remove it from focus, so a keyboard user landed on an invisible link; the panel is now `inert` when closed
- Footer linked to `/docs`, which does not exist. Replaced with the new partners route until documentation is real
