<!-- src/routes/control-panel/billing/payment-methods/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { billingService } from '$lib/services/billingService.js';

	let loading = true;

	let methods = [];
	let error = null;

	let showAdd = false;
	let addLoading = false;
	let addError = null;
	let addSuccess = false;
	let cardFlow = null;
	let modalVisible = false;

	let deletingId = null;
	let defaultingId = null;
	let opError = null;

	onMount(async () => {
		const si = page.url.searchParams.get('setup_intent');
		const status = page.url.searchParams.get('redirect_status');
		if (si && status === 'succeeded') {
			try {
				methods = await billingService.confirmSetupIntent(si, 'stripe');
				addSuccess = true;
			} catch (e) {
				const msg = typeof e?.message === 'string' ? e.message : '';
				error =
					msg && msg !== '[object Object]'
						? msg
						: 'La tarjeta se autorizó pero no quedó registrada.';
				await load();
				return;
			} finally {
				loading = false;
			}
			return;
		}
		await load();
	});

	async function load() {
		loading = true;
		error = null;
		try {
			methods = await billingService.getPaymentMethods('stripe');
		} catch (e) {
			error = e.message ?? 'No se pudieron cargar los métodos de pago.';
		} finally {
			loading = false;
		}
	}

	async function openAdd() {
		showAdd = true;
		addError = null;
		addSuccess = false;
		addLoading = true;
		await new Promise((r) => setTimeout(r, 100));
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				modalVisible = true;
			})
		);
		try {
			cardFlow = await billingService.initAddPaymentMethodFlow('add-card-el', 'stripe');
		} catch (e) {
			addError = e.message ?? 'Error al inicializar el formulario.';
		} finally {
			addLoading = false;
		}
	}

	async function confirmAdd() {
		if (!cardFlow || addLoading) return;
		addLoading = true;
		addError = null;
		const returnUrl = `${window.location.origin}/control-panel/billing/payment-methods`;
		const { error: err, setupIntent } = await cardFlow.confirmSetup(returnUrl);
		if (err) {
			addError = xlate(err);
			addLoading = false;
			return;
		}
		if (!setupIntent?.id) {
			addError = 'Stripe no devolvió el guardado. Intenta de nuevo.';
			addLoading = false;
			return;
		}
		try {
			methods = await billingService.confirmSetupIntent(setupIntent.id, 'stripe');
			addSuccess = true;
			closeAdd();
		} catch (e) {
			const msg = typeof e?.message === 'string' ? e.message : '';
			addError =
				msg && msg !== '[object Object]'
					? msg
					: 'La tarjeta se autorizó pero no quedó registrada. Intenta de nuevo.';
		} finally {
			addLoading = false;
		}
	}

	function closeAdd() {
		modalVisible = false;
		setTimeout(() => {
			showAdd = false;
			cardFlow = null;
			addError = null;
			addLoading = false;
			const el = document.getElementById('add-card-el');
			if (el) el.innerHTML = '';
		}, 250);
	}

	async function del(m) {
		if (!confirm(`¿Eliminar ${(m.brand ?? 'tarjeta').toUpperCase()} ···· ${m.last4}?`)) return;
		deletingId = m.external_token;
		opError = null;
		try {
			await billingService.deletePaymentMethod(m.external_token, m.gateway);
			await load();
		} catch (e) {
			opError = e.message ?? 'Error al eliminar.';
		} finally {
			deletingId = null;
		}
	}

	async function makeDefault(m) {
		if (m.is_default) return;
		defaultingId = m.external_token;
		opError = null;
		try {
			await billingService.setDefaultPaymentMethod(m.external_token, m.gateway);
			await load();
		} catch (e) {
			opError = e.message ?? 'Error al actualizar el predeterminado.';
		} finally {
			defaultingId = null;
		}
	}

	function brandMeta(brand) {
		const b = (brand ?? '').toLowerCase();
		if (b === 'visa') return { label: 'Visa', gradFrom: '#1a1f71', gradTo: '#2563eb' };
		if (b === 'mastercard' || b === 'mc')
			return { label: 'Mastercard', gradFrom: '#1a0a0a', gradTo: '#b91c1c' };
		if (b === 'amex') return { label: 'Amex', gradFrom: '#0c3357', gradTo: '#0284c7' };
		return { label: (brand ?? 'Tarjeta').toUpperCase(), gradFrom: '#1e293b', gradTo: '#334155' };
	}

	function isExpired(m) {
		if (!m.exp_year || !m.exp_month) return false;
		const n = new Date();
		return (
			m.exp_year < n.getFullYear() ||
			(m.exp_year === n.getFullYear() && m.exp_month < n.getMonth() + 1)
		);
	}

	function fmtExp(m) {
		if (!m.exp_month || !m.exp_year) return '—';
		return `${String(m.exp_month).padStart(2, '0')} / ${String(m.exp_year).slice(-2)}`;
	}

	function xlate(err) {
		const m = {
			card_declined: 'Tarjeta declinada.',
			insufficient_funds: 'Fondos insuficientes.',
			expired_card: 'La tarjeta está vencida.',
			incorrect_cvc: 'CVV incorrecto.',
			invalid_number: 'Número de tarjeta inválido.',
			processing_error: 'Error de procesamiento. Intenta de nuevo.'
		};
		return m[err?.code] ?? err?.message ?? 'Error al procesar la tarjeta.';
	}

	$: defaultMethod = methods.find((m) => m.is_default);
