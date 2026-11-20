<script>
	/**
	 * Escenario del hero dibujado en tiempo real (no es una foto): globo de
	 * puntos con los continentes de Natural Earth, reflectores que barren,
	 * anillos orbitales, arcos de datos que salen de Querétaro y polvo en la luz.
	 * Nítido a cualquier resolución.
	 */
	import { onMount } from 'svelte';

	let { reduced = false, lite = false, intro = false, radius = 28 } = $props();

	const LAND_URL = '/img/products/nexus/experiencia/globo-tierra.json';
	const QRO = [20.59, -100.39];
	const DEST = [
		[25.67, -100.31],
		[34.05, -118.24],
		[41.88, -87.63],
		[40.42, -3.7],
		[4.71, -74.07],
		[-23.55, -46.63],
		[19.43, -99.13]
	];
	const DEG = Math.PI / 180;
	const TILT = 16 * DEG;

	let host = $state(null);
	let canvas = $state(null);

	onMount(() => {
		const ctx = canvas.getContext('2d');
		let W = 0;
		let H = 0;
		let dpr = 1;
		let land = null;
		let raf = 0;
		let alive = true;
		const dust = Array.from({ length: lite ? 30 : 70 }, () => ({
			x: Math.random(),
			y: Math.random(),
			s: 0.4 + Math.random() * 1.4,
			v: 0.004 + Math.random() * 0.012,
			p: Math.random() * Math.PI * 2
		}));
		const hud = Array.from({ length: 22 }, () => 0.2 + Math.random() * 0.8);

		function resize() {
			const rect = host.getBoundingClientRect();
			dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 2);
			W = rect.width;
			H = rect.height;
			canvas.width = Math.round(W * dpr);
			canvas.height = Math.round(H * dpr);
		}

		/** lat/lon → coordenadas de pantalla y profundidad (z > 0 = cara visible). */
		function project(lat, lon, rot, cx, cy, R, alt = 1) {
			const la = lat * DEG;
			const lo = lon * DEG - rot;
			const x = Math.cos(la) * Math.sin(lo);
			const y = Math.sin(la);
			const z = Math.cos(la) * Math.cos(lo);
			const y2 = y * Math.cos(TILT) - z * Math.sin(TILT);
			const z2 = y * Math.sin(TILT) + z * Math.cos(TILT);
			return [cx + x * R * alt, cy - y2 * R * alt, z2];
		}

		function slerp(a, b, s) {
			const toV = ([lat, lon]) => [
				Math.cos(lat * DEG) * Math.cos(lon * DEG),
				Math.cos(lat * DEG) * Math.sin(lon * DEG),
				Math.sin(lat * DEG)
			];
			const va = toV(a);
			const vb = toV(b);
			const dot = Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]);
			const om = Math.acos(dot) || 1e-6;
			const k1 = Math.sin((1 - s) * om) / Math.sin(om);
			const k2 = Math.sin(s * om) / Math.sin(om);
			const v = [k1 * va[0] + k2 * vb[0], k1 * va[1] + k2 * vb[1], k1 * va[2] + k2 * vb[2]];
			return [Math.asin(v[2]) / DEG, Math.atan2(v[1], v[0]) / DEG];
		}

		function drawSpot(x0, ang, len, spread, alpha) {
			for (const [k, a] of [
				[1, 0.05],
				[0.6, 0.07],
				[0.3, 0.1]
			]) {
				const w = spread * k;
				const x1 = x0 + Math.sin(ang) * len;
				const y1 = Math.cos(ang) * len;
				const nx = Math.cos(ang) * w;
				const ny = -Math.sin(ang) * w;
				const g = ctx.createLinearGradient(x0, 0, x1, y1);
				g.addColorStop(0, `rgba(210,240,255,${a * alpha * 3})`);
				g.addColorStop(0.5, `rgba(150,215,255,${a * alpha})`);
				g.addColorStop(1, 'rgba(120,200,255,0)');
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.moveTo(x0 - 3, 0);
				ctx.lineTo(x1 - nx, y1 - ny);
				ctx.lineTo(x1 + nx, y1 + ny);
				ctx.lineTo(x0 + 3, 0);
				ctx.closePath();
				ctx.fill();
			}
			const glare = ctx.createRadialGradient(x0, 4, 0, x0, 4, 40);
			glare.addColorStop(0, `rgba(255,255,255,${0.95 * alpha})`);
			glare.addColorStop(0.25, `rgba(190,235,255,${0.5 * alpha})`);
			glare.addColorStop(1, 'rgba(190,235,255,0)');
			ctx.fillStyle = glare;
			ctx.beginPath();
			ctx.arc(x0, 4, 40, 0, Math.PI * 2);
			ctx.fill();
		}

		function drawHud(x, y, w, h, t, flip) {
			ctx.save();
			ctx.globalAlpha = 0.55;
			ctx.strokeStyle = 'rgba(120,220,255,0.35)';
			ctx.lineWidth = 1;
			ctx.strokeRect(x, y, w, h);
			const rows = 11;
			for (let i = 0; i < rows; i++) {
				const k = hud[(i + Math.floor(t / 900)) % hud.length];
				const bw = (w - 20) * k;
				ctx.fillStyle = i % 4 === 0 ? 'rgba(0,255,170,0.55)' : 'rgba(140,215,255,0.35)';
				ctx.fillRect(flip ? x + w - 10 - bw : x + 10, y + 12 + i * ((h - 24) / rows), bw, 2);
			}
			ctx.restore();
		}

		function drawGlobe(now) {
			const t = reduced ? 8000 : now;
			const s = t / 1000;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			// Fondo: muro azul profundo con resplandor detrás del globo.
			const bg = ctx.createLinearGradient(0, 0, 0, H);
			bg.addColorStop(0, '#050d1c');
			bg.addColorStop(0.55, '#0a2340');
			bg.addColorStop(1, '#040912');
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, W, H);

			const cx = W / 2;
			const cy = H * 0.53;
			const R = Math.min(W * 0.26, H * 0.36);

			const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.2);
			halo.addColorStop(0, 'rgba(40,170,220,0.32)');
			halo.addColorStop(0.5, 'rgba(20,90,150,0.12)');
			halo.addColorStop(1, 'rgba(10,40,80,0)');
			ctx.fillStyle = halo;
			ctx.fillRect(0, 0, W, H);

			// Retícula del muro.
			ctx.fillStyle = 'rgba(120,200,255,0.07)';
			for (let gx = 12; gx < W; gx += 22) {
				for (let gy = 12; gy < H * 0.9; gy += 22) ctx.fillRect(gx, gy, 1.2, 1.2);
			}

			// Paneles HUD laterales.
			drawHud(W * 0.05, H * 0.36, W * 0.16, H * 0.3, t, false);
			drawHud(W * 0.79, H * 0.36, W * 0.16, H * 0.3, t + 400, true);
			ctx.font = '600 11px ui-monospace, Menlo, monospace';
			ctx.fillStyle = 'rgba(140,215,255,0.6)';
			ctx.textAlign = 'left';
			ctx.fillText('SEÑALES · EVENTOS · CONTEXTO', W * 0.05, H * 0.34);
			ctx.textAlign = 'right';
			ctx.fillText('QRO 20.59 N · 100.39 O', W * 0.95, H * 0.34);

			// Reflectores (aditivos).
			ctx.globalCompositeOperation = 'lighter';
			const spots = [0.1, 0.27, 0.42, 0.58, 0.73, 0.9];
			spots.forEach((fx, i) => {
				const base = (fx - 0.5) * -0.9;
				const ang = base + Math.sin(s * 0.35 + i * 1.3) * 0.16;
				drawSpot(W * fx, ang, H * 1.15, H * 0.2, i % 2 ? 0.8 : 1);
			});

			// Polvo flotando en la luz.
			for (const d of dust) {
				if (!reduced) d.y -= d.v * 0.016;
				if (d.y < 0) d.y = 1;
				const tw = 0.4 + 0.6 * Math.abs(Math.sin(s * 0.8 + d.p));
				ctx.fillStyle = `rgba(220,245,255,${0.35 * tw})`;
				ctx.fillRect(d.x * W, d.y * H, d.s, d.s);
			}
			ctx.globalCompositeOperation = 'source-over';

			// Anillo orbital trasero.
			const rot = -1.62 + Math.sin(s * 0.07) * 0.75;
			const ringTilt = -0.28;
			const ring = (front, r1, r2, phase) => {
				ctx.save();
				ctx.translate(cx, cy);
				ctx.rotate(ringTilt);
				ctx.strokeStyle = `rgba(120,220,255,${front ? 0.45 : 0.16})`;
				ctx.lineWidth = 1;
				ctx.setLineDash([2, 6]);
				ctx.beginPath();
				ctx.ellipse(0, 0, R * r1, R * r2, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
				ctx.stroke();
				ctx.setLineDash([]);
				const a = s * 0.5 + phase;
				const sa = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
				if (front === sa < Math.PI) {
					const px = Math.cos(a) * R * r1;
					const py = Math.sin(a) * R * r2;
					const g = ctx.createRadialGradient(px, py, 0, px, py, 10);
					g.addColorStop(0, 'rgba(255,255,255,1)');
					g.addColorStop(0.3, 'rgba(0,255,170,0.7)');
					g.addColorStop(1, 'rgba(0,255,170,0)');
					ctx.fillStyle = g;
					ctx.beginPath();
					ctx.arc(px, py, 10, 0, Math.PI * 2);
					ctx.fill();
				}
				ctx.restore();
			};
			ring(false, 1.42, 0.34, 0);
			ring(false, 1.62, 0.42, 2.4);

			// Esfera: sombreado y atmósfera.
			const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
			body.addColorStop(0, 'rgba(40,120,170,0.55)');
			body.addColorStop(0.7, 'rgba(10,45,85,0.75)');
			body.addColorStop(1, 'rgba(6,20,40,0.9)');
			ctx.fillStyle = body;
			ctx.beginPath();
			ctx.arc(cx, cy, R, 0, Math.PI * 2);
			ctx.fill();

			// Paralelos y meridianos.
			ctx.lineWidth = 0.8;
			const line = (pts) => {
				let open = false;
				ctx.beginPath();
				for (const [x, y, z] of pts) {
					if (z > 0) {
						if (!open) ctx.moveTo(x, y);
						else ctx.lineTo(x, y);
						open = true;
					} else open = false;
				}
				ctx.stroke();
			};
			ctx.strokeStyle = 'rgba(140,220,255,0.16)';
			for (let lat = -60; lat <= 60; lat += 30) {
				const pts = [];
				for (let lon = -180; lon <= 180; lon += 6) pts.push(project(lat, lon, rot, cx, cy, R));
				line(pts);
			}
			for (let lon = -180; lon < 180; lon += 30) {
				const pts = [];
				for (let lat = -88; lat <= 88; lat += 6) pts.push(project(lat, lon, rot, cx, cy, R));
				line(pts);
			}

			// Continentes de puntos.
			if (land) {
				for (let i = 0; i < land.length; i += 2) {
					const [x, y, z] = project(land[i], land[i + 1], rot, cx, cy, R);
					if (z < -0.05) continue;
					const a = 0.25 + 0.75 * z;
					const size = 1.1 + 1.3 * z;
					ctx.fillStyle = `rgba(${170 + 60 * z},${235 + 20 * z},255,${a})`;
					ctx.fillRect(x - size / 2, y - size / 2, size, size);
				}
			}

			const rim = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.18);
			rim.addColorStop(0, 'rgba(80,220,255,0)');
			rim.addColorStop(0.45, 'rgba(80,220,255,0.38)');
			rim.addColorStop(1, 'rgba(80,220,255,0)');
			ctx.fillStyle = rim;
			ctx.beginPath();
			ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
			ctx.fill();

			// Arcos de datos desde Querétaro con pulsos.
			ctx.globalCompositeOperation = 'lighter';
			DEST.forEach((dst, i) => {
				const pts = [];
				for (let k = 0; k <= 40; k++) {
					const sk = k / 40;
					const [lat, lon] = slerp(QRO, dst, sk);
					pts.push(project(lat, lon, rot, cx, cy, R, 1 + 0.22 * Math.sin(Math.PI * sk)));
				}
				ctx.strokeStyle = 'rgba(0,255,170,0.28)';
				ctx.lineWidth = 1.2;
				line(pts);
				const head = ((s * 0.35 + i * 0.37) % 1.4) / 1.4;
				const hi = Math.floor(head * 40);
				for (let k = Math.max(0, hi - 8); k <= hi; k++) {
					const [x, y, z] = pts[k];
					if (z <= 0) continue;
					const f = 1 - (hi - k) / 8;
					ctx.fillStyle = `rgba(160,255,215,${0.9 * f})`;
					ctx.beginPath();
					ctx.arc(x, y, 1 + 2.2 * f, 0, Math.PI * 2);
					ctx.fill();
				}
			});

			// Querétaro.
			const [qx, qy, qz] = project(QRO[0], QRO[1], rot, cx, cy, R);
			if (qz > 0) {
				const pulse = (s % 2) / 2;
				ctx.strokeStyle = `rgba(0,255,136,${(1 - pulse) * qz})`;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(qx, qy, 4 + pulse * 22, 0, Math.PI * 2);
				ctx.stroke();
				ctx.fillStyle = '#eafff4';
				ctx.beginPath();
				ctx.arc(qx, qy, 3.5, 0, Math.PI * 2);
				ctx.fill();
				ctx.globalCompositeOperation = 'source-over';
				ctx.font = '600 12px Outfit, system-ui, sans-serif';
				ctx.textAlign = 'left';
				ctx.fillStyle = `rgba(200,255,230,${qz})`;
				ctx.fillText('QUERÉTARO', qx + 12, qy - 8);
			}
			ctx.globalCompositeOperation = 'source-over';

			// Anillos delanteros.
			ring(true, 1.42, 0.34, 0);
			ring(true, 1.62, 0.42, 2.4);

			// Piso con reflejo.
			const floor = ctx.createLinearGradient(0, H * 0.82, 0, H);
			floor.addColorStop(0, 'rgba(4,9,18,0)');
			floor.addColorStop(1, 'rgba(4,9,18,0.95)');
			ctx.fillStyle = floor;
			ctx.fillRect(0, H * 0.82, W, H * 0.18);
			const refl = ctx.createRadialGradient(cx, H * 0.97, 0, cx, H * 0.97, R * 1.6);
			refl.addColorStop(0, 'rgba(60,200,255,0.25)');
			refl.addColorStop(1, 'rgba(60,200,255,0)');
			ctx.fillStyle = refl;
			ctx.fillRect(0, H * 0.8, W, H * 0.2);
		}

		// ── Intro estilo estudio de cine ──────────────────────────────────
		const logo = new Image();
		logo.src = '/img/geminislabs-nobg.webp';
		const video = document.createElement('video');
		video.src = '/vid/nexus-animation.mp4';
		video.muted = true;
		video.playsInline = true;
		video.preload = 'auto';
		let videoStarted = false;
		const stars = Array.from({ length: 140 }, () => [
			Math.random(),
			Math.random() * 0.8,
			Math.random()
		]);
		const INTRO_END = 10.4;
		let t0 = 0;
		document.fonts?.load('400 80px "Dune Rise"').catch(() => {});

		const fade = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));

		function extruded(text, font, cx, cy, size, depth, face) {
			ctx.font = font;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			for (let d = depth; d > 0; d--) {
				const k = d / depth;
				ctx.fillStyle = `rgb(${8 + 20 * (1 - k)},${30 + 60 * (1 - k)},${24 + 40 * (1 - k)})`;
				ctx.fillText(text, cx, cy + d * size * 0.011);
			}
			const g = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
			face.forEach(([o, c]) => g.addColorStop(o, c));
			ctx.fillStyle = g;
			ctx.shadowColor = 'rgba(120,255,190,0.55)';
			ctx.shadowBlur = size * 0.25;
			ctx.fillText(text, cx, cy);
			ctx.shadowBlur = 0;
		}

		function drawIntro(el, alpha) {
			ctx.save();
			ctx.globalAlpha = alpha;
			const bg = ctx.createRadialGradient(W / 2, H * 1.1, 0, W / 2, H * 1.1, W * 0.75);
			bg.addColorStop(0, '#0d3a5c');
			bg.addColorStop(0.5, '#061a2e');
			bg.addColorStop(1, '#010409');
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, W, H);
			for (const [x, y, b] of stars) {
				ctx.fillStyle = `rgba(220,240,255,${0.25 + 0.5 * b * (0.6 + 0.4 * Math.sin(el * 2 + b * 9))})`;
				ctx.fillRect(x * W, y * H, 1.3, 1.3);
			}
			// Reflectores desde abajo, barriendo el cielo.
			ctx.globalCompositeOperation = 'lighter';
			[0.14, 0.32, 0.5, 0.68, 0.86].forEach((fx, i) => {
				const x0 = W * fx;
				const ang = (fx - 0.5) * 0.9 + Math.sin(el * 0.8 + i * 1.7) * 0.32;
				const len = H * 1.6;
				const x1 = x0 + Math.sin(ang) * len;
				const y1 = H - Math.cos(ang) * len;
				const w = H * 0.16;
				const g = ctx.createLinearGradient(x0, H, x1, y1);
				g.addColorStop(0, 'rgba(200,235,255,0.35)');
				g.addColorStop(0.6, 'rgba(140,210,255,0.08)');
				g.addColorStop(1, 'rgba(140,210,255,0)');
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.moveTo(x0 - 4, H);
				ctx.lineTo(x1 - Math.cos(ang) * w, y1 - Math.sin(ang) * w);
				ctx.lineTo(x1 + Math.cos(ang) * w, y1 + Math.sin(ang) * w);
				ctx.lineTo(x0 + 4, H);
				ctx.closePath();
				ctx.fill();
			});
			ctx.globalCompositeOperation = 'source-over';

			// Acto 1: GEMINIS LABS presenta.
			const a1 = fade(el, 0.6, 1.6) * (1 - fade(el, 4.6, 5.3));
			if (a1 > 0) {
				ctx.save();
				ctx.globalAlpha = alpha * a1;
				const push = 1 + fade(el, 0.6, 5.3) * 0.06;
				ctx.translate(W / 2, H * 0.5);
				ctx.scale(push, push);
				ctx.translate(-W / 2, -H * 0.5);
				const size = Math.min(H * 0.2, W * 0.075);
				if (logo.complete && logo.naturalWidth) {
					// Solo el logo, grande, con un halo que respira.
					const ls = H * 0.5;
					const glow = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, ls);
					glow.addColorStop(0, `rgba(62,193,40,${0.35 + 0.1 * Math.sin(el * 2)})`);
					glow.addColorStop(1, 'rgba(62,193,40,0)');
					ctx.fillStyle = glow;
					ctx.fillRect(0, 0, W, H);
					ctx.shadowColor = 'rgba(120,255,170,0.7)';
					ctx.shadowBlur = ls * 0.2;
					ctx.drawImage(logo, W / 2 - ls / 2, H * 0.4 - ls / 2, ls, ls);
					ctx.shadowBlur = 0;
				}
				const a2 = fade(el, 2.0, 2.9);
				ctx.globalAlpha = alpha * a1 * a2;
				ctx.font = `italic 300 ${size * 0.5}px Outfit, system-ui, sans-serif`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = '#dff3ff';
				ctx.letterSpacing = '8px';
				ctx.fillText('presenta', W / 2, H * 0.82);
				ctx.restore();
			}

			// Acto 2: el logo 3D de Nexus.
			if (el >= 5 && !videoStarted) {
				videoStarted = true;
				video.currentTime = 0;
				video.play().catch(() => {});
			}
			const a3 = fade(el, 5.1, 5.8);
			if (a3 > 0) {
				ctx.save();
				ctx.globalAlpha = alpha * a3;
				if (video.readyState >= 2) {
					const vs = H * 0.78;
					ctx.globalCompositeOperation = 'screen';
					ctx.drawImage(video, W / 2 - vs / 2, H * 0.02, vs, vs);
					ctx.globalCompositeOperation = 'source-over';
				}
				const a4 = fade(el, 7.2, 8.0);
				ctx.globalAlpha = alpha * a3 * a4;
				const size = Math.min(H * 0.15, W * 0.06);
				extruded('NEXUS', `400 ${size}px Audiowide, sans-serif`, W / 2, H * 0.86, size, 10, [
					[0, '#ffffff'],
					[1, '#9fb4c8']
				]);
				ctx.restore();
			}
			ctx.restore();
		}

		function frame(now) {
			raf = requestAnimationFrame(frame);
			if (!t0) t0 = now;
			const el = (now - t0) / 1000;
			const playIntro = intro && !reduced && el < INTRO_END;
			// La escala de la pantalla (Retina = 2×) aplica a la intro y al globo.
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			if (playIntro && el <= 9.2) ctx.clearRect(0, 0, W, H);
			if (!playIntro || el > 9.2) drawGlobe(now);
			if (playIntro) drawIntro(el, 1 - fade(el, 9.2, INTRO_END));
		}

		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(host);
		fetch(LAND_URL)
			.then((r) => r.json())
			.then((d) => {
				if (alive) land = d.p;
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

<div class="stage" bind:this={host} style="--stage-radius:{radius}px">
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
	.stage {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: var(--stage-radius, 28px);
		overflow: hidden;
		box-shadow:
			0 0 0 1px rgba(120, 220, 255, 0.22),
			0 30px 90px rgba(0, 0, 0, 0.55),
			0 0 120px rgba(40, 170, 220, 0.18);
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
