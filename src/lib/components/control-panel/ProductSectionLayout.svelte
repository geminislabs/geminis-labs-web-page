<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { isAuthenticated } from '$lib/stores/authStore.js';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	export let sectionTitle = '';
	export let sectionSubtitle = '';
	export let tabs = [];
	/** @type {'' | 'nexus' | 'orion' | 'usage' | 'settings'} */
	export let accent = '';

	const PALETTES = {
		nexus: {
			primary: '#38bdf8',
			border: 'rgba(56,189,248,0.2)',
			glow: 'rgba(56,189,248,0.1)',
			icon: 'rgba(56,189,248,0.15)',
			tabActive: 'linear-gradient(135deg,#0ea5e9,#0284c7)'
		},
		orion: {
			primary: '#a78bfa',
			border: 'rgba(167,139,250,0.2)',
			glow: 'rgba(167,139,250,0.1)',
			icon: 'rgba(167,139,250,0.15)',
			tabActive: 'linear-gradient(135deg,#8b5cf6,#6d28d9)'
		},
		usage: {
			primary: '#34d399',
			border: 'rgba(52,211,153,0.25)',
			glow: 'rgba(16,185,129,0.14)',
			icon: 'rgba(52,211,153,0.14)',
			tabActive: 'linear-gradient(135deg,#10b981,#047857)'
		},
		settings: {
			primary: '#818cf8',
			border: 'rgba(129,140,248,0.28)',
			glow: 'rgba(99,102,241,0.14)',
			icon: 'rgba(99,102,241,0.14)',
			tabActive: 'linear-gradient(135deg,#6366f1,#7c3aed)'
		}
	};

	onMount(() => {
		if (!$isAuthenticated) goto('/auth');
	});

	$: resolvedAccent =
		accent || (sectionTitle === 'Nexus' ? 'nexus' : sectionTitle === 'Orion' ? 'orion' : 'orion');

	$: accentColor = PALETTES[resolvedAccent] ?? PALETTES.orion;
</script>

<Navbar />
<Sidebar />