</script>

<svelte:head><title>Métodos de pago — Facturación | Geminis Labs</title></svelte:head>

<!-- ── Notificaciones globales ─────────────────────────────────────────────── -->
{#if addSuccess}
	<div class="alert alert--success" role="status">
		<svg
			width="15"
			height="15"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
			class="shrink"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span
			><strong>Tarjeta guardada correctamente.</strong> Ya puede usarse para cobros automáticos.</span
		>
		<button on:click={() => (addSuccess = false)} class="alert__close" aria-label="Cerrar">✕</button
		>
	</div>
{/if}

{#if opError}
	<div class="alert alert--error" role="alert">
		<svg
			width="15"
			height="15"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
			class="shrink"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
			/>
		</svg>
		<span>{opError}</span>
		<button on:click={() => (opError = null)} class="alert__close" aria-label="Cerrar">✕</button>
	</div>
{/if}

<!-- ── Loading skeleton ───────────────────────────────────────────────────── -->
{#if loading}
	<div class="cards-grid mb-6">
		{#each [1, 2] as i (i)}
			<div class="skeleton h-52 rounded-3xl"></div>
		{/each}
	</div>
	<div class="skeleton h-32 rounded-2xl"></div>

	<!-- ── Error ──────────────────────────────────────────────────────────────── -->
{:else if error}
	<div class="error-card">
		<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f87171" stroke-width="1.5">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
			/>
		</svg>
		<p>{error}</p>
		<button on:click={load} class="btn-link">Reintentar</button>
	</div>
{:else}
	<!-- ── Info bar ───────────────────────────────────────────────────────────── -->
	{#if methods.length > 0}
		<div class="info-bar mb-5">
			<div class="info-bar__stat">
				<span class="info-bar__num">{methods.length}</span>
				<span class="info-bar__label"
					>{methods.length === 1 ? 'tarjeta guardada' : 'tarjetas guardadas'}</span
				>
			</div>
			{#if defaultMethod}
				<div class="info-bar__sep"></div>
				<div class="info-bar__default">
					<span class="dot dot--green"></span>
					<span class="info-bar__label">
						Predeterminada: <strong
							>{defaultMethod.brand?.toUpperCase()} ···· {defaultMethod.last4}</strong
						>
					</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ── Cards grid ────────────────────────────────────────────────────────── -->
	<div class="cards-grid mb-6">
		{#each methods as m (m.external_token)}
			{@const meta = brandMeta(m.brand)}
			{@const expired = m.is_expired ?? isExpired(m)}
			{@const busy = deletingId === m.external_token || defaultingId === m.external_token}

			<div
				class="card-wrap"
				class:card-wrap--default={m.is_default}
				style="opacity:{busy ? 0.5 : 1}; transition: opacity 0.2s;"
			>
				<!-- Cara de la tarjeta -->
				<div
					class="card-face"
					style="background: linear-gradient(135deg, {meta.gradFrom}, {meta.gradTo});"
				>
					<!-- Decoraciones -->
					<div class="card-deco card-deco--tl"></div>
					<div class="card-deco card-deco--br"></div>

					<!-- Header -->
					<div class="card-face__head">
						<span class="card-brand">{meta.label}</span>
						<div class="card-badges">
							{#if m.is_default}
								<span class="badge badge--default">
									<span class="dot dot--green dot--sm"></span>
									Predeterminada
								</span>
							{/if}
							{#if expired}
								<span class="badge badge--expired">Vencida</span>
							{/if}
						</div>
					</div>

					<!-- Chip -->
					<div class="card-chip">
						<div class="card-chip__inner"></div>
					</div>

					<!-- PAN -->
					<p class="card-pan">•••• &nbsp;•••• &nbsp;•••• &nbsp;{m.last4 ?? '----'}</p>

					<!-- Exp -->
					<div class="card-exp">
						<span class="card-exp__label">Válida hasta</span>
						<span class="card-exp__val" class:card-exp__val--expired={expired}>{fmtExp(m)}</span>
					</div>
				</div>

				<!-- Controles -->
				<div class="card-controls">
					<span class="card-controls__status" class:card-controls__status--active={m.is_default}>
						{m.is_default ? 'Cobros automáticos activos' : 'No predeterminada'}
					</span>
					<div class="card-controls__actions">
						{#if !m.is_default}
							<button
								on:click={() => makeDefault(m)}
								disabled={busy}
								class="ctrl-btn ctrl-btn--primary"
							>
								{#if defaultingId === m.external_token}
									<span class="spinner-xs"></span>
								{:else}
									<svg
										width="11"
										height="11"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2.5"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									Predeterminar
								{/if}
							</button>
						{/if}
						<button
							on:click={() => del(m)}
							disabled={busy || m.is_default}
							title={m.is_default
								? 'Asigna otra tarjeta predeterminada antes de eliminar esta'
								: ''}
							class="ctrl-btn ctrl-btn--danger"
						>
							{#if deletingId === m.external_token}
								<span class="spinner-xs spinner-xs--red"></span>
							{:else}
								<svg
									width="11"
									height="11"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
								Eliminar
							{/if}
						</button>
					</div>
				</div>
			</div>
		{/each}

		<!-- Botón agregar -->
		<button on:click={openAdd} class="add-card-btn" aria-label="Agregar tarjeta">
			<div class="add-card-btn__icon">
				<svg
					width="22"
					height="22"
					fill="none"
					viewBox="0 0 24 24"
					stroke="#6366f1"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
			</div>
			<span class="add-card-btn__label">Agregar tarjeta</span>
			<span class="add-card-btn__sub">Visa · Mastercard · Amex</span>
		</button>
	</div>

	<!-- ── Panel de seguridad ─────────────────────────────────────────────────── -->
	<div class="security-panel">
		<div class="security-panel__header">
			<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#475569" stroke-width="2">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
				/>
			</svg>
			<span class="security-panel__title">Seguridad y cumplimiento</span>
		</div>
		<div class="security-items">
			{#each [{ icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'PCI DSS', desc: 'Procesamiento certificado. Nunca manejamos ni almacenamos datos de tarjeta.' }, { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: 'Datos protegidos', desc: 'Solo guardamos los últimos 4 dígitos y fecha de expiración.' }, { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', title: 'Auditoría completa', desc: 'Cada cambio queda registrado para trazabilidad total.' }] as item (item.title)}
				<div class="security-item">
					<div class="security-item__icon">
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="#10b981"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
						</svg>
					</div>
					<div>
						<p class="security-item__title">{item.title}</p>
						<p class="security-item__desc">{item.desc}</p>
					</div>
				</div>
			{/each}
		</div>
		<div class="security-panel__footer">
			<svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#10b981" stroke-width="2">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
				/>
			</svg>
			<span>TLS cifrado de extremo a extremo · procesado por Stripe</span>
		</div>
	</div>
{/if}

<!-- ── Modal agregar tarjeta ──────────────────────────────────────────────── -->
{#if showAdd}
	<div
		class="modal-backdrop"
		on:click|self={closeAdd}
		on:keydown={(e) => e.key === 'Escape' && closeAdd()}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
		aria-label="Agregar tarjeta de pago"
	>
		<div class="modal" class:modal--visible={modalVisible}>
			<div class="modal__head">
				<div>
					<h2 class="modal__title">Nueva tarjeta</h2>
					<p class="modal__sub">Los datos van directamente a Stripe — nunca los vemos nosotros.</p>
				</div>
				<button on:click={closeAdd} class="modal__close" aria-label="Cerrar">
					<svg
						width="16"
						height="16"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			{#if addError}
				<div class="modal__error" role="alert">{addError}</div>
			{/if}

			{#if addLoading && !cardFlow}
				<div class="modal__loading">
					<span class="spinner"></span>
					<span>Cargando formulario seguro…</span>
				</div>
			{/if}
			<!-- Siempre en el DOM para que Stripe pueda montar antes de que addLoading cambie -->
			<div
				id="add-card-el"
				class="modal__stripe-el"
				style:display={addLoading && !cardFlow ? 'none' : 'block'}
			></div>

			<div class="modal__security-note">
				<svg
					width="11"
					height="11"
					fill="none"
					viewBox="0 0 24 24"
					stroke="#10b981"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
				TLS cifrado · PCI DSS · procesado por Stripe
			</div>

			<div class="modal__actions">
				<button on:click={closeAdd} disabled={addLoading} class="modal__btn-cancel">
					Cancelar
				</button>
				<button on:click={confirmAdd} disabled={addLoading || !cardFlow} class="modal__btn-confirm">
					{#if addLoading}
						<span class="spinner spinner--white"></span>
						Procesando…
					{:else}
						<svg
							width="14"
							height="14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
						Guardar tarjeta
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── Alerts ──────────────────────────────────────────────────────────────── */
	.alert {
		display: flex;
		align-items: center;
		gap: 10px;
		border-radius: 12px;
		padding: 12px 16px;
		font-size: 13px;
		margin-bottom: 16px;
		border: 1px solid;
	}
	.alert--success {
		background: rgba(74, 222, 128, 0.07);
		border-color: rgba(74, 222, 128, 0.2);
		color: #4ade80;
	}
	.alert--error {
		background: rgba(248, 113, 113, 0.07);
		border-color: rgba(248, 113, 113, 0.2);
		color: #fca5a5;
	}
	.alert__close {
		margin-left: auto;
		background: none;
		border: none;
		cursor: pointer;
		color: #475569;
		font-size: 14px;
		padding: 0;
	}
	.shrink {
		flex-shrink: 0;
	}

	.error-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		background: rgba(248, 113, 113, 0.06);
		border: 1px solid rgba(248, 113, 113, 0.18);
		border-radius: 16px;
		padding: 32px;
		text-align: center;
		color: #fca5a5;
		font-size: 13px;
	}
	.btn-link {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 12px;
		color: #6366f1;
		text-decoration: underline;
	}

	.skeleton {
		background: rgba(255, 255, 255, 0.04);
		animation: pulse 1.5s infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
	.mb-5 {
		margin-bottom: 20px;
	}
	.mb-6 {
		margin-bottom: 24px;
	}

	/* ── Info bar ────────────────────────────────────────────────────────────── */
	.info-bar {
		display: flex;
		align-items: center;
		gap: 16px;
		background: rgba(10, 16, 26, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		padding: 12px 18px;
	}
	.info-bar__stat {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}
	.info-bar__num {
		font-size: 20px;
		font-weight: 800;
		color: #e2e8f0;
	}
	.info-bar__label {
		font-size: 12px;
		color: #475569;
	}
	.info-bar__sep {
		width: 1px;
		height: 20px;
		background: rgba(255, 255, 255, 0.07);
	}
	.info-bar__default {
		display: flex;
		align-items: center;
		gap: 7px;
	}

	/* ── Dots ────────────────────────────────────────────────────────────────── */
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.dot--green {
		background: #4ade80;
	}
	.dot--sm {
		width: 5px;
		height: 5px;
	}

	/* ── Cards grid ──────────────────────────────────────────────────────────── */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
	}

	/* ── Card wrap ───────────────────────────────────────────────────────────── */
	.card-wrap {
		border-radius: 20px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.07);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}
	.card-wrap:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
	}
	.card-wrap--default {
		border-color: rgba(99, 102, 241, 0.35);
		box-shadow:
			0 0 0 1px rgba(99, 102, 241, 0.08),
			0 8px 32px rgba(0, 0, 0, 0.25);
	}

	/* ── Card face ───────────────────────────────────────────────────────────── */
	.card-face {
		padding: 20px 22px;
		min-height: 160px;
		position: relative;
		overflow: hidden;
	}
	.card-deco {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		background: rgba(255, 255, 255, 0.06);
	}
	.card-deco--tl {
		width: 100px;
		height: 100px;
		top: -30px;
		right: -20px;
	}
	.card-deco--br {
		width: 80px;
		height: 80px;
		bottom: -25px;
		right: 20px;
		background: rgba(255, 255, 255, 0.04);
	}
	.card-face__head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
		position: relative;
	}
	.card-brand {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.65);
	}
	.card-badges {
		display: flex;
		gap: 5px;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		border-radius: 99px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(0, 0, 0, 0.3);
		padding: 2px 8px;
		font-size: 10px;
		font-weight: 700;
		color: #fff;
		backdrop-filter: blur(4px);
	}
	.badge--expired {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.4);
		color: #fca5a5;
	}

	.card-chip {
		width: 32px;
		height: 24px;
		border-radius: 5px;
		margin-bottom: 14px;
		position: relative;
		background: linear-gradient(135deg, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.6));
		border: 1px solid rgba(255, 215, 0, 0.25);
	}
	.card-chip__inner {
		position: absolute;
		inset: 3px;
		border-radius: 3px;
		border: 1px solid rgba(0, 0, 0, 0.2);
		background: linear-gradient(135deg, rgba(255, 220, 50, 0.6), transparent);
	}

	.card-pan {
		font-family: 'Courier New', monospace;
		font-size: 17px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.9);
		margin: 0 0 14px;
		font-variant-numeric: tabular-nums;
	}
	.card-exp__label {
		display: block;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.35);
		margin-bottom: 2px;
	}
	.card-exp__val {
		font-family: 'Courier New', monospace;
		font-size: 14px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.85);
	}
	.card-exp__val--expired {
		color: #fca5a5;
	}

	/* ── Card controls ───────────────────────────────────────────────────────── */
	.card-controls {
		background: rgba(10, 16, 26, 0.9);
		padding: 12px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.card-controls__status {
		font-size: 11px;
		color: #334155;
	}
	.card-controls__status--active {
		color: #4ade80;
	}
	.card-controls__actions {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
	}

	.ctrl-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		border-radius: 8px;
		border: 1px solid;
		padding: 5px 10px;
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		transition: filter 0.15s;
	}
	.ctrl-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.ctrl-btn:not(:disabled):hover {
		filter: brightness(1.25);
	}
	.ctrl-btn--primary {
		background: rgba(99, 102, 241, 0.1);
		border-color: rgba(99, 102, 241, 0.25);
		color: #a5b4fc;
	}
	.ctrl-btn--danger {
		background: rgba(239, 68, 68, 0.07);
		border-color: rgba(239, 68, 68, 0.18);
		color: rgba(252, 165, 165, 0.8);
	}

	/* ── Add button ──────────────────────────────────────────────────────────── */
	.add-card-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 200px;
		width: 100%;
		cursor: pointer;
		background: rgba(99, 102, 241, 0.02);
		border: 1px dashed rgba(99, 102, 241, 0.2);
		border-radius: 20px;
		transition:
			border-color 0.2s,
			background 0.2s;
	}
	.add-card-btn:hover {
		border-color: rgba(99, 102, 241, 0.45);
		background: rgba(99, 102, 241, 0.05);
	}
	.add-card-btn__icon {
		width: 44px;
		height: 44px;
		border-radius: 14px;
		border: 1px solid rgba(99, 102, 241, 0.2);
		background: rgba(99, 102, 241, 0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}
	.add-card-btn:hover .add-card-btn__icon {
		background: rgba(99, 102, 241, 0.14);
	}
	.add-card-btn__label {
		font-size: 14px;
		font-weight: 700;
		color: #6366f1;
	}
	.add-card-btn__sub {
		font-size: 11px;
		color: #334155;
	}

	/* ── Security panel ──────────────────────────────────────────────────────── */
	.security-panel {
		background: rgba(10, 16, 26, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 18px;
		padding: 20px;
	}
	.security-panel__header {
		display: flex;
		align-items: center;
		gap: 7px;
		margin-bottom: 16px;
	}
	.security-panel__title {
		font-size: 12px;
		font-weight: 700;
		color: #334155;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.security-items {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-bottom: 16px;
	}
	.security-item {
		display: flex;
		gap: 10px;
	}
	.security-item__icon {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 1px;
	}
	.security-item__title {
		font-size: 12px;
		font-weight: 600;
		color: #475569;
		margin: 0 0 3px;
	}
	.security-item__desc {
		font-size: 11px;
		color: #334155;
		line-height: 1.5;
		margin: 0;
	}
	.security-panel__footer {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: #334155;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		padding-top: 14px;
	}

	/* ── Spinners ────────────────────────────────────────────────────────────── */
	.spinner-xs {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 2px solid rgba(165, 180, 252, 0.25);
		border-top-color: #a5b4fc;
		animation: spin 0.7s linear infinite;
	}
	.spinner-xs--red {
		border-color: rgba(252, 165, 165, 0.25);
		border-top-color: #fca5a5;
	}
	.spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid rgba(99, 102, 241, 0.25);
		border-top-color: #6366f1;
		animation: spin 0.7s linear infinite;
	}
	.spinner--white {
		border-color: rgba(255, 255, 255, 0.25);
		border-top-color: #fff;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ── Modal ───────────────────────────────────────────────────────────────── */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(12px);
		padding: 0;
	}
	@media (min-width: 640px) {
		.modal-backdrop {
			align-items: center;
			padding: 20px;
		}
	}
	.modal {
		width: 100%;
		max-width: 480px;
		background: #0d1520;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 28px 28px 0 0;
		padding: 28px;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
		transform: translateY(20px);
		opacity: 0;
		transition:
			transform 0.25s ease-out,
			opacity 0.25s ease-out;
	}
	@media (min-width: 640px) {
		.modal {
			border-radius: 24px;
		}
	}
	.modal--visible {
		transform: translateY(0);
		opacity: 1;
	}

	.modal__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 20px;
	}
	.modal__title {
		font-size: 18px;
		font-weight: 700;
		color: #f1f5f9;
		margin: 0 0 4px;
	}
	.modal__sub {
		font-size: 12px;
		color: #475569;
		margin: 0;
	}
	.modal__close {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 8px;
		padding: 6px;
		cursor: pointer;
		color: #64748b;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.15s,
			color 0.15s;
		flex-shrink: 0;
	}
	.modal__close:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #94a3b8;
	}
	.modal__error {
		background: rgba(239, 68, 68, 0.07);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 10px;
		padding: 11px 14px;
		font-size: 13px;
		color: #fca5a5;
		margin-bottom: 16px;
	}
	.modal__loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 40px 0;
		font-size: 13px;
		color: #475569;
	}
	.modal__stripe-el {
		min-height: 140px;
		margin-bottom: 16px;
		padding: 2px;
	}
	.modal__security-note {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: #334155;
		margin-bottom: 20px;
	}
	.modal__actions {
		display: flex;
		gap: 10px;
	}
	.modal__btn-cancel {
		flex: 1;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.07);
		background: rgba(255, 255, 255, 0.04);
		padding: 12px;
		font-size: 13px;
		font-weight: 500;
		color: #475569;
		cursor: pointer;
		transition: background 0.15s;
	}
	.modal__btn-cancel:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.modal__btn-cancel:not(:disabled):hover {
		background: rgba(255, 255, 255, 0.07);
	}
	.modal__btn-confirm {
		flex: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		border-radius: 12px;
		border: none;
		background: linear-gradient(135deg, #6366f1, #7c3aed);
		padding: 12px;
		font-size: 13px;
		font-weight: 700;
		color: #fff;
		cursor: pointer;
		box-shadow: 0 2px 12px rgba(99, 102, 241, 0.3);
		transition: filter 0.15s;
	}
	.modal__btn-confirm:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.modal__btn-confirm:not(:disabled):hover {
		filter: brightness(1.1);
	}

	/* ── Responsive ──────────────────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.security-items {
			grid-template-columns: 1fr;
		}
		.info-bar {
			flex-wrap: wrap;
		}
	}
	@media (max-width: 480px) {
		.cards-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
