<script>
	import { onMount } from 'svelte';

	/**
	 * Efecto de mosaico que se desplaza alrededor del mouse. `source` puede ser
	 * un <video> o un <canvas> (por ejemplo, el shader de aurora del hero).
	 */
	let {
		source = null,
		opacity = 0.58,
		tileW = 72,
		tileH = 58,
		radius = 420,
		/** Desenfoque (px) de los cuadros desplazados; 0 = sin desenfoque. */
		blur = 0,
		/** Segunda fuente animada (lienzo) mezclada en modo pantalla sobre la primera. */
		overlay = null,
		overlayAlpha = 0.5
	} = $props();

	let canvas;

	onMount(() => {
		const videoEl = source || document.querySelector('video.hero-bg-video');
		if (!videoEl) return;
		const isVideo = videoEl instanceof HTMLVideoElement;
		const isImage = videoEl instanceof HTMLImageElement;

		const ctx = canvas.getContext('2d');
		const buf = document.createElement('canvas');
		const bctx = buf.getContext('2d');

		const TILE_W = tileW;
		const TILE_H = tileH;
		const MAX_OX = 220 * (tileW / 72);
		const MAX_OY = 170 * (tileH / 58);
		const EFFECT_R = radius;
		// Capa de los cuadros desplazados: se desenfoca de una sola vez.
		const fx = document.createElement('canvas');
		const fctx = fx.getContext('2d');

		let mouseX = -9999,
			mouseY = -9999;
		let glitchActive = 0,
			glitchTarget = 0;
		let tiles = [];
		let cw = 0,
			ch = 0;
		let animId;

		function buildTiles(w, h) {
			tiles = [];
			const cols = Math.ceil(w / TILE_W) + 1;
			const rows = Math.ceil(h / TILE_H) + 1;
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					tiles.push({
						x: c * TILE_W,
						y: r * TILE_H,
						cx: c * TILE_W + TILE_W * 0.5,
						cy: r * TILE_H + TILE_H * 0.5,
						// Fixed random offsets per tile — where to sample from
						ox: (Math.random() - 0.5) * MAX_OX * 2,
						oy: (Math.random() - 0.5) * MAX_OY * 2,
						// Alcance propio de cada cuadro: el área del efecto no es un círculo.
						k: 0.45 + Math.random() * 0.95
					});
				}
			}
		}

		function resize() {
			const rect = canvas.parentElement?.getBoundingClientRect();
			if (!rect) return;
			cw = canvas.width = fx.width = Math.round(rect.width);
			ch = canvas.height = fx.height = Math.round(rect.height);
			buildTiles(cw, ch);
		}
		resize();

		// Listen on the hero section so events bubble through the PIXI canvas above
		const hero = canvas.closest('section') || document.body;

		const onMove = (e) => {
			const r = canvas.getBoundingClientRect();
			mouseX = e.clientX - r.left;
			mouseY = e.clientY - r.top;
			glitchTarget = 1;
		};
		const onLeave = () => {
			glitchTarget = 0;
		};

		hero.addEventListener('mousemove', onMove);
		hero.addEventListener('mouseleave', onLeave);
		window.addEventListener('resize', resize);

		function drawFrame() {
			animId = requestAnimationFrame(drawFrame);
			if (!videoEl || (isVideo && videoEl.readyState < 2) || !cw || !ch) return;
			if (isImage && !videoEl.complete) return;

			// Replicate object-fit:cover into the buffer
			buf.width = cw;
			buf.height = ch;
			const vw = isVideo ? videoEl.videoWidth : isImage ? videoEl.naturalWidth : videoEl.width,
				vh = isVideo ? videoEl.videoHeight : isImage ? videoEl.naturalHeight : videoEl.height;
			if (!vw || !vh) return;

			const vr = vw / vh,
				cr = cw / ch;
			let srcX, srcY, srcW, srcH;
			if (vr > cr) {
				// video wider: crop left/right
				srcH = vh;
				srcW = srcH * cr;
				srcX = (vw - srcW) * 0.5;
				srcY = 0;
			} else {
				// video taller: crop top/bottom
				srcW = vw;
				srcH = srcW / cr;
				srcX = 0;
				srcY = (vh - srcH) * 0.5;
			}
			bctx.drawImage(videoEl, srcX, srcY, srcW, srcH, 0, 0, cw, ch);
			if (overlay && overlay.width && overlay.height) {
				bctx.globalCompositeOperation = 'screen';
				bctx.globalAlpha = overlayAlpha;
				bctx.drawImage(overlay, 0, 0, cw, ch);
				bctx.globalAlpha = 1;
				bctx.globalCompositeOperation = 'source-over';
			}

			// Smooth ease in/out
			glitchActive += (glitchTarget - glitchActive) * 0.12;

			ctx.clearRect(0, 0, cw, ch);

			if (glitchActive < 0.015) {
				ctx.drawImage(buf, 0, 0);
				return;
			}

			if (blur > 0) {
				drawBlurred();
				return;
			}

			// Dark background shows through tile gaps
			ctx.fillStyle = 'rgba(0,0,6,1)';
			ctx.fillRect(0, 0, cw, ch);

			for (const t of tiles) {
				const dist = Math.hypot(t.cx - mouseX, t.cy - mouseY);
				const prox = Math.max(0, 1 - dist / EFFECT_R);
				const str = prox * glitchActive;

				// Sample from displaced position in buffer
				const srcTX = Math.max(0, Math.min(t.x + t.ox * str, cw - TILE_W));
				const srcTY = Math.max(0, Math.min(t.y + t.oy * str, ch - TILE_H));

				// Shrink tile slightly when displaced → visible dark gaps
				const gap = str * 10;
				const dstX = t.x + gap * 0.5;
				const dstY = t.y + gap * 0.5;
				const dstW = Math.max(1, TILE_W - gap);
				const dstH = Math.max(1, TILE_H - gap);

				ctx.drawImage(buf, srcTX, srcTY, TILE_W, TILE_H, dstX, dstY, dstW, dstH);
			}
		}

		/**
		 * Variante con desenfoque, como el original: cada cuadro cercano al cursor
		 * se desplaza y se encoge dejando huecos negros nítidos; solo el contenido
		 * de los cuadros se ve desenfocado.
		 */
		function drawBlurred() {
			ctx.drawImage(buf, 0, 0);
			// Copia desenfocada del fondo, de una sola pasada.
			fctx.clearRect(0, 0, cw, ch);
			fctx.filter = `blur(${blur}px)`;
			fctx.drawImage(buf, 0, 0);
			fctx.filter = 'none';
			const maxGap = Math.max(4, TILE_W * 0.16);
			for (const t of tiles) {
				const dist = Math.hypot(t.cx - mouseX, t.cy - mouseY);
				const str = Math.max(0, 1 - dist / (EFFECT_R * t.k)) * glitchActive;
				if (str < 0.01) continue;
				const srcTX = Math.max(0, Math.min(t.x + t.ox * str, cw - TILE_W));
				const srcTY = Math.max(0, Math.min(t.y + t.oy * str, ch - TILE_H));
				const gap = str * maxGap;
				const dx = t.x + gap / 2;
				const dy = t.y + gap / 2;
				const dw = Math.max(1, TILE_W - gap);
				const dh = Math.max(1, TILE_H - gap);
				// Hueco negro que crece con la intensidad, como en el original.
				ctx.fillStyle = '#000006';
				ctx.fillRect(t.x, t.y, TILE_W, TILE_H);
				ctx.drawImage(buf, srcTX, srcTY, TILE_W, TILE_H, dx, dy, dw, dh);
				// El desenfoque entra en proporción a la intensidad.
				ctx.globalAlpha = Math.min(1, str * 1.6);
				ctx.drawImage(fx, srcTX, srcTY, TILE_W, TILE_H, dx, dy, dw, dh);
				ctx.globalAlpha = 1;
			}
		}

		drawFrame();

		return () => {
			cancelAnimationFrame(animId);
			hero.removeEventListener('mousemove', onMove);
			hero.removeEventListener('mouseleave', onLeave);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<canvas bind:this={canvas} class="glitch-canvas" style="opacity:{opacity}"></canvas>

<style>
	.glitch-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		pointer-events: none;
		filter: contrast(1.08) saturate(0.82);
	}
</style>
