<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	// Estado de expansión de secciones
	let expandedSections = {
		organization: true,
		billing: false,
		products: false,
		nexus: false,
		orion: false,
		usage: false,
		settings: false
	};

	// Estado móvil
	let isMobile = false;
	let sidebarOpen = false;

	function toggleSection(section) {
		expandedSections[section] = !expandedSections[section];
	}

	function isActive(path) {
		return page.url.pathname === path;
	}

	function checkMobile() {
		isMobile = window.innerWidth <= 1024;
		if (!isMobile) sidebarOpen = false;
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = sidebarOpen ? 'hidden' : '';
		}
	}

	function closeSidebar() {
		sidebarOpen = false;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	}

	function handleNavClick() {
		if (isMobile) closeSidebar();
	}

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		const handleKeydown = (e) => {
			if (e.key === 'Escape' && sidebarOpen) closeSidebar();
		};
		document.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('resize', checkMobile);
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		};
	});
</script>

{#if isMobile}
	<button
		class="sidebar-fab"
		class:fab-open={sidebarOpen}
		on:click={toggleSidebar}
		aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú lateral'}
		aria-expanded={sidebarOpen}
	>
		{#if sidebarOpen}
			<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		{:else}
			<!-- Hamburger cuando está cerrado -->
			<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
		{/if}
		{#if !sidebarOpen}
			<span class="fab-label">Menú</span>
		{/if}
	</button>

	<!-- Backdrop -->
	{#if sidebarOpen}
		<div class="sidebar-backdrop" on:click={closeSidebar} aria-hidden="true"></div>
	{/if}
{/if}

<aside class="sidebar" class:mobile-open={sidebarOpen && isMobile}>
	<!-- Header del sidebar en móvil -->
	{#if isMobile}
		<div class="sidebar-mobile-header">
			<div class="sidebar-mobile-brand">
				<img src="/img/geminis-labs-logo-short.png" alt="" width="24" height="24" />
				<span>Panel de Control</span>
			</div>
			<button class="sidebar-close" on:click={closeSidebar} aria-label="Cerrar">
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
		<div class="sidebar-mobile-sep"></div>
	{/if}

	<div class="sidebar-content">
		<!-- Inicio -->
		<div class="menu-section">
			<a
				href="/control-panel"
				class="section-header no-chevron"
				class:active={isActive('/control-panel')}
				on:click={handleNavClick}
			>
				<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				<span class="section-title">Panel Principal</span>
			</a>
		</div>

		<!-- Organización -->
		<div class="menu-section">
			<button
				class="section-header"
				class:expanded={expandedSections.organization}
				on:click={() => toggleSection('organization')}
			>
				<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
				<span class="section-title">Organización</span>
				<svg
					class="chevron"
					class:rotated={expandedSections.organization}
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
				>
					<path
						d="M4 6L8 10L12 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			{#if expandedSections.organization}
				<div class="menu-items">
					<a
						href="/control-panel/organization/info"
						class:active={isActive('/control-panel/organization/info')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Información
					</a>
					<a
						href="/control-panel/organization/users"
						class:active={isActive('/control-panel/organization/users')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Usuarios
					</a>
					<a
						href="/control-panel/organization/roles"
						class:active={isActive('/control-panel/organization/roles')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Roles y permisos
					</a>
				</div>
			{/if}
		</div>

		<!-- Facturación -->
		<div class="menu-section">
			<button
				class="section-header"
				class:expanded={expandedSections.billing}
				on:click={() => toggleSection('billing')}
			>
				<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
					/>
				</svg>
				<span class="section-title">Facturación</span>
				<svg
					class="chevron"
					class:rotated={expandedSections.billing}
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
				>
					<path
						d="M4 6L8 10L12 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			{#if expandedSections.billing}
				<div class="menu-items">
					<a
						href="/control-panel/billing/summary"
						class:active={isActive('/control-panel/billing/summary')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Resumen
					</a>
					<a
						href="/control-panel/billing/payment-methods"
						class:active={isActive('/control-panel/billing/payment-methods')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Métodos de pago
					</a>
					<a
						href="/control-panel/billing/invoices"
						class:active={isActive('/control-panel/billing/invoices')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Facturas
					</a>
				</div>
			{/if}
		</div>

		<!-- Productos -->
		<div class="menu-section">
			<button
				class="section-header"
				class:expanded={expandedSections.products}
				on:click={() => toggleSection('products')}
			>
				<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
					/>
				</svg>
				<span class="section-title">Productos</span>
				<svg
					class="chevron"
					class:rotated={expandedSections.products}
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
				>
					<path
						d="M4 6L8 10L12 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			{#if expandedSections.products}
				<div class="menu-items">
					<!-- Nexus Subsection -->
					<button
						class="subsection-header"
						class:expanded={expandedSections.nexus}
						on:click={() => toggleSection('nexus')}
					>
						<span class="item-dot"></span>
						<span>Nexus</span>
						<svg
							class="chevron-small"
							class:rotated={expandedSections.nexus}
							width="14"
							height="14"
							viewBox="0 0 16 16"
							fill="none"
						>
							<path
								d="M4 6L8 10L12 6"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
					{#if expandedSections.nexus}
						<div class="sub-items">
							<a
								href="/control-panel/products/nexus/status"
								class:active={isActive('/control-panel/products/nexus/status')}
								on:click={handleNavClick}>– Estado</a
							>
							<a
								href="/control-panel/products/nexus/devices"
								class:active={isActive('/control-panel/products/nexus/devices')}
								on:click={handleNavClick}>– Dispositivos</a
							>
							<a
								href="/control-panel/products/nexus/consumption"
								class:active={isActive('/control-panel/products/nexus/consumption')}
								on:click={handleNavClick}>– Consumo</a
							>
						</div>
					{/if}

					<!-- Orion Subsection -->
					<button
						class="subsection-header"
						class:expanded={expandedSections.orion}
						on:click={() => toggleSection('orion')}
					>
						<span class="item-dot"></span>
						<span>Orion</span>
						<svg
							class="chevron-small"
							class:rotated={expandedSections.orion}
							width="14"
							height="14"
							viewBox="0 0 16 16"
							fill="none"
						>
							<path
								d="M4 6L8 10L12 6"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
					{#if expandedSections.orion}
						<div class="sub-items">
							<a
								href="/control-panel/products/orion/api-keys"
								class:active={isActive('/control-panel/products/orion/api-keys')}
								on:click={handleNavClick}>– API Keys</a
							>
							<a
								href="/control-panel/products/orion/limits"
								class:active={isActive('/control-panel/products/orion/limits')}
								on:click={handleNavClick}>– Límites</a
							>
							<a
								href="/control-panel/products/orion/logs"
								class:active={isActive('/control-panel/products/orion/logs')}
								on:click={handleNavClick}>– Logs</a
							>
							<a
								href="/control-panel/products/orion/playground"
								class:active={isActive('/control-panel/products/orion/playground')}
								on:click={handleNavClick}>– Playground</a
							>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Uso -->
		<div class="menu-section">
			<button
				class="section-header"
				class:expanded={expandedSections.usage}
				on:click={() => toggleSection('usage')}
			>
				<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				<span class="section-title">Uso</span>
				<svg
					class="chevron"
					class:rotated={expandedSections.usage}
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
				>
					<path
						d="M4 6L8 10L12 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			{#if expandedSections.usage}
				<div class="menu-items">
					<a
						href="/control-panel/usage/metrics"
						class:active={isActive('/control-panel/usage/metrics')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Métricas
					</a>
					<a
						href="/control-panel/usage/history"
						class:active={isActive('/control-panel/usage/history')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Historial
					</a>
				</div>
			{/if}
		</div>

		<!-- Configuración -->
		<div class="menu-section">
			<button
				class="section-header"
				class:expanded={expandedSections.settings}
				on:click={() => toggleSection('settings')}
			>
				<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				<span class="section-title">Configuración</span>
				<svg
					class="chevron"
					class:rotated={expandedSections.settings}
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
				>
					<path
						d="M4 6L8 10L12 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			{#if expandedSections.settings}
				<div class="menu-items">
					<a
						href="/control-panel/settings/webhooks"
						class:active={isActive('/control-panel/settings/webhooks')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Webhooks
					</a>
					<a
						href="/control-panel/settings/integrations"
						class:active={isActive('/control-panel/settings/integrations')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Integraciones
					</a>
					<a
						href="/control-panel/settings/audit"
						class:active={isActive('/control-panel/settings/audit')}
						on:click={handleNavClick}
					>
						<span class="item-dot"></span>
						Auditoría
					</a>
				</div>
			{/if}
		</div>
	</div>
</aside>

<style>
	/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	   SIDEBAR BASE (escritorio)
	━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
	.sidebar {
		position: fixed;
		left: 0;
		top: 70px; /* Debajo del navbar */
		bottom: 0;
		width: 260px;
		background: linear-gradient(
			90deg,
			rgba(31, 41, 53, 0.94) 0%,
			rgba(28, 36, 48, 0.93) 50%,
			rgba(28, 36, 48, 0.93) 100%
		);
		backdrop-filter: blur(20px);
		border-right: none;
		overflow-y: auto;
		overflow-x: hidden;
		z-index: 900;
		box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
		transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.sidebar::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: url('/img/noise.webp');
		background-repeat: repeat;
		opacity: 0.03;
		pointer-events: none;
		z-index: -1;
	}

	.sidebar-content {
		padding: 1.5rem 0;
		position: relative;
		z-index: 1;
	}

	/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	   MOBILE HEADER (solo visible en mobile)
	━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
	.sidebar-mobile-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem 0.75rem;
	}

	.sidebar-mobile-brand {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.sidebar-mobile-brand img {
		filter: drop-shadow(0 0 6px rgba(0, 166, 192, 0.4));
	}

	.sidebar-mobile-brand span {
		font-size: 0.875rem;
		font-weight: 700;
		color: rgba(226, 232, 240, 0.9);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.sidebar-close {
		width: 32px;
		height: 32px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 7px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.5);
		transition: all 0.2s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.sidebar-close:hover,
	.sidebar-close:active {
		background: rgba(239, 68, 68, 0.12);
		border-color: rgba(239, 68, 68, 0.3);
		color: #f87171;
	}

	.sidebar-mobile-sep {
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(0, 166, 192, 0.3), transparent);
		margin: 0.5rem 1.25rem 0.25rem;
	}

	/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	   FAB (botón flotante para móvil)
	━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
	.sidebar-fab {
		display: none; /* se activa en mobile */
		position: fixed;
		bottom: 1.5rem;
		left: 1.25rem;
		z-index: 950;
		align-items: center;
		gap: 0.5rem;
		padding: 0 1.125rem 0 0.875rem;
		height: 48px;
		background: linear-gradient(135deg, rgba(0, 166, 192, 0.9), rgba(33, 230, 140, 0.85));
		border: none;
		border-radius: 24px;
		color: white;
		font-size: 0.8125rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow:
			0 4px 20px rgba(0, 166, 192, 0.45),
			0 2px 8px rgba(0, 0, 0, 0.3);
		transition: all 0.25s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.sidebar-fab:hover,
	.sidebar-fab:active {
		transform: translateY(-2px);
		box-shadow:
			0 8px 28px rgba(0, 166, 192, 0.55),
			0 4px 12px rgba(0, 0, 0, 0.35);
	}

	.sidebar-fab.fab-open {
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.85));
		box-shadow:
			0 4px 20px rgba(239, 68, 68, 0.4),
			0 2px 8px rgba(0, 0, 0, 0.3);
		padding: 0 0.875rem;
	}

	.fab-label {
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.03em;
	}

	/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	   BACKDROP
	━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
	.sidebar-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.68);
		backdrop-filter: blur(3px);
		z-index: 890;
		animation: fadeIn 0.25s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	   MENU ITEMS (sin cambios)
	━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
	.menu-section {
		margin-bottom: 0.5rem;
	}

	.section-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: none;
		color: rgba(226, 232, 240, 0.9);
		font-size: 0.875rem !important;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		letter-spacing: 0.3px;
		line-height: 1.2;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.section-header:hover,
	.section-header.active {
		background: rgba(71, 85, 105, 0.2);
		color: rgba(255, 255, 255, 1);
	}

	.section-header.active {
		background: linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%);
		color: rgba(167, 139, 250, 1);
		border-left: 3px solid rgba(139, 92, 246, 0.8);
	}

	.section-header.no-chevron {
		text-decoration: none;
	}

	.section-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		color: rgba(147, 197, 253, 0.6);
		stroke-width: 2;
	}

	.section-title {
		flex: 1;
		font-size: 0.875rem !important;
		line-height: 1.2;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.chevron {
		flex-shrink: 0;
		color: rgba(148, 163, 184, 0.6);
		transition: transform 0.2s ease;
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.chevron-small {
		flex-shrink: 0;
		color: rgba(148, 163, 184, 0.5);
		transition: transform 0.2s ease;
	}

	.chevron-small.rotated {
		transform: rotate(180deg);
	}

	/* Items del menú */
	.menu-items {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.25rem 0;
		animation: slideDown 0.2s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.menu-items a {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1.25rem 0.625rem 3rem;
		color: rgba(203, 213, 225, 0.8);
		text-decoration: none;
		font-size: 0.8125rem !important;
		font-weight: 500;
		transition: all 0.2s ease;
		position: relative;
		line-height: 1.2;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.menu-items a:hover {
		background: rgba(71, 85, 105, 0.15);
		color: rgba(255, 255, 255, 0.95);
		padding-left: 3.25rem;
	}

	.menu-items a.active {
		background: linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%);
		color: rgba(167, 139, 250, 1);
		border-left: 3px solid rgba(139, 92, 246, 0.8);
		font-weight: 600;
	}

	.menu-items a.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		background: linear-gradient(180deg, rgba(139, 92, 246, 0.8) 0%, rgba(99, 102, 241, 0.6) 100%);
		box-shadow: 0 0 12px rgba(139, 92, 246, 0.5);
	}

	.item-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: rgba(148, 163, 184, 0.5);
		flex-shrink: 0;
	}

	.menu-items a:hover .item-dot {
		background: rgba(167, 139, 250, 0.8);
		box-shadow: 0 0 8px rgba(167, 139, 250, 0.6);
	}

	.menu-items a.active .item-dot {
		background: rgba(167, 139, 250, 1);
		box-shadow: 0 0 10px rgba(167, 139, 250, 0.8);
	}

	/* Subsecciones */
	.subsection-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1.25rem 0.625rem 3rem;
		background: transparent;
		border: none;
		color: rgba(203, 213, 225, 0.85);
		font-size: 0.8125rem !important;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
		line-height: 1.2;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.subsection-header:hover {
		background: rgba(71, 85, 105, 0.15);
		color: rgba(255, 255, 255, 0.95);
		padding-left: 3.25rem;
	}

	.subsection-header span:nth-child(2) {
		flex: 1;
	}

	/* Sub-items (items dentro de subsecciones) */
	.sub-items {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.25rem 0;
		animation: slideDown 0.2s ease;
	}

	.sub-items a {
		display: flex;
		align-items: center;
		padding: 0.5rem 1.25rem 0.5rem 4rem;
		color: rgba(186, 230, 253, 0.7);
		text-decoration: none;
		font-size: 0.75rem !important;
		font-weight: 500;
		transition: all 0.2s ease;
		position: relative;
		line-height: 1.2;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.sub-items a:hover {
		background: rgba(71, 85, 105, 0.12);
		color: rgba(186, 230, 253, 0.95);
		padding-left: 4.25rem;
	}

	.sub-items a.active {
		background: linear-gradient(90deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%);
		color: rgba(125, 211, 252, 1);
		border-left: 3px solid rgba(14, 165, 233, 0.7);
		font-weight: 600;
	}

	.sub-items a.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		background: linear-gradient(180deg, rgba(14, 165, 233, 0.8) 0%, rgba(6, 182, 212, 0.6) 100%);
		box-shadow: 0 0 12px rgba(14, 165, 233, 0.5);
	}

	/* Scrollbar personalizado */
	.sidebar::-webkit-scrollbar {
		width: 6px;
	}

	.sidebar::-webkit-scrollbar-track {
		background: rgba(15, 23, 42, 0.3);
	}

	.sidebar::-webkit-scrollbar-thumb {
		background: rgba(71, 85, 105, 0.5);
		border-radius: 3px;
	}

	.sidebar::-webkit-scrollbar-thumb:hover {
		background: rgba(71, 85, 105, 0.7);
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.sidebar {
			top: 0;
			width: min(280px, 82vw);
			transform: translateX(-100%);
			z-index: 895;
			box-shadow: none;
		}

		.sidebar.mobile-open {
			transform: translateX(0);
			box-shadow: 8px 0 32px rgba(0, 0, 0, 0.5);
		}

		.sidebar-fab {
			display: flex;
		}

		/* Links más grandes en mobile para mejor touch */
		.section-header {
			padding: 0.875rem 1.25rem;
			font-size: 0.9375rem;
		}

		.menu-items a {
			padding: 0.75rem 1.25rem 0.75rem 3rem;
			font-size: 0.875rem;
		}

		.sub-items a {
			padding: 0.625rem 1.25rem 0.625rem 4rem;
		}
	}

	@media (max-width: 768px) {
		.sidebar {
			transform: translateX(-100%);
			transition: transform 0.3s ease;
		}
	}

	@media (max-width: 480px) {
		.sidebar {
			width: 88vw;
		}
	}
</style>
