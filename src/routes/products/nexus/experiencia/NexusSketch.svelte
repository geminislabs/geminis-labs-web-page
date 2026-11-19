<script>
	/**
	 * Mini ventana estilo Nexus que cuenta la cadena vehículo → evento →
	 * contexto → decisión sobre calles reales de Querétaro. Escenario
	 * ilustrativo (no son datos de una unidad real).
	 */
	import { onMount } from 'svelte';
	import { loadNetwork, routePoint } from './roadNetwork.js';

	let { phase = $bindable(0), reduced = false } = $props();

	const CYCLE = 13000;

	let host = $state(null);
	let canvas = $state(null);

	onMount(() => {
		const ctx = canvas.getContext('2d');
		let W = 0;
		let H = 0;
		let dpr = 1;
		let net = null;
		let raf = 0;
		let alive = true;
		let layer = null;
		let view = null;

		function resize() {
			const r = host.getBoundingClientRect();
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			W = r.width;
			H = r.height;
			canvas.width = Math.round(W * dpr);
			canvas.height = Math.round(H * dpr);
			layer = null;
		}

		function fit() {
			const [x0, y0, x1, y1] = net.route.bbox;
			const pad = 90;
			const s = Math.min(W / (x1 - x0 + pad * 2), (H - 40) / (y1 - y0 + pad * 2));
			view = { s, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
		}

		const toS = (x, y) => [(x - view.cx) * view.s + W / 2, (y - view.cy) * view.s + H / 2 + 14];

		function buildLayer() {
			fit();
			layer = document.createElement('canvas');
			layer.width = canvas.width;
			layer.height = canvas.height;
			const l = layer.getContext('2d');
			l.setTransform(dpr, 0, 0, dpr, 0, 0);
			l.fillStyle = '#0b1726';
			l.fillRect(0, 0, W, H);
			l.save();
			l.translate(W / 2 - view.cx * view.s, H / 2 + 14 - view.cy * view.s);
			l.scale(view.s, view.s);
			l.lineCap = 'round';
			l.lineJoin = 'round';
			const styles = [
				['#3e6f9c', 7],
				['#3e6f9c', 6],
				['#2f5579', 4.5],
				['#22405c', 3.2],
				['#1a3249', 2.4]
			];
			for (let c = 4; c >= 0; c--) {
				l.strokeStyle = styles[c][0];
				l.lineWidth = styles[c][1] / view.s;
				l.stroke(net.paths[c]);
			}
			l.restore();
		}

		function frame(now) {
			raf = requestAnimationFrame(frame);
			if (!net) return;
			if (!layer) buildLayer();
			const t = reduced ? CYCLE * 0.9 : now % CYCLE;
			const p = t / CYCLE;
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.drawImage(layer, 0, 0);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			const len = net.route.len;
			// Recorrido: avanza hasta 0.72, se detiene ahí (40 min «detenida»).
			const travel = Math.min(p, 0.72) / 0.72;
			const dist = len * 0.08 + travel * len * 0.8;
			const fenceCenter = routePoint(net.route, len * 0.3);
			const exitPt = routePoint(net.route, len * 0.52);
			const [fx, fy] = toS(...fenceCenter);
			const [ex, ey] = toS(...exitPt);
			const fr = Math.hypot(ex - fx, ey - fy);

			// Geocerca.
			const outside = dist > len * 0.52;
			ctx.fillStyle = outside ? 'rgba(217,145,77,0.12)' : 'rgba(0,255,136,0.12)';
			ctx.strokeStyle = outside ? 'rgba(217,145,77,0.8)' : 'rgba(0,255,136,0.75)';
			ctx.setLineDash([6, 5]);
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.arc(fx, fy, fr, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.font = '600 12px Outfit, system-ui, sans-serif';
			ctx.fillStyle = 'rgba(234,243,252,0.8)';
			ctx.textAlign = 'center';
			ctx.fillText('Geocerca · Cliente', fx, fy - fr - 8);

			// Ruta recorrida.
			ctx.lineCap = 'round';
			ctx.strokeStyle = 'rgba(0,255,136,0.9)';
			ctx.lineWidth = 3.5;
			ctx.shadowColor = 'rgba(0,255,136,0.7)';
			ctx.shadowBlur = 10;
			ctx.beginPath();
			for (let d = len * 0.08; d <= dist; d += 6) {
				const [x, y] = toS(...routePoint(net.route, d));
				if (d === len * 0.08) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
			ctx.shadowBlur = 0;

			// Unidad.
			const [vx, vy] = toS(...routePoint(net.route, dist));
			const [bx, by] = toS(...routePoint(net.route, Math.max(0, dist - 8)));
			const ang = Math.atan2(vy - by, vx - bx);
			ctx.save();
			ctx.translate(vx, vy);
			ctx.rotate(ang);
			ctx.fillStyle = '#eafff4';
			ctx.shadowColor = 'rgba(0,255,136,0.9)';
			ctx.shadowBlur = 16;
			ctx.beginPath();
			ctx.moveTo(11, 0);
			ctx.lineTo(-8, -7);
			ctx.lineTo(-4, 0);
			ctx.lineTo(-8, 7);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
			ctx.shadowBlur = 0;

			let ph = 0;
			// Evento al salir de la geocerca.
			if (outside) {
				ph = 1;
				const k = ((now % 1400) / 1400) * (reduced ? 0 : 1);
				ctx.strokeStyle = `rgba(217,145,77,${1 - k})`;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(ex, ey, 6 + k * 26, 0, Math.PI * 2);
				ctx.stroke();
				ctx.fillStyle = '#d9914d';
				ctx.beginPath();
				ctx.arc(ex, ey, 5, 0, Math.PI * 2);
				ctx.fill();
			}
			const toast = (x, y, title, sub, color) => {
				ctx.save();
				ctx.font = '600 13px Outfit, system-ui, sans-serif';
				const w = Math.max(ctx.measureText(title).width, ctx.measureText(sub).width) + 28;
				const bx2 = Math.min(Math.max(10, x - w / 2), W - w - 10);
				ctx.fillStyle = 'rgba(8,16,28,0.92)';
				ctx.strokeStyle = color;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.roundRect(bx2, y, w, 46, 10);
				ctx.fill();
				ctx.stroke();
				ctx.textAlign = 'left';
				ctx.fillStyle = '#eaf3fc';
				ctx.fillText(title, bx2 + 14, y + 19);
				ctx.font = '400 12px Outfit, system-ui, sans-serif';
				ctx.fillStyle = color;
				ctx.fillText(sub, bx2 + 14, y + 36);
				ctx.restore();
			};
			if (p > 0.45 && outside)
				toast(ex, ey + 18, 'Salió de la geocerca', 'Unidad 14 · 15:02', '#d9914d');
			if (p > 0.8) {
				ph = 2;
				toast(vx, vy - 70, 'Detenida fuera de ruta', '15:40 · 40 min sin moverse', '#ffb35c');
			}
			if (p > 0.9) ph = 3;
			if (ph !== phase) phase = ph;

			// Barra de la ventana.
			ctx.fillStyle = 'rgba(6,12,22,0.95)';
			ctx.fillRect(0, 0, W, 30);
			for (const [i, c] of ['#ff5f57', '#febc2e', '#28c840'].entries()) {
				ctx.fillStyle = c;
				ctx.beginPath();
				ctx.arc(16 + i * 16, 15, 5, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.font = '600 12px Outfit, system-ui, sans-serif';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#94b5d0';
			ctx.fillText('Nexus · Seguimiento · escenario ilustrativo', W / 2, 19);
		}

		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(host);
		loadNetwork()
			.then((n) => {
				if (alive) net = n;
			})
			.catch(() => {});
		raf = requestAnimationFrame(frame);
		return () => {
			alive = false;
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	});
</script>

<div class="sketch" bind:this={host}>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
	.sketch {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 18px;
		overflow: hidden;
		box-shadow:
			0 0 0 1px rgba(0, 255, 136, 0.28),
			0 30px 80px rgba(0, 0, 0, 0.55),
			0 0 80px rgba(0, 255, 136, 0.12);
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
