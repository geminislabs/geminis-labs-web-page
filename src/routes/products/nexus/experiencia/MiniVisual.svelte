<script>
	/**
	 * Ilustraciones vivas para tarjetas (SVG + SMIL/CSS, sin imágenes):
	 * flotilla, marca, riesgo, teams, inteligencia.
	 */
	let { kind = 'flotilla' } = $props();

	const ROADS = [
		'M-10 40 C 60 30, 120 70, 190 55 S 290 30, 330 45',
		'M-10 110 C 70 120, 140 90, 210 105 S 300 125, 330 115',
		'M60 -10 C 70 50, 40 100, 70 170',
		'M230 -10 C 220 60, 250 100, 235 170',
		'M-10 80 L 330 80'
	];
	const HEX = (() => {
		const out = [];
		const r = 15;
		const w = Math.sqrt(3) * r;
		for (let row = 0; row < 6; row++) {
			for (let col = 0; col < 11; col++) {
				const x = col * w + (row % 2 ? w / 2 : 0) + 6;
				const y = row * r * 1.5 + 10;
				const cx = x - 160;
				const cy = y - 70;
				const heat =
					Math.max(0, 1 - Math.hypot(cx - 20, cy) / 120) * 0.8 +
					Math.max(0, 1 - Math.hypot(cx + 90, cy + 30) / 60) * 0.6;
				const pts = Array.from({ length: 6 }, (_, k) => {
					const a = (Math.PI / 3) * k + Math.PI / 6;
					return `${(x + Math.cos(a) * (r - 1.5)).toFixed(1)},${(y + Math.sin(a) * (r - 1.5)).toFixed(1)}`;
				}).join(' ');
				out.push({ pts, heat: Math.min(1, heat), i: row * 11 + col });
			}
		}
		return out;
	})();
	const NODES = [
		[40, 40],
		[110, 25],
		[170, 70],
		[250, 35],
		[285, 110],
		[200, 125],
		[95, 115],
		[30, 125]
	];
	const LINKS = [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 4],
		[4, 5],
		[5, 2],
		[5, 6],
		[6, 0],
		[6, 7],
		[2, 6],
		[1, 3]
	];
</script>

