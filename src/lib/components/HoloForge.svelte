<script>
	/**
	 * Hero de servicios: una arquitectura holográfica que se ensambla sola sobre
	 * una mesa de luz, al estilo de un taller de película. De abajo hacia arriba:
	 * dispositivos → conectividad → nube → datos e IA → aplicaciones, unidos por
	 * líneas por las que viajan pulsos. La cámara entra, orbita despacio y sigue
	 * al mouse; al pasar sobre una capa, se levanta y muestra su nombre.
	 * Three.js se carga solo en esta página.
	 */
	import { onMount } from 'svelte';

	let { offsetX = 0.18 } = $props();

	const LAYERS = [
		{ id: 'dev', label: 'Dispositivos', y: 0.35 },
		{ id: 'net', label: 'Conectividad', y: 1.55 },
		{ id: 'cloud', label: 'Nube', y: 3.0 },
		{ id: 'data', label: 'Datos e IA', y: 4.45 },
		{ id: 'apps', label: 'Aplicaciones', y: 5.9 }
	];

	let host = $state(null);
	let canvas = $state(null);
	let tags = $state([]);
	let ready = $state(false);

	onMount(() => {
		let alive = true;
		let cleanup = () => {};

		(async () => {
			const THREE = await import('three');
			const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
			const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
			const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
			const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
			if (!alive) return;

			const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			const lite = window.innerWidth <= 768;
			const CYAN = new THREE.Color('#38e8ff');
			const TEAL = new THREE.Color('#00ffc6');

			const renderer = new THREE.WebGLRenderer({
				canvas,
				antialias: true,
				powerPreference: 'high-performance'
			});
			renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.5));
			renderer.setClearColor('#02060b');
			const scene = new THREE.Scene();
			scene.fog = new THREE.FogExp2('#02060b', 0.028);
			const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

			const disposables = [];
			const keep = (o) => (disposables.push(o), o);
			const add = (THREEgeo, mat, parent = scene) => {
				const m = new THREE.Mesh(keep(THREEgeo), mat);
				parent.add(m);
				return m;
			};
			const holoMat = (color, opacity) =>
				keep(
					new THREE.MeshBasicMaterial({
						color,
						transparent: true,
						opacity,
						blending: THREE.AdditiveBlending,
						depthWrite: false,
						side: THREE.DoubleSide
					})
				);
			const lineMat = (color, opacity) =>
				keep(
					new THREE.LineBasicMaterial({
						color,
						transparent: true,
						opacity,
						blending: THREE.AdditiveBlending,
						depthWrite: false
					})
				);
			const edges = (geo, color, opacity, parent) => {
				const l = new THREE.LineSegments(
					keep(new THREE.EdgesGeometry(geo)),
					lineMat(color, opacity)
				);
				parent.add(l);
				return l;
			};
			/** Módulo holográfico: relleno tenue + aristas brillantes. */
			function holo(geo, parent, { fill = 0.07, edge = 0.95, color = CYAN } = {}) {
				fill *= 0.4;
				edge *= 0.75;
				const g = new THREE.Group();
				add(geo, holoMat(color, fill), g);
				edges(geo, color, edge, g);
				parent.add(g);
				return g;
			}

			// ── Mesa de luz ─────────────────────────────────────────────
			const table = new THREE.Group();
			scene.add(table);
			for (let i = 1; i <= 7; i++) {
				const r = i * 0.9;
				const ring = new THREE.Mesh(
					keep(new THREE.RingGeometry(r - 0.012, r + 0.012, 128)),
					holoMat(i === 7 ? TEAL : CYAN, i === 7 ? 0.6 : 0.1 + (i % 2) * 0.08)
				);
				ring.rotation.x = -Math.PI / 2;
				table.add(ring);
			}
			// Radios
			const spokes = [];
			for (let i = 0; i < 24; i++) {
				const a = (i / 24) * Math.PI * 2;
				spokes.push(
					new THREE.Vector3(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9),
					new THREE.Vector3(Math.cos(a) * 6.3, 0, Math.sin(a) * 6.3)
				);
			}
			table.add(
				new THREE.LineSegments(
					keep(new THREE.BufferGeometry().setFromPoints(spokes)),
					lineMat(CYAN, 0.12)
				)
			);
			// Resplandor del piso
			const glowTex = (() => {
				const c = document.createElement('canvas');
				c.width = c.height = 256;
				const x = c.getContext('2d');
				const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
				g.addColorStop(0, 'rgba(56,232,255,0.22)');
				g.addColorStop(0.4, 'rgba(10,111,140,0.1)');
				g.addColorStop(1, 'rgba(0,0,0,0)');
				x.fillStyle = g;
				x.fillRect(0, 0, 256, 256);
				return keep(new THREE.CanvasTexture(c));
			})();
			const floor = new THREE.Mesh(
				keep(new THREE.PlaneGeometry(16, 16)),
				keep(
					new THREE.MeshBasicMaterial({
						map: glowTex,
						transparent: true,
						blending: THREE.AdditiveBlending,
						depthWrite: false
					})
				)
			);
			floor.rotation.x = -Math.PI / 2;
			floor.position.y = -0.01;
			table.add(floor);
			// Anillo exterior que gira
			const outer = new THREE.Mesh(
				keep(new THREE.TorusGeometry(6.6, 0.015, 8, 200, Math.PI * 1.4)),
				holoMat(TEAL, 0.85)
			);
			outer.rotation.x = Math.PI / 2;
			table.add(outer);

			// ── Capas de la arquitectura ────────────────────────────────
			const layerGroups = {};
			const pieces = []; // { obj, home: Vector3, from: Vector3, delay, spin }
			function piece(obj, delay, spread = 6) {
				const home = obj.position.clone();
				const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5)
					.normalize()
					.multiplyScalar(spread);
				pieces.push({
					obj,
					home,
					from: home.clone().add(dir),
					delay,
					spin: (Math.random() - 0.5) * 4
				});
			}
			for (const L of LAYERS) {
				const g = new THREE.Group();
				g.position.y = L.y;
				g.userData = { id: L.id, lift: 0 };
				scene.add(g);
				layerGroups[L.id] = g;
			}

			// Dispositivos: anillo de pequeños módulos hexagonales
			const devPos = [];
			for (let i = 0; i < 8; i++) {
				const a = (i / 8) * Math.PI * 2 + 0.2;
				const m = holo(new THREE.CylinderGeometry(0.32, 0.32, 0.36, 6), layerGroups.dev, {
					fill: 0.1
				});
				m.position.set(Math.cos(a) * 3.6, 0, Math.sin(a) * 3.6);
				const chip = holo(new THREE.BoxGeometry(0.22, 0.05, 0.22), m, { color: TEAL, fill: 0.4 });
				chip.position.y = 0.22;
				devPos.push(m.position.clone().add(new THREE.Vector3(0, LAYERS[0].y + 0.2, 0)));
				piece(m, 0.15 + i * 0.07);
			}

			// Conectividad: tres mástiles con anillos que giran
			const netPos = [];
			const masts = [];
			for (let i = 0; i < 3; i++) {
				const a = (i / 3) * Math.PI * 2 + 0.6;
				const m = new THREE.Group();
				m.position.set(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2);
				holo(new THREE.CylinderGeometry(0.04, 0.12, 1.4, 6), m, { fill: 0.2 });
				for (let k = 0; k < 3; k++) {
					const r = new THREE.Mesh(
						keep(new THREE.TorusGeometry(0.25 + k * 0.17, 0.008, 6, 60)),
						holoMat(TEAL, 0.7 - k * 0.18)
					);
					r.rotation.x = Math.PI / 2;
					r.position.y = 0.55;
					m.add(r);
					masts.push(r);
				}
				layerGroups.net.add(m);
				netPos.push(m.position.clone().add(new THREE.Vector3(0, LAYERS[1].y + 0.6, 0)));
				piece(m, 0.9 + i * 0.12);
			}

			// Nube: núcleo hexagonal grande con órbitas
			const core = holo(new THREE.CylinderGeometry(1.15, 1.15, 0.85, 6), layerGroups.cloud, {
				fill: 0.09
			});
			const coreInner = holo(new THREE.IcosahedronGeometry(0.42, 1), core, {
				color: TEAL,
				fill: 0.18
			});
			const orbits = [];
			for (let k = 0; k < 3; k++) {
				const o = new THREE.Mesh(
					keep(new THREE.TorusGeometry(1.55 + k * 0.28, 0.01, 6, 120)),
					holoMat(k === 1 ? TEAL : CYAN, 0.6)
				);
				o.rotation.set(Math.PI / 2 + (k - 1) * 0.35, 0, k * 0.6);
				layerGroups.cloud.add(o);
				orbits.push(o);
			}
			piece(core, 1.5, 4);
			const cloudPos = new THREE.Vector3(0, LAYERS[2].y, 0);

			// Datos e IA: discos apilados que giran en sentidos opuestos
			const discs = [];
			for (let k = 0; k < 4; k++) {
				const d = holo(
					new THREE.CylinderGeometry(1.4 - k * 0.22, 1.4 - k * 0.22, 0.06, 24),
					layerGroups.data,
					{
						fill: 0.12,
						color: k % 2 ? TEAL : CYAN
					}
				);
				d.position.y = k * 0.22 - 0.3;
				discs.push(d);
				piece(d, 2.0 + k * 0.1, 5);
			}
			const dataPos = new THREE.Vector3(0, LAYERS[3].y + 0.3, 0);

			// Aplicaciones: paneles flotantes con gráficas
			function panelTexture(kind) {
				const c = document.createElement('canvas');
				c.width = 256;
				c.height = 160;
				const x = c.getContext('2d');
				x.fillStyle = 'rgba(56,232,255,0.10)';
				x.fillRect(0, 0, 256, 160);
				x.strokeStyle = 'rgba(56,232,255,0.9)';
				x.lineWidth = 2;
				x.strokeRect(2, 2, 252, 156);
				x.fillStyle = 'rgba(0,255,198,0.85)';
				x.fillRect(14, 14, 70, 8);
				if (kind === 0) {
					x.beginPath();
					for (let i = 0; i <= 20; i++) {
						const px = 14 + i * 11.4;
						const py = 120 - Math.abs(Math.sin(i * 0.7)) * 70 - i * 1.5;
						if (i) x.lineTo(px, py);
						else x.moveTo(px, py);
					}
					x.stroke();
				} else if (kind === 1) {
					for (let i = 0; i < 9; i++) {
						const h = 20 + ((i * 37) % 80);
						x.fillRect(18 + i * 26, 140 - h, 16, h);
					}
				} else {
					x.beginPath();
					x.arc(128, 90, 46, 0, Math.PI * 1.5);
					x.lineWidth = 8;
					x.stroke();
					x.lineWidth = 2;
					for (let i = 0; i < 4; i++) x.fillRect(190, 50 + i * 20, 50, 6);
				}
				for (let y = 0; y < 160; y += 4) {
					x.fillStyle = 'rgba(0,0,0,0.18)';
					x.fillRect(0, y, 256, 1);
				}
				return keep(new THREE.CanvasTexture(c));
			}
			const panels = [];
			for (let i = 0; i < 3; i++) {
				const p = new THREE.Mesh(
					keep(new THREE.PlaneGeometry(1.7, 1.06)),
					keep(
						new THREE.MeshBasicMaterial({
							map: panelTexture(i),
							transparent: true,
							blending: THREE.AdditiveBlending,
							depthWrite: false,
							side: THREE.DoubleSide,
							opacity: 0.7
						})
					)
				);
				const a = (i / 3) * Math.PI * 2;
				p.position.set(Math.cos(a) * 2.1, 0.2, Math.sin(a) * 2.1);
				p.userData.angle = a;
				layerGroups.apps.add(p);
				panels.push(p);
				piece(p, 2.6 + i * 0.15, 5);
			}

			// ── Conexiones con pulsos ───────────────────────────────────
			const curves = [];
			const link = (a, b, bend = 0.6) => {
				const mid = a.clone().lerp(b, 0.5);
				mid.y += bend;
				curves.push(new THREE.QuadraticBezierCurve3(a, mid, b));
			};
			devPos.forEach((p, i) => link(p, netPos[i % 3], 0.3));
			netPos.forEach((p) => link(p, cloudPos, 0.5));
			link(
				cloudPos.clone().add(new THREE.Vector3(0, 0.45, 0)),
				dataPos.clone().add(new THREE.Vector3(0, -0.5, 0)),
				0
			);
			for (let i = 0; i < 3; i++) {
				const a = (i / 3) * Math.PI * 2;
				link(
					dataPos,
					new THREE.Vector3(Math.cos(a) * 2.1, LAYERS[4].y + 0.2, Math.sin(a) * 2.1),
					0.4
				);
			}
			const linkLines = curves.map((c) => {
				const l = new THREE.Line(
					keep(new THREE.BufferGeometry().setFromPoints(c.getPoints(40))),
					lineMat(CYAN, 0)
				);
				scene.add(l);
				return l;
			});
			const PULSES = lite ? 40 : 90;
			const pulseGeo = keep(new THREE.BufferGeometry());
			const pulsePos = new Float32Array(PULSES * 3);
			pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
			const dotTex = (() => {
				const c = document.createElement('canvas');
				c.width = c.height = 64;
				const x = c.getContext('2d');
				const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
				g.addColorStop(0, 'rgba(255,255,255,1)');
				g.addColorStop(0.3, 'rgba(120,255,240,0.8)');
				g.addColorStop(1, 'rgba(0,0,0,0)');
				x.fillStyle = g;
				x.fillRect(0, 0, 64, 64);
				return keep(new THREE.CanvasTexture(c));
			})();
			const pulseMat = keep(
				new THREE.PointsMaterial({
					size: 0.18,
					map: dotTex,
					transparent: true,
					blending: THREE.AdditiveBlending,
					depthWrite: false,
					opacity: 0
				})
			);
			scene.add(new THREE.Points(pulseGeo, pulseMat));
			const pulses = Array.from({ length: PULSES }, () => ({
				c: Math.floor(Math.random() * curves.length),
				t: Math.random(),
				v: 0.25 + Math.random() * 0.35
			}));

			// ── Polvo de luz ────────────────────────────────────────────
			const DUST = lite ? 250 : 700;
			const dustGeo = keep(new THREE.BufferGeometry());
			const dustPos = new Float32Array(DUST * 3);
			for (let i = 0; i < DUST; i++) {
				const r = 1 + Math.random() * 9;
				const a = Math.random() * Math.PI * 2;
				dustPos.set([Math.cos(a) * r, Math.random() * 9, Math.sin(a) * r], i * 3);
			}
			dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
			const dust = new THREE.Points(
				dustGeo,
				keep(
					new THREE.PointsMaterial({
						size: 0.05,
						color: CYAN,
						transparent: true,
						opacity: 0.35,
						blending: THREE.AdditiveBlending,
						depthWrite: false
					})
				)
			);
			scene.add(dust);

			// ── Proyector: cono de luz que sale de la mesa ───────────────
			const beamTex = (() => {
				const c = document.createElement('canvas');
				c.width = 4;
				c.height = 256;
				const x = c.getContext('2d');
				const g = x.createLinearGradient(0, 0, 0, 256);
				g.addColorStop(0, 'rgba(56,232,255,0)');
				g.addColorStop(1, 'rgba(56,232,255,0.2)');
				x.fillStyle = g;
				x.fillRect(0, 0, 4, 256);
				return keep(new THREE.CanvasTexture(c));
			})();
			const beam = new THREE.Mesh(
				keep(new THREE.CylinderGeometry(2.6, 0.5, 7, 48, 1, true)),
				keep(
					new THREE.MeshBasicMaterial({
						map: beamTex,
						transparent: true,
						opacity: 0,
						blending: THREE.AdditiveBlending,
						depthWrite: false,
						side: THREE.DoubleSide
					})
				)
			);
			beam.position.y = 3.5;
			scene.add(beam);

			// ── Haz de escaneo que «imprime» la estructura ──────────────
			const scan = new THREE.Mesh(keep(new THREE.RingGeometry(4.3, 4.45, 96)), holoMat(TEAL, 0));
			scan.rotation.x = -Math.PI / 2;
			scene.add(scan);

			// ── Post-proceso: bloom cinematográfico ─────────────────────
			const composer = new EffectComposer(renderer);
			composer.addPass(new RenderPass(scene, camera));
			const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), lite ? 0.55 : 0.75, 0.45, 0.22);
			composer.addPass(bloom);
			composer.addPass(new OutputPass());

			// ── Interacción ─────────────────────────────────────────────
			const mouse = new THREE.Vector2(0, 0);
			const smooth = new THREE.Vector2(0, 0);
			const ray = new THREE.Raycaster();
			let hovered = null;
			const onMove = (e) => {
				const r = host.getBoundingClientRect();
				mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
				mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
			};
			const onLeave = () => {
				mouse.set(0, 0);
				hovered = null;
			};
			const section = host.closest('section') || host;
			section.addEventListener('pointermove', onMove);
			section.addEventListener('pointerleave', onLeave);

			function resize() {
				const r = host.getBoundingClientRect();
				renderer.setSize(r.width, r.height, false);
				composer.setSize(r.width, r.height);
				camera.aspect = r.width / Math.max(1, r.height);
				if (r.width > 860)
					camera.setViewOffset(r.width, r.height, -r.width * offsetX, 0, r.width, r.height);
				else camera.clearViewOffset();
				camera.updateProjectionMatrix();
			}
			resize();
			const ro = new ResizeObserver(resize);
			ro.observe(host);
			let onScreen = true;
			const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting));
			io.observe(host);

			const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
			const t0 = performance.now();
			let last = t0;
			let raf = 0;
			const tmp = new THREE.Vector3();
			ready = true;

			function frame(now) {
				raf = requestAnimationFrame(frame);
				if (!onScreen) {
					last = now;
					return;
				}
				const dt = Math.min(0.05, (now - last) / 1000);
				last = now;
				const el = reduced ? 20 : (now - t0) / 1000;

				// Cámara: entra desde cerca y baja, luego orbita y sigue al mouse.
				smooth.lerp(mouse, 0.05);
				const intro = ease(el / 4.5);
				const ang = 0.9 + el * 0.06 + smooth.x * 0.35;
				const rad = 24 - intro * 4.5;
				const camY = 12 - intro * 5 + smooth.y * 1.2;
				camera.position.set(Math.sin(ang) * rad, camY, Math.cos(ang) * rad);
				camera.lookAt(0, 3.1, 0);

				// Ensamble de piezas.
				for (const p of pieces) {
					const k = ease((el - p.delay) / 1.4);
					p.obj.position.lerpVectors(p.from, p.home, k);
					p.obj.scale.setScalar(Math.max(0.001, k));
					p.obj.rotation.y = (1 - k) * p.spin + (p.obj === core ? el * 0.25 : 0);
				}
				coreInner.rotation.set(el * 0.6, el * 0.9, 0);
				orbits.forEach((o, k) => (o.rotation.z += dt * (0.3 + k * 0.15) * (k % 2 ? -1 : 1)));
				discs.forEach((d, k) => (d.rotation.y += dt * (k % 2 ? -0.5 : 0.4)));
				masts.forEach((m, k) => {
					const s = 1 + ((el * 1.4 + k * 0.33) % 1) * 0.6;
					m.scale.setScalar(s);
					m.material.opacity = 0.75 * (1 - ((el * 1.4 + k * 0.33) % 1));
				});
				panels.forEach((p) => {
					const a = p.userData.angle + el * 0.18;
					p.position.x = Math.cos(a) * 2.1;
					p.position.z = Math.sin(a) * 2.1;
					p.lookAt(camera.position.x, p.position.y + LAYERS[4].y, camera.position.z);
				});
				outer.rotation.z += dt * 0.15;
				beam.material.opacity = (0.6 + 0.2 * Math.sin(el * 2.2)) * ease(el / 1.5);
				table.rotation.y -= dt * 0.02;

				// Haz de escaneo durante el ensamble.
				const sk = Math.min(1, el / 3.6);
				scan.position.y = sk * 6.6;
				scan.material.opacity = el < 3.6 ? 0.9 * Math.sin(sk * Math.PI) : 0;
				scan.scale.setScalar(1 - sk * 0.55);

				// Conexiones y pulsos aparecen al terminar el ensamble.
				const linkA = ease((el - 2.8) / 1.2);
				linkLines.forEach((l) => (l.material.opacity = 0.35 * linkA));
				pulseMat.opacity = linkA;
				for (let i = 0; i < PULSES; i++) {
					const p = pulses[i];
					p.t += p.v * dt;
					if (p.t > 1) {
						p.t = 0;
						p.c = Math.floor(Math.random() * curves.length);
					}
					curves[p.c].getPoint(p.t, tmp);
					pulsePos.set([tmp.x, tmp.y, tmp.z], i * 3);
				}
				pulseGeo.attributes.position.needsUpdate = true;

				// Polvo que sube.
				for (let i = 0; i < DUST; i++) {
					let y = dustPos[i * 3 + 1] + dt * 0.18;
					if (y > 9) y = 0;
					dustPos[i * 3 + 1] = y;
				}
				dustGeo.attributes.position.needsUpdate = true;

				// Capa bajo el mouse: se levanta.
				if (el > 3.5 && !reduced) {
					ray.setFromCamera(mouse, camera);
					let best = null;
					let bestD = Infinity;
					for (const L of LAYERS) {
						const g = layerGroups[L.id];
						tmp.set(0, g.position.y, 0).project(camera);
						const d = Math.hypot(tmp.x - mouse.x, (tmp.y - mouse.y) * 1.4);
						if (d < bestD) {
							bestD = d;
							best = L.id;
						}
					}
					hovered = bestD < 0.22 && (mouse.x !== 0 || mouse.y !== 0) ? best : null;
				}
				for (const L of LAYERS) {
					const g = layerGroups[L.id];
					g.userData.lift += ((hovered === L.id ? 0.45 : 0) - g.userData.lift) * 0.12;
					g.position.y = L.y + g.userData.lift;
				}

				composer.render();

				// Etiquetas proyectadas.
				const r = host.getBoundingClientRect();
				const showTags = el > 3.4;
				const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
				tags = LAYERS.map((L, i) => {
					const g = layerGroups[L.id];
					const rad2 = [4.4, 2.9, 2.3, 1.9, 3.2][i];
					// Ancla en el borde derecho (visto desde la cámara) de cada capa.
					tmp.set(0, g.position.y, 0).addScaledVector(right, rad2).project(camera);
					return {
						label: L.label,
						// Sin salirse por la orilla derecha.
						x: Math.min(((tmp.x + 1) / 2) * r.width, r.width - 200),
						y: ((1 - tmp.y) / 2) * r.height,
						on: showTags,
						hot: hovered === L.id,
						d: i * 0.12
					};
				});
			}
			raf = requestAnimationFrame(frame);

			cleanup = () => {
				cancelAnimationFrame(raf);
				ro.disconnect();
				io.disconnect();
				section.removeEventListener('pointermove', onMove);
				section.removeEventListener('pointerleave', onLeave);
				for (const d of disposables) d.dispose?.();
				composer.dispose?.();
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

<div class="hf" class:ready bind:this={host} aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
	{#each tags as t (t.label)}
		<span
			class="hf-tag"
			class:on={t.on}
			class:hot={t.hot}
			style="left:{t.x}px; top:{t.y}px; --d:{t.d}s"><i></i>{t.label}</span
		>
	{/each}
</div>

<style>
	.hf {
		position: absolute;
		inset: 0;
		overflow: hidden;
		opacity: 0;
		transition: opacity 1.2s ease;
	}
	.hf.ready {
		opacity: 1;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	.hf-tag {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		translate: 34px -50%;
		padding: 0.25rem 0.7rem 0.25rem 0.35rem;
		border-radius: 999px;
		background: rgba(2, 12, 18, 0.55);
		box-shadow: inset 0 0 0 1px rgba(56, 232, 255, 0.35);
		font:
			600 0.72rem/1 Outfit,
			system-ui,
			sans-serif;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(190, 245, 255, 0.85);
		white-space: nowrap;
		opacity: 0;
		transition:
			opacity 0.6s ease var(--d),
			box-shadow 0.3s ease,
			color 0.3s ease;
		pointer-events: none;
	}
	.hf-tag::before {
		content: '';
		position: absolute;
		right: 100%;
		top: 50%;
		width: 34px;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(56, 232, 255, 0.7));
	}
	.hf-tag i {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #38e8ff;
		box-shadow: 0 0 8px #38e8ff;
	}
	.hf-tag.on {
		opacity: 1;
	}
	@media (max-width: 860px) {
		.hf-tag {
			display: none;
		}
	}
	.hf-tag.hot {
		color: #fff;
		box-shadow:
			inset 0 0 0 1px rgba(0, 255, 198, 0.9),
			0 0 18px rgba(0, 255, 198, 0.35);
	}
</style>
