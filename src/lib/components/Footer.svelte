<script>
	import { page } from '$app/state';

	function getLinkHref(hash) {
		if (page.url.pathname === '/') {
			return hash;
		}
		return `/${hash}`;
	}
</script>

<footer class="footer">
	<div class="footer-inner">
		<!-- Top: brand + 4 columns -->
		<div class="footer-top">
			<!-- Brand -->
			<div class="footer-brand">
				<span class="footer-logo">Geminis Labs</span>
				<p class="footer-tagline">
					Ingeniería e innovación tecnológica. Conectamos humanidad y tecnología.
				</p>
			</div>

			<!-- Servicios -->
			<div class="footer-col">
				<h4 class="footer-col-title">Servicios</h4>
				<ul class="footer-links">
					<li><a href="/servicios">Capacidades</a></li>
					<li><a href="/servicios#diagnostico">Diagnóstico tecnológico</a></li>
					<li><a href="/servicios#doors">CTO as a Service</a></li>
				</ul>
			</div>

			<!-- Productos -->
			<div class="footer-col">
				<h4 class="footer-col-title">Productos</h4>
				<ul class="footer-links">
					<li><a href="/products/nexus">Nexus</a></li>
					<li>
						<a href="https://orion.geminislabs.com/" target="_blank" rel="noopener noreferrer"
							>Orion</a
						>
					</li>
					<li>
						<a href="https://signum.geminislabs.com/" target="_blank" rel="noopener noreferrer"
							>Signum</a
						>
					</li>
				</ul>
			</div>

			<!-- Empresa -->
			<div class="footer-col">
				<h4 class="footer-col-title">Empresa</h4>
				<ul class="footer-links">
					<li><a href={getLinkHref('#existimos')}>Quiénes Somos</a></li>
					<li><a href={getLinkHref('#contacto')}>Contacto</a></li>
				</ul>
			</div>

			<!-- Recursos -->
			<div class="footer-col">
				<h4 class="footer-col-title">Recursos</h4>
				<ul class="footer-links">
					<li><a href="/faq">FAQ</a></li>
					<li><a href="/products/nexus/partners">Nexus para partners</a></li>
				</ul>
			</div>

			<!-- Legal -->
			<div class="footer-col">
				<h4 class="footer-col-title">Legal</h4>
				<ul class="footer-links">
					<li><a href="/legal/privacidad">Política de Privacidad</a></li>
					<li><a href="/legal/terminos">Términos de Uso</a></li>
					<li><a href="/legal/aviso-legal">Aviso Legal</a></li>
					<li><a href="/legal/cookies">Política de Cookies</a></li>
				</ul>
			</div>
		</div>

		<!-- Bottom bar -->
		<div class="footer-bottom">
			<p class="footer-copy">&copy; 2026 Geminis Labs &middot; Todos los derechos reservados</p>
			<p class="footer-disclaimer">
				Los servicios pueden depender de conectividad, hardware y terceros.
			</p>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: #0b1016;
		color: #ffffff;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.footer-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 4rem 2rem 0;
	}

	/* ── Top grid ───────────────────────────────────────────── */
	.footer-top {
		display: grid;
		/* marca + cinco columnas: Servicios entró junto a Productos. */
		grid-template-columns: 1.5fr repeat(5, 1fr);
		gap: 2.5rem;
		padding-bottom: 3rem;
	}

	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.footer-logo {
		font-family: 'Audiowide', sans-serif;
		font-size: 1.2rem;
		color: #ffffff;
		letter-spacing: 0.02em;
	}

	.footer-tagline {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.65;
		max-width: 220px;
	}

	/* ── Column ─────────────────────────────────────────────── */
	.footer-col-title {
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #00a6c0;
		margin: 0 0 1rem;
	}

	.footer-links {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.footer-links a {
		font-size: 0.875rem;
		color: #9ca3af;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.footer-links a:hover {
		color: #ffffff;
	}

	/* ── Bottom bar ─────────────────────────────────────────── */
	.footer-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.5rem 0 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		flex-wrap: wrap;
	}

	.footer-copy {
		font-size: 0.8125rem;
		color: #4b5563;
	}

	.footer-disclaimer {
		font-size: 0.75rem;
		color: #374151;
		text-align: right;
	}

	/* ── Responsive ─────────────────────────────────────────── */
	@media (max-width: 1024px) {
		.footer-top {
			grid-template-columns: 1fr 1fr 1fr;
			gap: 2rem;
		}

		.footer-brand {
			grid-column: 1 / -1;
			flex-direction: row;
			align-items: flex-start;
			gap: 2rem;
		}

		.footer-tagline {
			max-width: 300px;
		}
	}

	@media (max-width: 640px) {
		.footer-inner {
			padding: 3rem 1.5rem 0;
		}

		.footer-top {
			grid-template-columns: 1fr 1fr;
			gap: 2rem;
		}

		.footer-brand {
			grid-column: 1 / -1;
			flex-direction: column;
			gap: 0.5rem;
		}

		.footer-tagline {
			max-width: 100%;
		}

		.footer-bottom {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.footer-disclaimer {
			text-align: left;
		}
	}
</style>
