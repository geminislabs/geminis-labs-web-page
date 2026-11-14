<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import AccountSwitch from '$lib/components/AccountSwitch.svelte';

	let mobileMenuOpen = false;
	let innerWidth;
	let scrollY;

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
		}
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	}

	onMount(() => {
		const handleKeydown = (e) => {
			if (e.key === 'Escape' && mobileMenuOpen) closeMobileMenu();
		};
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		};
	});

	function getLinkHref(hash) {
		if (page.url.pathname === '/') return hash;
		return `/${hash}`;
	}

	const navLinks = [
		{
			href: '#inicio',
			label: 'Inicio',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
		},
		{
			href: '/servicios',
			label: 'Servicios',
			external: true,
			icon: 'M11.049 2.927c-.3-.921-1.603-.921-1.902 0l-1.07 3.292a1 1 0 01-.95.69H3.61c-.969 0-1.371 1.24-.588 1.81l2.8 2.034a1 1 0 01.364 1.118l-1.07 3.292c-.3.921.755 1.688 1.54 1.118l2.8-2.034a1 1 0 011.175 0l2.8 2.034c.784.57 1.838-.197 1.539-1.118l-1.07-3.292a1 1 0 01.363-1.118l2.8-2.034c.784-.57.38-1.81-.588-1.81h-3.461a1 1 0 01-.951-.69l-1.07-3.292z'
		},
		{
			href: '#nosotros',
			label: 'Nosotros',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
		},
		{
			href: '#tecnologias',
			label: 'Tecnología',
			icon: 'M13 10V3L4 14h7v7l9-11h-7z'
		},
		{
			href: '#productos',
			label: 'Productos',
			icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
		},
		{
			href: '#futuro',
			label: 'Futuro',
			icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
		},
		{
			href: '#contacto',
			label: 'Contacto',
			icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
		}
	];
</script>

<svelte:window bind:scrollY bind:innerWidth />

<!-- Backdrop oscuro cuando el drawer está abierto -->
<div
	class="mobile-backdrop"
	class:is-open={mobileMenuOpen}
	on:click={closeMobileMenu}
	aria-hidden="true"
></div>

