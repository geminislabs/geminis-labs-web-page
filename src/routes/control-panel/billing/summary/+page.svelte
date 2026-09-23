<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { billingService } from '$lib/services/billingService.js';
	import CheckoutModal from '$lib/components/CheckoutModal.svelte';
	import { goto } from '$app/navigation';
	import { formatMxn, toCents } from '$lib/utils/currency.js';

	let loading = true;
	let summary = null;
	let payments = [];
	let paymentsTotal = 0;
	let paymentsHasMore = false;
	let error = null;

	let showCheckout = false;
	let checkoutPlan = null;
	let savedMethods = [];
	let checkoutSuccess = false;
	let checkoutPending = false;

	let dismissedPending = false;
	let autoRenewOverride = null;
	let autoRenewSaving = false;
	let autoRenewError = null;

	onMount(async () => {
		const params = $page.url.searchParams;
		const clientSecret = params.get('payment_intent_client_secret');
		const checkoutFlag = params.get('checkout');
		const redirectStatus = params.get('redirect_status');
		if (redirectStatus) billingService.completeCheckout(redirectStatus);

		if (clientSecret || checkoutFlag) {
			const next = new URL($page.url.href);
			next.searchParams.delete('checkout');
			next.searchParams.delete('payment_intent');
			next.searchParams.delete('payment_intent_client_secret');
			next.searchParams.delete('redirect_status');
			const qs = next.searchParams.toString();
			history.replaceState({}, '', `${next.pathname}${qs ? `?${qs}` : ''}${next.hash}`);
		}

		if (clientSecret) {
			try {
				const { paymentIntent, error: piError } =
					await billingService.retrievePaymentIntent(clientSecret);
				if (!piError) {
					applyReturnedIntent(paymentIntent?.status);
				}
			} catch {
				/* el resumen dirá si la suscripción ya quedó activa */
			}
		}

		await loadData();

		if ((clientSecret || checkoutFlag) && !summary?.has_active_subscription) {
			await new Promise((r) => setTimeout(r, 3000));
			await loadData();
		}
		if ((clientSecret || checkoutFlag) && !summary?.has_active_subscription) {
			await new Promise((r) => setTimeout(r, 4000));
			await loadData();
		}

		reconcileCheckoutBanners(checkoutFlag, clientSecret);
	});

	function applyReturnedIntent(status) {
		if (status === 'succeeded' || status === 'requires_capture') {
			checkoutSuccess = true;
			checkoutPending = false;
			return;
		}
		if (status === 'processing' || status === 'requires_action') {
			checkoutSuccess = false;
			checkoutPending = true;
		}
	}

	function reconcileCheckoutBanners(checkoutFlag, clientSecret) {
		if (!checkoutFlag && !clientSecret) return;
		if (summary?.has_active_subscription) {
			checkoutSuccess = true;
			checkoutPending = false;
			return;
		}
		if (
			checkoutPending ||
			checkoutFlag === 'pending' ||
			checkoutFlag === 'resume' ||
			checkoutFlag === 'success'
		) {
			checkoutSuccess = false;
			checkoutPending = true;
		}
	}

	async function loadData() {
		loading = true;
		error = null;
		dismissedPending = false;
		try {
			const [s, m, p] = await Promise.all([
				billingService.getSummary(),
				billingService.getPaymentMethods('stripe').catch(() => []),
				billingService
					.getPayments({ limit: 5 })
					.catch(() => ({ data: [], total: 0, has_more: false }))
			]);
			summary = s;
			savedMethods = Array.isArray(m) ? m : [];
			payments = p.data ?? [];
			paymentsTotal = p.total ?? 0;
			paymentsHasMore = p.has_more ?? false;
		} catch (e) {
			error = e.message ?? 'No se pudo cargar el resumen de facturación.';
		} finally {
			loading = false;
		}
	}

	async function openCheckout() {
		if (summary?.current_plan) {
			const plans = await billingService.getPlans().catch(() => []);
			checkoutPlan = plans.find((p) => p.id === summary.current_plan.plan_id) ?? null;
			if (checkoutPlan) showCheckout = true;
			return;
		}

		goto('/control-panel/billing/plans');
	}

	function onPaymentSuccess() {
		checkoutSuccess = true;
		checkoutPending = false;
		showCheckout = false;
		setTimeout(loadData, 2000);
	}

	function onPaymentPending() {
		checkoutSuccess = false;
		checkoutPending = true;
		showCheckout = false;
		setTimeout(loadData, 2000);
	}

	$: plan = summary?.current_plan;
	$: planQuote = plan?.quote ?? null;
	$: stats = summary?.stats;
	$: pendingAmount = summary?.pending_amount ?? '0';

	$: days = (() => {
		if (!plan?.next_billing_date) return null;
		return Math.max(0, Math.ceil((new Date(plan.next_billing_date) - new Date()) / 86400000));
	})();

	$: urgencyColor =
		days === null ? '#34d399' : days <= 3 ? '#f87171' : days <= 7 ? '#fbbf24' : '#34d399';

	$: renewal = summary?.renewal;
	$: graceLabel = renewal?.grace_until ? fmtDate(renewal.grace_until) : null;
	$: autoRenew = autoRenewOverride ?? renewal?.auto_renew ?? true;

	async function toggleAutoRenew(next) {
		if (autoRenewSaving) return;
		autoRenewSaving = true;
		autoRenewError = null;
		// Optimista, pero se revierte si el backend rechaza: el interruptor nunca
		// debe quedar mostrando algo distinto a lo que está guardado.
		autoRenewOverride = next;
		try {
			const res = await billingService.setAutoRenew(next);
			autoRenewOverride = res.auto_renew;
		} catch (e) {
			autoRenewOverride = !next;
			autoRenewError = e.message ?? 'No pudimos guardar el cambio';
		} finally {
			autoRenewSaving = false;
		}
	}

	// Cada estado pide una acción distinta del cliente, así que el aviso lo dice
	// en lugar de mandarlo a adivinar qué salió mal.
	$: renewalAlert = (() => {
		switch (renewal?.state) {
			case 'action_required':
				return {
					title: 'Tu banco pide autorizar el cargo',
					message:
						'La renovación quedó pendiente de confirmación. Autorízala para no perder el servicio.',
					cta: 'Autorizar cargo'
				};
			case 'no_payment_method':
				return {
					title: 'No tenemos una tarjeta para renovar',
					message: 'Agrega un método de pago para que tu plan se renueve automáticamente.',
					cta: 'Agregar tarjeta'
				};
			case 'past_due':
				return {
					title: 'No pudimos cobrar la renovación',
					message: renewal?.message ?? 'Revisa tu método de pago e inténtalo de nuevo.',
					cta: 'Reintentar pago'
				};
			default:
				return null;
		}
	})();

	$: daysLabel =
		days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : days !== null ? `En ${days} días` : '—';

	function fmtMxn(v) {
		return formatMxn(v);
	}

	function toCentsSafe(v) {
		try {
			return toCents(v);
		} catch {
			return 0;
		}
	}

	function fmtDate(d) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('es-MX', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function fmtDateShort(d) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('es-MX', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function paymentStatusInfo(status) {
		const s = (status || '').toUpperCase();
		if (s === 'SUCCESS')
			return {
				label: 'Exitoso',
				color: '#4ade80',
				bg: 'rgba(74,222,128,0.08)',
				border: 'rgba(74,222,128,0.2)'
			};
		if (s === 'PENDING')
			return {
				label: 'Pendiente',
				color: '#fbbf24',
				bg: 'rgba(251,191,36,0.08)',
				border: 'rgba(251,191,36,0.2)'
			};
		if (s === 'FAILED')
			return {
				label: 'Fallido',
				color: '#f87171',
				bg: 'rgba(248,113,113,0.08)',
				border: 'rgba(248,113,113,0.2)'
			};
		if (s === 'REFUNDED')
			return {
				label: 'Reembolsado',
				color: '#818cf8',
				bg: 'rgba(129,140,248,0.08)',
				border: 'rgba(129,140,248,0.2)'
			};
		if (s === 'PARTIALLY_REFUNDED')
			return {
				label: 'Reembolso parcial',
				color: '#818cf8',
				bg: 'rgba(129,140,248,0.08)',
				border: 'rgba(129,140,248,0.2)'
			};
		if (s === 'DISPUTED')
			return {
				label: 'En disputa',
				color: '#fb923c',
				bg: 'rgba(251,146,60,0.08)',
				border: 'rgba(251,146,60,0.2)'
			};
		if (s === 'PROCESSING' || s === 'REQUIRES_ACTION')
			return {
				label: 'En confirmación',
				color: '#fbbf24',
				bg: 'rgba(251,191,36,0.08)',
				border: 'rgba(251,191,36,0.2)'
			};
		if (s === 'CANCELED')
			return {
				label: 'Cancelado',
				color: '#64748b',
				bg: 'rgba(100,116,139,0.08)',
				border: 'rgba(100,116,139,0.2)'
			};
		return {
			label: status || '—',
			color: '#64748b',
			bg: 'rgba(100,116,139,0.08)',
			border: 'rgba(100,116,139,0.2)'
		};
	}

	function methodLabel(method) {
		const m = (method || '').toLowerCase();
		if (m === 'card') return 'Tarjeta';
		if (m === 'oxxo') return 'OXXO';
		if (m === 'spei') return 'SPEI';
		return method || '—';
	}

	$: defaultCard = savedMethods.find((m) => m.is_default);
</script>

<svelte:head><title>Resumen — Facturación | Geminis Labs</title></svelte:head>

{#if checkoutSuccess}
	<div class="alert alert--success" role="status">
		<svg
			width="16"
			height="16"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
			class="shrink-0"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span
			><strong>Pago procesado correctamente.</strong> Tu suscripción está activa. El recibo llegará a
			tu correo.</span
		>
		<button
			type="button"
			on:click={() => (checkoutSuccess = false)}
			class="alert__close"
			aria-label="Cerrar">✕</button
		>
	</div>
{:else if checkoutPending}
	<div class="alert alert--info" role="status">
		<svg
			width="16"
			height="16"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
			class="shrink-0"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span
			><strong>Estamos confirmando tu pago.</strong> Tu banco aún no cierra la operación. No vuelvas a
			pagar: la suscripción se activa sola cuando se acredite.</span
		>
		<button
			type="button"
			on:click={() => (checkoutPending = false)}
			class="alert__close"
			aria-label="Cerrar">✕</button
		>
	</div>
{/if}

{#if !loading && toCentsSafe(pendingAmount) > 0 && !dismissedPending && !checkoutSuccess && !checkoutPending}
	<div class="alert alert--warning" role="alert">
		<svg
			width="16"
			height="16"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
			class="shrink-0"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<div class="flex-1">
			<strong>Pago iniciado pero no completado</strong>
			<p class="alert__sub">
				Cerraste el proceso antes de confirmar. Puedes retomarlo ahora — no se te cobra nada hasta
				que confirmes.
			</p>
		</div>
		<div class="alert__actions">
			<button type="button" class="alert__cta" on:click={openCheckout}> Completar pago </button>
			<button
				type="button"
				class="alert__dismiss"
				on:click={() => (dismissedPending = true)}
				aria-label="Ignorar"
			>
				✕
			</button>
		</div>
	</div>
{/if}

{#if !loading && renewalAlert}
	<div class="alert alert--warning" role="alert">
		<svg
			width="16"
			height="16"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
			class="shrink-0"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
			/>
		</svg>
		<div class="flex-1">
			<strong>{renewalAlert.title}</strong>
			<p class="alert__sub">
				{renewalAlert.message}
				{#if graceLabel}
					Tu servicio sigue activo hasta el {graceLabel}.
				{/if}
			</p>
		</div>
		<div class="alert__actions">
			<button type="button" class="alert__cta" on:click={openCheckout}>
				{renewalAlert.cta}
			</button>
		</div>
	</div>
{/if}

{#if error}
	<div class="error-card">
		<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f87171" stroke-width="1.5">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
			/>
		</svg>
		<p>{error}</p>
		<button on:click={loadData} class="btn-link">Reintentar</button>
	</div>
{:else if loading}
	<div class="kpi-grid mb-4">
		{#each [1, 2, 3] as i (i)}<div class="skeleton h-28 rounded-2xl"></div>{/each}
	</div>
	<div class="skeleton h-64 rounded-2xl mb-4"></div>
	<div class="skeleton h-48 rounded-2xl"></div>
{:else}
	<div class="kpi-grid mb-5">
		<div class="kpi-card">
			<div
				class="kpi-icon"
				style="background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.2);"
			>
				<svg
					width="18"
					height="18"
					fill="none"
					viewBox="0 0 24 24"
					stroke={urgencyColor}
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
			</div>
			<div class="kpi-body">
				<p class="kpi-label">Próximo cobro</p>
				{#if plan}
					<p class="kpi-value" style="color:{urgencyColor}">{daysLabel}</p>
					<p class="kpi-sub">{fmtDate(plan.next_billing_date)}</p>
				{:else}
					<p class="kpi-value" style="color:#475569;">Sin suscripción</p>
					<p class="kpi-sub">Activa un plan para comenzar</p>
				{/if}
			</div>
			{#if days !== null && days <= 7}
				<div
					class="kpi-badge"
					style="background: rgba(251,191,36,0.1); color: #fbbf24; border-color: rgba(251,191,36,0.25);"
				>
					Pronto
				</div>
			{/if}
		</div>

		<div class="kpi-card">
			<div
				class="kpi-icon"
				style="background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.15);"
			>
				<svg
					width="18"
					height="18"
					fill="none"
					viewBox="0 0 24 24"
					stroke="#818cf8"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<div class="kpi-body">
				<p class="kpi-label">A cobrar (con IVA)</p>
				{#if plan}
					<p class="kpi-value" style="color:#e2e8f0;">{fmtMxn(planQuote?.total ?? '0')}</p>
					<p class="kpi-sub">{plan.billing_cycle === 'YEARLY' ? 'Ciclo anual' : 'Ciclo mensual'}</p>
				{:else}
					<p class="kpi-value" style="color:#475569;">—</p>
					<p class="kpi-sub">Sin plan activo</p>
				{/if}
			</div>
		</div>

		<div class="kpi-card">
			<div
				class="kpi-icon"
				style="background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.2);"
			>
				<svg
					width="18"
					height="18"
					fill="none"
					viewBox="0 0 24 24"
					stroke="#34d399"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
					/>
				</svg>
			</div>
			<div class="kpi-body">
				<p class="kpi-label">Total pagado histórico</p>
				<p class="kpi-value" style="color:#34d399;">{fmtMxn(stats?.total_paid ?? '0')}</p>
				<p class="kpi-sub">
					{stats?.payments_count ?? 0}
					{stats?.payments_count === 1 ? 'pago realizado' : 'pagos realizados'}
				</p>
			</div>
		</div>
	</div>

	<div class="section-card mb-4">
		<div class="section-card__head">
			<div>
				<p class="section-card__eyebrow">Suscripción activa</p>
				<h2 class="section-card__title">{plan?.plan_name ?? 'Sin plan contratado'}</h2>
				{#if summary?.organization_name}
					<p class="section-card__org">
						<svg
							width="12"
							height="12"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
						{summary.organization_name}
					</p>
				{/if}
			</div>
			<div class="flex items-center gap-2 flex-wrap justify-end">
				{#if summary?.billing_email}
					<span class="meta-chip">
						<svg
							width="11"
							height="11"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						{summary.billing_email}
					</span>
				{/if}
				{#if summary?.has_active_subscription}
					<span class="status-badge status-badge--active">
						<span class="status-badge__dot" style="background:#4ade80;"></span>
						Activo
					</span>
				{:else}
					<span class="status-badge status-badge--inactive">Sin plan</span>
				{/if}
			</div>
		</div>

		{#if plan}
			<div class="plan-details">
				<div class="plan-row">
					<span class="plan-row__label">Código de plan</span>
					<span class="plan-row__value plan-row__mono">{plan.plan_code ?? '—'}</span>
				</div>
				<div class="plan-row">
					<span class="plan-row__label">Ciclo de facturación</span>
					<span class="plan-row__value"
						>{plan.billing_cycle === 'YEARLY' ? 'Anual (12 meses)' : 'Mensual'}</span
					>
				</div>
				<div class="plan-row">
					<span class="plan-row__label">Precio sin IVA</span>
					<span class="plan-row__value plan-row__mono">{fmtMxn(planQuote?.subtotal ?? '0')}</span>
				</div>
				<div class="plan-row">
					<span class="plan-row__label">IVA (16%)</span>
					<span class="plan-row__value plan-row__mono">{fmtMxn(planQuote?.tax ?? '0')}</span>
				</div>
				<div class="plan-row plan-row--total">
					<span class="plan-row__label">Total con IVA</span>
					<span class="plan-row__value plan-row__mono plan-row__total-val"
						>{fmtMxn(planQuote?.total ?? '0')}</span
					>
				</div>
				<div class="plan-row">
					<span class="plan-row__label">
						Renovación automática
						<span class="plan-row__hint">
							{autoRenew
								? 'Se cobrará solo, 3 días antes de vencer'
								: 'Tu plan vence sin volver a cobrarse'}
						</span>
					</span>
					<label class="switch">
						<input
							type="checkbox"
							checked={autoRenew}
							disabled={autoRenewSaving}
							on:change={(e) => toggleAutoRenew(e.currentTarget.checked)}
						/>
						<span class="switch__track"><span class="switch__thumb"></span></span>
					</label>
				</div>
				{#if autoRenewError}
					<p class="plan-row__error">{autoRenewError}</p>
				{/if}
			</div>

			{#if defaultCard}
				<div class="default-card-info">
					<svg
						width="13"
						height="13"
						fill="none"
						viewBox="0 0 24 24"
						stroke="#818cf8"
						stroke-width="2"
					>
						<rect x="2" y="5" width="20" height="14" rx="2" />
						<path stroke-linecap="round" d="M2 10h20" />
					</svg>
					<span
						>Cobros con <strong
							>{defaultCard.brand?.toUpperCase() ?? 'tarjeta'} ···· {defaultCard.last4}</strong
						></span
					>
					<a href="/control-panel/billing/payment-methods" class="link-subtle">Cambiar</a>
				</div>
			{/if}

			<div class="plan-actions">
				<button type="button" on:click={openCheckout} class="btn-primary">
					<svg
						width="13"
						height="13"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
						/>
					</svg>
					Renovar suscripción
				</button>
				<a href="/control-panel/billing/invoices" class="btn-ghost">
					Ver facturas
					<svg
						width="13"
						height="13"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
					</svg>
				</a>
			</div>
		{:else}
			<div class="no-plan">
				<p class="no-plan__text">
					No tienes una suscripción activa. Contrata un plan para acceder a todas las funciones de
					NEXUS y comenzar a gestionar tu flota.
				</p>
				<a href="/control-panel/billing/plans" class="btn-primary">
					<svg
						width="13"
						height="13"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7" />
					</svg>
					Ver planes disponibles
				</a>
			</div>
		{/if}
	</div>

	<div class="section-card mb-4">
		<div class="payments-head">
			<div>
				<p class="section-card__eyebrow">Actividad de pagos</p>
				<h2 class="section-card__title" style="font-size:16px;">Pagos recientes</h2>
			</div>
			{#if paymentsTotal > 0}
				<span class="count-badge">{paymentsTotal} total</span>
			{/if}
		</div>

		{#if payments.length === 0 && (stats?.payments_count ?? 0) > 0}
			<div class="stats-fallback">
				<div class="stats-fallback__row">
					<div class="stats-fallback__item">
						<span class="stats-fallback__label">Pagos realizados</span>
						<span class="stats-fallback__val">{stats.payments_count}</span>
					</div>
					<div class="stats-fallback__item">
						<span class="stats-fallback__label">Total acumulado</span>
						<span class="stats-fallback__val">{fmtMxn(stats.total_paid)}</span>
					</div>
					{#if stats.last_payment_date}
						<div class="stats-fallback__item">
							<span class="stats-fallback__label">Último pago</span>
							<span class="stats-fallback__val">{fmtDateShort(stats.last_payment_date)}</span>
						</div>
					{/if}
				</div>
				<a
					href="/control-panel/billing/invoices"
					class="link-more"
					style="margin-top:10px; display:inline-flex;"
				>
					Ver comprobantes completos →
				</a>
			</div>
		{:else if payments.length === 0}
			<div class="empty-state">
				<div class="empty-state__icon">
					<svg
						width="20"
						height="20"
						fill="none"
						viewBox="0 0 24 24"
						stroke="#334155"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
				<p class="empty-state__text">Aún no hay pagos registrados en esta organización.</p>
			</div>
		{:else}
			<div class="payments-list">
				{#each payments as pmt (pmt.id)}
					{@const st = paymentStatusInfo(pmt.status)}
					<div class="payment-row">
						<div class="payment-row__icon" style="background:{st.bg}; border-color:{st.border};">
							<svg
								width="12"
								height="12"
								fill="none"
								viewBox="0 0 24 24"
								stroke={st.color}
								stroke-width="2"
							>
								{#if pmt.status === 'SUCCESS'}
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								{:else if pmt.status === 'FAILED'}
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								{:else}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								{/if}
							</svg>
						</div>
						<div class="payment-row__body">
							<div class="payment-row__top">
								<span class="payment-row__method">{methodLabel(pmt.method)}</span>
								{#if pmt.transaction_ref}
									<span class="payment-row__ref">{pmt.transaction_ref}</span>
								{/if}
							</div>
							<span class="payment-row__date">{fmtDateShort(pmt.paid_at ?? pmt.created_at)}</span>
						</div>
						<div class="payment-row__right">
							<span class="payment-row__amount">{fmtMxn(pmt.amount)}</span>
							<span
								class="status-pill"
								style="color:{st.color}; background:{st.bg}; border-color:{st.border};"
							>
								{st.label}
							</span>
						</div>
					</div>
				{/each}
			</div>
			{#if paymentsHasMore}
				<div class="payments-footer">
					<a href="/control-panel/billing/invoices" class="link-more">
						Ver historial completo
						<svg
							width="12"
							height="12"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			{/if}
		{/if}
	</div>

	<div class="quick-links">
		{#each [{ href: '/control-panel/billing/payment-methods', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Métodos de pago', sub: savedMethods.length > 0 ? `${savedMethods.length} tarjeta${savedMethods.length !== 1 ? 's' : ''} guardada${savedMethods.length !== 1 ? 's' : ''}` : 'Agrega una tarjeta', accent: '#818cf8' }, { href: '/control-panel/billing/invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Facturas y comprobantes', sub: paymentsTotal > 0 ? `${paymentsTotal} documento${paymentsTotal !== 1 ? 's' : ''} disponible${paymentsTotal !== 1 ? 's' : ''}` : 'Sin facturas aún', accent: '#34d399' }] as link (link.href)}
			<a href={link.href} class="quick-link-card">
				<div
					class="quick-link-card__icon"
					style="background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.15);"
				>
					<svg
						width="15"
						height="15"
						fill="none"
						viewBox="0 0 24 24"
						stroke={link.accent}
						stroke-width="1.8"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d={link.icon} />
					</svg>
				</div>
				<div class="quick-link-card__body">
					<p class="quick-link-card__label">{link.label}</p>
					<p class="quick-link-card__sub">{link.sub}</p>
				</div>
				<svg
					width="14"
					height="14"
					fill="none"
					viewBox="0 0 24 24"
					stroke="#334155"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		{/each}
	</div>
{/if}

{#if showCheckout && checkoutPlan}
	<CheckoutModal
		plan={checkoutPlan}
		initialCycle={plan?.billing_cycle ?? 'MONTHLY'}
		{savedMethods}
		on:close={() => (showCheckout = false)}
		on:success={onPaymentSuccess}
		on:pending={onPaymentPending}
	/>
{/if}

<style>
	.alert {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		border-radius: 12px;
		padding: 13px 16px;
		font-size: 13px;
		margin-bottom: 16px;
		border-width: 1px;
		border-style: solid;
	}
	.alert--success {
		background: rgba(74, 222, 128, 0.07);
		border-color: rgba(74, 222, 128, 0.2);
		color: #4ade80;
	}
	.alert--warning {
		background: rgba(251, 191, 36, 0.07);
		border-color: rgba(251, 191, 36, 0.2);
		color: #fbbf24;
	}
	.alert--info {
		background: rgba(99, 102, 241, 0.08);
		border-color: rgba(99, 102, 241, 0.25);
		color: #a5b4fc;
	}
	.alert__close {
		margin-left: auto;
		background: none;
		border: none;
		cursor: pointer;
		color: #475569;
		font-size: 14px;
		line-height: 1;
		padding: 0;
	}
	.alert__sub {
		font-size: 12px;
		margin: 3px 0 0;
		opacity: 0.8;
	}
	.alert__actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
		flex-shrink: 0;
		align-self: center;
	}
	.alert__cta {
		white-space: nowrap;
		font-size: 12px;
		font-weight: 700;
		color: #0d1117;
		background: #fbbf24;
		border: none;
		border-radius: 8px;
		padding: 6px 12px;
		cursor: pointer;
		transition: filter 0.15s;
		line-height: 1;
	}
	.alert__cta:hover {
		filter: brightness(1.08);
	}
	.alert__dismiss {
		background: none;
		border: none;
		cursor: pointer;
		color: rgba(251, 191, 36, 0.45);
		font-size: 14px;
		padding: 4px;
		line-height: 1;
		transition: color 0.15s;
	}
	.alert__dismiss:hover {
		color: rgba(251, 191, 36, 0.75);
	}

	.stats-fallback {
		padding: 4px 0 8px;
	}
	.stats-fallback__row {
		display: flex;
		gap: 24px;
		flex-wrap: wrap;
		padding: 14px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		margin-bottom: 4px;
	}
	.stats-fallback__item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.stats-fallback__label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #334155;
	}
	.stats-fallback__val {
		font-size: 18px;
		font-weight: 700;
		color: #e2e8f0;
		font-variant-numeric: tabular-nums;
	}

	.error-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		background: rgba(248, 113, 113, 0.07);
		border: 1px solid rgba(248, 113, 113, 0.2);
		border-radius: 16px;
		padding: 28px;
		text-align: center;
		color: #fca5a5;
		font-size: 13px;
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
	.mb-4 {
		margin-bottom: 16px;
	}
	.mb-5 {
		margin-bottom: 20px;
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 14px;
	}
	.kpi-card {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		background: rgba(10, 16, 26, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 18px;
		padding: 18px;
		position: relative;
		transition: border-color 0.2s;
	}
	.kpi-card:hover {
		border-color: rgba(255, 255, 255, 0.12);
	}
	.kpi-icon {
		width: 42px;
		height: 42px;
		border-radius: 12px;
		border: 1px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.kpi-body {
		flex: 1;
		min-width: 0;
	}
	.kpi-label {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #334155;
		margin: 0 0 5px;
	}
	.kpi-value {
		font-size: 22px;
		font-weight: 800;
		letter-spacing: -0.03em;
		margin: 0 0 3px;
		font-variant-numeric: tabular-nums;
	}
	.kpi-sub {
		font-size: 11px;
		color: #475569;
		margin: 0;
	}
	.kpi-badge {
		position: absolute;
		top: 14px;
		right: 14px;
		font-size: 10px;
		font-weight: 700;
		border-radius: 99px;
		border: 1px solid;
		padding: 2px 8px;
	}

	.section-card {
		background: rgba(10, 16, 26, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 20px;
		padding: 22px;
	}
	.section-card__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 18px;
		flex-wrap: wrap;
	}
	.section-card__eyebrow {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #334155;
		margin: 0 0 4px;
	}
	.section-card__title {
		font-size: 18px;
		font-weight: 700;
		color: #f1f5f9;
		margin: 0 0 4px;
		letter-spacing: -0.02em;
	}
	.section-card__org {
		font-size: 12px;
		color: #475569;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border-radius: 99px;
		border: 1px solid;
		padding: 4px 10px;
		font-size: 11px;
		font-weight: 700;
		white-space: nowrap;
	}
	.status-badge--active {
		background: rgba(74, 222, 128, 0.08);
		border-color: rgba(74, 222, 128, 0.25);
		color: #4ade80;
	}
	.status-badge--inactive {
		background: rgba(100, 116, 139, 0.08);
		border-color: rgba(100, 116, 139, 0.25);
		color: #475569;
	}
	.status-badge__dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}
	.meta-chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 8px;
		padding: 4px 10px;
		font-size: 11px;
		color: #64748b;
	}

	.plan-details {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 16px;
	}
	.plan-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 11px 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}
	.plan-row:last-child {
		border-bottom: none;
	}
	.plan-row--total {
		background: rgba(99, 102, 241, 0.05);
		border-top: 1px solid rgba(99, 102, 241, 0.1);
	}
	.plan-row__label {
		font-size: 13px;
		color: #475569;
	}
	.plan-row__value {
		font-size: 13px;
		color: #cbd5e1;
		font-weight: 500;
	}
	.plan-row__mono {
		font-variant-numeric: tabular-nums;
	}
	.plan-row__hint {
		display: block;
		margin-top: 2px;
		font-size: 11px;
		color: #334155;
	}
	.plan-row__error {
		margin: 0;
		padding: 8px 16px;
		font-size: 12px;
		color: #f87171;
	}
	.switch {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
	}
	.switch input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}
	.switch__track {
		position: relative;
		display: block;
		width: 38px;
		height: 21px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		transition:
			background 0.18s ease,
			border-color 0.18s ease;
	}
	.switch__thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: #94a3b8;
		transition:
			transform 0.18s ease,
			background 0.18s ease;
	}
	.switch input:checked + .switch__track {
		background: rgba(74, 222, 128, 0.18);
		border-color: rgba(74, 222, 128, 0.4);
	}
	.switch input:checked + .switch__track .switch__thumb {
		transform: translateX(17px);
		background: #4ade80;
	}
	.switch input:focus-visible + .switch__track {
		outline: 2px solid rgba(74, 222, 128, 0.5);
		outline-offset: 2px;
	}
	.switch input:disabled + .switch__track {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.plan-row__total-val {
		font-size: 16px;
		font-weight: 800;
		color: #f1f5f9;
	}
	.default-card-info {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 12px;
		color: #64748b;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		padding: 10px 14px;
		margin-bottom: 16px;
	}
	.default-card-info strong {
		color: #94a3b8;
	}
	.link-subtle {
		margin-left: auto;
		font-size: 11px;
		color: #6366f1;
		text-decoration: none;
		font-weight: 600;
	}
	.link-subtle:hover {
		color: #818cf8;
	}

	.plan-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		background: linear-gradient(135deg, #6366f1, #7c3aed);
		padding: 10px 18px;
		font-size: 13px;
		font-weight: 600;
		color: #fff;
		text-decoration: none;
		box-shadow: 0 2px 12px rgba(99, 102, 241, 0.3);
		transition: filter 0.15s;
	}
	.btn-primary:hover {
		filter: brightness(1.1);
	}
	.btn-ghost {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 500;
		color: #818cf8;
		text-decoration: none;
		transition: color 0.15s;
	}
	.btn-ghost:hover {
		color: #a5b4fc;
	}
	.btn-link {
		font-size: 12px;
		color: #6366f1;
		text-decoration: underline;
		cursor: pointer;
		background: none;
		border: none;
	}
	.no-plan__text {
		font-size: 13px;
		color: #475569;
		line-height: 1.7;
		margin: 0 0 16px;
		max-width: 52ch;
	}

	.payments-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}
	.count-badge {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 8px;
		padding: 4px 10px;
		font-size: 11px;
		font-weight: 700;
		color: #475569;
		white-space: nowrap;
		align-self: center;
	}
	.payments-list {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.payment-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		border-radius: 10px;
		transition: background 0.15s;
	}
	.payment-row:hover {
		background: rgba(255, 255, 255, 0.02);
	}
	.payment-row__icon {
		width: 32px;
		height: 32px;
		border-radius: 10px;
		border: 1px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.payment-row__body {
		flex: 1;
		min-width: 0;
	}
	.payment-row__top {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 2px;
	}
	.payment-row__method {
		font-size: 13px;
		font-weight: 500;
		color: #cbd5e1;
	}
	.payment-row__ref {
		font-size: 11px;
		font-family: monospace;
		color: #334155;
	}
	.payment-row__date {
		font-size: 11px;
		color: #475569;
	}
	.payment-row__right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
		flex-shrink: 0;
	}
	.payment-row__amount {
		font-size: 14px;
		font-weight: 700;
		color: #e2e8f0;
		font-variant-numeric: tabular-nums;
	}
	.status-pill {
		font-size: 10px;
		font-weight: 700;
		border-radius: 99px;
		border: 1px solid;
		padding: 2px 8px;
		white-space: nowrap;
	}
	.payments-footer {
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		padding-top: 12px;
		margin-top: 8px;
		display: flex;
		justify-content: center;
	}
	.link-more {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 12px;
		font-weight: 600;
		color: #6366f1;
		text-decoration: none;
		transition: color 0.15s;
	}
	.link-more:hover {
		color: #818cf8;
	}
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 32px 16px;
		text-align: center;
	}
	.empty-state__icon {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(255, 255, 255, 0.02);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.empty-state__text {
		font-size: 13px;
		color: #334155;
		max-width: 36ch;
		line-height: 1.6;
		margin: 0;
	}

	.quick-links {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.quick-link-card {
		display: flex;
		align-items: center;
		gap: 14px;
		background: rgba(10, 16, 26, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 16px;
		padding: 16px;
		text-decoration: none;
		transition:
			border-color 0.15s,
			background 0.15s;
	}
	.quick-link-card:hover {
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.02);
	}
	.quick-link-card__icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		border: 1px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.quick-link-card__body {
		flex: 1;
	}
	.quick-link-card__label {
		font-size: 13px;
		font-weight: 600;
		color: #e2e8f0;
		margin: 0 0 2px;
	}
	.quick-link-card__sub {
		font-size: 11px;
		color: #475569;
		margin: 0;
	}

	.flex-1 {
		flex: 1;
	}
	.flex {
		display: flex;
	}
	.items-center {
		align-items: center;
	}
	.gap-2 {
		gap: 8px;
	}
	.flex-wrap {
		flex-wrap: wrap;
	}
	.justify-end {
		justify-content: flex-end;
	}
	.shrink-0 {
		flex-shrink: 0;
	}

	@media (max-width: 900px) {
		.kpi-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 640px) {
		.kpi-grid {
			grid-template-columns: 1fr;
		}
		.quick-links {
			grid-template-columns: 1fr;
		}
		.plan-actions {
			flex-direction: column;
			align-items: flex-start;
		}
		.section-card {
			padding: 16px;
		}
		.kpi-card {
			padding: 14px;
		}
		.alert {
			flex-wrap: wrap;
		}
		.alert__actions {
			margin-left: 0;
			margin-top: 8px;
		}
	}
</style>
