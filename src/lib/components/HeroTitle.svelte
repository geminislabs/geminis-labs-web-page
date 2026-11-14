<script>
	import { onMount, onDestroy } from 'svelte';

	let canvas;

	// `onMount` async no puede devolver la limpieza (Svelte la ignora): sin
	// esto, el bucle de `requestAnimationFrame` seguía al salir de la portada.
	let destroyed = false;
	let teardown = null;

	onDestroy(() => {
		destroyed = true;
		teardown?.();
	});

	onMount(async () => {
		if (typeof window === 'undefined' || !canvas) return;

		// Wait for custom fonts (Dune Rise, etc.)
		await document.fonts.ready;
		if (destroyed) return;

		const ctx = canvas.getContext('2d');
		const buf1 = document.createElement('canvas'); // text 1
		const buf2 = document.createElement('canvas'); // text 2
		const b1c = buf1.getContext('2d');
		const b2c = buf2.getContext('2d');

		const LINES1 = ['CONECTAMOS', 'HUMANIDAD Y TECNOLOGÍA'];
		const LINES2 = ['CREAMOS TECNOLOGÍA', 'QUE POTENCIA A LA HUMANIDAD'];

		const TILE_W = 72;
		const TILE_H = 58;
		const LINE_H = 1.28;
		const SCRAMBLE_WIN = 0.13; // fraction of glitchActive around flipAt where scramble shows

		let cw = 0,
			ch = 0,
			fontSize = 38;
		let glitchActive = 0,
			glitchTarget = 0;
		let tiles = [];
		let animId;

		function fontStr(size) {
			return `normal ${size}px 'Dune Rise', Inter, -apple-system, BlinkMacSystemFont, sans-serif`;
		}

		function setLetterSpacing(c) {
			try {
				c.letterSpacing = '0.02em';
			} catch {
				// Some canvas contexts do not support letterSpacing.
			}
		}

		function computeLayout() {
			fontSize = Math.min(Math.max(window.innerWidth * 0.032, 22.4), 38.4);
			ctx.font = fontStr(fontSize);
			setLetterSpacing(ctx);
			const allLines = [...LINES1, ...LINES2];
			const maxW = Math.max(...allLines.map((l) => ctx.measureText(l).width));
			cw = Math.ceil(maxW) + 10;
			ch = Math.ceil(LINES1.length * fontSize * LINE_H) + 10;
		}

		function renderBuf(bufCtx, lines) {
			bufCtx.clearRect(0, 0, cw, ch);
			bufCtx.font = fontStr(fontSize);
			setLetterSpacing(bufCtx);
			bufCtx.textBaseline = 'top';
			const grad = bufCtx.createLinearGradient(0, 0, cw, ch);
			grad.addColorStop(0, '#f5f0e8');
			grad.addColorStop(1, '#00a6c0');
			bufCtx.fillStyle = grad;
			lines.forEach((line, i) => {
				bufCtx.fillText(line, 3, i * fontSize * LINE_H + 3);
			});
		}

		function buildTiles() {
			tiles = [];
			const cols = Math.ceil(cw / TILE_W) + 1;
			const rows = Math.ceil(ch / TILE_H) + 1;
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					tiles.push({
						x: c * TILE_W,
						y: r * TILE_H,
						ox: (Math.random() - 0.5) * 36,
						oy: (Math.random() - 0.5) * 24,
						flipAt: 0.15 + Math.random() * 0.7 // staggered flip point per tile
					});
				}
			}
		}

		function rebuild() {
			computeLayout();
			canvas.width = buf1.width = buf2.width = cw;
			canvas.height = buf1.height = buf2.height = ch;
			renderBuf(b1c, LINES1);
			renderBuf(b2c, LINES2);
			buildTiles();
		}

		rebuild();

		// Listen only on the title canvas itself
		let leaveTimer = null;
		const onMove = () => {
			if (leaveTimer) {
				clearTimeout(leaveTimer);
				leaveTimer = null;
			}
			glitchTarget = 1;
		};
		const onLeave = () => {
			leaveTimer = setTimeout(() => {
				glitchTarget = 0;
				leaveTimer = null;
			}, 1000);
		};
		canvas.addEventListener('mousemove', onMove);
		canvas.addEventListener('mouseleave', onLeave);
		window.addEventListener('resize', rebuild);

		function draw() {
			animId = requestAnimationFrame(draw);
			glitchActive += (glitchTarget - glitchActive) * 0.065;

			ctx.clearRect(0, 0, cw, ch);

			// Fast paths for fully at-rest or fully active states
			if (glitchActive < 0.01) {
				ctx.drawImage(buf1, 0, 0);
				return;
			}
			if (glitchActive > 0.99) {
				ctx.drawImage(buf2, 0, 0);
				return;
			}

			for (const t of tiles) {
				const flipped = glitchActive > t.flipAt;
				const dist = Math.abs(glitchActive - t.flipAt);

				if (dist >= SCRAMBLE_WIN) {
					// Fully in either state: draw cleanly
					ctx.drawImage(flipped ? buf2 : buf1, t.x, t.y, TILE_W, TILE_H, t.x, t.y, TILE_W, TILE_H);
				} else {
					// Scramble window: displaced tile from target buffer
					const scramble = 1 - dist / SCRAMBLE_WIN; // peaks at 1 when at exact flipAt
					const src = flipped ? buf2 : buf1;
					const srcX = Math.max(0, Math.min(t.x + t.ox * scramble, cw - TILE_W));
					const srcY = Math.max(0, Math.min(t.y + t.oy * scramble, ch - TILE_H));
					ctx.globalAlpha = 0.45 + 0.55 * (1 - scramble);
					ctx.drawImage(src, srcX, srcY, TILE_W, TILE_H, t.x, t.y, TILE_W, TILE_H);
					ctx.globalAlpha = 1;
				}
			}
		}

		draw();

		teardown = () => {
			cancelAnimationFrame(animId);
			if (leaveTimer) clearTimeout(leaveTimer);
			canvas.removeEventListener('mousemove', onMove);
			canvas.removeEventListener('mouseleave', onLeave);
			window.removeEventListener('resize', rebuild);
		};
	});
</script>

<canvas bind:this={canvas} class="hero-title-canvas"></canvas>

<style>
	.hero-title-canvas {
		display: block;
		max-width: 100%;
		pointer-events: all;
		cursor: default;
		position: relative;
		z-index: 11; /* por encima del overlay para recibir eventos */
	}
</style>
