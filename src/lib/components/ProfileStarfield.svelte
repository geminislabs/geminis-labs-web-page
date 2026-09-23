<script>
	import { onMount, onDestroy } from 'svelte';
	import '$lib/styles/profile-starfield.css';

	// Props
	export let isActive = false;

	// Variables para el parallax del cursor
	let starfieldContainer;
	let backgroundLayer;
	let midLayer;
	let foregroundLayer;
	let logoElement;

	let currentTheme = 'default'; // eslint-disable-line no-unused-vars
	let mouseX = 0;
	let mouseY = 0;
	let isMouseActive = false; // eslint-disable-line no-unused-vars
	let animationFrame;
	let returnToOriginTimeout;

	// Configuración del parallax
	const parallaxConfig = {
		background: { intensity: 0.05, maxOffset: 8 },
		mid: { intensity: 0.12, maxOffset: 15 },
		foreground: { intensity: 0.25, maxOffset: 20 },
		logo: { intensity: 0.03, maxOffset: 5 }
	};

	onMount(() => {
		if (typeof window !== 'undefined') {
			setupParallaxInteraction();
			setupThemeListener();
			// Detectar tema inicial
			detectCurrentTheme();
		}
	});

	onDestroy(() => {
		cleanup();
		removeThemeListener();
	});

	function setupParallaxInteraction() {
		// Obtener referencias a los elementos
		backgroundLayer = starfieldContainer?.querySelector('.stars-background-layer');
		midLayer = starfieldContainer?.querySelector('.stars-mid-layer');
		foregroundLayer = starfieldContainer?.querySelector('.stars-foreground-layer');
		logoElement = starfieldContainer?.querySelector('.geminis-logo-cosmic');

		// Agregar clases de transición
		if (backgroundLayer) backgroundLayer.classList.add('cursor-parallax-bg');
		if (midLayer) midLayer.classList.add('cursor-parallax-mid');
		if (foregroundLayer) foregroundLayer.classList.add('cursor-parallax-fg');
		if (logoElement) logoElement.classList.add('cursor-parallax-logo');

		// Event listeners
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseleave', handleMouseLeave);
	}

	function handleMouseMove(event) {
		if (!isActive || !starfieldContainer) return;

		const rect = starfieldContainer.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		// Calcular posición relativa del cursor (normalizada entre -1 y 1)
		mouseX = (event.clientX - centerX) / (rect.width / 2);
		mouseY = (event.clientY - centerY) / (rect.height / 2);

		// Limitar valores
		mouseX = Math.max(-1, Math.min(1, mouseX));
		mouseY = Math.max(-1, Math.min(1, mouseY));

		isMouseActive = true;

		// Cancelar timeout de retorno al origen
		if (returnToOriginTimeout) {
			clearTimeout(returnToOriginTimeout);
		}

		// Aplicar parallax
		animationFrame = requestAnimationFrame(updateParallax);
	}

	function handleMouseLeave() {
		isMouseActive = false;

		// Retornar suavemente al origen después de un breve delay
		returnToOriginTimeout = setTimeout(() => {
			mouseX = 0;
			mouseY = 0;
			animationFrame = requestAnimationFrame(updateParallax);
		}, 300);
	}

	function updateParallax() {
		if (!isActive) return;

		// Calcular offsets para cada capa (movimiento opuesto al cursor)
		const bgOffsetX = -mouseX * parallaxConfig.background.maxOffset;
		const bgOffsetY = -mouseY * parallaxConfig.background.maxOffset;

		const midOffsetX = -mouseX * parallaxConfig.mid.maxOffset;
		const midOffsetY = -mouseY * parallaxConfig.mid.maxOffset;

		const fgOffsetX = -mouseX * parallaxConfig.foreground.maxOffset;
		const fgOffsetY = -mouseY * parallaxConfig.foreground.maxOffset;

		const logoOffsetX = -mouseX * parallaxConfig.logo.maxOffset;
		const logoOffsetY = -mouseY * parallaxConfig.logo.maxOffset;

		// Aplicar transformaciones
		if (backgroundLayer) {
			backgroundLayer.style.transform = `translate(${bgOffsetX}px, ${bgOffsetY}px)`;
		}

		if (midLayer) {
			midLayer.style.transform = `translate(${midOffsetX}px, ${midOffsetY}px)`;
		}

		if (foregroundLayer) {
			foregroundLayer.style.transform = `translate(${fgOffsetX}px, ${fgOffsetY}px)`;
		}

		if (logoElement) {
			logoElement.style.transform = `translate(-50%, -50%) translate(${logoOffsetX}px, ${logoOffsetY}px)`;
		}
	}

	function cleanup() {
		if (typeof window !== 'undefined') {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseleave', handleMouseLeave);
		}

		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}

		if (returnToOriginTimeout) {
			clearTimeout(returnToOriginTimeout);
		}
	}

	// Funciones para manejo de temas dinámicos
	function detectCurrentTheme() {
		if (typeof document !== 'undefined') {
			const theme = document.documentElement.getAttribute('data-theme') || 'default';
			currentTheme = theme;
		}
	}

	function setupThemeListener() {
		if (typeof document !== 'undefined') {
			document.addEventListener('themeChanged', handleThemeChange);
		}
	}

	function removeThemeListener() {
		if (typeof document !== 'undefined') {
			document.removeEventListener('themeChanged', handleThemeChange);
		}
	}

	function handleThemeChange(event) {
		currentTheme = event.detail.theme;
		// La transición se maneja automáticamente por CSS
	}

	// Reactivar el parallax cuando cambie isActive
	$: if (isActive && starfieldContainer) {
		setupParallaxInteraction();
	} else if (!isActive) {
		// Resetear posiciones cuando se desactive
		if (backgroundLayer) backgroundLayer.style.transform = '';
		if (midLayer) midLayer.style.transform = '';
		if (foregroundLayer) foregroundLayer.style.transform = '';
		if (logoElement) logoElement.style.transform = '';
	}
