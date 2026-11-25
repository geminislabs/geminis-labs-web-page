<script>
	/**
	 * Lienzo persistente de la experiencia: red vial real de Querétaro
	 * (OpenStreetMap), revelado binario 0/1, cometas sobre las vías y una
	 * cámara virtual que se mueve entre escenas. Todo lo que dibuja es
	 * ilustrativo: no representa vehículos ni datos de Nexus.
	 */
	import { onMount } from 'svelte';
	import { prepareNetwork, pointAt, endpointKey, routePoint, bucketCells } from './roadNetwork.js';

	/** contained: ocupa su contenedor (no la ventana) y se pausa fuera de pantalla. */
	let { sceneId = 'hero', beat = 0, reduced = false, lite = false, contained = false } = $props();
	let onScreen = true;

	const ROADS_URL = '/img/products/nexus/experiencia/queretaro-vias.json';
	const OVERVIEW = { x: 1040, y: 1040, zoom: 1.12 };
	const ORIGIN = { fx: 0.42, fy: 0.5 }; // mismo punto que el faro de la escena 01

	const CLASS_STYLE = [
		{ w: 2.4, color: '62,193,40', a: 0.75 },
		{ w: 2.0, color: '62,193,40', a: 0.65 },
		{ w: 1.4, color: '148,181,208', a: 0.7 },
		{ w: 1.0, color: '94,140,175', a: 0.6 },
		{ w: 0.7, color: '70,105,135', a: 0.6 }
	];

	/** Escena 01: la ciudad de noche, en tonos cálidos y en perspectiva. */
	const WARM_STYLE = [
		{ w: 2.6, color: '255,176,92', a: 0.7 },
		{ w: 2.2, color: '255,176,92', a: 0.65 },
		{ w: 1.5, color: '230,140,70', a: 0.45 },
		{ w: 1.0, color: '190,110,60', a: 0.4 },
		{ w: 0.7, color: '150,85,50', a: 0.4 }
	];
	const NIGHT_VIEW = { x: 1060, y: 1180, zoom: 1.55 };

	/** Opacidad del mapa por escena. */
	const MAP_ALPHA = { pregunta: 1, queretaro: 1, peticion: 0.5, h3: 0.5 };
	const H3_URL = '/img/products/nexus/experiencia/queretaro-h3.json';
	let hex = null; // { r8, drill, bucket }
	let hexGlow = null;
	let drillStart = -1;
	const DRILL_STEP = 1700;
	const INDUSTRY_URL = '/img/products/nexus/experiencia/queretaro-industria.json';
	let industry = null;

	let canvas = $state(null);

	// Estado interno del render (no reactivo a propósito).
	let ctx;
	let W = 0;
	let H = 0;
	let dpr = 1;
	let world = null;
	let roadsLayer;
	let roadsCtx;
	let layerDirty = true;
	let densityGrid = null;
	let gridCols = 0;
	let gridRows = 0;
	const cam = { x: OVERVIEW.x, y: OVERVIEW.y, zoom: OVERVIEW.zoom };
	const camTarget = { ...cam };
	let mapAlpha = 0;
	let revealStart = -1;
	let revealed = false;
	let routeStart = -1;
	let comets = [];
	let flicker = [];
	let lastFlicker = 0;
	let raf = 0;
	let lastT = 0;
	let prevScene = '';
	let sceneT0 = 0;
	let warmLayer = false;

	const isWarm = () => sceneId === 'pregunta';

	const cellSize = () => (lite ? 18 : 14);

	function baseScale() {
		if (!world) return 1;
		return Math.max(W / world.w, H / world.h);
	}

	function toScreen(px, py) {
		const s = baseScale() * cam.zoom;
		return [(px - cam.x) * s + W / 2, (py - cam.y) * s + H / 2];
	}

	// ── Cometas ──────────────────────────────────────────────────────────
	function spawnComet(comet = {}) {
		const { network, roads } = world;
		let i = network[Math.floor(Math.random() * network.length)];
		// En la vista nocturna, que nazcan donde la cámara las ve.
		if (isWarm()) {
			for (let tries = 0; tries < 40; tries++) {
				const cand = network[Math.floor(Math.random() * network.length)];
				const [mx, my] = pointAt(roads[cand], roads[cand].len / 2);
				if (Math.hypot(mx - cam.x, my - (cam.y - 120)) < 420) {
					i = cand;
					break;
				}
			}
		}
		comet.i = i;
		comet.dir = Math.random() < 0.5 ? 1 : -1;
		comet.s = Math.random() * roads[i].len * 0.5;
		comet.speed = isWarm() ? 150 + Math.random() * 130 : 90 + Math.random() * 90;
		comet.trail = [];
		comet.hot = Math.random() < 0.2;
		return comet;
	}

	function cometPos(c) {
		const road = world.roads[c.i];
		return pointAt(road, c.dir > 0 ? c.s : road.len - c.s);
	}

	function stepComet(c, dt) {
		const road = world.roads[c.i];
		c.s += c.speed * dt;
		if (c.s >= road.len) {
			const end = c.dir > 0 ? 1 : 0;
			const options = (world.adjacency.get(endpointKey(road, end)) || []).filter(
				(o) => o.i !== c.i
			);
			if (!options.length || c.trail.length > 600) {
				const keepHot = c.hot;
				spawnComet(c);
				c.hot = keepHot;
				return;
			}
			const next = options[Math.floor(Math.random() * options.length)];
			c.s -= road.len;
			c.i = next.i;
			c.dir = next.end === 0 ? 1 : -1;
		}
		c.trail.push(cometPos(c));
		const maxPoints = Math.ceil((isWarm() ? 340 : 110) / Math.max(1, c.speed * dt));
		if (c.trail.length > maxPoints) c.trail.splice(0, c.trail.length - maxPoints);
	}

	function drawComets(alpha) {
		const s = baseScale() * cam.zoom;
		const warm = isWarm();
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		ctx.lineCap = 'round';
		for (const c of comets) {
			const n = c.trail.length;
			if (n < 2) continue;
			const rgb = warm ? (c.hot ? '255,64,48' : '255,184,92') : c.hot ? '217,145,77' : '0,255,136';
			const pts = c.trail.map((p) => toScreen(p[0], p[1]));
			// Resplandor ancho y núcleo fino, ambos con cola que se desvanece.
			for (const [wk, ak] of [
				[3.4, 0.16],
				[1, 0.9]
			]) {
				for (let k = 1; k < n; k++) {
					const f = k / n;
					ctx.strokeStyle = `rgba(${rgb},${(f * f * ak * alpha).toFixed(3)})`;
					ctx.lineWidth = Math.max(0.8, (warm ? 3.2 : 2.4) * f * wk * Math.min(1.6, s));
					ctx.beginPath();
					ctx.moveTo(pts[k - 1][0], pts[k - 1][1]);
					ctx.lineTo(pts[k][0], pts[k][1]);
					ctx.stroke();
				}
			}
			const [hx, hy] = pts[n - 1];
			const r = warm ? 14 : 10;
			const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
			glow.addColorStop(0, `rgba(255,250,235,${alpha})`);
			glow.addColorStop(0.3, `rgba(${rgb},${0.6 * alpha})`);
			glow.addColorStop(1, `rgba(${rgb},0)`);
			ctx.fillStyle = glow;
			ctx.beginPath();
			ctx.arc(hx, hy, r, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();
	}

	function drawLabels(alpha) {
		if (!world.labels?.length) return;
		ctx.save();
		ctx.font = '600 13px Outfit, system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		for (const l of world.labels) {
			const [x, y] = toScreen(l.x, l.y);
			if (x < -200 || x > W + 200 || y < -100 || y > H + 100) continue;
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate((l.a * Math.PI) / 180);
			ctx.fillStyle = `rgba(255,222,180,${0.8 * alpha})`;
			ctx.shadowColor = 'rgba(0,0,0,0.9)';
			ctx.shadowBlur = 6;
			ctx.fillText(
				l.n.replace(/^(Carretera|Calle|Avenida|Boulevard|Prolongación)\s+/i, '').toUpperCase(),
				0,
				-9
			);
			ctx.restore();
		}
		ctx.restore();
	}

	// ── Capa de vías ─────────────────────────────────────────────────────
	function renderRoadsLayer() {
		const s = baseScale() * cam.zoom;
		roadsCtx.setTransform(1, 0, 0, 1, 0, 0);
		roadsCtx.clearRect(0, 0, roadsLayer.width, roadsLayer.height);
		roadsCtx.setTransform(
			s * dpr,
			0,
			0,
			s * dpr,
			(W / 2 - cam.x * s) * dpr,
			(H / 2 - cam.y * s) * dpr
		);
		roadsCtx.lineCap = 'round';
		roadsCtx.lineJoin = 'round';
		warmLayer = isWarm();
		const styles = warmLayer ? WARM_STYLE : CLASS_STYLE;
		for (let c = styles.length - 1; c >= 0; c--) {
			const st = styles[c];
			roadsCtx.strokeStyle = `rgba(${st.color},${st.a})`;
			roadsCtx.lineWidth = (st.w * Math.min(1.8, Math.max(0.8, cam.zoom * 0.8))) / s;
			roadsCtx.stroke(world.paths[c]);
		}
		layerDirty = false;
	}

	/** Densidad de vías por celda, para que los 0/1 brillen donde hay calles. */
	function computeDensity() {
		const size = cellSize();
		gridCols = Math.ceil(W / size);
		gridRows = Math.ceil(H / size);
		const small = document.createElement('canvas');
		small.width = gridCols;
		small.height = gridRows;
		const sctx = small.getContext('2d', { willReadFrequently: true });
		sctx.drawImage(roadsLayer, 0, 0, gridCols, gridRows);
		const px = sctx.getImageData(0, 0, gridCols, gridRows).data;
		densityGrid = new Float32Array(gridCols * gridRows);
		for (let i = 0; i < densityGrid.length; i++) densityGrid[i] = px[i * 4 + 3] / 255;
	}

	// ── Escena actual → objetivos ────────────────────────────────────────
	function routeCamera() {
		const [x0, y0, x1, y1] = world.route.bbox;
		const base = baseScale();
		const bw = Math.max(40, x1 - x0) * base;
		const bh = Math.max(40, y1 - y0) * base;
		const zoom = Math.max(1.8, Math.min(4.5, Math.min((W * 0.26) / bw, (H * 0.45) / bh)));
		// El texto vive a la izquierda: desplaza la ruta hacia la derecha.
		// En celular el texto va arriba: la ruta se coloca en la mitad inferior.
		if (W < 860) {
			return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 - (H * 0.25) / (base * zoom), zoom };
		}
		const offset = (W * 0.32) / (base * zoom);
		return { x: (x0 + x1) / 2 - offset, y: (y0 + y1) / 2, zoom };
	}

	/** Escena 12: zonas industriales del poniente a la derecha, arriba de las tarjetas. */
	function buyersCamera() {
		const zoom = 1.45;
		const s = baseScale() * zoom;
		return { x: 760 - (W * 0.24) / s, y: 920 + (H * 0.14) / s, zoom };
	}

	/** Escena H3: la ciudad a la derecha; el texto vive a la izquierda. */
	function hexCamera() {
		if (sceneId === 'h3' && beat === 1 && hex && drillStart >= 0) {
			const lvl = Math.min(4, Math.floor((performance.now() - drillStart) / DRILL_STEP));
			return fitCells(hex.drill[Math.max(0, lvl)].cells, 0.5);
		}
		const zoom = 1.15;
		const s = baseScale() * zoom;
		return { x: 1030 - (W * 0.2) / s, y: 1020, zoom };
	}

	function fitCells(cells, frac) {
		let x0 = Infinity;
		let y0 = Infinity;
		let x1 = -Infinity;
		let y1 = -Infinity;
		for (const c of cells) {
			for (let i = 0; i < c.b.length; i += 2) {
				x0 = Math.min(x0, c.b[i]);
				x1 = Math.max(x1, c.b[i]);
				y0 = Math.min(y0, c.b[i + 1]);
				y1 = Math.max(y1, c.b[i + 1]);
			}
		}
		const base = baseScale();
		const narrow = W < 860;
		const zoom = Math.min(
			(W * (narrow ? 0.8 : 0.42)) / ((x1 - x0) * base),
			(H * frac) / ((y1 - y0) * base)
		);
		const s = base * zoom;
		return {
			x: (x0 + x1) / 2 - (narrow ? 0 : (W * 0.2) / s),
			y: (y0 + y1) / 2 - (narrow ? (H * 0.18) / s : 0),
			zoom
		};
	}

	function prepareHex(d) {
		hexGlow = new Float32Array(d.r8.length);
		hex = { ...d, bucket: bucketCells(d.r8, 80) };
	}

	/** Celda r8 que contiene (aprox.) un punto del mapa: la de centro más cercano. */
	function cellAt(x, y) {
		const bx = Math.floor(x / 80);
		const by = Math.floor(y / 80);
		let best = -1;
		let bd = Infinity;
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				for (const i of hex.bucket.get(`${bx + dx},${by + dy}`) || []) {
					const c = hex.r8[i].c;
					const d = (c[0] - x) ** 2 + (c[1] - y) ** 2;
					if (d < bd) {
						bd = d;
						best = i;
					}
				}
			}
		}
		return best;
	}

	function traceCell(b) {
		ctx.beginPath();
		for (let i = 0; i < b.length; i += 2) {
			const [x, y] = toScreen(b[i], b[i + 1]);
			if (i) ctx.lineTo(x, y);
			else ctx.moveTo(x, y);
		}
		ctx.closePath();
	}

	function drawHexGrid(t, alpha) {
		const el = (t - sceneT0) / 1000;
		const [ox, oy] = hex.drill[0].cells[0].c;
		const drilling = sceneId === 'h3' && beat === 1;
		const gridAlpha = alpha * (drilling ? 0.35 : 1);
		// Las estelas encienden la celda por la que pasan.
		for (const c of comets) {
			const n = c.trail.length;
			if (!n) continue;
			const i = cellAt(c.trail[n - 1][0], c.trail[n - 1][1]);
			if (i >= 0) hexGlow[i] = 1;
		}
		ctx.save();
		ctx.lineJoin = 'round';
		hex.r8.forEach((c, i) => {
			const d = Math.hypot(c.c[0] - ox, c.c[1] - oy);
			const wave = reduced ? 1 : Math.max(0, Math.min(1, (el * 520 - d) / 180));
			if (wave <= 0) return;
			const g = hexGlow[i];
			hexGlow[i] *= 0.955;
			const a = gridAlpha * wave;
			traceCell(c.b);
			ctx.fillStyle = `rgba(0,210,170,${(0.03 + 0.34 * c.w) * a})`;
			ctx.fill();
			if (g > 0.02) {
				ctx.fillStyle = `rgba(150,255,200,${0.55 * g * a})`;
				ctx.fill();
			}
			ctx.strokeStyle = `rgba(110,220,255,${(0.16 + 0.5 * g) * a})`;
			ctx.lineWidth = 0.8 + g;
			ctx.stroke();
		});
		ctx.restore();
	}

	/** De la ciudad a la calle: r6 → r10 sobre el Centro Histórico. */
	function drawDrill(t) {
		if (drillStart < 0) return;
		const el = t - drillStart;
		// El reloj del cuadro puede ir unos ms detrás de drillStart: nunca un nivel negativo.
		const lvl = reduced ? 4 : Math.max(0, Math.min(4, Math.floor(el / DRILL_STEP)));
		ctx.save();
		ctx.lineJoin = 'round';
		for (let k = 0; k <= lvl; k++) {
			const level = hex.drill[k];
			const fresh = k === lvl;
			const p = reduced ? 1 : Math.min(1, (el - k * DRILL_STEP) / 600);
			level.cells.forEach((c, i) => {
				const focus = i === level.focus;
				traceCell(c.b);
				if (fresh) {
					ctx.fillStyle = `rgba(0,255,150,${(focus ? 0.28 : 0.1) * p})`;
					ctx.fill();
				}
				ctx.strokeStyle = focus
					? `rgba(220,255,235,${0.95 * p})`
					: `rgba(0,255,150,${(fresh ? 0.75 : 0.3) * p})`;
				ctx.lineWidth = focus ? 2.4 : fresh ? 1.6 : 1;
				ctx.stroke();
			});
		}
		const focusCell = hex.drill[lvl].cells[hex.drill[lvl].focus];
		const [fx, fy] = toScreen(...focusCell.c);
		const pulse = reduced ? 0.5 : (t % 1400) / 1400;
		ctx.strokeStyle = `rgba(0,255,150,${1 - pulse})`;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(fx, fy, 6 + pulse * 22, 0, Math.PI * 2);
		ctx.stroke();
		ctx.fillStyle = '#eafff4';
		ctx.beginPath();
		ctx.arc(fx, fy, 4, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	let lastBeat = 0;
	function applyScene() {
		if (!world) return;
		// Escena H3 en bucle: al volver al inicio, la malla vuelve a aparecer en onda.
		if (sceneId === 'h3' && beat === 0 && lastBeat > 0 && sceneId === prevScene) {
			sceneT0 = performance.now();
			if (hexGlow) hexGlow.fill(0);
		}
		lastBeat = beat;
		if (sceneId !== prevScene) {
			if (sceneId === 'queretaro' && (prevScene === 'pregunta' || !revealed)) {
				revealed = false;
				revealStart = performance.now();
			}
			if (sceneId === 'pregunta' || sceneId === 'peticion' || sceneId === 'h3') revealed = true;
			if (hexGlow) hexGlow.fill(0);
			if (sceneId === 'hero') {
				revealed = false;
				revealStart = -1;
			}
			comets = [];
			layerDirty = true;
			densityGrid = null;
			sceneT0 = performance.now();
			prevScene = sceneId;
		}
		const zoomed = sceneId === 'queretaro' && beat >= 2;
		const target = zoomed
			? routeCamera()
			: sceneId === 'pregunta'
				? NIGHT_VIEW
				: sceneId === 'peticion'
					? buyersCamera()
					: sceneId === 'h3'
						? hexCamera()
						: OVERVIEW;
		if (sceneId === 'h3' && beat === 1) {
			if (drillStart < 0) drillStart = performance.now();
		} else {
			drillStart = -1;
		}
		camTarget.x = target.x;
		camTarget.y = target.y;
		camTarget.zoom = target.zoom;
		if (zoomed && routeStart < 0) routeStart = performance.now() + (reduced ? 0 : 900);
		if (!zoomed) routeStart = -1;
		if (reduced) {
			Object.assign(cam, camTarget);
			layerDirty = true;
		}
	}

	$effect(() => {
		// Dependencias explícitas: escena y beat.
		void sceneId;
		void beat;
		applyScene();
	});

	// ── Bucle de dibujo ──────────────────────────────────────────────────
	function resize() {
		dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.5);
		const box = contained ? canvas.parentElement.getBoundingClientRect() : null;
		W = box ? box.width : window.innerWidth;
		H = box ? box.height : window.innerHeight;
		canvas.width = Math.round(W * dpr);
		canvas.height = Math.round(H * dpr);
		roadsLayer.width = canvas.width;
		roadsLayer.height = canvas.height;
		layerDirty = true;
		densityGrid = null;
		applyScene();
	}

	function easeInOut(t) {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	function drawBinaryBand(R, band) {
		const size = cellSize();
		const ox = W * ORIGIN.fx;
		const oy = H * ORIGIN.fy;
		ctx.font = `600 ${Math.round(size * 0.78)}px ui-monospace, Menlo, monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		for (let r = 0; r < gridRows; r++) {
			const cy = r * size + size / 2;
			for (let c = 0; c < gridCols; c++) {
				const cx = c * size + size / 2;
				const d = Math.hypot(cx - ox, cy - oy);
				if (d < R - band || d > R) continue;
				const edge = 1 - (R - d) / band; // 1 en el frente, 0 detrás
				const dens = densityGrid ? densityGrid[r * gridCols + c] : 0;
				const road = dens > 0.04;
				if (road) {
					ctx.fillStyle = `rgba(62,193,40,${(0.18 * edge).toFixed(3)})`;
					ctx.fillRect(c * size + 1, r * size + 1, size - 2, size - 2);
				}
				ctx.fillStyle = road
					? `rgba(0,255,136,${(0.95 * edge).toFixed(3)})`
					: `rgba(61,90,114,${(0.35 * edge).toFixed(3)})`;
				ctx.fillText(Math.random() < 0.5 ? '0' : '1', cx, cy);
			}
		}
	}

	function drawFlicker(t, alpha) {
		if (!densityGrid || reduced) return;
		const size = cellSize();
		if (t - lastFlicker > 140) {
			lastFlicker = t;
			flicker = [];
			for (let k = 0; k < 400 && flicker.length < (lite ? 16 : 34); k++) {
				const idx = Math.floor(Math.random() * densityGrid.length);
				if (densityGrid[idx] > 0.06) flicker.push([idx, Math.random() < 0.5 ? '0' : '1']);
			}
		}
		ctx.font = `600 ${Math.round(size * 0.78)}px ui-monospace, Menlo, monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = `rgba(0,255,136,${0.4 * alpha})`;
		for (const [idx, ch] of flicker) {
			const c = idx % gridCols;
			const r = Math.floor(idx / gridCols);
			ctx.fillText(ch, c * size + size / 2, r * size + size / 2);
		}
	}

	function drawRoute(t) {
		if (routeStart < 0 || t < routeStart) return;
		const p = reduced ? 1 : Math.min(1, (t - routeStart) / 1800);
		const len = world.route.len * easeInOut(p);
		const s = baseScale() * cam.zoom;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		const trace = () => {
			ctx.beginPath();
			const [sx, sy] = toScreen(...world.route.pts[0]);
			ctx.moveTo(sx, sy);
			const { pts, cum } = world.route;
			for (let i = 1; i < pts.length && cum[i - 1] < len; i++) {
				const [x, y] = cum[i] <= len ? pts[i] : routePoint(world.route, len);
				const [px, py] = toScreen(x, y);
				ctx.lineTo(px, py);
			}
		};
		ctx.strokeStyle = 'rgba(0,255,136,0.22)';
		ctx.lineWidth = 12;
		trace();
		ctx.stroke();
		ctx.strokeStyle = 'rgba(234,243,252,0.95)';
		ctx.lineWidth = Math.max(2.5, 1.2 * s);
		trace();
		ctx.stroke();

		const [ax, ay] = toScreen(...world.route.pts[0]);
		ctx.fillStyle = '#eaf3fc';
		ctx.beginPath();
		ctx.arc(ax, ay, 5, 0, Math.PI * 2);
		ctx.fill();

		if (p > 0.72) {
			const [ex, ey] = toScreen(...routePoint(world.route, world.route.len * 0.72));
			const k = reduced ? 0.6 : ((t - routeStart) % 1600) / 1600;
			ctx.strokeStyle = `rgba(217,145,77,${1 - k})`;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(ex, ey, 8 + k * 26, 0, Math.PI * 2);
			ctx.stroke();
			ctx.fillStyle = '#D9914D';
			ctx.beginPath();
			ctx.arc(ex, ey, 7, 0, Math.PI * 2);
			ctx.fill();
			const flip = ex > W * 0.8;
			const lx = flip ? ex - 22 : ex + 22;
			ctx.font = '600 20px Outfit, system-ui, sans-serif';
			ctx.textAlign = flip ? 'right' : 'left';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'rgba(234,243,252,0.95)';
			ctx.fillText('Unidad 14 · 15:40', lx, ey - 13);
			ctx.fillStyle = 'rgba(217,145,77,0.95)';
			ctx.fillText('Detenida 40 min', lx, ey + 15);
		}
	}

	function frame(t) {
		raf = requestAnimationFrame(frame);
		if (!onScreen || W < 2 || H < 2) {
			lastT = 0;
			return;
		}
		const dt = Math.min(0.05, lastT ? (t - lastT) / 1000 : 0.016);
		lastT = t;

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		if (!world) return;

		// Escena 01: la cámara avanza despacio sobre la ciudad.
		if (sceneId === 'pregunta' && !reduced && !lite) {
			const el = (t - sceneT0) / 1000;
			camTarget.y = NIGHT_VIEW.y - el * 9;
			camTarget.x = NIGHT_VIEW.x + Math.sin(el * 0.08) * 60;
		}
		if (warmLayer !== isWarm()) layerDirty = true;

		// Cámara con amortiguamiento.
		const k = reduced ? 1 : 1 - Math.pow(0.0015, dt);
		const moving =
			Math.abs(cam.x - camTarget.x) > 0.3 ||
			Math.abs(cam.y - camTarget.y) > 0.3 ||
			Math.abs(cam.zoom - camTarget.zoom) > 0.002;
		if (moving) {
			cam.x += (camTarget.x - cam.x) * k;
			cam.y += (camTarget.y - cam.y) * k;
			cam.zoom += (camTarget.zoom - cam.zoom) * k;
			layerDirty = true;
		}

		let targetAlpha = MAP_ALPHA[sceneId] ?? 0;
		mapAlpha += (targetAlpha - mapAlpha) * (reduced ? 1 : 1 - Math.pow(0.02, dt));
		if (mapAlpha < 0.005 && targetAlpha === 0) return;

		if (layerDirty) renderRoadsLayer();
		if (!moving && !densityGrid) computeDensity();

		// Revelado binario desde el faro.
		let R = Infinity;
		const band = 140;
		if (!revealed && revealStart >= 0) {
			const p = reduced ? 1 : Math.min(1, (t - revealStart) / 2800);
			const maxD = Math.hypot(Math.max(W * ORIGIN.fx, W * (1 - ORIGIN.fx)), H) + band;
			R = easeInOut(p) * maxD;
			if (p >= 1) revealed = true;
		} else if (!revealed) {
			R = 0;
		}

		const zoomed = sceneId === 'queretaro' && beat >= 2;
		ctx.save();
		ctx.globalAlpha = mapAlpha * (zoomed ? 0.45 : 1);
		if (R !== Infinity) {
			ctx.beginPath();
			ctx.arc(W * ORIGIN.fx, H * ORIGIN.fy, Math.max(0, R - band * 0.6), 0, Math.PI * 2);
			ctx.clip();
		}
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.drawImage(roadsLayer, 0, 0);
		ctx.restore();
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		if (R !== Infinity && R > 0) drawBinaryBand(R, band);
		if (sceneId === 'queretaro' && !zoomed && revealed) drawFlicker(t, mapAlpha);

		// La malla H3 va debajo de las estelas.
		if (sceneId === 'h3' && hex) drawHexGrid(t, Math.min(1, mapAlpha * 2));

		// Cometas.
		const warm = isWarm();
		const cometCount = warm
			? lite
				? 24
				: 60
			: sceneId === 'queretaro' && beat >= 1
				? lite
					? 8
					: 18
				: sceneId === 'peticion'
					? 12
					: sceneId === 'h3'
						? lite
							? 10
							: 22
						: 0;
		const cometAlpha = warm
			? mapAlpha
			: sceneId === 'queretaro'
				? beat >= 1
					? 1
					: 0
				: sceneId === 'peticion'
					? mapAlpha * 1.4
					: sceneId === 'h3'
						? beat === 1
							? 0.35
							: 1
						: 0;
		if (cometAlpha > 0.01 && revealed) {
			while (comets.length < cometCount) comets.push(spawnComet());
			if (comets.length > cometCount) comets.length = cometCount;
			if (!reduced) for (const c of comets) stepComet(c, dt);
			drawComets(Math.min(1, cometAlpha) * (zoomed ? 0.35 : 1));
		}

		if (zoomed) drawRoute(t);
		if (warm && mapAlpha > 0.3) drawLabels(mapAlpha);
		if (sceneId === 'peticion' && industry) drawIndustry(t, Math.min(1, mapAlpha * 2));
		if (sceneId === 'h3' && hex) {
			// La cámara del recorrido r6 → r10 avanza nivel por nivel.
			if (beat === 1) Object.assign(camTarget, hexCamera());
			if (beat === 1) drawDrill(t);
		}
	}

	/** Zonas industriales reales (OSM): dónde están los compradores potenciales. */
	function drawIndustry(t, alpha) {
		const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t / 900);
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		for (const a of industry) {
			ctx.beginPath();
			for (let i = 0; i < a.p.length; i += 2) {
				const [x, y] = toScreen(a.p[i], a.p[i + 1]);
				if (i) ctx.lineTo(x, y);
				else ctx.moveTo(x, y);
			}
			ctx.closePath();
			ctx.fillStyle = `rgba(0,255,136,${(0.12 + 0.1 * pulse) * alpha})`;
			ctx.strokeStyle = `rgba(120,255,190,${0.75 * alpha})`;
			ctx.lineWidth = 1.2;
			ctx.fill();
			ctx.stroke();
		}
		ctx.globalCompositeOperation = 'source-over';
		ctx.font = '600 12px Outfit, system-ui, sans-serif';
		ctx.textAlign = 'left';
		for (const a of industry) {
			if (!a.n) continue;
			const [x, y] = toScreen(a.c[0], a.c[1]);
			const k = ((t / 1600 + a.c[0] * 0.001) % 1) * (reduced ? 0 : 1);
			ctx.strokeStyle = `rgba(0,255,136,${(1 - k) * alpha})`;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.arc(x, y, 5 + k * 22, 0, Math.PI * 2);
			ctx.stroke();
			ctx.fillStyle = '#eafff4';
			ctx.beginPath();
			ctx.arc(x, y, 3.5, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = `rgba(214,255,234,${0.9 * alpha})`;
			ctx.shadowColor = 'rgba(0,0,0,0.9)';
			ctx.shadowBlur = 6;
			ctx.fillText(a.n.toUpperCase(), x + 10, y - 8);
			ctx.shadowBlur = 0;
		}
		ctx.restore();
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		roadsLayer = document.createElement('canvas');
		roadsCtx = roadsLayer.getContext('2d');
		resize();
		window.addEventListener('resize', resize);
		let io = null;
		let ro = null;
		if (contained) {
			io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting));
			io.observe(canvas);
			ro = new ResizeObserver(resize);
			ro.observe(canvas.parentElement);
		}
		const onVisibility = () => {
			if (document.hidden) {
				cancelAnimationFrame(raf);
				raf = 0;
			} else if (!raf) {
				lastT = 0;
				raf = requestAnimationFrame(frame);
			}
		};
		document.addEventListener('visibilitychange', onVisibility);
		raf = requestAnimationFrame(frame);

		let alive = true;
		fetch(ROADS_URL)
			.then((r) => r.json())
			.then((data) => {
				if (!alive) return;
				world = prepareNetwork(data, CLASS_STYLE.length);
				fetch(H3_URL)
					.then((r) => r.json())
					.then((d) => {
						if (alive) prepareHex(d);
					})
					.catch(() => {});
				fetch(INDUSTRY_URL)
					.then((r) => r.json())
					.then((d) => {
						if (alive) industry = d.areas;
					})
					.catch(() => {});
				layerDirty = true;
				applyScene();
			})
			.catch(() => {
				// Sin mapa la narrativa sigue funcionando sobre fondo oscuro.
			});

		return () => {
			alive = false;
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			document.removeEventListener('visibilitychange', onVisibility);
			io?.disconnect();
			ro?.disconnect();
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="xp-world"
	class:contained
	class:tilt={sceneId === 'pregunta'}
	aria-hidden="true"
></canvas>

<style>
	.xp-world {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100dvh;
		display: block;
		z-index: 0;
		transform-origin: 50% 65%;
		transition: transform 1.8s cubic-bezier(0.6, 0, 0.2, 1);
	}
	.xp-world.contained {
		position: absolute;
		width: 100%;
		height: 100%;
	}
	/* Escena 01: la ciudad vista en perspectiva, como desde un avión. */
	.xp-world.tilt {
		transform: perspective(1000px) rotateX(50deg) scale(2) translateY(-12%);
	}
	@media (prefers-reduced-motion: reduce) {
		.xp-world {
			transition: none;
		}
	}
</style>