<main class="products-main">
	<!-- Noise overlay -->
	<div class="noise-overlay" aria-hidden="true"></div>

	<div class="products-content">
		<!-- ── Header ── -->
		<div class="products-header">
			<div
				class="header-icon"
				style="background:{accentColor.icon};border-color:{accentColor.border};"
			>
				<slot name="icon">
					<svg class="icon-fallback" fill="none" viewBox="0 0 24 24" stroke-width="1.5">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"
						/>
					</svg>
				</slot>
			</div>
			<div class="header-text">
				<h1 class="header-title">{sectionTitle}</h1>
				<p class="header-subtitle">{sectionSubtitle}</p>
			</div>
		</div>

		<!-- ── Nav tabs ── -->
		<nav class="products-nav" aria-label={sectionTitle}>
			{#each tabs as item (item.href)}
				{@const active = page.url.pathname === item.href}
				<a
					href={item.href}
					class="products-tab"
					class:products-tab--active={active}
					style={active
						? `background:${accentColor.tabActive};box-shadow:0 4px 14px ${accentColor.glow};`
						: ''}
					aria-current={active ? 'page' : undefined}
				>
					<!-- Icono -->
					{#if item.icon === 'pulse'}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"><path stroke-linecap="round" d="M4 12h4l2-8 4 16 2-8h8" /></svg
						>
					{:else if item.icon === 'key'}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
							/></svg
						>
					{:else if item.icon === 'chart'}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"><path stroke-linecap="round" d="M4 20V10M12 20V4M20 20v-6" /></svg
						>
					{:else if item.icon === 'file'}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/></svg
						>
					{:else if item.icon === 'play'}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
							/><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
					{:else if item.icon === 'cpu'}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 16.5V21m3.75-18v1.5m0 16.5V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z"
							/></svg
						>
					{:else if item.icon === 'clock'}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
							/></svg
						>
					{:else if item.icon === 'link'}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							/></svg
						>
					{:else if item.icon === 'shield'}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							/></svg
						>
					{:else if item.icon === 'puzzle'}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 001 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
							/></svg
						>
					{/if}
					<span class="tab-label">{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- Divider -->
		<div
			class="products-divider"
			style="background:linear-gradient(90deg,transparent,{accentColor.primary}4d,transparent);"
		></div>

		<!-- ── Contenido de la página ── -->
		<div class="products-slot">
			<slot />
		</div>
	</div>
</main>

<style>
	.products-main {
		min-height: 100vh;
		background-color: #0a0f1a;
		background-image:
			radial-gradient(ellipse 80% 50% at 5% 0%, rgba(56, 189, 248, 0.07) 0%, transparent 55%),
			radial-gradient(ellipse 60% 40% at 95% 100%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
		padding: 2rem;
		padding-top: calc(70px + 2rem);
		margin-left: 260px;
		box-sizing: border-box;
		position: relative;
	}

	.noise-overlay {
		position: fixed;
		top: 0;
		left: 260px;
		right: 0;
		bottom: 0;
		background-image: url('/img/noise.webp');
		background-repeat: repeat;
		opacity: 0.025;
		pointer-events: none;
		z-index: 0;
	}

	.products-content {
		max-width: 1280px;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}

	/* ── Header ── */
	.products-header {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 24px;
	}

	.header-icon {
		width: 46px;
		height: 46px;
		border-radius: 13px;
		border: 1px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.header-icon :global(svg) {
		width: 20px;
		height: 20px;
	}

	.icon-fallback {
		width: 20px;
		height: 20px;
		stroke: #94a3b8;
	}

	.header-title {
		font-size: 22px;
		font-weight: 700;
		color: #f1f5f9;
		margin: 0 0 3px;
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	.header-subtitle {
		font-size: 13px;
		color: #334155;
		margin: 0;
		line-height: 1.4;
	}

	/* ── Nav ── */
	.products-nav {
		display: flex;
		gap: 4px;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 13px;
		padding: 5px;
		margin-bottom: 22px;
		width: fit-content;
		max-width: 100%;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.products-nav::-webkit-scrollbar {
		display: none;
	}

	.products-tab {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 9px 16px;
		border-radius: 9px;
		font-size: 13px;
		font-weight: 500;
		text-decoration: none;
		color: #475569;
		transition:
			color 0.15s,
			background 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.products-tab:hover {
		color: #cbd5e1;
		background: rgba(255, 255, 255, 0.05);
	}

	.products-tab--active {
		color: #fff !important;
		font-weight: 600;
	}

	/* ── Divider ── */
	.products-divider {
		height: 1px;
		margin-bottom: 22px;
		opacity: 0.6;
	}

	/* ── Slot ── */
	.products-slot :global(a) {
		color: #94a3b8;
		text-decoration: none;
	}

	.products-slot :global(a:hover) {
		color: #f1f5f9;
	}

	/* ── Responsive ── */
	@media (max-width: 1024px) {
		.products-main {
			margin-left: 0;
			padding: 1.25rem;
			padding-top: calc(70px + 1.25rem);
			padding-bottom: 5rem;
		}

		.noise-overlay {
			left: 0;
		}

		.products-header {
			margin-bottom: 18px;
		}

		.header-title {
			font-size: 19px;
		}

		.header-subtitle {
			font-size: 12px;
		}

		.products-nav {
			width: 100%;
		}

		.products-tab {
			flex: 1;
			justify-content: center;
			padding: 9px 12px;
			font-size: 12px;
		}
	}

	@media (max-width: 640px) {
		.products-main {
			padding: 1rem;
			padding-top: calc(70px + 1rem);
			padding-bottom: 5.5rem;
		}

		.products-header {
			gap: 12px;
			margin-bottom: 14px;
		}

		.header-icon {
			width: 40px;
			height: 40px;
			border-radius: 10px;
		}

		.header-title {
			font-size: 17px;
		}

		.header-subtitle {
			font-size: 11px;
			display: -webkit-box;
			-webkit-line-clamp: 1;
			line-clamp: 1;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}

		.products-nav {
			border-radius: 11px;
			padding: 4px;
		}

		.products-tab {
			padding: 8px 10px;
			font-size: 11px;
			gap: 5px;
		}

		.products-tab svg {
			width: 15px;
			height: 15px;
		}
	}

	@media (max-width: 380px) {
		.tab-label {
			display: none;
		}

		.products-tab {
			padding: 10px;
		}
	}
</style>