<div class="mv mv-{kind}" aria-hidden="true">
	{#if kind === 'flotilla'}
		<svg viewBox="0 0 320 160">
			{#each ROADS as d, i (i)}
				<path id="mv-road-{i}" {d} class="road" />
			{/each}
			<rect x="140" y="66" width="34" height="28" rx="6" class="depot" />
			<text x="157" y="84" class="depot-t">BASE</text>
			{#each Array(9) as _, i (i)}
				<circle r="4.5" class="unit" class:alert={i === 4}>
					<animateMotion
						dur="{7 + (i % 4) * 2.3}s"
						repeatCount="indefinite"
						begin="-{i * 1.7}s"
						rotate="auto"
					>
						<mpath href="#mv-road-{i % 5}" />
					</animateMotion>
				</circle>
			{/each}
		</svg>
	{:else if kind === 'marca'}
		<div class="phones">
			{#each [['#3ec128', 'NEXUS'], ['#2b7bf0', 'TU MARCA'], ['#e0457b', 'TU MARCA']] as [c, n], i (i)}
				<div class="phone" style="--c:{c}; --i:{i}">
					<span class="ph-brand">{n}</span>
					<span class="ph-map"><i></i></span>
					<span class="ph-row"></span>
					<span class="ph-row short"></span>
				</div>
			{/each}
		</div>
	{:else if kind === 'riesgo'}
		<svg viewBox="0 0 320 150">
			{#each HEX as h (h.i)}
				<polygon
					points={h.pts}
					class="hex"
					style="--h:{h.heat.toFixed(2)}; --dl:{(h.i % 7) * 0.4}s"
				/>
			{/each}
		</svg>
	{:else if kind === 'teams'}
		<svg viewBox="0 0 320 150">
			<circle cx="160" cy="75" r="46" class="zone" />
			{#each [[90, 40], [235, 45], [250, 115], [80, 118], [160, 20]] as [x, y], i (i)}
				<line x1="160" y1="75" x2={x} y2={y} class="tie" style="--dl:{i * 0.5}s" />
				<g transform="translate({x} {y})" class="person">
					<circle r="13" />
					<circle cy="-3" r="4.5" class="head" />
					<path d="M-7 8 Q0 0 7 8" class="body" />
				</g>
			{/each}
			<circle cx="160" cy="75" r="9" class="pin" />
		</svg>
	{:else if kind === 'inteligencia'}
		<svg viewBox="0 0 320 150">
			{#each LINKS as [a, b], i (i)}
				<path
					id="mv-link-{i}"
					d="M{NODES[a][0]} {NODES[a][1]} L{NODES[b][0]} {NODES[b][1]}"
					class="link"
				/>
			{/each}
			{#each LINKS as _, i (i)}
				<circle r="2.6" class="signal">
					<animateMotion dur="{2.4 + (i % 3)}s" repeatCount="indefinite" begin="-{i * 0.6}s">
						<mpath href="#mv-link-{i}" />
					</animateMotion>
				</circle>
			{/each}
			{#each NODES as [x, y], i (i)}
				<circle cx={x} cy={y} r={i === 2 ? 9 : 6} class="node" class:core={i === 2} />
			{/each}
		</svg>
	{/if}
</div>

<style>
	.mv {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 120px;
		overflow: hidden;
		border-radius: 12px;
		background: radial-gradient(ellipse at 50% 60%, rgba(14, 40, 60, 0.9), rgba(5, 12, 22, 0.95));
	}
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.road {
		fill: none;
		stroke: rgba(94, 140, 175, 0.45);
		stroke-width: 3;
	}
	.depot {
		fill: rgba(0, 255, 136, 0.12);
		stroke: rgba(0, 255, 136, 0.6);
	}
	.depot-t {
		fill: #9ff5c4;
		font:
			600 8px Outfit,
			sans-serif;
		text-anchor: middle;
		letter-spacing: 0.1em;
	}
	.unit {
		fill: #eafff4;
		filter: drop-shadow(0 0 5px #00ff88);
	}
	.unit.alert {
		fill: #ffd0a0;
		filter: drop-shadow(0 0 6px #d9914d);
	}

	.phones {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.phone {
		position: relative;
		width: 70px;
		height: 128px;
		margin: 0 -10px;
		padding: 9px 7px;
		border-radius: 14px;
		background: #0a1422;
		box-shadow:
			0 0 0 2px color-mix(in srgb, var(--c) 70%, transparent),
			0 10px 30px rgba(0, 0, 0, 0.5),
			0 0 24px color-mix(in srgb, var(--c) 35%, transparent);
		transform: rotate(calc((var(--i) - 1) * 12deg)) translateY(calc(var(--i) * -2px));
		animation: ph-float 5s ease-in-out infinite;
		animation-delay: calc(var(--i) * -1.6s);
		display: flex;
		flex-direction: column;
		gap: 6px;
		z-index: calc(3 - var(--i));
	}
	@keyframes ph-float {
		50% {
			translate: 0 -6px;
		}
	}
	.ph-brand {
		font:
			700 8px Outfit,
			sans-serif;
		letter-spacing: 0.08em;
		color: var(--c);
	}
	.ph-map {
		position: relative;
		flex: 1;
		border-radius: 6px;
		background:
			linear-gradient(35deg, transparent 45%, rgba(148, 181, 208, 0.35) 46%, transparent 49%),
			linear-gradient(-20deg, transparent 55%, rgba(148, 181, 208, 0.3) 56%, transparent 58%),
			#0f2236;
	}
	.ph-map i {
		position: absolute;
		left: 55%;
		top: 40%;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--c);
		box-shadow: 0 0 8px var(--c);
	}
	.ph-row {
		height: 5px;
		border-radius: 3px;
		background: color-mix(in srgb, var(--c) 50%, #1a2a3c);
	}
	.ph-row.short {
		width: 60%;
	}

	.hex {
		fill: rgb(217 145 77 / calc(0.06 + var(--h) * 0.75));
		stroke: rgba(217, 145, 77, 0.25);
		stroke-width: 0.8;
		animation: hex-pulse 4s ease-in-out infinite;
		animation-delay: var(--dl);
	}
	@keyframes hex-pulse {
		50% {
			opacity: 0.6;
		}
	}

	.zone {
		fill: rgba(0, 255, 136, 0.06);
		stroke: rgba(0, 255, 136, 0.4);
		stroke-dasharray: 4 4;
	}
	.tie {
		stroke: rgba(0, 255, 136, 0.5);
		stroke-width: 1.2;
		stroke-dasharray: 3 4;
		animation: tie 1.6s linear infinite;
		animation-delay: var(--dl);
	}
	@keyframes tie {
		to {
			stroke-dashoffset: -14;
		}
	}
	.person circle:first-child {
		fill: #0d2235;
		stroke: rgba(159, 245, 196, 0.8);
	}
	.head {
		fill: #9ff5c4;
	}
	.body {
		fill: none;
		stroke: #9ff5c4;
		stroke-width: 2;
	}
	.pin {
		fill: #00ff88;
		filter: drop-shadow(0 0 8px #00ff88);
	}

	.link {
		stroke: rgba(195, 139, 255, 0.35);
		stroke-width: 1.2;
		fill: none;
	}
	.signal {
		fill: #f0dcff;
		filter: drop-shadow(0 0 4px #c38bff);
	}
	.node {
		fill: #120a26;
		stroke: #c38bff;
		stroke-width: 1.5;
	}
	.node.core {
		fill: #c38bff;
		filter: drop-shadow(0 0 10px #c38bff);
	}
	@media (prefers-reduced-motion: reduce) {
		.phone,
		.hex,
		.tie {
			animation: none;
		}
	}
</style>
