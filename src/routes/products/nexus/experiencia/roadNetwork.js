/**
 * Red vial para el lienzo de la experiencia: geometría, adyacencia entre vías
 * y una ruta ilustrativa. Módulo sin estado reactivo (datos estáticos).
 */

const CITY_CENTER = { x: 1066, y: 1110 };

/** Clave de un nodo por coordenadas enteras (las vías comparten nodos OSM). */
export const nodeKey = (x, y) => `${x},${y}`;

/**
 * @param {{ w: number, h: number, roads: { c: number, p: number[] }[] }} data
 * @param {number} classCount
 */
export function prepareNetwork(data, classCount) {
	const roads = data.roads.map((r) => {
		const n = r.p.length / 2;
		const cum = new Float32Array(n);
		for (let i = 1; i < n; i++) {
			const dx = r.p[i * 2] - r.p[i * 2 - 2];
			const dy = r.p[i * 2 + 1] - r.p[i * 2 - 1];
			cum[i] = cum[i - 1] + Math.hypot(dx, dy);
		}
		return { c: r.c, p: r.p, cum, len: cum[n - 1] };
	});
	const paths = Array.from({ length: classCount }, () => new Path2D());
	for (const r of roads) {
		const path = paths[r.c];
		path.moveTo(r.p[0], r.p[1]);
		for (let i = 2; i < r.p.length; i += 2) path.lineTo(r.p[i], r.p[i + 1]);
	}
	const adjacency = new Map();
	roads.forEach((r, i) => {
		if (r.c > 3 || r.len < 4) return;
		const last = r.p.length - 2;
		for (const [end, k] of [
			[0, nodeKey(r.p[0], r.p[1])],
			[1, nodeKey(r.p[last], r.p[last + 1])]
		]) {
			if (!adjacency.has(k)) adjacency.set(k, []);
			adjacency.get(k).push({ i, end });
		}
	});
	const network = roads.map((_r, i) => i).filter((i) => roads[i].c <= 2 && roads[i].len > 30);
	const net = { w: data.w, h: data.h, roads, paths, adjacency, network, labels: data.labels || [] };
	net.route = buildRoute(net);
	return net;
}

/** Punto a una distancia `d` desde el inicio de la vía. */
export function pointAt(road, d) {
	const { p, cum, len } = road;
	const dist = Math.max(0, Math.min(len, d));
	let lo = 0;
	let hi = cum.length - 1;
	while (lo < hi - 1) {
		const mid = (lo + hi) >> 1;
		if (cum[mid] <= dist) lo = mid;
		else hi = mid;
	}
	const seg = cum[hi] - cum[lo] || 1;
	const t = (dist - cum[lo]) / seg;
	return [
		p[lo * 2] + (p[hi * 2] - p[lo * 2]) * t,
		p[lo * 2 + 1] + (p[hi * 2 + 1] - p[lo * 2 + 1]) * t
	];
}

/** Clave del extremo `end` (0 = inicio, 1 = final) de una vía. */
export function endpointKey(road, end) {
	const i = end === 0 ? 0 : road.p.length - 2;
	return nodeKey(road.p[i], road.p[i + 1]);
}

function chainFrom(roads, adjacency, start, startForward) {
	const pts = [];
	const used = new Set([start]);
	let road = roads[start];
	let forward = startForward;
	let total = 0;
	for (let step = 0; step < 60 && total < 520; step++) {
		const n = road.p.length / 2;
		for (let k = 0; k < n; k++) {
			const idx = forward ? k : n - 1 - k;
			const x = road.p[idx * 2];
			const y = road.p[idx * 2 + 1];
			const prev = pts[pts.length - 1];
			if (prev && prev[0] === x && prev[1] === y) continue;
			if (prev) total += Math.hypot(x - prev[0], y - prev[1]);
			pts.push([x, y]);
		}
		const tail = pts[pts.length - 1];
		const before = pts[Math.max(0, pts.length - 4)];
		const heading = Math.atan2(tail[1] - before[1], tail[0] - before[0]);
		const options = (adjacency.get(endpointKey(road, forward ? 1 : 0)) || []).filter(
			(o) => !used.has(o.i) && roads[o.i].c <= 2
		);
		if (!options.length) break;
		let pick = options[0];
		let pickTurn = Infinity;
		for (const o of options) {
			const r = roads[o.i];
			const [ax, ay] = o.end === 0 ? [r.p[0], r.p[1]] : [r.p[r.p.length - 2], r.p[r.p.length - 1]];
			const [bx, by] = pointAt(r, o.end === 0 ? Math.min(r.len, 20) : Math.max(0, r.len - 20));
			const h = Math.atan2(by - ay, bx - ax);
			const turn = Math.abs(Math.atan2(Math.sin(h - heading), Math.cos(h - heading)));
			if (turn < pickTurn) {
				pickTurn = turn;
				pick = o;
			}
		}
		if (pickTurn > Math.PI / 2) break;
		used.add(pick.i);
		road = roads[pick.i];
		forward = pick.end === 0;
	}
	return { pts, total };
}

