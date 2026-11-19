<script>
	/**
	 * Centro Histórico de Querétaro en 3D (maqueta glTF con huellas de edificios
	 * y calles de OpenStreetMap) con cinco capas H3 r10 flotando encima.
	 * Movilidad usa la red vial real; las demás capas son ilustrativas.
	 * Three.js se carga solo cuando se monta esta escena.
	 */
	import { onMount } from 'svelte';

	let { layers = [], active = $bindable(0), reduced = false } = $props();

	const BASE = '/img/products/nexus/experiencia';
	const CYCLE = 3600;
	const GAP = 330;
	const FIRST = 380;

	let host = $state(null);
	let canvas = $state(null);
	let tags = $state([]);
	let ready = $state(false);

	function field(x, z, seed) {
		const a = Math.sin(x * 0.0032 + seed) * Math.cos(z * 0.004 - seed * 1.7);
		const b = Math.sin((x + z) * 0.0021 + seed * 2.3);
		return Math.max(0, Math.min(1, 0.5 + 0.35 * a + 0.25 * b));
	}

	function valueFor(id, c) {
		const [x, z] = c.c;
		switch (id) {
			case 'movilidad':
				return c.m;
			case 'rf':
				return field(x, z, 1.3) * 0.95;
			case 'seguridad':
				return Math.min(1, Math.pow(c.m, 1.3) * field(x, z, 4.1) * 1.8);
			case 'comportamiento':
				return field(x, z, 7.7) * (0.35 + 0.65 * c.m);
			default:
				return c.m > 0.5 && field(x, z, 2.2) > 0.55 ? 1 : field(x, z, 9.9) * 0.18;
		}
	}

	onMount(() => {
		let alive = true;
		let cleanup = () => {};

		(async () => {
			const THREE = await import('three');
			const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
			if (!alive) return;

			const renderer = new THREE.WebGLRenderer({
				canvas,
				antialias: true,
				powerPreference: 'high-performance'
			});
			renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 1.35;
			renderer.setClearColor('#050d16');

			const scene = new THREE.Scene();
			scene.fog = new THREE.FogExp2('#050d16', 0.00016);
			const camera = new THREE.PerspectiveCamera(34, 1, 10, 20000);
			const target = new THREE.Vector3(-60, 760, -40);
			scene.add(new THREE.HemisphereLight(0xa0eaff, 0x182639, 2.6));
			const key = new THREE.DirectionalLight(0xc8e7ff, 3.7);
			key.position.set(-700, 1300, -900);
			scene.add(key);
			const rim = new THREE.DirectionalLight(0x30bce7, 1.6);
			rim.position.set(1000, 400, 800);
			scene.add(rim);

			const disposables = [];
			const keep = (o) => (disposables.push(o), o);

			// Maqueta.
			const [gltf, data] = await Promise.all([
				new GLTFLoader().loadAsync(`${BASE}/queretaro-centro.glb`),
				fetch(`${BASE}/centro-capas.json`).then((r) => r.json())
			]);
			if (!alive) return;
			const city = gltf.scene;
			scene.add(city);
			const axes = city.getObjectByName('Ejes_cian') || city.getObjectByName('Ejes cian');
			if (axes)
				axes.material = keep(new THREE.MeshBasicMaterial({ color: 0x18d9f4, toneMapped: false }));
			const buildings = city.getObjectByName('Edificios');
			if (buildings) {
				const outline = new THREE.LineSegments(
					keep(new THREE.EdgesGeometry(buildings.geometry, 28)),
					keep(new THREE.LineBasicMaterial({ color: 0x4d91a5, transparent: true, opacity: 0.28 }))
				);
				scene.add(outline);
			}

			// Límites del recorte para los marcos de las capas.
			const box = new THREE.Box3().setFromObject(city);
			const x0 = box.min.x;
			const x1 = box.max.x;
			const z0 = box.min.z;
			const z1 = box.max.z;

			// Capas H3 flotantes.
			const planes = layers.map((layer, li) => {
				const group = new THREE.Group();
				const col = new THREE.Color(`rgb(${layer.rgb.join(',')})`);
				const pos = [];
				const colors = [];
				const edges = [];
				for (const c of data.cells) {
					const v = Math.max(0, Math.min(1, valueFor(layer.id, c)));
					const n = c.b.length / 2;
					for (let i = 0; i < n; i++) {
						const j = (i + 1) % n;
						edges.push(c.b[i * 2], 0, c.b[i * 2 + 1], c.b[j * 2], 0, c.b[j * 2 + 1]);
						if (v < 0.12) continue;
						pos.push(
							c.c[0],
							0,
							c.c[1],
							c.b[i * 2],
							0,
							c.b[i * 2 + 1],
							c.b[j * 2],
							0,
							c.b[j * 2 + 1]
						);
						for (let k = 0; k < 3; k++)
							colors.push(col.r * v * 0.8, col.g * v * 0.8, col.b * v * 0.8);
					}
				}
				const fillGeo = keep(new THREE.BufferGeometry());
				fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
				fillGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
				const fillMat = keep(
					new THREE.MeshBasicMaterial({
						vertexColors: true,
						transparent: true,
						opacity: 0.9,
						blending: THREE.AdditiveBlending,
						depthWrite: false,
						side: THREE.DoubleSide,
						toneMapped: false
					})
				);
				group.add(new THREE.Mesh(fillGeo, fillMat));
				const edgeGeo = keep(new THREE.BufferGeometry());
				edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3));
				const edgeMat = keep(
					new THREE.LineBasicMaterial({
						color: col,
						transparent: true,
						opacity: 0.35,
						depthWrite: false
					})
				);
				group.add(new THREE.LineSegments(edgeGeo, edgeMat));
				// Marco y vidrio de la capa.
				const frameGeo = keep(
					new THREE.BufferGeometry().setFromPoints([
						new THREE.Vector3(x0, 0, z0),
						new THREE.Vector3(x1, 0, z0),
						new THREE.Vector3(x1, 0, z1),
						new THREE.Vector3(x0, 0, z1),
						new THREE.Vector3(x0, 0, z0)
					])
				);
				const frameMat = keep(
					new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.8 })
				);
				group.add(new THREE.Line(frameGeo, frameMat));
				const glassGeo = keep(new THREE.PlaneGeometry(x1 - x0, z1 - z0));
				const glassMat = keep(
					new THREE.MeshBasicMaterial({
						color: col,
						transparent: true,
						opacity: 0.04,
						depthWrite: false,
						side: THREE.DoubleSide
					})
				);
				const glass = new THREE.Mesh(glassGeo, glassMat);
				glass.rotation.x = -Math.PI / 2;
				glass.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
				group.add(glass);
				group.position.y = FIRST;
				scene.add(group);
				return { group, fillMat, edgeMat, frameMat, glassMat, li };
			});

			// Tráfico ilustrativo sobre las calles reales.
			const roads = data.roads.map((r) => {
				const pts = [];
				for (let i = 0; i < r.p.length; i += 2) pts.push([r.p[i], r.p[i + 1]]);
				const cum = [0];
				for (let i = 1; i < pts.length; i++) {
					cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
				}
				return { c: r.c, pts, cum, len: cum[cum.length - 1] };
			});
			const weighted = [];
			roads.forEach((r, i) => {
				if (r.len < 40) return;
				for (let k = 0; k < Math.round(r.c * 2); k++) weighted.push(i);
			});
			const N = reduced ? 0 : 180;
			const cars = Array.from({ length: N }, () => ({
				r: weighted[Math.floor(Math.random() * weighted.length)],
				s: Math.random(),
				v: 25 + Math.random() * 40,
				dir: Math.random() < 0.5 ? 1 : -1
			}));
			const carPos = new Float32Array(N * 3);
			const carCol = new Float32Array(N * 3);
			cars.forEach((c, i) => {
				const warm = Math.random() < 0.3;
				carCol.set(warm ? [1, 0.72, 0.3] : [0.55, 0.95, 1], i * 3);
				c.s *= roads[c.r].len;
			});
			const sprite = document.createElement('canvas');
			sprite.width = sprite.height = 64;
			const sctx = sprite.getContext('2d');
			const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
			g.addColorStop(0, 'rgba(255,255,255,1)');
			g.addColorStop(0.25, 'rgba(255,255,255,0.7)');
			g.addColorStop(1, 'rgba(255,255,255,0)');
			sctx.fillStyle = g;
			sctx.fillRect(0, 0, 64, 64);
			const carGeo = keep(new THREE.BufferGeometry());
			carGeo.setAttribute('position', new THREE.BufferAttribute(carPos, 3));
			carGeo.setAttribute('color', new THREE.BufferAttribute(carCol, 3));
			const carMat = keep(
				new THREE.PointsMaterial({
					size: 34,
					map: keep(new THREE.CanvasTexture(sprite)),
					vertexColors: true,
					transparent: true,
					blending: THREE.AdditiveBlending,
					depthWrite: false,
					toneMapped: false
				})
			);
			scene.add(new THREE.Points(carGeo, carMat));

			function along(road, d) {
				let i = 1;
				while (i < road.cum.length - 1 && road.cum[i] < d) i++;
				const seg = road.cum[i] - road.cum[i - 1] || 1;
				const t = Math.max(0, Math.min(1, (d - road.cum[i - 1]) / seg));
				const a = road.pts[i - 1];
				const b = road.pts[i];
				return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
			}

			function resize() {
				const r = host.getBoundingClientRect();
				renderer.setSize(r.width, r.height, false);
				camera.aspect = r.width / Math.max(1, r.height);
				// En escritorio la maqueta se desplaza a la derecha; el texto vive a la izquierda.
				if (r.width > 860)
					camera.setViewOffset(r.width, r.height, -r.width * 0.17, 0, r.width, r.height);
				else camera.clearViewOffset();
				camera.updateProjectionMatrix();
			}
			resize();
			const ro = new ResizeObserver(resize);
			ro.observe(host);

			const t0 = performance.now();
			let last = t0;
			let raf = 0;
			const v = new THREE.Vector3();
			ready = true;

			function frame(now) {
				raf = requestAnimationFrame(frame);
				const dt = Math.min(0.05, (now - last) / 1000);
				last = now;
				const el = (now - t0) / 1000;
				const act = reduced ? 0 : Math.floor((now - t0) / CYCLE) % layers.length;
				if (act !== active) active = act;

				// Órbita lenta de la cámara.
				const ang = reduced ? 0.7 : 0.7 + Math.sin(el * 0.06) * 0.35;
				camera.position.set(target.x + Math.sin(ang) * 6500, 2650, target.z + Math.cos(ang) * 6500);
				camera.lookAt(target);

				// Las capas se separan al entrar; la activa brilla.
				const open = reduced ? 1 : Math.min(1, el / 2.2);
				const ease = 1 - Math.pow(1 - open, 3);
				for (const p of planes) {
					const on = p.li === act;
					p.group.position.y = FIRST * ease + p.li * GAP * ease;
					const k = 1 - Math.pow(0.002, dt);
					p.fillMat.opacity += ((on ? 0.95 : 0.1) - p.fillMat.opacity) * k;
					p.edgeMat.opacity += ((on ? 0.55 : 0.1) - p.edgeMat.opacity) * k;
					p.frameMat.opacity += ((on ? 1 : 0.35) - p.frameMat.opacity) * k;
					p.glassMat.opacity += ((on ? 0.09 : 0.025) - p.glassMat.opacity) * k;
				}

				for (let i = 0; i < N; i++) {
					const c = cars[i];
					const road = roads[c.r];
					c.s += c.v * dt;
					if (c.s > road.len) {
						c.r = weighted[Math.floor(Math.random() * weighted.length)];
						c.s = 0;
						c.dir = Math.random() < 0.5 ? 1 : -1;
					}
					const rr = roads[c.r];
					const [x, z] = along(rr, c.dir > 0 ? c.s : rr.len - c.s);
					carPos[i * 3] = x;
					carPos[i * 3 + 1] = 4;
					carPos[i * 3 + 2] = z;
				}
				carGeo.attributes.position.needsUpdate = true;
				carMat.opacity = act === 0 ? 1 : 0.55;

				renderer.render(scene, camera);

				// Etiquetas que siguen a la esquina de cada capa.
				const r = host.getBoundingClientRect();
				tags = planes.map((p) => {
					// La esquina más a la derecha que quepa en pantalla.
					let best = null;
					for (const [cx, cz] of [
						[x0, z0],
						[x1, z0],
						[x1, z1],
						[x0, z1]
					]) {
						v.set(cx, p.group.position.y, cz).project(camera);
						const sx = ((v.x + 1) / 2) * r.width;
						const sy = ((1 - v.y) / 2) * r.height;
						if (sx < r.width - 190 && (!best || sx > best.x)) best = { x: sx, y: sy };
					}
					return { ...(best || { x: -999, y: -999 }), on: p.li === act };
				});
			}
			raf = requestAnimationFrame(frame);

			cleanup = () => {
				cancelAnimationFrame(raf);
				ro.disconnect();
				city.traverse((o) => {
					if (o.geometry) o.geometry.dispose();
					if (o.material) o.material.dispose?.();
				});
				for (const d of disposables) d.dispose?.();
				renderer.dispose();
				renderer.forceContextLoss();
			};
		})().catch(() => {});

		return () => {
			alive = false;
			cleanup();
		};
	});
</script>

<div class="cm" class:ready bind:this={host} aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
	{#each tags as t, i (i)}
		<span
			class="cm-tag"
			class:on={t.on}
			style="left:{t.x}px; top:{t.y}px; --rgb:{layers[i]?.rgb.join(',')}">{layers[i]?.n}</span
		>
	{/each}
</div>

<style>
	.cm {
		position: absolute;
		inset: 0;
		overflow: hidden;
		opacity: 0;
		transition: opacity 1.2s ease;
	}
	.cm.ready {
		opacity: 1;
	}
	.cm canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	.cm-tag {
		position: absolute;
		translate: 10px -50%;
		padding: 0.2rem 0.6rem;
		border-left: 2px solid rgb(var(--rgb));
		background: rgba(4, 10, 20, 0.6);
		font:
			600 0.78rem Outfit,
			system-ui,
			sans-serif;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgb(var(--rgb));
		white-space: nowrap;
		opacity: 0.45;
		transition: opacity 0.5s ease;
		pointer-events: none;
	}
	.cm-tag.on {
		opacity: 1;
		text-shadow: 0 0 10px rgba(var(--rgb), 0.8);
	}
</style>
