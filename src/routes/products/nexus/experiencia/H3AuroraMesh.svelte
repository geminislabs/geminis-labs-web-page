<script>
	/**
	 * Port web del fondo de la app INexus (NexusH3AuroraMeshView.swift):
	 * aurora fluida de 7 focos (incluye 2 «sombras» negras) con desenfoque
	 * amplio, velo negro, micro-malla hexagonal H3 negra y máscara de olas
	 * líquidas difuminadas abajo (y bóveda superior opcional). Mismos colores
	 * de marca y mismas fórmulas de movimiento.
	 */
	import { onMount } from 'svelte';

	let {
		startYRatio = 0.62,
		topCanopy = true,
		topCanopyRatio = 0.16,
		amplitude = 18,
		hexRadius = 5.2,
		lineWidth = 0.7,
		gridOpacity = 0.85,
		flowSpeed = 0.8,
		reduced = false
	} = $props();

	const PRIMARY = '108,190,71'; // #6CBE47
	const BRIGHT = '141,205,81'; // #8DCD51
	const DEEP = '79,175,56'; // #4FAF38
	const CYAN = '0,229,255'; // #00E5FF
	const HOT = '200,245,170';

	let host = $state(null);
	let canvas = $state(null);

	onMount(() => {
		const ctx = canvas.getContext('2d');
		const aurora = document.createElement('canvas');
		const actx = aurora.getContext('2d');
		const mask = document.createElement('canvas');
		const mctx = mask.getContext('2d');
		const content = document.createElement('canvas');
		const cctx = content.getContext('2d');
		let grid = null;
		let W = 0;
		let H = 0;
		let dpr = 1;
		let raf = 0;
		const LOW = 0.25; // aurora y máscara a baja resolución (se desenfocan igual)

		function resize() {
			const r = host.getBoundingClientRect();
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			W = r.width;
			H = r.height;
			for (const c of [canvas, content]) {
				c.width = Math.round(W * dpr);
				c.height = Math.round(H * dpr);
			}
			aurora.width = mask.width = Math.max(2, Math.round(W * LOW));
			aurora.height = mask.height = Math.max(2, Math.round(H * LOW));
			buildGrid();
		}

		/** Micro-malla H3: hexágonos negros finos, precalculados una vez. */
		function buildGrid() {
			grid = document.createElement('canvas');
			grid.width = canvas.width;
			grid.height = canvas.height;
			const g = grid.getContext('2d');
			g.setTransform(dpr, 0, 0, dpr, 0, 0);
			const r = hexRadius;
			const hw = Math.sqrt(3) * r;
			const vStep = 1.5 * r;
			g.beginPath();
			const rows = Math.ceil(H / vStep) + 2;
			const cols = Math.ceil(W / hw) + 2;
			for (let row = -1; row <= rows; row++) {
				const y = row * vStep;
				const xo = row % 2 !== 0 ? hw / 2 : 0;
				for (let col = -1; col <= cols; col++) {
					const x = col * hw + xo;
					for (let i = 0; i < 6; i++) {
						const a = ((i * 60 - 30) * Math.PI) / 180;
						const px = x + r * Math.cos(a);
						const py = y + r * Math.sin(a);
						if (i === 0) g.moveTo(px, py);
						else g.lineTo(px, py);
					}
					g.closePath();
				}
			}
			g.strokeStyle = `rgba(0,0,0,${gridOpacity})`;
			g.lineWidth = lineWidth;
			g.lineJoin = 'round';
			g.stroke();
		}

		function blob(x, y, radius, rgb, a) {
			actx.fillStyle = `rgba(${rgb},${a})`;
			actx.beginPath();
			actx.arc(x, y, radius, 0, Math.PI * 2);
			actx.fill();
		}

		function drawAurora(t) {
			const w = aurora.width;
			const h = aurora.height;
			const m = Math.min(w, h);
			actx.filter = 'none';
			actx.fillStyle = '#000';
			actx.fillRect(0, 0, w, h);
			actx.filter = `blur(${Math.max(45 * LOW, m * 0.18)}px)`;
			if (topCanopy) {
				const topY = h * 0.06;
				const span = h * 0.03;
				blob(
					w * (0.5 + 0.28 * Math.cos(t * 0.26)),
					topY + span * Math.sin(t * 0.22),
					m * 0.42,
					PRIMARY,
					0.85
				);
				blob(
					w * (0.8 + 0.18 * Math.sin(t * 0.3)),
					topY + span * Math.cos(t * 0.24),
					m * 0.35,
					CYAN,
					0.6
				);
				blob(
					w * (0.28 + 0.2 * Math.sin(t * 0.24 + 1.8)),
					topY + span * Math.cos(t * 0.28),
					m * 0.3,
					'0,0,0',
					0.92
				);
			}
			const baseY = h * (startYRatio + 0.15);
			const ySpan = h * (1 - startYRatio) * 0.4;
			blob(
				w * (0.5 + 0.35 * Math.sin(t * 0.3)),
				baseY + ySpan * Math.cos(t * 0.24),
				m * 0.55,
				PRIMARY,
				0.95
			);
			blob(
				w * (0.34 + 0.3 * Math.cos(t * 0.26 + 1.8)),
				baseY + ySpan * Math.sin(t * 0.32 + 1.2),
				m * 0.48,
				BRIGHT,
				0.9
			);
			blob(
				w * (0.54 + 0.3 * Math.sin(t * 0.22 + 3.8)),
				baseY + ySpan * Math.cos(t * 0.28 + 2.5),
				m * 0.44,
				'0,0,0',
				0.96
			);
			blob(
				w * (0.68 + 0.28 * Math.cos(t * 0.33 + 0.6)),
				baseY + ySpan * Math.sin(t * 0.25 + 3.0),
				m * 0.5,
				DEEP,
				0.85
			);
			blob(
				w * (0.22 + 0.25 * Math.sin(t * 0.28 + 1.2)),
				baseY + ySpan * Math.cos(t * 0.35 + 0.4),
				m * 0.45,
				CYAN,
				0.7
			);
			blob(
				w * (0.42 + 0.3 * Math.cos(t * 0.35 + 4.5)),
				baseY + ySpan * Math.sin(t * 0.22 + 1.6),
				m * 0.4,
				'0,0,0',
				0.94
			);
			blob(
				w * (0.5 + 0.2 * Math.sin(t * 0.4 + 1.0)),
				baseY + ySpan * Math.cos(t * 0.36 + 4.0),
				m * 0.26,
				HOT,
				0.65
			);
			actx.filter = 'none';
		}

		const bottomWave = (relX, baseY, t, amp) =>
			baseY +
			Math.sin(relX * Math.PI * 2.2 + t * 1.1) * amp +
			Math.cos(relX * Math.PI * 3.6 - t * 0.75) * amp * 0.5 +
			Math.sin(relX * Math.PI * 1.1 + t * 0.5) * amp * 0.35;
		const topWave = (relX, baseY, t, amp) =>
			baseY +
			Math.cos(relX * Math.PI * 2.0 + t * 0.85) * amp * 0.6 +
			Math.sin(relX * Math.PI * 3.1 - t * 0.65) * amp * 0.35;

		function drawMask(t) {
			const w = mask.width;
			const h = mask.height;
			const amp = amplitude * LOW * 1.6;
			mctx.clearRect(0, 0, w, h);
			mctx.filter = `blur(${22 * LOW}px)`;
			mctx.fillStyle = '#000';
			mctx.beginPath();
			mctx.moveTo(-10, h + 10);
			for (let i = 0; i <= 45; i++) {
				const x = (w * i) / 45;
				mctx.lineTo(x, bottomWave(i / 45, h * startYRatio, t, amp));
			}
			mctx.lineTo(w + 10, h + 10);
			mctx.closePath();
			mctx.fill();
			if (topCanopy) {
				mctx.beginPath();
				mctx.moveTo(-10, -10);
				for (let i = 0; i <= 45; i++) {
					const x = (w * i) / 45;
					mctx.lineTo(x, topWave(i / 45, h * topCanopyRatio, t, amp));
				}
				mctx.lineTo(w + 10, -10);
				mctx.closePath();
				mctx.fill();
			}
			mctx.filter = 'none';
		}

		function frame(now) {
			raf = requestAnimationFrame(frame);
			const t = reduced ? 0 : (now / 1000) * flowSpeed;
			drawAurora(t);
			drawMask(t);

			cctx.setTransform(1, 0, 0, 1, 0, 0);
			cctx.globalCompositeOperation = 'source-over';
			cctx.clearRect(0, 0, content.width, content.height);
			cctx.imageSmoothingQuality = 'high';
			cctx.drawImage(aurora, 0, 0, content.width, content.height);
			cctx.fillStyle = 'rgba(0,0,0,0.28)';
			cctx.fillRect(0, 0, content.width, content.height);
			cctx.drawImage(grid, 0, 0);
			const cx = content.width / 2;
			const cy = content.height / 2;
			const vg = cctx.createRadialGradient(
				cx,
				cy,
				Math.min(content.width, content.height) * 0.45,
				cx,
				cy,
				Math.max(content.width, content.height) * 0.88
			);
			vg.addColorStop(0, 'rgba(0,0,0,0)');
			vg.addColorStop(0.5, 'rgba(0,0,0,0.3)');
			vg.addColorStop(1, 'rgba(0,0,0,0.85)');
			cctx.fillStyle = vg;
			cctx.fillRect(0, 0, content.width, content.height);
			cctx.globalCompositeOperation = 'destination-in';
			cctx.drawImage(mask, 0, 0, content.width, content.height);

			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(content, 0, 0);
			if (reduced) cancelAnimationFrame(raf);
		}

		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(host);
		raf = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	});
</script>

<div class="h3m" bind:this={host} aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.h3m {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background: #000;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
