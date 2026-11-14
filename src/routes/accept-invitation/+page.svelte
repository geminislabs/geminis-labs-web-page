<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/authStore.js';
	import { toastStore } from '$lib/stores/toastStore.js';
	import { pageTransitionStore } from '$lib/stores/pageTransitionStore.js';

	let token = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let success = false;
	let error = null;
	let message = '';
	let email = '';

	// Validación de contraseña
	let showPassword = false;
	let showConfirmPassword = false;
	let passwordError = '';
	let confirmPasswordError = '';

	// Extraer el token de la URL
	onMount(() => {
		token = page.url.searchParams.get('token');

		if (!token) {
			error = 'Token de invitación no encontrado en la URL';
		}
	});

	// Validar requisitos de la contraseña
	function validatePassword() {
		const minLength = password.length >= 8;
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumber = /\d/.test(password);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		if (!minLength) {
			passwordError = 'La contraseña debe tener al menos 8 caracteres';
			return false;
		}
		if (!hasUpperCase) {
			passwordError = 'La contraseña debe contener al menos una mayúscula';
			return false;
		}
		if (!hasLowerCase) {
			passwordError = 'La contraseña debe contener al menos una minúscula';
			return false;
		}
		if (!hasNumber) {
			passwordError = 'La contraseña debe contener al menos un número';
			return false;
		}
		if (!hasSpecialChar) {
			passwordError = 'La contraseña debe contener al menos un carácter especial';
			return false;
		}

		passwordError = '';
		return true;
	}

	// Validar que las contraseñas coincidan
	function validateConfirmPassword() {
		if (confirmPassword !== password) {
			confirmPasswordError = 'Las contraseñas no coinciden';
			return false;
		}
		confirmPasswordError = '';
		return true;
	}

	// Manejar el envío del formulario
	async function handleSubmit() {
		if (!token) {
			error = 'Token de invitación no válido';
			toastStore.error(error);
			return;
		}

		if (!validatePassword()) {
			toastStore.error(passwordError);
			return;
		}

		if (!validateConfirmPassword()) {
			toastStore.error(confirmPasswordError);
			return;
		}

		loading = true;
		error = null;

		try {
			const result = await authStore.acceptInvitation(token, password);

			if (result.success) {
				success = true;
				message = result.message || 'Invitación aceptada exitosamente';
				email = result.data?.email || '';
				toastStore.success(message);

				// Redirigir al login después de 3 segundos
				setTimeout(() => {
					pageTransitionStore.goto('/auth', { transitionType: 'fade', duration: 400 });
				}, 3000);
			} else {
				error = result.message || 'Error al aceptar la invitación';
				toastStore.error(error);
			}
		} catch {
			error = 'Error de conexión. Intenta nuevamente.';
			toastStore.error(error);
		} finally {
			loading = false;
		}
	}

	function goToLogin() {
		pageTransitionStore.goto('/auth', { transitionType: 'fade' });
	}

	function goHome() {
		pageTransitionStore.goto('/', { transitionType: 'slide' });
	}
</script>

<svelte:head>
	<title>Aceptar Invitación - Geminis Labs</title>
	<meta name="description" content="Acepta tu invitación y crea tu cuenta" />
</svelte:head>

<!-- Video de fondo -->
<video class="background-video" autoplay muted loop playsinline>
	<source src="/vid/map-back.mp4" type="video/mp4" />
	Tu navegador no soporta videos.
</video>

<!-- Overlay con degradado -->
<div class="gradient-overlay"></div>

