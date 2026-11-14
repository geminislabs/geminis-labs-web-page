<script>
	import { onMount, onDestroy } from 'svelte';

	let wrap;
	let pixiCanvas;

	// `onMount` async no puede devolver la limpieza (Svelte la ignora): la
	// escena se apaga en `onDestroy`, y si el componente se desmonta mientras
	// la escena todavía se arma, se apaga en cuanto termina.
	let destroyed = false;
	let teardown = null;

	onDestroy(() => {
		destroyed = true;
		teardown?.();
	});

	onMount(async () => {
		if (typeof window === 'undefined' || !wrap) return;

		const PIXI = await import('pixi.js');
		if (destroyed) return;

		const W = wrap.clientWidth || window.innerWidth;
		const H = wrap.clientHeight || window.innerHeight;
		if (W === 0 || H === 0) return;

		const isMobile = W < 768;

		// pixi 8: el renderer se crea con `init()`, que es async.
		const app = new PIXI.Application();
		await app.init({
			width: W,
			height: H,
			canvas: pixiCanvas,
			backgroundAlpha: 0,
			resolution: Math.min(window.devicePixelRatio || 1, 2),
			autoDensity: true,
			antialias: false,
			powerPreference: 'high-performance'
		});
		// Sin `textureSource`: pixi 8 avisa si se destruye una fuente aún ligada al
		// shader. Las dos texturas son canvas de 4 y 16 px.
		const destroyApp = () => app.destroy(false, { children: true, texture: true });
		if (destroyed) {
			destroyApp();
			return;
		}

		const bgContainer = new PIXI.Container();
		const fxContainer = new PIXI.Container();
		const logoContainer = new PIXI.Container();
		app.stage.addChild(bgContainer);
		app.stage.addChild(fxContainer);
		app.stage.addChild(logoContainer);

		// ── MOUSE ──────────────────────────────────────────────────────
		let mouseX = W * 0.7,
			mouseY = H * 0.44;
		let smoothX = mouseX,
			smoothY = mouseY;
		const onMove = (e) => {
			const r = wrap.getBoundingClientRect();
			mouseX = e.clientX - r.left;
			mouseY = e.clientY - r.top;
		};
		const onTouch = (e) => {
			const r = wrap.getBoundingClientRect();
			mouseX = e.touches[0].clientX - r.left;
			mouseY = e.touches[0].clientY - r.top;
		};
		wrap.addEventListener('mousemove', onMove);
		wrap.addEventListener('touchmove', onTouch, { passive: true });
		let onResize = null;
		teardown = () => {
			teardown = null;
			wrap?.removeEventListener('mousemove', onMove);
			wrap?.removeEventListener('touchmove', onTouch);
			if (onResize) window.removeEventListener('resize', onResize);
			destroyApp();
		};

		// ── HELPERS ────────────────────────────────────────────────────
		const rng = (a, b) => a + Math.random() * (b - a);
		const lerpColor = (c1, c2, t) => {
			const r1 = (c1 >> 16) & 0xff,
				g1 = (c1 >> 8) & 0xff,
				b1 = c1 & 0xff;
			const r2 = (c2 >> 16) & 0xff,
				g2 = (c2 >> 8) & 0xff,
				b2 = c2 & 0xff;
			return (
				(Math.round(r1 + (r2 - r1) * t) << 16) |
				(Math.round(g1 + (g2 - g1) * t) << 8) |
				Math.round(b1 + (b2 - b1) * t)
			);
		};

		// ── TEXTURES ───────────────────────────────────────────────────
		const makeDot = (size) => {
			const c = document.createElement('canvas');
			c.width = c.height = size;
			const ctx = c.getContext('2d');
			ctx.fillStyle = '#ffffff';
			ctx.beginPath();
			ctx.arc(size / 2, size / 2, size / 2 - 0.3, 0, Math.PI * 2);
			ctx.fill();
			return PIXI.Texture.from(c);
		};
		const makeGlow = (size) => {
			const c = document.createElement('canvas');
			c.width = c.height = size;
			const ctx = c.getContext('2d');
			const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
			g.addColorStop(0, 'rgba(255,255,255,1)');
			g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
			g.addColorStop(1, 'rgba(255,255,255,0)');
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, size, size);
			return PIXI.Texture.from(c);
		};
		const partTex = makeDot(4);
		const nodeTex = makeGlow(16);

		// ── AMBIENT DATA NETWORK ───────────────────────────────────────
		const nodeCount = isMobile ? 35 : 60;
		const bgNodes = Array.from({ length: nodeCount }, () => ({
			x: rng(10, W - 10),
			y: rng(10, H - 10),
			size: rng(2, 5),
			baseAlpha: rng(0.03, 0.08),
			pulseOffset: rng(0, Math.PI * 2),
			pulseSpeed: rng(0.2, 0.55)
		}));
		const lineG = new PIXI.Graphics();
		const CONN_D = Math.min(W, H) * 0.14,
			CONN_D2 = CONN_D * CONN_D;
		for (let i = 0; i < bgNodes.length; i++)
			for (let j = i + 1; j < bgNodes.length; j++) {
				const dx = bgNodes[i].x - bgNodes[j].x,
					dy = bgNodes[i].y - bgNodes[j].y,
					d2 = dx * dx + dy * dy;
				if (d2 < CONN_D2) {
					const p = 1 - Math.sqrt(d2) / CONN_D;
					// pixi 8: el trazo se declara después del camino.
					lineG
						.moveTo(bgNodes[i].x, bgNodes[i].y)
						.lineTo(bgNodes[j].x, bgNodes[j].y)
						.stroke({ width: 0.5, color: 0x00d4aa, alpha: p * 0.06 });
				}
			}
		bgContainer.addChild(lineG);
		// pixi 8: un ParticleContainer lleva `Particle`, no `Sprite`. `color`
		// dinámico porque el alpha cambia en cada cuadro.
		const bgNodePC = new PIXI.ParticleContainer({
			texture: nodeTex,
			dynamicProperties: { position: false, color: true }
		});
		bgContainer.addChild(bgNodePC);
		const bgNodeSprites = bgNodes.map((n) => {
			const s = new PIXI.Particle({
				texture: nodeTex,
				x: n.x,
				y: n.y,
				anchorX: 0.5,
				anchorY: 0.5,
				scaleX: n.size / 16,
				scaleY: n.size / 16,
				alpha: n.baseAlpha,
				tint: 0x00d4aa
			});
			bgNodePC.addParticle(s);
			return { ...n, sprite: s };
		});

		// ── LOGO GEOMETRY ──────────────────────────────────────────────
		const logoSize = Math.min(W, H) * (isMobile ? 0.416 : 0.52);
		// Margen fijo desde el borde derecho: el logo queda siempre pegado a la derecha
		const logoMargin = Math.min(W, H) * (isMobile ? 0.06 : 0.04);
		const logoCYFactor = isMobile ? 0.38 : 0.44;
		let logoCX = W - logoSize / 2 - logoMargin;
		let logoCY = H * logoCYFactor;
		const maxLogoR = logoSize * 0.4;

		let globalRot = 0;

		// ── LOGO SAMPLING ──────────────────────────────────────────────
		const SAMPLE_RES = 512,
			STEP = isMobile ? 5 : 3;
		const logoSrcList = [];
		await new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				const sc = document.createElement('canvas');
				sc.width = sc.height = SAMPLE_RES;
				const sctx = sc.getContext('2d');
				sctx.drawImage(img, 0, 0, SAMPLE_RES, SAMPLE_RES);
				const px = sctx.getImageData(0, 0, SAMPLE_RES, SAMPLE_RES).data;
				const lx = logoCX - logoSize / 2,
					ly = logoCY - logoSize / 2;
				for (let y = 0; y < SAMPLE_RES; y += STEP)
					for (let x = 0; x < SAMPLE_RES; x += STEP) {
						const idx = (y * SAMPLE_RES + x) * 4;
						if (px[idx + 3] > 50)
							logoSrcList.push({
								x: lx + (x / SAMPLE_RES) * logoSize,
								y: ly + (y / SAMPLE_RES) * logoSize
							});
					}
				resolve();
			};
			img.onerror = resolve;
			img.src = '/img/geminislabs-nobg.webp';
		});
		if (destroyed) return;
		if (logoSrcList.length === 0) return;

		// ── LOGO PARTICLES ─────────────────────────────────────────────
		const logoPC = new PIXI.ParticleContainer({
			texture: partTex,
			dynamicProperties: { position: true, color: true }
		});
		logoContainer.addChild(logoPC);

		const logoParticles = logoSrcList.map((s) => {
			const dx = s.x - logoCX,
				dy = s.y - logoCY;
			const r = Math.sqrt(dx * dx + dy * dy);
			const baseAngle = Math.atan2(dy, dx);
			const colorT = Math.min(r / maxLogoR, 1);

			const edgeFade =
				r > maxLogoR * 0.68
					? Math.max(0, 1 - Math.pow((r - maxLogoR * 0.68) / (maxLogoR * 0.32), 1.1))
					: 1.0;
			const baseAlpha = Math.max(0.1, (0.88 - colorT * 0.22 + rng(-0.05, 0.08)) * edgeFade);

			const sprite = new PIXI.Particle({
				texture: partTex,
				x: s.x,
				y: s.y,
				anchorX: 0.5,
				anchorY: 0.5,
				alpha: baseAlpha,
				tint: lerpColor(0x00ff7a, 0x00c8ff, colorT)
			});
			logoPC.addParticle(sprite);

			// Each particle breathes independently
			const driftAmp = rng(1.8, 5.0);
			const driftFreq = rng(0.35, 0.95);
			const driftPhX = rng(0, Math.PI * 2);
			const driftPhY = rng(0, Math.PI * 2);

			return {
				sprite,
				r,
				baseAngle,
				x: s.x,
				y: s.y,
				vx: 0,
				vy: 0,
				baseAlpha,
				driftAmp,
				driftFreq,
				driftPhX,
				driftPhY
			};
		});

		// ── FLOATING DATA PARTICLES ────────────────────────────────────
		// Sparse bright motes drifting upward across the scene
		const DATA_COUNT = isMobile ? 28 : 55;
		const dataPC = new PIXI.ParticleContainer({
			texture: partTex,
			dynamicProperties: { position: true, color: true }
		});
		fxContainer.addChild(dataPC);

		const dataBits = Array.from({ length: DATA_COUNT }, () => {
			const scale = rng(0.25, 0.8);
			const s = new PIXI.Particle({
				texture: partTex,
				x: rng(0, W),
				y: rng(0, H),
				anchorX: 0.5,
				anchorY: 0.5,
				scaleX: scale,
				scaleY: scale,
				tint: Math.random() < 0.6 ? 0x00ffaa : 0x0099ff,
				alpha: rng(0.05, 0.2)
			});
			dataPC.addParticle(s);
			return {
				sprite: s,
				x: s.x,
				y: s.y,
				vy: -rng(0.12, 0.45),
				vx: rng(-0.06, 0.06),
				phaseOff: rng(0, Math.PI * 2),
				blinkSpeed: rng(0.4, 1.8)
			};
		});

		// ── TICKER ─────────────────────────────────────────────────────
		const PARALLAX = isMobile ? 0.25 : 1.0;
		const ATTR_R = Math.min(W, H) * 0.34;

		app.ticker.add(() => {
			const t = performance.now() * 0.001;
			globalRot += 0.00038;

			smoothX += (mouseX - smoothX) * 0.04;
			smoothY += (mouseY - smoothY) * 0.04;
			const nx = (smoothX / W - 0.5) * PARALLAX;
			const ny = (smoothY / H - 0.5) * PARALLAX;
			bgContainer.x = nx * -14;
			bgContainer.y = ny * -9;
			fxContainer.x = nx * -26;
			fxContainer.y = ny * -16;
			logoContainer.x = nx * -36;
			logoContainer.y = ny * -24;

			// Ambient node pulse
			for (let i = 0; i < bgNodeSprites.length; i++) {
				const ns = bgNodeSprites[i];
				const pulse = (Math.sin(t * ns.pulseSpeed + ns.pulseOffset) + 1) * 0.5;
				ns.sprite.alpha = Math.max(0, ns.baseAlpha * (0.3 + pulse * 0.7));
			}

			// Floating data bits
			for (let i = 0; i < dataBits.length; i++) {
				const d = dataBits[i];
				d.x += d.vx;
				d.y += d.vy;
				if (d.y < -10) {
					d.y = H + 10;
					d.x = rng(0, W);
				}
				if (d.x < -10 || d.x > W + 10) {
					d.x = rng(0, W);
					d.y = rng(0, H);
				}
				const blink = (Math.sin(t * d.blinkSpeed + d.phaseOff) + 1) * 0.5;
				d.sprite.x = d.x;
				d.sprite.y = d.y;
				d.sprite.alpha = 0.035 + blink * 0.16;
			}

			// Logo particles — orbit + breathing drift + mouse
			for (let i = 0; i < logoParticles.length; i++) {
				const p = logoParticles[i];
				const ang = p.baseAngle + globalRot;
				const tx = logoCX + Math.cos(ang) * p.r;
				const ty = logoCY + Math.sin(ang) * p.r;

				const bx = Math.sin(t * p.driftFreq + p.driftPhX) * p.driftAmp;
				const by = Math.cos(t * p.driftFreq + p.driftPhY) * p.driftAmp;

				p.vx += (tx + bx - p.x) * 0.02;
				p.vy += (ty + by - p.y) * 0.02;

				const ddx = mouseX - p.x,
					ddy = mouseY - p.y;
				const dist = Math.sqrt(ddx * ddx + ddy * ddy) + 0.5;
				if (dist < ATTR_R) {
					const f = 0.3 * (1 - dist / ATTR_R);
					p.vx += (ddx / dist) * f;
					p.vy += (ddy / dist) * f;
				}
				p.vx *= 0.865;
				p.vy *= 0.865;
				p.x += p.vx;
				p.y += p.vy;
				p.sprite.x = p.x;
				p.sprite.y = p.y;

				const pulse = (Math.sin(t * p.driftFreq * 0.6 + p.driftPhX) + 1) * 0.5;
				p.sprite.alpha = p.baseAlpha * (0.72 + pulse * 0.28);
			}
		});

		onResize = () => {
			if (!app?.renderer || !wrap) return;
			const nw = wrap.clientWidth,
				nh = wrap.clientHeight;
			app.renderer.resize(nw, nh);
			// Mantener el logo pegado a la derecha (mismo tamaño, solo se reubica el centro)
			logoCX = nw - logoSize / 2 - logoMargin;
			logoCY = nh * logoCYFactor;
		};
		window.addEventListener('resize', onResize);
	});
</script>

<div bind:this={wrap} class="hero-canvas-wrap">
	<canvas bind:this={pixiCanvas}></canvas>
</div>

<style>
	.hero-canvas-wrap {
		position: absolute;
		inset: 0;
		z-index: 3;
		pointer-events: all;
	}

	.hero-canvas-wrap :global(canvas) {
		display: block;
		position: absolute;
		inset: 0;
		width: 100% !important;
		height: 100% !important;
	}
</style>