</script>

<!-- Fondo estrellado para Mi Perfil -->
<div class="profile-starfield {isActive ? 'active' : ''}" bind:this={starfieldContainer}>
	<!-- Gradiente base espacial -->
	<div class="starfield-base-gradient"></div>

	<!-- Overlay de profundidad -->
	<div class="starfield-depth-overlay"></div>

	<!-- Capa de neblina dinámica - se adapta al tema activo -->
	<div class="starfield-dynamic-haze"></div>

	<!-- Capa de brillo ambiental dinámico -->
	<div class="starfield-ambient-glow"></div>

	<!-- Capa 1: Estrellas lejanas -->
	<div class="stars-background-layer"></div>

	<!-- Capa 2: Estrellas medias -->
	<div class="stars-mid-layer"></div>

	<!-- Capa 3: Estrellas cercanas -->
	<div class="stars-foreground-layer"></div>

	<!-- Logo central de Geminis Labs -->
	<div class="geminis-logo-cosmic"></div>

	<!-- Constelación de Géminis -->
	<div class="gemini-constellation-lines">
		<div class="constellation-connection connection-1"></div>
		<div class="constellation-connection connection-2"></div>
		<div class="constellation-connection connection-3"></div>
		<div class="constellation-connection connection-4"></div>
		<div class="constellation-connection connection-5"></div>

		<!-- Nodos de conexión -->
		<div class="constellation-node node-1"></div>
		<div class="constellation-node node-2"></div>
		<div class="constellation-node node-3"></div>
		<div class="constellation-node node-4"></div>
		<div class="constellation-node node-5"></div>
	</div>
</div>

<style>
	/* Estilos específicos del componente si es necesario */
	:global(.profile-starfield) {
		/* Asegurar que el fondo no interfiera con el contenido */
		pointer-events: none;
	}

	:global(.profile-starfield.active) {
		/* Activar pointer events solo cuando esté activo para el parallax */
		pointer-events: auto;
	}
</style>
