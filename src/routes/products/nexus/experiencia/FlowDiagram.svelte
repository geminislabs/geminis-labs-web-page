<script>
	/**
	 * Arquitectura de Nexus como flujo vivo: cada partícula es un evento que viaja
	 * del dispositivo a la recepción, al procesamiento y de ahí a reglas,
	 * histórico, alertas y reportes. Los nodos se encienden cuando llega un evento.
	 */
	import { onMount } from 'svelte';

	let { reduced = false } = $props();

	const NODES = [
		{ id: 'gps', x: 0.07, y: 0.5, t: 'Dispositivo GPS', s: 'Suntech · Queclink' },
		{ id: 'red', x: 0.23, y: 0.5, t: 'Red celular', s: 'LTE' },
		{ id: 'rx', x: 0.39, y: 0.5, t: 'Recepción', s: 'Protocolos' },
		{ id: 'proc', x: 0.55, y: 0.5, t: 'Procesamiento', s: 'Eventos' },
		{ id: 'reglas', x: 0.73, y: 0.22, t: 'Contexto y reglas', s: 'Geocercas' },
		{ id: 'hist', x: 0.73, y: 0.78, t: 'Histórico', s: 'Trayectos' },
		{ id: 'alertas', x: 0.92, y: 0.22, t: 'Alertas', s: 'Web y app' },
		{ id: 'rep', x: 0.92, y: 0.78, t: 'Reportes', s: 'Telemetría' }
	];
	const EDGES = [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 4],
		[3, 5],
		[4, 6],
		[5, 7]
	];

	let host = $state(null);
	let canvas = $state(null);

	onMount(() => {
		const ctx = canvas.getContext('2d');
		let W = 0;
		let H = 0;
		let dpr = 1;
		let raf = 0;
		const glow = NODES.map(() => 0);
		let particles = [];
		let lastSpawn = 0;
		let bw = 150;
		const bh = 58;

		function resize() {
			const r = host.getBoundingClientRect();
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			W = r.width;
			H = r.height;
			canvas.width = Math.round(W * dpr);
			canvas.height = Math.round(H * dpr);
		}

		// En pantallas angostas el flujo corre de arriba hacia abajo.
		const vertical = () => W < 640;
		const pos = (n) =>
			vertical() ? [NODES[n].y * W, NODES[n].x * H] : [NODES[n].x * W, NODES[n].y * H];

		function bez(a, b, u) {
			const [cx0, cy0] = pos(a);
			const [cx3, cy3] = pos(b);
			const v = 1 - u;
			if (vertical()) {
				// De la base de un nodo a la parte superior del siguiente.
				const y0 = cy0 + bh / 2;
				const y3 = cy3 - bh / 2;
				const my = (y0 + y3) / 2;
				return [
					v * v * v * cx0 + 3 * v * v * u * cx0 + 3 * v * u * u * cx3 + u * u * u * cx3,
					v * v * v * y0 + 3 * v * v * u * my + 3 * v * u * u * my + u * u * u * y3
				];
			}
			// Las conexiones salen del borde derecho y llegan al borde izquierdo.
			const y0 = cy0;
			const y3 = cy3;
			const x0 = cx0 + bw / 2;
			const x3 = cx3 - bw / 2;
			const mx = (x0 + x3) / 2;
			const x1 = mx;
			const x2 = mx;
			return [
				v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3,
				v * v * v * y0 + 3 * v * v * u * y0 + 3 * v * u * u * y3 + u * u * u * y3
			];
		}

		function spawn() {
			// Un evento recorre la cadena completa; al procesarse se divide en dos.
			particles.push({
				edge: 0,
				u: 0,
				speed: 0.55 + Math.random() * 0.25,
				hue: Math.random() < 0.18
			});
		}

		function frame(now) {
			raf = requestAnimationFrame(frame);
			const dt = 0.016;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, W, H);
			bw = vertical() ? Math.min(150, W * 0.4) : Math.min(150, W * 0.115);

			if (!reduced && now - lastSpawn > 260) {
				lastSpawn = now;
				spawn();
			}

			// Conexiones.
			ctx.lineWidth = 1.5;
			for (const [a, b] of EDGES) {
				ctx.strokeStyle = 'rgba(134,240,221,0.22)';
				ctx.beginPath();
				for (let k = 0; k <= 30; k++) {
					const [x, y] = bez(a, b, k / 30);
					if (k) ctx.lineTo(x, y);
					else ctx.moveTo(x, y);
				}
				ctx.stroke();
			}

			// Partículas.
			ctx.globalCompositeOperation = 'lighter';
			const next = [];
			for (const p of particles) {
				p.u += p.speed * dt * 1.25;
				const [a, b] = EDGES[p.edge];
				if (p.u >= 1) {
					glow[b] = 1;
					const outs = EDGES.map((e, i) => [e, i]).filter(([e]) => e[0] === b);
					for (const [, i] of outs) next.push({ ...p, edge: i, u: 0 });
					continue;
				}
				const color = p.hue ? '255,179,92' : '134,255,221';
				for (let k = 0; k < 10; k++) {
					const uu = Math.max(0, p.u - k * 0.03);
					const [x, y] = bez(a, b, uu);
					ctx.fillStyle = `rgba(${color},${0.95 * (1 - k / 10)})`;
					ctx.beginPath();
					ctx.arc(x, y, 4 - k * 0.32, 0, Math.PI * 2);
					ctx.fill();
				}
				const [hx, hy] = bez(a, b, p.u);
				const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14);
				g.addColorStop(0, `rgba(${color},0.55)`);
				g.addColorStop(1, `rgba(${color},0)`);
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.arc(hx, hy, 14, 0, Math.PI * 2);
				ctx.fill();
				next.push(p);
			}
			particles = next;
			ctx.globalCompositeOperation = 'source-over';

			// Nodos.
			NODES.forEach((n, i) => {
				const [x, y] = pos(i);
				glow[i] *= 0.92;
				const g = glow[i];
				ctx.fillStyle = 'rgba(6,20,26,0.92)';
				ctx.strokeStyle = `rgba(${g > 0.05 ? '0,255,170' : '134,240,221'},${0.3 + g * 0.7})`;
				ctx.lineWidth = 1 + g;
				ctx.shadowColor = 'rgba(0,255,170,0.8)';
				ctx.shadowBlur = 24 * g;
				ctx.beginPath();
				ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 14);
				ctx.fill();
				ctx.stroke();
				ctx.shadowBlur = 0;
				ctx.textAlign = 'center';
				ctx.fillStyle = '#eaf3fc';
				ctx.font = `600 ${W < 900 ? 11 : 14}px Outfit, system-ui, sans-serif`;
				ctx.fillText(n.t, x, y - 3);
				ctx.fillStyle = '#86f0dd';
				ctx.font = `400 ${W < 900 ? 10 : 12}px Outfit, system-ui, sans-serif`;
				ctx.fillText(n.s, x, y + 15);
			});
		}

		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(host);
		raf = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	});
</script>

<div class="flow" bind:this={host}>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
	.flow {
		width: 100%;
		height: clamp(220px, 34vh, 340px);
	}
	@media (max-width: 639px) {
		.flow {
			height: 640px;
		}
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
