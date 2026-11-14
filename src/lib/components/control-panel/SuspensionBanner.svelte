<script>
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { organizationAccess, accessBlockCopy } from '$lib/stores/organizationAccessStore.js';

	const BILLING_PATH = '/control-panel/billing';

	$: copy = $organizationAccess ? accessBlockCopy($organizationAccess) : null;

	// El aviso va fijo bajo la barra superior; cada sección del panel arma su
	// propio `main`, así que el hueco se abre en `body`.
	$: if (typeof document !== 'undefined') {
		document.body.classList.toggle('cp-access-blocked', Boolean(copy));
	}

	onDestroy(() => {
		if (typeof document !== 'undefined') document.body.classList.remove('cp-access-blocked');
	});
</script>

{#if copy}
	<div class="suspension-banner" role="status" aria-live="polite">
		<svg
			class="suspension-icon"
			width="20"
			height="20"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="1.8"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
			/>
		</svg>
		<p class="suspension-message">{copy.message}</p>
		{#if copy.showBilling && !page.url.pathname.startsWith(BILLING_PATH)}
			<a class="suspension-action" href="{BILLING_PATH}/summary">Ir a facturación</a>
		{/if}
	</div>
{/if}

<style>
	:global(body.cp-access-blocked) {
		padding-top: 3.25rem;
	}

	.suspension-banner {
		position: fixed;
		top: 70px;
		left: 260px;
		right: 0;
		min-height: 3.25rem;
		z-index: 950;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1.5rem;
		box-sizing: border-box;
		background: rgba(120, 53, 15, 0.92);
		border-bottom: 1px solid rgba(251, 191, 36, 0.35);
		color: #fef3c7;
		backdrop-filter: blur(12px);
	}

	.suspension-icon {
		flex-shrink: 0;
		color: #fbbf24;
	}

	.suspension-message {
		margin: 0;
		flex: 1;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.suspension-action {
		flex-shrink: 0;
		padding: 0.4rem 0.9rem;
		border-radius: 0.5rem;
		background: #fbbf24;
		color: #451a03;
		font-size: 0.85rem;
		font-weight: 600;
		text-decoration: none;
	}

	.suspension-action:hover {
		background: #fcd34d;
	}

	@media (max-width: 1024px) {
		.suspension-banner {
			left: 0;
			padding: 0.625rem 1rem;
		}
	}
</style>