<!-- Navbar principal -->
<nav class="navbar" class:scrolled={scrollY > 20}>
	<div class="nav-container">
		<!-- Logo -->
		<div class="nav-logo">
			<a href="/">
				<picture>
					<img src="/img/geminis-labs-logo-short.png" alt="Geminis Labs Logo" />
				</picture>
				<h1>Geminis Labs</h1>
			</a>
		</div>

		<!-- Menú de escritorio -->
		<ul class="nav-menu desktop-menu">
			{#each navLinks as link (link.href)}
				<li>
					<a href={link.external ? link.href : getLinkHref(link.href)} on:click={closeMobileMenu}
						>{link.label}</a
					>
				</li>
			{/each}
		</ul>

		<!-- Acciones -->
		<div class="nav-actions">
			<AccountSwitch />
			<button
				class="hamburger"
				class:is-open={mobileMenuOpen}
				on:click={toggleMobileMenu}
				aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
				aria-expanded={mobileMenuOpen}
			>
				<span class="bar b1"></span>
				<span class="bar b2"></span>
				<span class="bar b3"></span>
			</button>
		</div>
	</div>
</nav>

<!-- Drawer móvil (slide desde la derecha) -->
<aside class="mobile-drawer" class:is-open={mobileMenuOpen} aria-label="Navegación móvil">
	<!-- Línea de acento animada en la parte superior -->
	<div class="drawer-accent-line"></div>

	<!-- Cabecera del drawer -->
	<div class="drawer-header">
		<div class="drawer-brand">
			<img src="/img/geminis-labs-logo-short.png" alt="" width="28" height="28" />
			<span>Geminis Labs</span>
		</div>
		<button class="drawer-close-btn" on:click={closeMobileMenu} aria-label="Cerrar">
			<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	</div>

	<!-- Separador -->
	<div class="drawer-sep"></div>

	<!-- Links de navegación -->
	<nav class="drawer-nav">
		{#each navLinks as link, i (link.href)}
			<a
				href={link.external ? link.href : getLinkHref(link.href)}
				class="drawer-link"
				style="--delay: {i * 55}ms"
				on:click={closeMobileMenu}
			>
				<span class="drawer-link-ico">
					<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={link.icon} />
					</svg>
				</span>
				<span class="drawer-link-text">{link.label}</span>
				<svg
					class="drawer-link-chevron"
					width="13"
					height="13"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		{/each}
	</nav>

	<!-- Footer del drawer -->
	<div class="drawer-footer">
		<div class="drawer-footer-copy">© 2026 Geminis Labs · Todos los derechos reservados</div>
	</div>
</aside>

<style>
	/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	   NAVBAR BASE
	━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background: var(--color-bg-primary);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid var(--glass-border);
		transition: all 0.3s ease;
	}

	.navbar.scrolled {
		background: rgba(13, 18, 28, 0.96);
		border-bottom-color: rgba(0, 166, 192, 0.15);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	/* Logo */
	.nav-logo {
		display: flex;
		align-items: center;
	}

	.nav-logo a {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		text-decoration: none;
	}

	.nav-logo img {
		height: 44px;
		width: 44px;
		object-fit: contain;
	}

	.nav-logo h1 {
		font-family:
			'Dune Rise',
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
		font-size: 1.75rem;
		font-weight: 400;
		color: var(--color-accent-primary);
		text-shadow: 0 0 20px rgba(0, 166, 192, 0.5);
		margin: 0;
	}

	/* Menú desktop */
	.nav-menu {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: 2rem;
	}

	.nav-menu li a {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		font-size: 0.9375rem;
		font-weight: 500;
		transition: all 0.3s ease;
		position: relative;
		padding: 0.5rem 0;
	}

	.nav-menu li a::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 0;
		height: 2px;
		background: linear-gradient(90deg, #00a6c0, #21e68c);
		border-radius: 1px;
		transition: width 0.3s ease;
	}

	.nav-menu li a:hover {
		color: #ffffff;
	}

	.nav-menu li a:hover::after {
		width: 100%;
	}

	/* Acciones */
	.nav-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	   HAMBURGER
	━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
	.hamburger {
		display: none;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 5px;
		width: 44px;
		height: 44px;
		background: rgba(0, 166, 192, 0.08);
		border: 1px solid rgba(0, 166, 192, 0.2);
		border-radius: 10px;
		cursor: pointer;
		padding: 0;
		z-index: 1002;
		transition:
			background 0.25s ease,
			border-color 0.25s ease,
			transform 0.2s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.hamburger:hover {
		background: rgba(0, 166, 192, 0.18);
		border-color: rgba(0, 166, 192, 0.45);
	}

	.hamburger:active {
		transform: scale(0.94);
	}

	.bar {
		display: block;
		width: 19px;
		height: 1.75px;
		background: var(--color-accent-primary);
		border-radius: 2px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: center;
	}

	.hamburger.is-open .b1 {
		transform: translateY(6.75px) rotate(45deg);
	}

	.hamburger.is-open .b2 {
		opacity: 0;
		transform: scaleX(0);
	}

	.hamburger.is-open .b3 {
		transform: translateY(-6.75px) rotate(-45deg);
	}

	/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	   BACKDROP
	━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
	.mobile-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		z-index: 1000;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.35s ease;
	}

	.mobile-backdrop.is-open {
		opacity: 1;
		pointer-events: all;
	}

	/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	   MOBILE DRAWER
	━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
	.mobile-drawer {
		position: fixed;
		top: 0;
		right: -100%;
		width: min(340px, 90vw);
		height: 100dvh;
		background: rgba(7, 11, 20, 0.98);
		border-left: 1px solid rgba(0, 166, 192, 0.18);
		z-index: 1001;
		display: flex;
		flex-direction: column;
		transition: right 0.38s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: -16px 0 48px rgba(0, 0, 0, 0.55);
		visibility: hidden;
		overflow: hidden;
	}

	.mobile-drawer.is-open {
		right: 0;
		visibility: visible;
	}

	/* Línea de acento superior animada */
	.drawer-accent-line {
		height: 2px;
		background: linear-gradient(90deg, #00a6c0, #21e68c, #00a6c0, #00a6c0);
		background-size: 300% 100%;
		animation: accentFlow 4s linear infinite;
		flex-shrink: 0;
	}

	@keyframes accentFlow {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: -100% 0;
		}
	}

	/* Cabecera drawer */
	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.125rem 1.375rem;
		flex-shrink: 0;
	}

	.drawer-brand {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.drawer-brand img {
		filter: drop-shadow(0 0 8px rgba(0, 166, 192, 0.5));
	}

	.drawer-brand span {
		font-family: 'Dune Rise', 'Inter', sans-serif;
		font-size: 1rem;
		color: var(--color-accent-primary);
		font-weight: 400;
		letter-spacing: 0.02em;
	}

	.drawer-close-btn {
		width: 34px;
		height: 34px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.5);
		transition: all 0.2s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.drawer-close-btn:hover,
	.drawer-close-btn:active {
		background: rgba(239, 68, 68, 0.12);
		border-color: rgba(239, 68, 68, 0.3);
		color: #f87171;
	}

	/* Separador */
	.drawer-sep {
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(0, 166, 192, 0.35),
			rgba(33, 230, 140, 0.2),
			transparent
		);
		margin: 0 1.375rem;
		flex-shrink: 0;
	}

	/* Navegación del drawer */
	.drawer-nav {
		flex: 1;
		padding: 1rem 0.875rem;
		display: flex;
		flex-direction: column;
		gap: 3px;
		overflow-y: auto;
	}

	.drawer-link {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem 1rem;
		border-radius: 11px;
		color: rgba(255, 255, 255, 0.65);
		text-decoration: none;
		font-size: 0.9375rem;
		font-weight: 500;
		transition: all 0.22s ease;
		border: 1px solid transparent;
		/* Animación de entrada escalonada */
		opacity: 0;
		transform: translateX(12px);
		-webkit-tap-highlight-color: transparent;
	}

	/* Las animaciones se activan cuando el drawer está abierto */
	.mobile-drawer.is-open .drawer-link {
		opacity: 1;
		transform: translateX(0);
		transition:
			opacity 0.32s ease var(--delay, 0ms),
			transform 0.32s ease var(--delay, 0ms),
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.drawer-link:hover,
	.drawer-link:active {
		background: rgba(0, 166, 192, 0.08);
		border-color: rgba(0, 166, 192, 0.2);
		color: #ffffff;
		transform: translateX(-3px) !important;
	}

	.drawer-link-ico {
		width: 38px;
		height: 38px;
		background: rgba(0, 166, 192, 0.09);
		border-radius: 9px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-accent-primary);
		flex-shrink: 0;
		transition: all 0.22s ease;
	}

	.drawer-link:hover .drawer-link-ico,
	.drawer-link:active .drawer-link-ico {
		background: rgba(0, 166, 192, 0.18);
		transform: scale(1.08);
	}

	.drawer-link-text {
		flex: 1;
	}

	.drawer-link-chevron {
		color: rgba(255, 255, 255, 0.18);
		transition: all 0.22s ease;
		flex-shrink: 0;
	}

	.drawer-link:hover .drawer-link-chevron {
		color: var(--color-accent-primary);
		transform: translateX(4px);
	}

	/* Footer del drawer */
	.drawer-footer {
		padding: 1.125rem 1.375rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		flex-shrink: 0;
	}

	.drawer-footer-copy {
		text-align: center;
		font-size: 0.6875rem;
		color: rgba(255, 255, 255, 0.18);
		line-height: 1.4;
	}

	/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	   RESPONSIVE
	━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

	/* Tabletas y móviles (≤1024px) */
	@media (max-width: 1024px) {
		.desktop-menu {
			display: none;
		}

		.hamburger {
			display: flex;
		}

		.nav-logo h1 {
			font-size: 1.35rem;
		}

		.nav-logo img {
			height: 38px;
			width: 38px;
		}
	}

	/* Móviles pequeños (≤480px) */
	@media (max-width: 480px) {
		.nav-container {
			padding: 0.875rem 1rem;
		}

		.nav-logo h1 {
			font-size: 1.15rem;
		}

		.nav-logo img {
			height: 34px;
			width: 34px;
		}

		.nav-logo a {
			gap: 0.6rem;
		}
	}
</style>
