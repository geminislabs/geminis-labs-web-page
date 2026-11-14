<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { isAuthenticated } from '$lib/stores/authStore.js';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	onMount(() => {
		if (!$isAuthenticated) goto('/auth');
	});

	const nav = [
		{ href: '/control-panel/billing/summary', label: 'Resumen', icon: 'chart' },
		{ href: '/control-panel/billing/plans', label: 'Planes', icon: 'layers' },
		{ href: '/control-panel/billing/payment-methods', label: 'Métodos de pago', icon: 'card' },
		{ href: '/control-panel/billing/tax-profile', label: 'Datos fiscales', icon: 'id' },
		{ href: '/control-panel/billing/invoices', label: 'Facturas', icon: 'file' }
	];
</script>

<Navbar />
<Sidebar />

<main class="billing-main">
	<div class="billing-content">
		<div class="billing-header">
			<div class="billing-icon">
				<svg
					width="22"
					height="22"
					fill="none"
					viewBox="0 0 24 24"
					stroke="#a78bfa"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v4.125c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 16.125V12m18 0h-3.75M3 12h3.75m8.25-3V4.875c0-.621-.504-1.125-1.125-1.125h-9c-.621 0-1.125.504-1.125 1.125V9M12 8.25h.008v.008H12V8.25z"
					/>
				</svg>
			</div>
			<div>
				<h1 class="billing-title">Facturación</h1>
				<p class="billing-subtitle">Gestiona tu suscripción, planes, métodos de pago y facturas</p>
			</div>
		</div>

		<nav class="billing-nav app-scrollbar" aria-label="Sección de facturación">
			{#each nav as item (item.href)}
				{@const active = page.url.pathname === item.href}
				<a
					href={item.href}
					class="billing-tab"
					class:billing-tab--active={active}
					aria-current={active ? 'page' : undefined}
				>
					{#if item.icon === 'chart'}
						<svg
							width="15"
							height="15"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" d="M4 20V10M12 20V4M20 20v-6" />
						</svg>
					{:else if item.icon === 'layers'}
						<svg
							width="15"
							height="15"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
							/>
						</svg>
					{:else if item.icon === 'card'}
						<svg
							width="15"
							height="15"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="2" y="5" width="20" height="14" rx="2" />
							<path stroke-linecap="round" d="M2 10h20" />
						</svg>
					{:else if item.icon === 'id'}
						<svg
							width="15"
							height="15"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
							/>
						</svg>
					{:else}
						<svg
							width="15"
							height="15"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					{/if}
					<span class="tab-label">{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="billing-divider"></div>

		<slot />
	</div>
</main>

<style>
	.billing-main {
		min-height: 100vh;
		background-color: #111827;
		background-image:
			radial-gradient(ellipse 80% 50% at 0% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
			radial-gradient(ellipse 60% 40% at 100% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 50%);
		padding: 2rem;
		padding-top: calc(70px + 2rem);
		margin-left: 260px;
		box-sizing: border-box;
		position: relative;
	}
	.billing-main::after {
		content: '';
		position: fixed;
		top: 0;
		left: 260px;
		right: 0;
		bottom: 0;
		background-image: url('/img/noise.webp');
		background-repeat: repeat;
		opacity: 0.03;
		pointer-events: none;
		z-index: 1;
	}
	.billing-content {
		max-width: 1200px;
		margin: 0 auto;
		position: relative;
		z-index: 2;
	}
	.billing-header {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 24px;
	}
	.billing-icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		border: 1px solid rgba(167, 139, 250, 0.2);
		background: rgba(139, 92, 246, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.billing-title {
		font-size: 22px;
		font-weight: 700;
		color: #f1f5f9;
		margin: 0 0 2px;
		line-height: 1.2;
		letter-spacing: -0.02em;
	}
	.billing-subtitle {
		font-size: 13px;
		color: #475569;
		margin: 0;
	}
	.billing-nav {
		display: flex;
		gap: 4px;
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		padding: 5px;
		margin-bottom: 24px;
		width: fit-content;
	}
	.billing-tab {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 9px 16px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		text-decoration: none;
		color: #64748b;
		transition:
			color 0.15s,
			background 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.billing-tab:hover {
		color: #cbd5e1;
		background: rgba(255, 255, 255, 0.05);
	}
	.billing-tab--active {
		background: linear-gradient(135deg, #6366f1, #7c3aed);
		color: #fff;
		box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
	}
	.billing-tab--active:hover {
		color: #fff;
		background: linear-gradient(135deg, #6366f1, #7c3aed);
	}
	.billing-divider {
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(99, 102, 241, 0.3),
			rgba(139, 92, 246, 0.2),
			transparent
		);
		margin-bottom: 24px;
	}
	@media (max-width: 1024px) {
		.billing-main {
			margin-left: 220px;
		}
		.billing-main::after {
			left: 220px;
		}
	}
	@media (max-width: 768px) {
		.billing-main {
			padding: 1rem;
			margin-left: 0;
			padding: 1.25rem;
			padding-top: calc(70px + 1.25rem);
			padding-bottom: 5rem;
		}

		.billing-nav {
			width: 100%;
			overflow-x: auto;
		}

		.billing-tab {
			flex: 1;
			justify-content: center;
			padding: 8px 10px;
			font-size: 12px;
		}
	}
</style>