<!-- Contenido principal -->
<div class="invitation-container relative z-10 flex min-h-screen items-center justify-center p-4">
	<div class="invitation-card w-full max-w-md">
		{#if success}
			<!-- Estado de éxito -->
			<div class="success-state text-center">
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

				<h1 class="mb-4 text-2xl font-bold text-white">¡Invitación Aceptada!</h1>
				<p class="mb-2 text-gray-300">{message}</p>
				{#if email}
					<p class="mb-6 text-sm text-gray-400">Email: {email}</p>
				{/if}

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
		{:else if error && !token}
			<!-- Estado de error (sin token) -->
			<div class="error-state text-center">
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

				<h1 class="mb-4 text-2xl font-bold text-white">Error de Invitación</h1>
				<p class="mb-6 text-gray-300">{error}</p>

				<div class="action-buttons space-y-3">
					<button
						class="btn-link w-full py-2 text-sm text-cyan-400
							   transition-colors duration-200 hover:text-cyan-300"
						on:click={goHome}
					>
						Volver al Inicio
					</button>
				</div>
			</div>
		{:else}
			<!-- Formulario para crear contraseña -->
			<div class="form-state">
				<div class="mb-8 text-center">
					<div class="icon-container mb-4">
						<svg
							class="mx-auto h-16 w-16 text-cyan-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<h1 class="mb-2 text-2xl font-bold text-white">Aceptar Invitación</h1>
					<p class="text-sm text-gray-300">Crea tu contraseña para activar tu cuenta</p>
				</div>

				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<!-- Campo de contraseña -->
					<div class="form-group">
						<label for="password" class="mb-2 block text-sm font-medium text-gray-300">
							Nueva Contraseña
						</label>
						<div class="relative">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								on:blur={validatePassword}
								placeholder="Ingresa tu contraseña"
								class="form-input w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4
									   py-3 text-white transition-colors duration-200
									   focus:border-cyan-400 focus:outline-none"
								disabled={loading}
								required
							/>
							<button
								type="button"
								class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400
									   transition-colors hover:text-white"
								on:click={() => (showPassword = !showPassword)}
								tabindex="-1"
							>
								{#if showPassword}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
										/>
									</svg>
								{/if}
							</button>
						</div>
						{#if passwordError}
							<p class="mt-1 text-xs text-red-400">{passwordError}</p>
						{/if}
						<p class="mt-2 text-xs text-gray-400">
							Debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres
							especiales
						</p>
					</div>

					<!-- Campo de confirmar contraseña -->
					<div class="form-group">
						<label for="confirm-password" class="mb-2 block text-sm font-medium text-gray-300">
							Confirmar Contraseña
						</label>
						<div class="relative">
							<input
								id="confirm-password"
								type={showConfirmPassword ? 'text' : 'password'}
								bind:value={confirmPassword}
								on:blur={validateConfirmPassword}
								placeholder="Confirma tu contraseña"
								class="form-input w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4
									   py-3 text-white transition-colors duration-200
									   focus:border-cyan-400 focus:outline-none"
								disabled={loading}
								required
							/>
							<button
								type="button"
								class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400
									   transition-colors hover:text-white"
								on:click={() => (showConfirmPassword = !showConfirmPassword)}
								tabindex="-1"
							>
								{#if showConfirmPassword}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
										/>
									</svg>
								{/if}
							</button>
						</div>
						{#if confirmPasswordError}
							<p class="mt-1 text-xs text-red-400">{confirmPasswordError}</p>
						{/if}
					</div>

					<!-- Mensaje de error -->
					{#if error}
						<div class="error-message rounded-lg border border-red-500/30 bg-red-500/10 p-3">
							<p class="text-sm text-red-400">{error}</p>
						</div>
					{/if}

					<!-- Botón de envío -->
					<button
						type="submit"
						class="btn-submit from-brand-green to-brand-green-light hover:from-brand-green-light hover:to-brand-green flex w-full
							   items-center justify-center gap-2 rounded-lg bg-gradient-to-r
							   px-4 py-3 font-medium text-white transition-all duration-200
							   disabled:cursor-not-allowed disabled:opacity-50"
						disabled={loading}
					>
						{#if loading}
							<svg
								class="h-5 w-5 animate-spin text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Procesando...
						{:else}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							Aceptar Invitación
						{/if}
					</button>

					<!-- Link al login -->
					<div class="text-center">
						<button
							type="button"
							class="text-sm text-cyan-400 transition-colors hover:text-cyan-300"
							on:click={goToLogin}
						>
							¿Ya tienes cuenta? Iniciar sesión
						</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
</div>

<style>
	.invitation-card {
		background: var(--color-glass-bg);
		backdrop-filter: blur(20px);
		border: 1px solid var(--color-glass-border);
		border-radius: 20px;
		padding: 3rem;
		box-shadow:
			0 20px 40px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.form-input:focus {
		box-shadow: 0 0 0 3px rgba(0, 166, 192, 0.1);
	}

	.success-icon,
	.error-icon,
	.icon-container {
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

	.btn-primary,
	.btn-submit {
		box-shadow:
			0 8px 25px rgba(0, 166, 192, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.btn-primary:hover,
	.btn-submit:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow:
			0 12px 35px rgba(0, 166, 192, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	/* Responsive */
	@media (max-width: 480px) {
		.invitation-card {
			padding: 2rem;
			margin: 1rem;
		}
	}
</style>
