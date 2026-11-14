<script>
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore, isAuthenticated } from '$lib/stores/authStore.js';
	import { toastStore } from '$lib/stores/toastStore.js';
	import { pageTransitionStore } from '$lib/stores/pageTransitionStore.js';

	// Estado de la página
	let mode = 'login'; // 'login', 'register', 'recover', 'reset'

	$: isCredentialsMode = mode === 'login' || mode === 'register';
	$: isRecoveryFlow = mode === 'recover' || mode === 'reset';
	$: isAuthLayoutCompact = isCredentialsMode || isRecoveryFlow;
	let loading = false;
	let isTransitioning = false;
	let _recoveryStep = 'request'; // 'request' o 'reset'
	let successMessage = '';
	let recoveryEmail = '';

	// Estado para email no verificado
	let showEmailNotVerifiedBanner = false;
	let emailNotVerified = '';
	let resendingVerification = false;

	// Formularios
	let loginForm = {
		email: '',
		password: ''
	};

	let registerForm = {
		accountName: '',
		fullName: '',
		email: '',
		password: '',
		confirmPassword: ''
	};

	let recoveryForm = {
		email: ''
	};

	let resetForm = {
		code: '',
		newPassword: '',
		confirmPassword: ''
	};

	let errors = {};

	// Círculos animados de fondo
	let circles = [];

	function syncModeFromUrl(url) {
		const m = url.searchParams.get('mode');
		if (m === 'register') {
			mode = 'register';
		} else if (m === 'recover') {
			mode = 'recover';
		} else {
			mode = 'login';
		}
	}

	onMount(() => {
		// Verificar si el usuario ya está autenticado
		if ($isAuthenticated) {
			pageTransitionStore.goto('/');
			return;
		}

		syncModeFromUrl(page.url);

		// Generar círculos de fondo
		startCircleGeneration();
	});

	afterNavigate(({ to }) => {
		if (to?.url?.pathname?.endsWith('/auth')) {
			syncModeFromUrl(to.url);
		}
	});

	function startCircleGeneration() {
		const generateGroup = () => {
			const groupSize = Math.floor(Math.random() * 3) + 2;

			for (let i = 0; i < groupSize; i++) {
				setTimeout(() => {
					const circle = createRandomCircle();
					circles = [...circles, circle];

					setTimeout(() => {
						circles = circles.filter((c) => c.id !== circle.id);
					}, 12000);
				}, i * 300);
			}
		};

		generateGroup();
		setInterval(generateGroup, Math.random() * 4000 + 6000);
	}

	function createRandomCircle() {
		const colors = [
			'radial-gradient(circle, transparent 0%, transparent 40%, rgba(34, 40, 49, 0.3) 100%)',
			'radial-gradient(circle, transparent 0%, transparent 40%, rgba(40, 59, 72, 0.4) 100%)',
			'radial-gradient(circle, transparent 0%, transparent 40%, rgba(0, 166, 192, 0.2) 100%)',
			'radial-gradient(circle, transparent 0%, transparent 40%, rgba(216, 215, 204, 0.1) 100%)'
		];

		return {
			id: Date.now() + Math.random(),
			left: Math.random() * 90 + 5,
			top: Math.random() * 90 + 5,
			size: Math.random() * 100 + 30,
			color: colors[Math.floor(Math.random() * colors.length)]
		};
	}

	function switchMode(newMode) {
		if (isTransitioning || mode === newMode) return;

		isTransitioning = true;

		// Fade out actual
		setTimeout(() => {
			mode = newMode;
			errors = {};
			successMessage = '';

			// Resetear formularios de recuperación al cambiar modo
			if (newMode !== 'recover' && newMode !== 'reset') {
				_recoveryStep = 'request';
				recoveryEmail = '';
				recoveryForm = { email: '' };
				resetForm = { code: '', newPassword: '', confirmPassword: '' };
			}

			// Actualizar URL sin recargar
			const url = new URL(window.location);
			if (newMode === 'register') {
				url.searchParams.set('mode', 'register');
			} else if (newMode === 'recover') {
				url.searchParams.set('mode', 'recover');
			} else {
				url.searchParams.delete('mode');
			}
			window.history.replaceState({}, '', url);

			// Fade in nuevo
			setTimeout(() => {
				isTransitioning = false;
			}, 50);
		}, 150);
	}

	function validateLoginForm() {
		errors = {};

		if (!loginForm.email.trim()) {
			errors.email = 'El correo electrónico es requerido';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email)) {
			errors.email = 'Ingresa un correo electrónico válido';
		}

		if (!loginForm.password) {
			errors.password = 'La contraseña es requerida';
		}

		return Object.keys(errors).length === 0;
	}

	function validatePassword(password) {
		const errors = [];

		// Longitud mínima
		if (password.length < 8) {
			errors.push('al menos 8 caracteres');
		}

		// Longitud máxima (límite de bcrypt)
		if (password.length > 72) {
			errors.push('máximo 72 caracteres');
		}

		// Al menos una letra mayúscula
		if (!/[A-Z]/.test(password)) {
			errors.push('al menos una letra mayúscula');
		}

		// Al menos un número
		if (!/[0-9]/.test(password)) {
			errors.push('al menos un número');
		}

		// Al menos un carácter especial
		if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\];]/.test(password)) {
			errors.push('al menos un carácter especial (!@#$%^&*(),.?":{}|<>_-+=[];)');
		}

		return errors;
	}

	function validateRegisterForm() {
		errors = {};

		if (!registerForm.accountName.trim()) {
			errors.accountName = 'El nombre de la empresa es requerido';
		}

		if (!registerForm.fullName.trim()) {
			errors.fullName = 'El nombre completo es requerido';
		}

		if (!registerForm.email.trim()) {
			errors.email = 'El correo electrónico es requerido';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
			errors.email = 'Ingresa un correo electrónico válido';
		}

		if (!registerForm.password) {
			errors.password = 'La contraseña es requerida';
		} else {
			const passwordErrors = validatePassword(registerForm.password);
			if (passwordErrors.length > 0) {
				errors.password = `La contraseña debe tener ${passwordErrors.join(', ')}`;
			}
		}

		if (!registerForm.confirmPassword) {
			errors.confirmPassword = 'Confirma tu contraseña';
		} else if (registerForm.password !== registerForm.confirmPassword) {
			errors.confirmPassword = 'Las contraseñas no coinciden';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleLogin(event) {
		event.preventDefault();

		if (!validateLoginForm()) {
			return;
		}

		loading = true;
		// Ocultar banner de email no verificado al intentar login nuevamente
		showEmailNotVerifiedBanner = false;

		try {
			const result = await authStore.login({
				email: loginForm.email.trim(),
				password: loginForm.password
			});

			if (result.success) {
				toastStore.success('¡Bienvenido! Sesión iniciada correctamente');
				// Efecto de transición antes de ir a home
				pageTransitionStore.goto('/', { transitionType: 'fade', duration: 400 });
			} else {
				// Detectar error de email no verificado (403 con mensaje específico)
				const errorMessage = (result.message || '').toLowerCase();
				const isEmailNotVerified =
					result.error?.status === 403 &&
					(errorMessage.includes('email no verificado') ||
						errorMessage.includes('correo no verificado') ||
						errorMessage.includes('no verificado'));

				if (isEmailNotVerified) {
					showEmailNotVerifiedBanner = true;
					emailNotVerified = loginForm.email.trim();
					toastStore.warning('Tu correo aún no ha sido verificado');
				} else {
					toastStore.error(result.message || 'Error al iniciar sesión');
				}
			}
		} catch {
			toastStore.error('Error de conexión. Intenta nuevamente.');
		} finally {
			loading = false;
		}
	}

	async function handleRegister(event) {
		event.preventDefault();

		if (!validateRegisterForm()) {
			return;
		}

		loading = true;

		try {
			const result = await authStore.register({
				accountName: registerForm.accountName.trim(),
				fullName: registerForm.fullName.trim(),
				email: registerForm.email.trim(),
				password: registerForm.password
			});

			if (result.success) {
				toastStore.success(result.message);
				// Limpiar formulario
				registerForm = {
					accountName: '',
					fullName: '',
					email: '',
					password: '',
					confirmPassword: ''
				};
				// Efecto de transición y cambiar a modo login
				setTimeout(() => {
					switchMode('login');
				}, 500);
			} else {
				toastStore.error(result.message);
			}
		} catch {
			toastStore.error('Error de conexión. Intenta nuevamente.');
		} finally {
			loading = false;
		}
	}

	function goBack() {
		pageTransitionStore.goto('/', { transitionType: 'slide', duration: 350 });
	}

	function handleForgotPassword() {
		switchMode('recover');
	}

	function validateRecoveryForm() {
		errors = {};

		if (!recoveryForm.email.trim()) {
			errors.email = 'El correo electrónico es requerido';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryForm.email)) {
			errors.email = 'Ingresa un correo electrónico válido';
		}

		return Object.keys(errors).length === 0;
	}

	function validateResetForm() {
		errors = {};

		if (!resetForm.code.trim()) {
			errors.code = 'El código es requerido';
		} else if (resetForm.code.length !== 6) {
			errors.code = 'El código debe tener 6 dígitos';
		}

		if (!resetForm.newPassword) {
			errors.newPassword = 'La nueva contraseña es requerida';
		} else {
			const passwordErrors = validatePassword(resetForm.newPassword);
			if (passwordErrors.length > 0) {
				errors.newPassword = `La contraseña debe tener ${passwordErrors.join(', ')}`;
			}
		}

		if (!resetForm.confirmPassword) {
			errors.confirmPassword = 'Confirma tu nueva contraseña';
		} else if (resetForm.newPassword !== resetForm.confirmPassword) {
			errors.confirmPassword = 'Las contraseñas no coinciden';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleRecoveryRequest(event) {
		event.preventDefault();

		if (!validateRecoveryForm()) {
			return;
		}

		loading = true;

		try {
			const result = await authStore.forgotPassword(recoveryForm.email.trim());

			if (result.success) {
				recoveryEmail = recoveryForm.email.trim();
				successMessage = result.message;
				_recoveryStep = 'reset';
				mode = 'reset';
				toastStore.success('Código enviado correctamente');
			} else {
				toastStore.error(result.message || 'Error al solicitar recuperación');
			}
		} catch {
			toastStore.error('Error de conexión. Intenta nuevamente.');
		} finally {
			loading = false;
		}
	}

	async function handlePasswordReset(event) {
		event.preventDefault();

		if (!validateResetForm()) {
			return;
		}

		loading = true;

		try {
			const result = await authStore.resetPassword(
				recoveryEmail,
				resetForm.code.trim(),
				resetForm.newPassword
			);

			if (result.success) {
				toastStore.success(result.message);
				// Limpiar formularios
				resetForm = { code: '', newPassword: '', confirmPassword: '' };
				recoveryForm = { email: '' };
				recoveryEmail = '';
				_recoveryStep = 'request';

				// Transición suave de vuelta al login
				setTimeout(() => {
					switchMode('login');
				}, 1000);
			} else {
				toastStore.error(result.message || 'Error al restablecer contraseña');
			}
		} catch {
			toastStore.error('Error de conexión. Intenta nuevamente.');
		} finally {
			loading = false;
		}
	}

	async function handleResendVerification() {
		if (!emailNotVerified) {
			toastStore.error('No se pudo identificar el correo electrónico');
			return;
		}

		resendingVerification = true;

		try {
			const result = await authStore.resendVerification(emailNotVerified);

			if (result.success) {
				toastStore.success('Correo de verificación reenviado. Revisa tu bandeja de entrada.');
				showEmailNotVerifiedBanner = false;
			} else {
				toastStore.error(result.message || 'Error al reenviar el correo de verificación');
			}
		} catch {
			toastStore.error('Error de conexión. Intenta nuevamente.');
		} finally {
			resendingVerification = false;
		}
	}
</script>

<svelte:head>
	<title
		>{mode === 'login'
			? 'Iniciar Sesión'
			: mode === 'register'
				? 'Crear Cuenta'
				: mode === 'recover'
					? 'Recuperar Contraseña'
					: 'Restablecer Contraseña'} - Geminis Labs</title
	>
	<meta name="description" content="Accede a tu cuenta de Geminis Labs" />
</svelte:head>

<!-- Video de fondo -->
<video class="background-video" autoplay muted loop playsinline>
	<source src="/vid/map-back.mp4" type="video/mp4" />
	Tu navegador no soporta videos.
</video>

<!-- Overlay con degradado -->
<div class="gradient-overlay"></div>

<!-- Círculos animados de fondo -->
{#each circles as circle (circle.id)}
	<div
		class="animated-circle"
		style="
			left: {circle.left}%; 
			top: {circle.top}%; 
			width: {circle.size}px; 
			height: {circle.size}px;
			background: {circle.color};
		"
	></div>
{/each}

<!-- Contenido principal -->
<div class="auth-container min-h-screen flex items-center justify-center p-4 relative z-10">
	<div class="auth-card w-full max-w-md" class:auth-card-compact={isAuthLayoutCompact}>
		<!-- Header -->
		<div
			class="auth-header text-center justify-center
				{isAuthLayoutCompact ? 'mb-3 sm:mb-4' : 'mb-5 sm:mb-6'}"
		>
			<button
				class="back-button inline-flex items-center gap-2 text-cyan-400
					   hover:text-cyan-300 transition-colors duration-200
					   {isAuthLayoutCompact ? 'mb-2' : 'mb-4'}"
				on:click={goBack}
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Volver
			</button>

			<div
				class="logo-container flex justify-center self-center items-center place-self-center
					{isAuthLayoutCompact ? 'mb-3' : 'mb-6'}"
			>
				<img
					src="/img/geminis-labs-logo-short.png"
					alt="Geminis Labs"
					class={isAuthLayoutCompact ? 'h-14 w-14' : 'h-20 w-20'}
				/>
			</div>

			<!-- Toggle de modo - Solo mostrar en login/register -->
			{#if mode === 'login' || mode === 'register'}
				<div class="mode-toggle mode-toggle-compact">
					<div class="toggle-container bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
						<button
							class="toggle-button {mode === 'login' ? 'active' : ''}"
							on:click={() => switchMode('login')}
							disabled={isTransitioning}
						>
							Iniciar Sesión
						</button>
						<button
							class="toggle-button {mode === 'register' ? 'active' : ''}"
							on:click={() => switchMode('register')}
							disabled={isTransitioning}
						>
							Crear Cuenta
						</button>
					</div>
				</div>
			{:else}
				<!-- Título para modos de recuperación -->
				<div class="recovery-title text-center">
					<h2 class="text-lg sm:text-xl font-semibold text-cyan-400 mb-1">
						{mode === 'recover' ? 'Recuperar Contraseña' : 'Restablecer Contraseña'}
					</h2>
					<p class="text-xs sm:text-sm text-gray-300 leading-snug">
						{mode === 'recover'
							? 'Te enviaremos un código por correo'
							: 'Introduce el código de 6 dígitos y tu nueva contraseña'}
					</p>
				</div>
			{/if}
		</div>

		<!-- Formularios -->
		<div
			class="form-container {isTransitioning ? 'transitioning' : ''} {isAuthLayoutCompact
				? 'form-container--compact'
				: ''}"
		>
			{#if mode === 'login'}
				<!-- Formulario de Login -->
				<form
					on:submit={handleLogin}
					class="auth-form auth-form-compact space-y-2.5 sm:space-y-3
						{isTransitioning ? 'fade-out' : 'fade-in'}"
				>
					<div class="form-group">
						<label for="email" class="form-label">Correo Electrónico</label>
						<input
							type="email"
							id="email"
							bind:value={loginForm.email}
							class="form-input {errors.email ? 'error' : ''}"
							placeholder="tu@email.com"
							required
						/>
						{#if errors.email}
							<p class="error-message">{errors.email}</p>
						{/if}
					</div>

					<div class="form-group">
						<label for="password" class="form-label">Contraseña</label>
						<input
							type="password"
							id="password"
							bind:value={loginForm.password}
							class="form-input {errors.password ? 'error' : ''}"
							placeholder="Tu contraseña"
							required
						/>
						{#if errors.password}
							<p class="error-message">{errors.password}</p>
						{/if}
					</div>

					<!-- Banner de email no verificado -->
					{#if showEmailNotVerifiedBanner}
						<div class="email-not-verified-banner">
							<div class="banner-icon">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
							</div>
							<div class="banner-content">
								<p class="banner-text">
									Tu correo aún no ha sido verificado. Reenvía el correo para completar tu registro.
								</p>
							</div>
						</div>
					{/if}

					<!-- Link Olvidé mi contraseña -->
					<div class="forgot-password-container text-center mb-4">
						<button
							type="button"
							class="forgot-password-link text-sm text-cyan-400 hover:text-cyan-300
							   transition-colors duration-200 underline"
							on:click={handleForgotPassword}
						>
							¿Olvidaste tu contraseña?
						</button>
					</div>

					<button type="submit" disabled={loading} class="btn-primary auth-login-cta w-full">
						{#if loading}
							<svg class="shrink-0 animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
							<span>Iniciando sesión…</span>
						{:else}
							<svg
								class="shrink-0 w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
								/>
							</svg>
							<span>Iniciar sesión</span>
						{/if}
					</button>

					<!-- Botón de reenviar correo -->
					{#if showEmailNotVerifiedBanner}
						<button
							type="button"
							disabled={resendingVerification}
							on:click={handleResendVerification}
							class="resend-verification-button w-full py-3 px-4
							   text-white font-medium rounded-lg
							   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
							   flex items-center justify-center gap-2"
						>
							{#if resendingVerification}
								<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
								Reenviando correo...
							{:else}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
								Reenviar Correo
							{/if}
						</button>
					{/if}
				</form>
			{:else if mode === 'register'}
				<!-- Formulario de Registro -->
				<form
					on:submit={handleRegister}
					class="auth-form auth-form-compact space-y-2.5 sm:space-y-3
						{isTransitioning ? 'fade-out' : 'fade-in'}"
				>
					<div class="form-group">
						<label for="accountName" class="form-label">Nombre de la Empresa o Cuenta</label>
						<input
							type="text"
							id="accountName"
							bind:value={registerForm.accountName}
							class="form-input {errors.accountName ? 'error' : ''}"
							placeholder="Mi Empresa S.A."
							required
						/>
						{#if errors.accountName}
							<p class="error-message">{errors.accountName}</p>
						{/if}
					</div>

					<div class="form-group">
						<label for="fullName" class="form-label">Nombre Completo</label>
						<input
							type="text"
							id="fullName"
							bind:value={registerForm.fullName}
							class="form-input {errors.fullName ? 'error' : ''}"
							placeholder="Ingresa tu nombre completo"
							required
						/>
						{#if errors.fullName}
							<p class="error-message">{errors.fullName}</p>
						{/if}
					</div>

					<div class="form-group">
						<label for="registerEmail" class="form-label">Correo Electrónico</label>
						<input
							type="email"
							id="registerEmail"
							bind:value={registerForm.email}
							class="form-input {errors.email ? 'error' : ''}"
							placeholder="tu@email.com"
							required
						/>
						{#if errors.email}
							<p class="error-message">{errors.email}</p>
						{/if}
					</div>

					<div class="form-group">
						<label for="registerPassword" class="form-label">Contraseña</label>
						<input
							type="password"
							id="registerPassword"
							bind:value={registerForm.password}
							class="form-input {errors.password ? 'error' : ''}"
							placeholder="8-72 caracteres, 1 mayúscula, 1 número, 1 especial"
							required
						/>
						{#if errors.password}
							<p class="error-message">{errors.password}</p>
						{/if}
						<p class="password-hint text-[0.7rem] leading-tight text-gray-400/90 mt-0.5 sm:text-xs">
							Mayúscula, número y carácter especial (!@#$%…)
						</p>
					</div>

					<div class="form-group">
						<label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
						<input
							type="password"
							id="confirmPassword"
							bind:value={registerForm.confirmPassword}
							class="form-input {errors.confirmPassword ? 'error' : ''}"
							placeholder="Repite tu contraseña"
							required
						/>
						{#if errors.confirmPassword}
							<p class="error-message">{errors.confirmPassword}</p>
						{/if}
					</div>

					<button type="submit" disabled={loading} class="btn-primary auth-login-cta w-full">
						{#if loading}
							<svg class="shrink-0 animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
							<span>Creando cuenta…</span>
						{:else}
							<svg
								class="shrink-0 w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
								/>
							</svg>
							<span>Crear cuenta</span>
						{/if}
					</button>
				</form>
			{:else if mode === 'recover'}
				<!-- Formulario de Recuperación de Contraseña -->
				<form
					on:submit={handleRecoveryRequest}
					class="auth-form space-y-4 {isTransitioning ? 'fade-out' : 'fade-in'}"
				>
					{#if successMessage}
						<div
							class="success-banner bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4"
						>
							<p class="text-green-300 text-sm text-center">{successMessage}</p>
						</div>
					{/if}

					<div class="form-group">
						<label for="recoveryEmail" class="form-label">Correo Electrónico</label>
						<input
							type="email"
							id="recoveryEmail"
							bind:value={recoveryForm.email}
							class="form-input {errors.email ? 'error' : ''}"
							placeholder="tu@email.com"
							required
						/>
						{#if errors.email}
							<p class="error-message">{errors.email}</p>
						{/if}
					</div>

					<button type="submit" disabled={loading} class="btn-primary auth-login-cta w-full">
						{#if loading}
							<svg class="shrink-0 animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
							<span>Enviando código…</span>
						{:else}
							<svg
								class="shrink-0 w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
							<span>Enviar Código</span>
						{/if}
					</button>

					<!-- Enlace para volver al login -->
					<div class="back-to-login text-center mt-2">
						<button
							type="button"
							class="text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-200 underline"
							on:click={() => switchMode('login')}
						>
							Volver a iniciar sesión
						</button>
					</div>
				</form>
			{:else if mode === 'reset'}
				<!-- Formulario de Restablecimiento de Contraseña -->
				<form
					on:submit={handlePasswordReset}
					class="auth-form auth-form-compact space-y-2.5 sm:space-y-3 {isTransitioning
						? 'fade-out'
						: 'fade-in'}"
				>
					{#if successMessage}
						<div
							class="success-banner bg-green-500/20 border border-green-500/50 rounded-lg p-2 mb-2"
						>
							<p class="text-green-300 text-xs sm:text-sm text-center leading-snug">
								{successMessage}
							</p>
						</div>
					{/if}

					<div class="form-group">
						<label for="resetCode" class="form-label">Código de verificación</label>
						<input
							type="text"
							id="resetCode"
							bind:value={resetForm.code}
							class="form-input {errors.code ? 'error' : ''} text-center tracking-widest"
							placeholder="000000"
							maxlength="6"
							inputmode="numeric"
							autocomplete="one-time-code"
							required
						/>
						{#if errors.code}
							<p class="error-message">{errors.code}</p>
						{/if}
						<p
							class="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-snug truncate"
							title={recoveryEmail}
						>
							Enviado a {recoveryEmail}
						</p>
					</div>

					<div class="form-group">
						<label for="newPassword" class="form-label">Nueva contraseña</label>
						<input
							type="password"
							id="newPassword"
							bind:value={resetForm.newPassword}
							class="form-input {errors.newPassword ? 'error' : ''}"
							placeholder="Mín. 8 caracteres"
							required
						/>
						{#if errors.newPassword}
							<p class="error-message">{errors.newPassword}</p>
						{/if}
						<p class="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-snug">
							Mayúscula, número y carácter especial (!@#$…)
						</p>
					</div>

					<div class="form-group">
						<label for="confirmNewPassword" class="form-label">Confirmar contraseña</label>
						<input
							type="password"
							id="confirmNewPassword"
							bind:value={resetForm.confirmPassword}
							class="form-input {errors.confirmPassword ? 'error' : ''}"
							placeholder="Repite tu nueva contraseña"
							required
						/>
						{#if errors.confirmPassword}
							<p class="error-message">{errors.confirmPassword}</p>
						{/if}
					</div>

					<button type="submit" disabled={loading} class="btn-primary auth-login-cta w-full">
						{#if loading}
							<svg class="shrink-0 animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
							<span>Restableciendo…</span>
						{:else}
							<svg
								class="shrink-0 w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>Restablecer Contraseña</span>
						{/if}
					</button>

					<!-- Enlace para volver al login -->
					<div class="back-to-login text-center mt-2">
						<button
							type="button"
							class="text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-200 underline"
							on:click={() => switchMode('login')}
						>
							Volver a iniciar sesión
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>

<style>
	.auth-card {
		background: var(--color-glass-bg);
		backdrop-filter: blur(20px);
		border: 1px solid var(--color-glass-border);
		border-radius: 20px;
		padding: 2.5rem;
		box-shadow:
			0 20px 40px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	/* Login + registro: mismos márgenes y densidad (sin salto al cambiar de pestaña) */
	.auth-card-compact {
		padding: 1.5rem 1.25rem 1.25rem;
	}

	@media (min-width: 640px) {
		.auth-card-compact {
			padding: 1.75rem 1.75rem 1.5rem;
		}
	}

	.form-container.form-container--compact {
		margin-top: 0.75rem !important;
	}

	.mode-toggle-compact .toggle-button {
		padding: 0.5rem 0.625rem;
		font-size: 0.8125rem;
	}

	.auth-form-compact .form-label {
		margin-bottom: 0.2rem;
		font-size: 0.8125rem;
	}

	.auth-form-compact .form-input {
		padding: 0.5rem 0.75rem;
		font-size: 0.9375rem;
	}

	.toggle-container {
		display: flex;
		gap: 4px;
	}

	.toggle-button {
		flex: 1;
		padding: 0.75rem 1rem;
		background: transparent;
		color: var(--color-text-primary);
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.toggle-button.active {
		background: var(--color-accent-primary);
		color: white;
		box-shadow: 0 2px 8px rgba(0, 166, 192, 0.3);
	}

	.toggle-button:hover:not(.active) {
		background: rgba(255, 255, 255, 0.1);
	}

	.form-label {
		display: block;
		color: var(--color-text-primary);
		font-weight: 500;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem 1rem;
		background: rgba(40, 59, 72, 0.5);
		border: 1px solid var(--color-glass-border);
		border-radius: 8px;
		color: var(--color-text-primary);
		font-size: 1rem;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.form-input:focus {
		outline: none;
		border-color: var(--color-accent-primary);
		box-shadow: 0 0 0 3px rgba(0, 166, 192, 0.1);
		background: rgba(40, 59, 72, 0.7);
	}

	.form-input::placeholder {
		color: rgba(216, 215, 204, 0.6);
	}

	.form-input.error {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	/* Estilos para el autofill de los navegadores (Chrome, Safari, etc.) */
	.form-input:-webkit-autofill,
	.form-input:-webkit-autofill:hover,
	.form-input:-webkit-autofill:focus,
	.form-input:-webkit-autofill:active {
		-webkit-box-shadow: 0 0 0 30px #283b48 inset !important;
		-webkit-text-fill-color: #d8d7cc !important;
		transition: background-color 5000s ease-in-out 0s;
		caret-color: #d8d7cc;
	}

	.error-message {
		color: #fca5a5;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	/*
	 * Mismo aspecto que "Enviar Mensaje" (login-page.css → .btn-primary: píldora, sombra, hover).
	 * Solo se cambia el gradiente a la paleta verde de marca.
	 */
	:global(.btn-primary).auth-login-cta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		margin: 0;
		background: linear-gradient(135deg, #007a5c 0%, #00a878 50%, #00c896 100%);
		box-shadow:
			0 8px 25px rgba(0, 168, 120, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	:global(.btn-primary).auth-login-cta:hover:not(:disabled) {
		transform: translateY(-3px);
		box-shadow:
			0 12px 35px rgba(0, 168, 120, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	:global(.btn-primary).auth-login-cta:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Animaciones de transición entre pestañas: altura según contenido (evita scroll innecesario) */
	.form-container {
		position: relative;
		min-height: 0;
		margin-top: 1.25rem !important;
	}

	.auth-form {
		transition:
			opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		min-height: 0;
	}

	.fade-in {
		opacity: 1;
		transform: translateY(0);
		animation: slideIn 0.4s ease-out;
	}

	.fade-out {
		opacity: 0;
		transform: translateY(-10px);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Estilos para el link de olvidé contraseña */
	.forgot-password-link {
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		margin-bottom: 0.75rem !important;
	}

	.forgot-password-link:hover {
		text-decoration: underline;
	}

	/* Mejoras en el toggle de pestañas */
	.toggle-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.toggle-container {
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	/* Logo mejorado */
	.logo-container img {
		filter: drop-shadow(0 4px 8px rgba(0, 166, 192, 0.3));
		transition: transform 0.3s ease;
	}

	.logo-container img:hover {
		transform: scale(1.05);
	}

	/* Estilos para el modo de recuperación (compacto, alineado con login) */
	.recovery-title {
		margin-bottom: 0.5rem;
	}

	.recovery-title h2 {
		text-shadow: 0 2px 4px rgba(0, 166, 192, 0.3);
	}

	.success-banner {
		backdrop-filter: blur(10px);
		animation: slideInFromTop 0.4s ease-out;
		padding: 0.5rem;
		margin-bottom: 1rem;
	}

	@keyframes slideInFromTop {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Campo de código de verificación */
	.form-input.text-center {
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: 0.2em;
	}

	.auth-form-compact .form-input.text-center {
		font-size: 1.125rem;
		padding: 0.45rem 0.65rem;
	}

	/* Enlace de volver al login */
	.back-to-login button {
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		transition: all 0.2s ease;
	}

	.back-to-login button:hover {
		text-shadow: 0 0 8px rgba(0, 166, 192, 0.5);
	}

	/* Animación para el banner de éxito */
	.success-banner {
		position: relative;
		overflow: hidden;
	}

	.success-banner::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% {
			left: -100%;
		}
		100% {
			left: 100%;
		}
	}

	/* Banner de email no verificado con estilo naranja y glow */
	.email-not-verified-banner {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
		background: rgba(255, 149, 0, 0.15);
		border: 2px solid rgba(255, 149, 0, 0.5);
		border-radius: 8px;
		backdrop-filter: blur(10px);
		animation:
			slideInFromTop 0.4s ease-out,
			glowPulse 2s ease-in-out infinite;
		box-shadow:
			0 0 20px rgba(255, 149, 0, 0.3),
			0 0 40px rgba(255, 149, 0, 0.15),
			inset 0 1px 0 rgba(255, 149, 0, 0.2);
	}

	.banner-icon {
		flex-shrink: 0;
		color: #ff9500;
		filter: drop-shadow(0 0 8px rgba(255, 149, 0, 0.6));
	}

	.banner-content {
		flex: 1;
	}

	.banner-text {
		color: #ffb347;
		font-size: 0.875rem;
		line-height: 1.4;
		margin: 0;
		text-shadow: 0 0 10px rgba(255, 149, 0, 0.3);
	}

	/* Animación de glow pulsante */
	@keyframes glowPulse {
		0%,
		100% {
			box-shadow:
				0 0 20px rgba(255, 149, 0, 0.3),
				0 0 40px rgba(255, 149, 0, 0.15),
				inset 0 1px 0 rgba(255, 149, 0, 0.2);
		}
		50% {
			box-shadow:
				0 0 30px rgba(255, 149, 0, 0.5),
				0 0 60px rgba(255, 149, 0, 0.25),
				inset 0 1px 0 rgba(255, 149, 0, 0.3);
		}
	}

	/* Botón de reenviar correo con estilo naranja */
	.resend-verification-button {
		background: linear-gradient(135deg, #ff9500 0%, #ffb347 100%);
		box-shadow:
			0 8px 25px rgba(255, 149, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.2),
			0 0 20px rgba(255, 149, 0, 0.2);
		margin-top: 0.75rem;
	}

	.resend-verification-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #ffb347 0%, #ff9500 100%);
		transform: translateY(-2px);
		box-shadow:
			0 12px 35px rgba(255, 149, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3),
			0 0 30px rgba(255, 149, 0, 0.3);
	}

	.resend-verification-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.auth-card {
			padding: 2rem;
			margin: 1rem;
		}

		.auth-card-compact {
			padding: 1.25rem 1rem 1rem;
			margin: 0.5rem;
		}

		.form-container {
			min-height: 0;
		}

		.logo-container img {
			width: 4rem;
			height: 4rem;
		}

		.recovery-title h2 {
			font-size: 1.125rem;
		}

		.recovery-title p {
			font-size: 0.75rem;
		}

		.banner-text {
			font-size: 0.8125rem;
		}
	}
</style>
