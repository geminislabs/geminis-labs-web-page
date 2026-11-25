<script>
	/**
	 * Servicios en bento: un bloque grande para la puerta de entrada (consultoría
	 * y diagnóstico) y bloques más chicos para el resto. La jerarquía la da el
	 * tamaño, no los efectos.
	 */
</script>

<div class="sb">
	<header class="sb-head">
		<p class="sb-overline">Ingeniería y consultoría</p>
		<h2 class="sb-title">También construimos la tecnología de otros</h2>
		<p class="sb-lead">
			El mismo equipo que diseña, construye y opera Nexus, Orion y Signum, aplicado a tu problema:
			de la idea a una solución operando.
		</p>
	</header>

	<div class="sb-grid">
		<article class="sb-tile sb-big">
			<span class="sb-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>
			</span>
			<h3>Consultoría y estrategia</h3>
			<p>
				Entendemos el problema antes de proponer tecnología: diagnóstico, arquitectura y una ruta
				clara para llegar a producción.
			</p>
			<ul class="sb-chips">
				<li>Diagnóstico</li>
				<li>Arquitectura</li>
				<li>Roadmap</li>
				<li>Due diligence técnica</li>
			</ul>
			<a class="sb-cta" href="/servicios#diagnostico"
				>Empezar por un diagnóstico <span aria-hidden="true">→</span></a
			>
		</article>

		<article class="sb-tile sb-wide">
			<span class="sb-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24"
					><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg
				>
			</span>
			<h3>CTO por horas</h3>
			<p>
				Liderazgo técnico sin contratar de tiempo completo: decisiones de arquitectura, equipo y
				proveedores, cuando las necesitas.
			</p>
		</article>

		<article class="sb-tile">
			<span class="sb-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24"
					><path d="M8 7h8M8 17h8M4 12h16" /><circle cx="4" cy="12" r="2" /><circle
						cx="20"
						cy="12"
						r="2"
					/></svg
				>
			</span>
			<h3>Integración tecnológica</h3>
			<p>Conectamos dispositivos, sistemas y datos que hoy no se hablan.</p>
		</article>

		<article class="sb-tile">
			<span class="sb-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6" /></svg>
			</span>
			<h3>Desarrollo a la medida</h3>
			<p>Software, apps, nube, IoT e IA, construidos y operados por el mismo equipo.</p>
		</article>

		<article class="sb-tile sb-proof">
			<p>
				<strong>Nexus, Orion y Signum son la prueba:</strong> los diseñamos, construimos y operamos nosotros.
			</p>
			<a class="sb-link" href="/servicios"
				>Ver las seis capacidades <span aria-hidden="true">→</span></a
			>
		</article>
	</div>
</div>

<style>
	.sb {
		width: min(1240px, 100% - 2rem);
		margin: 0 auto;
	}
	.sb-head {
		max-width: 720px;
		margin: 0 auto 2.2rem;
		text-align: center;
	}
	.sb-overline {
		margin: 0 0 0.7rem;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #0891b2;
	}
	.sb-title {
		margin: 0 0 0.9rem;
		font-size: clamp(1.9rem, 3.6vw, 2.9rem);
		line-height: 1.1;
		font-weight: 700;
		color: #0d1b2e;
	}
	.sb-lead {
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.6;
		color: #4a6080;
	}
	.sb-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		grid-auto-rows: minmax(180px, auto);
		gap: 1rem;
	}
	.sb-tile {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.5rem;
		border-radius: 22px;
		background: #fff;
		box-shadow:
			0 10px 30px rgba(13, 27, 46, 0.06),
			inset 0 0 0 1px rgba(13, 27, 46, 0.07);
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}
	.sb-tile:hover {
		transform: translateY(-3px);
		box-shadow:
			0 18px 40px rgba(13, 27, 46, 0.1),
			inset 0 0 0 1px rgba(8, 145, 178, 0.25);
	}
	.sb-tile h3 {
		margin: 0;
		font-size: 1.2rem;
		color: #0d1b2e;
	}
	.sb-tile p {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.55;
		color: #4a6080;
	}
	.sb-icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: rgba(8, 145, 178, 0.1);
	}
	.sb-icon svg {
		width: 22px;
		height: 22px;
		fill: none;
		stroke: #0891b2;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.sb-big {
		grid-column: span 2;
		grid-row: span 2;
		justify-content: flex-end;
		padding: 2rem;
		background:
			radial-gradient(ellipse 70% 60% at 80% 10%, rgba(0, 166, 192, 0.28), transparent 70%),
			linear-gradient(160deg, #0c1a2a 0%, #060d16 100%);
	}
	.sb-big h3 {
		font-size: clamp(1.5rem, 2.4vw, 2rem);
		color: #f4f8fb;
	}
	.sb-big p {
		max-width: 460px;
		color: rgba(220, 232, 242, 0.75);
	}
	.sb-big .sb-icon {
		position: absolute;
		top: 2rem;
		left: 2rem;
		background: rgba(0, 166, 192, 0.18);
	}
	.sb-big .sb-icon svg {
		stroke: #5fd3e6;
	}
	.sb-wide {
		grid-column: span 2;
	}
	.sb-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0.4rem 0 0.6rem;
		padding: 0;
		list-style: none;
	}
	.sb-chips li {
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		font-size: 0.8rem;
		color: rgba(220, 232, 242, 0.85);
	}
	.sb-cta {
		align-self: flex-start;
		padding: 0.75rem 1.3rem;
		border-radius: 999px;
		background: #00a6c0;
		font-weight: 700;
		color: #fff;
		text-decoration: none;
	}
	.sb-proof {
		grid-column: span 4;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 1rem 2rem;
		flex-wrap: wrap;
		min-height: 0;
		background: linear-gradient(90deg, rgba(8, 145, 178, 0.08), rgba(62, 193, 40, 0.08));
	}
	.sb-proof strong {
		color: #0d1b2e;
	}
	.sb-link {
		font-weight: 700;
		color: #0891b2;
		text-decoration: none;
		white-space: nowrap;
	}
	@media (max-width: 900px) {
		.sb-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.sb-big,
		.sb-wide,
		.sb-proof {
			grid-column: span 2;
		}
		.sb-big {
			grid-row: auto;
			min-height: 340px;
		}
	}
	@media (max-width: 560px) {
		.sb-grid {
			grid-template-columns: 1fr;
		}
		.sb-big,
		.sb-wide,
		.sb-proof {
			grid-column: auto;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sb-tile {
			transition: none;
		}
	}
</style>