/** Ruta ilustrativa para el acercamiento: prueba varias vías de inicio cerca del centro y
 * se queda con la cadena más larga (encadenando con el menor giro posible). */
function buildRoute({ roads, network, adjacency }) {
	const seeds = network
		.filter((i) => roads[i].c <= 2)
		.map((i) => {
			const [mx, my] = pointAt(roads[i], roads[i].len / 2);
			return { i, d: Math.hypot(mx - CITY_CENTER.x, my - CITY_CENTER.y) };
		})
		.sort((a, b) => a.d - b.d)
		.slice(0, 30);
	let pts = [];
	let bestTotal = -1;
	for (const seed of seeds) {
		for (const forward of [true, false]) {
			const chain = chainFrom(roads, adjacency, seed.i, forward);
			if (chain.total > bestTotal) {
				bestTotal = chain.total;
				pts = chain.pts;
			}
		}
	}
	const cum = [0];
	for (let i = 1; i < pts.length; i++) {
		cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	}
	const xs = pts.map((p) => p[0]);
	const ys = pts.map((p) => p[1]);
	const bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
	return { pts, cum, len: cum[cum.length - 1], bbox };
}

/** Punto a una distancia `d` sobre la ruta ilustrativa. */
export function routePoint(route, d) {
	const { pts, cum } = route;
	let i = 1;
	while (i < cum.length - 1 && cum[i] < d) i++;
	const seg = cum[i] - cum[i - 1] || 1;
	const t = Math.max(0, Math.min(1, (d - cum[i - 1]) / seg));
	return [
		pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
		pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t
	];
}

const ROADS_URL = '/img/products/nexus/experiencia/queretaro-vias.json';
let networkPromise = null;

/** Carga y prepara la red vial una sola vez para todos los lienzos. */
export function loadNetwork(classCount = 5) {
	if (!networkPromise) {
		networkPromise = fetch(ROADS_URL)
			.then((r) => r.json())
			.then((data) => prepareNetwork(data, classCount))
			.catch((err) => {
				networkPromise = null;
				throw err;
			});
	}
	return networkPromise;
}

const H3_URL = '/img/products/nexus/experiencia/queretaro-h3.json';
let h3Promise = null;

/** Celdas H3 reales precalculadas (ver scripts de la experiencia). */
export function loadH3() {
	if (!h3Promise) {
		h3Promise = fetch(H3_URL)
			.then((r) => r.json())
			.catch((err) => {
				h3Promise = null;
				throw err;
			});
	}
	return h3Promise;
}

/**
 * Selecciona celdas cuyo centro cae dentro de un radio y devuelve las aristas
 * del contorno (las que no comparten dos celdas).
 */
export function hexZone(cells, cx, cy, radius) {
	const inside = cells.filter((c) => Math.hypot(c.c[0] - cx, c.c[1] - cy) <= radius);
	const count = new Map();
	const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
	const pt = (b, i) => `${b[i]},${b[i + 1]}`;
	for (const c of inside) {
		const n = c.b.length;
		for (let i = 0; i < n; i += 2) {
			const j = (i + 2) % n;
			const k = key(pt(c.b, i), pt(c.b, j));
			const e = count.get(k);
			if (e) e.n += 1;
			else count.set(k, { n: 1, a: [c.b[i], c.b[i + 1]], b: [c.b[j], c.b[j + 1]] });
		}
	}
	const edges = [...count.values()].filter((e) => e.n === 1).map((e) => [e.a, e.b]);
	return { inside, edges };
}

/** Índice espacial simple: celdas agrupadas por cubeta de `size` unidades. */
export function bucketCells(cells, size) {
	const bucket = new Map();
	cells.forEach((c, i) => {
		const k = `${Math.floor(c.c[0] / size)},${Math.floor(c.c[1] / size)}`;
		if (!bucket.has(k)) bucket.set(k, []);
		bucket.get(k).push(i);
	});
	return bucket;
}
