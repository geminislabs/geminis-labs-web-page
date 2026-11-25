<script>
	/**
	 * Mini ventana estilo Nexus que cuenta la cadena vehículo → evento →
	 * contexto → decisión sobre calles reales de Querétaro. Escenario
	 * ilustrativo (no son datos de una unidad real).
	 */
	import { onMount } from 'svelte';
	import {
		loadNetwork,
		loadH3,
		hexZone,
		routePoint,
		pointAt,
		endpointKey
	} from '$lib/components/experiencia/roadNetwork.js';

	let { phase = $bindable(0), reduced = false, fullbleed = false } = $props();

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
		let traffic = [];
		let h3cells = null;
		let zone = null;
		let lastNow = 0;

		/** Tráfico ilustrativo: estelas de luz sobre las vías que se ven en pantalla. */
		function spawnCar(car = {}) {
			const { roads, network } = net;
			let pick = network[Math.floor(Math.random() * network.length)];
			for (let k = 0; k < 40; k++) {
				const cand = network[Math.floor(Math.random() * network.length)];
				const [mx, my] = pointAt(roads[cand], roads[cand].len / 2);
				const [sx, sy] = toS(mx, my);
				if (sx > W * 0.2 && sx < W * 1.05 && sy > -40 && sy < H + 40) {
					pick = cand;
					break;
				}
			}
			car.i = pick;
			car.dir = Math.random() < 0.5 ? 1 : -1;
			car.s = Math.random() * roads[pick].len * 0.6;
			car.v = 60 + Math.random() * 70;
			car.trail = [];
			return car;
		}

		function stepCars(dt) {
			const { roads, adjacency } = net;
			ctx.save();
			ctx.globalCompositeOperation = 'lighter';
			ctx.lineCap = 'round';
			for (const c of traffic) {
				const road = roads[c.i];
				c.s += c.v * dt;
				if (c.s >= road.len) {
					const opts = (adjacency.get(endpointKey(road, c.dir > 0 ? 1 : 0)) || []).filter(
						(o) => o.i !== c.i
					);
					if (!opts.length) {
						spawnCar(c);
						continue;
					}
					const nx = opts[Math.floor(Math.random() * opts.length)];
					c.s -= road.len;
					c.i = nx.i;
					c.dir = nx.end === 0 ? 1 : -1;
				}
				const r2 = roads[c.i];
				c.trail.push(toS(...pointAt(r2, c.dir > 0 ? c.s : r2.len - c.s)));
				if (c.trail.length > 26) c.trail.shift();
				const n = c.trail.length;
				for (let k = 1; k < n; k++) {
					const f = k / n;
					ctx.strokeStyle = `rgba(110,200,255,${(f * f * 0.85).toFixed(3)})`;
					ctx.lineWidth = 1 + 2.4 * f;
					ctx.beginPath();
					ctx.moveTo(c.trail[k - 1][0], c.trail[k - 1][1]);
					ctx.lineTo(c.trail[k][0], c.trail[k][1]);
					ctx.stroke();
				}
				if (n) {
					const [hx, hy] = c.trail[n - 1];
					const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 9);
					g.addColorStop(0, 'rgba(235,248,255,0.95)');
					g.addColorStop(1, 'rgba(110,200,255,0)');
					ctx.fillStyle = g;
					ctx.beginPath();
					ctx.arc(hx, hy, 9, 0, Math.PI * 2);
					ctx.fill();
				}
			}
			ctx.restore();
		}

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
			const pad = fullbleed ? 55 : 90;
			// A pantalla completa la ruta vive a la derecha; el panel va a la izquierda.
			const availW = fullbleed ? W * 0.44 : W;
			const availH = fullbleed ? H * 0.7 : H - 40;
			const s = Math.min(availW / (x1 - x0 + pad * 2), availH / (y1 - y0 + pad * 2));
			view = {
				s,
				cx: (x0 + x1) / 2,
				cy: (y0 + y1) / 2,
				ox: fullbleed ? W * 0.74 : W / 2,
				oy: fullbleed ? H * 0.52 : H / 2 + 14
			};
		}

		const toS = (x, y) => [(x - view.cx) * view.s + view.ox, (y - view.cy) * view.s + view.oy];

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
			l.translate(view.ox - view.cx * view.s, view.oy - view.cy * view.s);
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
			const dt = Math.min(0.05, lastNow ? (now - lastNow) / 1000 : 0.016);
			lastNow = now;
			if (fullbleed && !reduced) {
				while (traffic.length < 34) traffic.push(spawnCar());
				stepCars(dt);
			}

			const len = net.route.len;
			// Recorrido: avanza hasta 0.72, se detiene ahí (40 min «detenida»).
			const travel = Math.min(p, 0.72) / 0.72;
			const dist = len * 0.08 + travel * len * 0.8;
			const fenceCenter = routePoint(net.route, len * 0.3);
			const exitPt = routePoint(net.route, len * 0.52);
			const [fx, fy] = toS(...fenceCenter);
			const [ex, ey] = toS(...exitPt);
			const fr = Math.hypot(ex - fx, ey - fy);

			// Geocerca hecha de celdas H3 r9 reales, como en la app.
			const outside = dist > len * 0.52;
			if (h3cells && !zone)
				zone = hexZone(h3cells, fenceCenter[0], fenceCenter[1], (fr / view.s) * 0.98);
			let labelY = fy - fr - 8;
			if (h3cells) {
				ctx.lineJoin = 'round';
				// Malla r9 tenue alrededor de la ruta.
				ctx.strokeStyle = 'rgba(110,200,255,0.08)';
				ctx.lineWidth = 1;
				for (const c of h3cells) {
					ctx.beginPath();
					for (let k = 0; k < c.b.length; k += 2) {
						const [x, y] = toS(c.b[k], c.b[k + 1]);
						if (k) ctx.lineTo(x, y);
						else ctx.moveTo(x, y);
					}
					ctx.closePath();
					ctx.stroke();
				}
				const rgb = outside ? '217,145,77' : '0,255,136';
				for (const c of zone.inside) {
					ctx.beginPath();
					for (let k = 0; k < c.b.length; k += 2) {
						const [x, y] = toS(c.b[k], c.b[k + 1]);
						if (k) ctx.lineTo(x, y);
						else ctx.moveTo(x, y);
					}
					ctx.closePath();
					ctx.fillStyle = `rgba(${rgb},0.13)`;
					ctx.fill();
					ctx.strokeStyle = `rgba(${rgb},0.28)`;
					ctx.stroke();
				}
				ctx.strokeStyle = `rgba(${rgb},0.95)`;
				ctx.lineWidth = 2;
				ctx.beginPath();
				for (const [a, b] of zone.edges) {
					const [x0, y0] = toS(a[0], a[1]);
					const [x1, y1] = toS(b[0], b[1]);
					ctx.moveTo(x0, y0);
					ctx.lineTo(x1, y1);
					labelY = Math.min(labelY, y0 - 10, y1 - 10);
				}
				ctx.stroke();
			}
			ctx.font = '600 12px Outfit, system-ui, sans-serif';
			ctx.fillStyle = 'rgba(234,243,252,0.85)';
			ctx.textAlign = 'center';
			ctx.fillText('Geocerca · Cliente · celdas H3', fx, labelY);

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

			if (fullbleed) return;
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
		loadH3()
			.then((d) => {
				if (alive) h3cells = d.r9route;
			})
			.catch(() => {});
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

<div class="sketch" class:fullbleed bind:this={host}>
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
	.sketch.fullbleed {
		border-radius: 0;
		box-shadow: none;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
