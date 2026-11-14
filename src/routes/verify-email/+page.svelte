<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/authStore.js';
	import { toastStore } from '$lib/stores/toastStore.js';
	import { pageTransitionStore } from '$lib/stores/pageTransitionStore.js';

	let loading = true;
	let success = false;
	let error = null;
	let message = '';

	onMount(async () => {
		const token = page.url.searchParams.get('token');

		if (!token) {
			error = 'Token de verificación no encontrado';
			loading = false;
			return;
		}

		try {
			const result = await authStore.confirmEmail(token);

			if (result.success) {
				success = true;
				message = 'Cuenta activada correctamente. Ahora puedes iniciar sesión.';
				toastStore.success(message);

				// Redirigir al login después de 3 segundos
				setTimeout(() => {
					pageTransitionStore.goto('/auth', { transitionType: 'fade', duration: 400 });
				}, 3000);
			} else {
				error = result.message || 'Error al verificar el email';
				toastStore.error(error);
			}
		} catch {
			error = 'Error de conexión. Intenta nuevamente.';
			toastStore.error(error);
		} finally {
			loading = false;
		}
	});

	function goToLogin() {
		pageTransitionStore.goto('/auth', { transitionType: 'fade' });
	}

	function goHome() {
		pageTransitionStore.goto('/', { transitionType: 'slide' });
	}
</script>

<svelte:head>
	<title>Verificación de Email - Geminis Labs</title>
	<meta name="description" content="Verificación de email para activar tu cuenta" />
</svelte:head>

<!-- Video de fondo -->
<video class="background-video" autoplay muted loop playsinline>
	<source src="/vid/map-back.mp4" type="video/mp4" />
	Tu navegador no soporta videos.
</video>

<!-- Overlay con degradado -->
<div class="gradient-overlay"></div>

<!-- Contenido principal -->
<div class="verify-container relative z-10 flex min-h-screen items-center justify-center p-4">
	<div class="verify-card w-full max-w-md text-center">
		{#if loading}
			<!-- Estado de carga -->
			<div class="loading-state">
				<div class="spinner mb-6"></div>
				<h1 class="mb-4 text-2xl font-bold text-white">Verificando tu email...</h1>
				<p class="text-gray-300">Por favor espera mientras confirmamos tu cuenta.</p>
			</div>
		{:else if success}
			<!-- Estado de éxito -->
			<div class="success-state">
				<div class="success-icon mb-6">
					<svg
						class="mx-auto h-16 w-16 text-green-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>

				<h1 class="mb-4 text-2xl font-bold text-white">¡Email Verificado!</h1>
				<p class="mb-6 text-gray-300">{message}</p>

				<div class="countdown-text mb-6 text-sm text-gray-400">
					Serás redirigido al login en unos segundos...
				</div>

				<div class="action-buttons space-y-3">
					<button
						class="btn-primary from-brand-green to-brand-green-light hover:from-brand-green-light hover:to-brand-green flex w-full
							   items-center justify-center gap-2 rounded-lg bg-gradient-to-r
							   px-4 py-3 font-medium text-white transition-all duration-200"
						on:click={goToLogin}
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
							/>
						</svg>
						Iniciar Sesión Ahora
					</button>
				</div>
			</div>
		{:else}
			<!-- Estado de error -->
			<div class="error-state">
				<div class="error-icon mb-6">
					<svg
						class="mx-auto h-16 w-16 text-red-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>

				<h1 class="mb-4 text-2xl font-bold text-white">Error de Verificación</h1>
				<p class="mb-6 text-gray-300">{error}</p>

				<div class="action-buttons space-y-3">
					<button
						class="btn-secondary flex w-full items-center justify-center gap-2
							   rounded-lg bg-gray-700 px-4 py-3 font-medium
							   text-white transition-all duration-200 hover:bg-gray-600"
						on:click={goToLogin}
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
							/>
						</svg>
						Ir al Login
					</button>

					<button
						class="btn-link w-full py-2 text-sm text-cyan-400
							   transition-colors duration-200 hover:text-cyan-300"
						on:click={goHome}
					>
						Volver al Inicio
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.verify-card {
		background: var(--color-glass-bg);
		backdrop-filter: blur(20px);
		border: 1px solid var(--color-glass-border);
		border-radius: 20px;
		padding: 3rem;
		box-shadow:
			0 20px 40px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid rgba(0, 166, 192, 0.3);
		border-top: 3px solid #00a6c0;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.success-icon,
	.error-icon {
		animation: scaleIn 0.5s ease-out;
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.5);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.countdown-text {
		animation: pulse 2s infinite;
	}

	.btn-primary {
		box-shadow:
			0 8px 25px rgba(0, 166, 192, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow:
			0 12px 35px rgba(0, 166, 192, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.btn-secondary:hover {
		transform: translateY(-1px);
	}

	.btn-link:hover {
		text-decoration: underline;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.verify-card {
			padding: 2rem;
			margin: 1rem;
		}
	}
</style>
