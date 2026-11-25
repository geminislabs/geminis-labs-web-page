<script>
	/**
	 * Visual vivo de cada producto en «Nuestros productos». Los datos que se ven
	 * son de ejemplo (rotulados); lo que se ilustra es cómo funciona cada uno.
	 *  - nexus: mapa con geocerca de celdas H3 (el mismo de la experiencia).
	 *  - orion: ubicación por señal celular: torres, radio estimado y respuesta.
	 *  - signum: el QR se escanea y aparece la ficha de emergencia.
	 */
	import NexusSketch from '$lib/components/experiencia/NexusSketch.svelte';

	let { id, active = false, reduced = false } = $props();

	// Matriz tipo QR decorativa (no es un código legible): patrón fijo y
	// determinista con las tres esquinas de posición.
	const N = 21;
	const qr = [];
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N; x++) {
			const finder = (fx, fy) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7;
			if (finder(0, 0) || finder(14, 0) || finder(0, 14)) continue;
			const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
			if (v - Math.floor(v) > 0.52) qr.push([x, y]);
		}
	}
	const FINDERS = [
		[0, 0],
		[14, 0],
		[0, 14]
	];
</script>

<div class="pv pv-{id}" class:active class:reduced aria-hidden="true">
	{#if id === 'nexus'}
		<div class="pv-nexus">
			{#if active}<NexusSketch {reduced} />{/if}
		</div>
	{:else if id === 'orion'}
		<svg class="pv-orion" viewBox="0 0 400 300">
			<defs>
				<pattern id="pv-dots" width="16" height="16" patternUnits="userSpaceOnUse">
					<circle cx="2" cy="2" r="1" fill="rgba(205,213,221,0.16)" />
				</pattern>
			</defs>
			<rect width="400" height="300" fill="url(#pv-dots)" />
			{#each [[70, 70], [330, 90], [210, 255]] as [tx, ty], i (i)}
				<g class="pv-tower" style="--i:{i}">
					<circle class="pv-wave" cx={tx} cy={ty} r="10" />
					<circle class="pv-wave pv-wave2" cx={tx} cy={ty} r="10" />
					<path d="M{tx} {ty - 14} l-7 22 h14 z" class="pv-mast" />
					<line x1={tx} y1={ty} x2="205" y2="140" class="pv-ray" />
				</g>
			{/each}
			<circle cx="205" cy="140" r="70" class="pv-radius" />
			<circle cx="205" cy="140" r="5" class="pv-pin" />
			<circle cx="205" cy="140" r="12" class="pv-pin-ring" />
		</svg>
		<pre class="pv-console"><span class="pv-l1">POST /locate  &#123; "cell_id": "…" &#125;</span>
<span class="pv-l2">→ &#123; "lat": 20.59, "lon": -100.39, "radio_m": 450 &#125;</span></pre>
		<p class="pv-note">Ejemplo ilustrativo</p>
	{:else if id === 'signum'}
		<div class="pv-signum">
			<svg class="pv-qr" viewBox="-2 -2 25 25">
				<rect x="-2" y="-2" width="25" height="25" rx="2" fill="#f4f1ec" />
				{#each FINDERS as [fx, fy] (`${fx}-${fy}`)}
					<rect x={fx + 0.5} y={fy + 0.5} width="6" height="6" class="pv-qr-f" />
					<rect x={fx + 2} y={fy + 2} width="3" height="3" fill="#15110f" />
				{/each}
				{#each qr as [x, y] (`${x}-${y}`)}
					<rect {x} {y} width="1" height="1" fill="#15110f" />
				{/each}
				<rect x="-2" y="0" width="25" height="1.2" class="pv-scan" />
			</svg>
			<div class="pv-card">
				<p class="pv-card-head"><span class="pv-dot"></span> Ficha de emergencia · ES / EN</p>
				<dl>
					<div>
						<dt>Tipo de sangre</dt>
						<dd>O+</dd>
					</div>
					<div>
						<dt>Alergias</dt>
						<dd>Penicilina</dd>
					</div>
					<div>
						<dt>Condición</dt>
						<dd>Asma</dd>
					</div>
				</dl>
				<span class="pv-call">Llamar a contacto de emergencia</span>
			</div>
			<p class="pv-note">Ejemplo ilustrativo</p>
		</div>
	{/if}
</div>

<style>
	.pv {
		position: relative;
		width: 100%;
		min-height: 360px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.pv-note {
		margin: 0.6rem 0 0;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.35);
	}

	/* Nexus */
	.pv-nexus {
		width: 100%;
		height: 380px;
	}

	/* Orion */
	.pv-orion {
		width: 100%;
		max-width: 420px;
	}
	.pv-mast {
		fill: rgba(225, 232, 238, 0.85);
	}
	.pv-wave {
		fill: none;
		stroke: rgba(225, 232, 238, 0.55);
		stroke-width: 1.2;
		transform-box: fill-box;
		transform-origin: center;
		animation: pv-wave 2.4s ease-out infinite;
		animation-delay: calc(var(--i) * 0.5s);
	}
	.pv-wave2 {
		animation-delay: calc(var(--i) * 0.5s + 1.2s);
	}
	@keyframes pv-wave {
		from {
			transform: scale(0.6);
			opacity: 0.9;
		}
		to {
			transform: scale(5);
			opacity: 0;
		}
	}
	.pv-ray {
		stroke: rgba(225, 232, 238, 0.28);
		stroke-width: 1;
		stroke-dasharray: 4 5;
		animation: pv-dash 1.2s linear infinite;
	}
	@keyframes pv-dash {
		to {
			stroke-dashoffset: -18;
		}
	}
	.pv-radius {
		fill: rgba(225, 232, 238, 0.06);
		stroke: rgba(255, 255, 255, 0.7);
		stroke-width: 1.4;
		stroke-dasharray: 5 5;
		transform-box: fill-box;
		transform-origin: center;
		animation: pv-narrow 4s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}
	@keyframes pv-narrow {
		0% {
			transform: scale(1.9);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		70%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	.pv-pin {
		fill: #fff;
	}
	.pv-pin-ring {
		fill: none;
		stroke: #fff;
		stroke-width: 1.5;
		transform-box: fill-box;
		transform-origin: center;
		animation: pv-wave 2s ease-out infinite;
	}
	.pv-console {
		width: min(100%, 400px);
		margin: 0.4rem 0 0;
		padding: 0.8rem 1rem;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.45);
		box-shadow: inset 0 0 0 1px rgba(225, 232, 238, 0.14);
		font:
			0.76rem/1.6 ui-monospace,
			'SF Mono',
			Menlo,
			monospace;
		color: rgba(225, 232, 238, 0.85);
		white-space: pre-wrap;
		overflow: hidden;
	}
	.pv-console span {
		display: block;
		overflow: hidden;
		white-space: nowrap;
		clip-path: inset(0 100% 0 0);
		animation: pv-type 4s steps(40) infinite;
	}
	.pv-console .pv-l2 {
		color: #fff;
		animation-name: pv-type2;
	}
	@keyframes pv-type {
		0% {
			clip-path: inset(0 100% 0 0);
		}
		30%,
		100% {
			clip-path: inset(0 0 0 0);
		}
	}
	@keyframes pv-type2 {
		0%,
		40% {
			clip-path: inset(0 100% 0 0);
		}
		70%,
		100% {
			clip-path: inset(0 0 0 0);
		}
	}

	/* Signum */
	.pv-signum {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}
	.pv-qr {
		width: min(190px, 50%);
		border-radius: 10px;
		box-shadow:
			0 20px 50px rgba(0, 0, 0, 0.5),
			0 0 0 6px rgba(229, 72, 77, 0.18);
	}
	.pv-qr-f {
		fill: none;
		stroke: #15110f;
		stroke-width: 1;
	}
	.pv-scan {
		fill: rgba(229, 72, 77, 0.75);
		animation: pv-scan 4.5s ease-in-out infinite;
	}
	@keyframes pv-scan {
		0% {
			transform: translateY(0);
			opacity: 0;
		}
		8% {
			opacity: 1;
		}
		35% {
			transform: translateY(21px);
			opacity: 1;
		}
		40%,
		100% {
			transform: translateY(21px);
			opacity: 0;
		}
	}
	.pv-card {
		width: min(100%, 300px);
		margin-top: -1.2rem;
		padding: 0.9rem 1rem;
		border-radius: 16px;
		background: rgba(24, 16, 14, 0.94);
		box-shadow:
			0 20px 50px rgba(0, 0, 0, 0.55),
			inset 0 0 0 1px rgba(229, 72, 77, 0.35);
		animation: pv-card 4.5s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}
	@keyframes pv-card {
		0%,
		36% {
			opacity: 0;
			transform: translateY(18px) scale(0.96);
		}
		46%,
		92% {
			opacity: 1;
			transform: none;
		}
		100% {
			opacity: 0;
			transform: translateY(-6px);
		}
	}
	.pv-card-head {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin: 0 0 0.6rem;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #e5484d;
	}
	.pv-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #e5484d;
		box-shadow: 0 0 8px #e5484d;
	}
	.pv-card dl {
		display: grid;
		gap: 0.35rem;
		margin: 0 0 0.7rem;
	}
	.pv-card dl div {
		display: flex;
		justify-content: space-between;
		font-size: 0.82rem;
	}
	.pv-card dt {
		color: rgba(244, 241, 236, 0.6);
	}
	.pv-card dd {
		margin: 0;
		font-weight: 600;
		color: #f4f1ec;
	}
	.pv-call {
		display: block;
		padding: 0.5rem;
		border-radius: 999px;
		background: #e5484d;
		text-align: center;
		font-size: 0.78rem;
		font-weight: 600;
		color: #fff;
	}

	/* Solo se anima el producto visible. */
	.pv:not(.active) *,
	.reduced * {
		animation-play-state: paused !important;
	}
	.reduced .pv-card,
	.reduced .pv-console span {
		animation: none;
		opacity: 1;
		clip-path: none;
	}
</style>
