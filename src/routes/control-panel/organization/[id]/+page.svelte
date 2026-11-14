<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { isAuthenticated } from '$lib/stores/authStore.js';
	import { organizationService } from '$lib/services/organizationService.js';
	import { toastStore } from '$lib/stores/toastStore.js';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	const { id } = page.params;

	let organization = {
		name: '',
		billing_email: '',
		country: '',
		timezone: ''
	};

	let loading = true;
	let saving = false;
	let error = null;

	onMount(async () => {
		if (!$isAuthenticated) {
			goto('/auth');
			return;
		}

		try {
			organization = await organizationService.getOrganizationById(id);
		} catch (err) {
			console.error('Error fetching organization:', err);
			error = 'No se pudo cargar la información de la organización.';
			toastStore.error(error);
		} finally {
			loading = false;
		}
	});

	async function handleSubmit() {
		saving = true;
		error = null;

		try {
			const updateData = {
				name: organization.name,
				billing_email: organization.billing_email,
				country: organization.country,
				timezone: organization.timezone
			};

			await organizationService.updateOrganization(id, updateData);
			toastStore.success('Organización actualizada correctamente');
			goto('/control-panel/organization/info');
		} catch (err) {
			console.error('Error updating organization:', err);
			error = 'Error al actualizar la organización. Por favor, intenta de nuevo.';
			toastStore.error(error);
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Editar Organización - Geminis Labs</title>
</svelte:head>

<Navbar />
<Sidebar />

<main class="control-panel-main">
	<div class="control-panel-content">
		<header class="page-header">
			<div class="header-info">
				<div class="breadcrumb">
					<a href="/control-panel/organization/info">Organizaciones</a>
					<span>/</span>
					<span>Editar</span>
				</div>
				<h1>Editar Organización</h1>
				<p>Actualiza la información básica y de facturación</p>
			</div>
		</header>

		{#if loading}
			<div class="status-container">
				<div class="spinner"></div>
				<p>Cargando información...</p>
			</div>
		{:else if error && !organization.name}
			<div class="status-container error">
				<div class="error-icon">⚠️</div>
				<p>{error}</p>
				<button class="btn-secondary" on:click={() => goto('/control-panel/organization/info')}>
					Regresar a la lista
				</button>
			</div>
		{:else}
			<div class="form-card">
				<form on:submit|preventDefault={handleSubmit}>
					<div class="form-grid">
						<div class="form-group">
							<label for="name">Nombre de la Organización</label>
							<input
								type="text"
								id="name"
								bind:value={organization.name}
								required
								placeholder="Ej. Flota Norte"
							/>
						</div>

						<div class="form-group">
							<label for="email">Email de Facturación</label>
							<input
								type="email"
								id="email"
								bind:value={organization.billing_email}
								placeholder="admin@empresa.com"
							/>
						</div>

						<div class="form-group">
							<label for="country">País</label>
							<select id="country" bind:value={organization.country}>
								<option value="">Selecciona un país</option>
								<option value="MX">México</option>
								<option value="US">Estados Unidos</option>
								<option value="CO">Colombia</option>
								<option value="ES">España</option>
								<option value="AR">Argentina</option>
								<option value="CL">Chile</option>
							</select>
						</div>

						<div class="form-group">
							<label for="timezone">Zona Horaria</label>
							<select id="timezone" bind:value={organization.timezone}>
								<option value="">Selecciona zona horaria</option>
								<option value="America/Mexico_City">America/Mexico_City</option>
								<option value="America/Monterrey">America/Monterrey</option>
								<option value="America/New_York">America/New_York</option>
								<option value="America/Bogota">America/Bogota</option>
								<option value="Europe/Madrid">Europe/Madrid</option>
							</select>
						</div>
					</div>

					<div class="form-actions">
						<button
							type="button"
							class="btn-ghost"
							on:click={() => goto('/control-panel/organization/info')}
						>
							Cancelar
						</button>
						<button type="submit" class="btn-primary" disabled={saving}>
							{saving ? 'Guardando...' : 'Guardar Cambios'}
						</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
</main>

<style>
	/* Heredar estilos base */
	.control-panel-main {
		min-height: 100vh;
		background: linear-gradient(
			270deg,
			rgba(31, 41, 55, 0.95) 0%,
			rgba(28, 36, 48, 0.95) 50%,
			rgba(24, 31, 42, 0.95) 100%
		);
		background-color: #1c2430;
		padding: 2rem;
		padding-top: calc(70px + 2rem);
		margin-left: 260px;
		transition: margin-left 0.3s ease;
		position: relative;
		box-sizing: border-box;
	}

	.control-panel-main::after {
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

	.control-panel-content {
		max-width: 900px;
		margin: 0 auto;
		position: relative;
		z-index: 2;
	}

	/* Breadcrumb */
	.breadcrumb {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #64748b;
	}

	.breadcrumb a {
		color: #818cf8;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	/* Header */
	.page-header {
		margin-bottom: 3rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		padding-bottom: 1.5rem;
	}

	.header-info h1 {
		color: #f1f5f9;
		font-size: 2.25rem;
		margin: 0 0 0.5rem 0;
		font-weight: 700;
	}

	.header-info p {
		color: #94a3b8;
		margin: 0;
	}

	/* Form Card */
	.form-card {
		background: rgba(30, 41, 59, 0.4);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 20px;
		padding: 2.5rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2rem;
		margin-bottom: 3rem;
	}

	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #cbd5e1;
		letter-spacing: 0.025em;
	}

	.form-group input,
	.form-group select {
		background: rgba(15, 23, 42, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 0.75rem 1rem;
		color: #f1f5f9;
		font-size: 1rem;
		transition: all 0.2s;
		outline: none;
	}

	.form-group input:focus,
	.form-group select:focus {
		border-color: #6366f1;
		background: rgba(15, 23, 42, 0.5);
		box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
	}

	.form-group select option {
		background-color: #1e293b;
		color: #f1f5f9;
	}

	/* Actions */
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1.5rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.btn-primary {
		background: linear-gradient(90deg, #6366f1, #a855f7);
		color: white;
		border: none;
		padding: 0.875rem 2rem;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
	}

	.btn-ghost {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #94a3b8;
		padding: 0.875rem 2rem;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-ghost:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #f1f5f9;
	}

	/* Status containers */
	.status-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 5rem 2rem;
		background: rgba(30, 41, 59, 0.3);
		border-radius: 20px;
		border: 1px dashed rgba(255, 255, 255, 0.1);
		color: #cbd5e1;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(99, 102, 241, 0.2);
		border-top-color: #6366f1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 1024px) {
		.control-panel-main {
			margin-left: 220px;
		}
	}

	@media (max-width: 768px) {
		.control-panel-main {
			padding: 1rem;
			margin-left: 0;
		}
	}
</style>
