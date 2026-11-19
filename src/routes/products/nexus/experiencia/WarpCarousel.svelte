<script>
	/**
	 * Anillo 3D de tarjetas con borde luminoso y reflejo. Gira solo; clic en una
	 * tarjeta la trae al frente. No usa flechas (son de la navegación de escenas).
	 */
	import { onMount } from 'svelte';

	let { items = [], interval = 3600, reduced = false } = $props();

	let active = $state(0);
	let paused = $state(false);
	let n = $derived(items.length);

	onMount(() => {
		if (reduced) return;
		const id = setInterval(() => {
			if (!paused) active = active + 1;
		}, interval);
		return () => clearInterval(id);
	});

	function offset(i) {
		const k = (((i - active) % n) + n) % n;
		return k > n / 2 ? k - n : k;
	}
</script>

<div
	class="wc"
	data-noadvance
	role="region"
	aria-label="Pantallas de Nexus"
	onpointerenter={() => (paused = true)}
	onpointerleave={() => (paused = false)}
>
	<div class="wc-ring">
		{#each items as item, i (item.src)}
			{@const o = offset(i)}
			<button
				class="wc-card"
				class:front={o === 0}
				style="--x:{o}; --o:{Math.abs(o)}; --hue:{item.hue ?? 180}; z-index:{10 - Math.abs(o)}"
				onclick={() => (active = active + o)}
				aria-label={item.title}
			>
				<img src={item.src} alt="" loading="eager" />
				<span class="wc-cap">
					<strong>{item.title}</strong>
					{item.caption}
				</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.wc {
		position: relative;
		width: 100%;
		height: min(56vh, 500px);
		perspective: 1400px;
		perspective-origin: 50% 40%;
	}
	.wc::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 46%;
		width: 80%;
		height: 120%;
		translate: -50% -50%;
		background: radial-gradient(
			ellipse,
			rgba(40, 190, 230, 0.32),
			rgba(10, 60, 90, 0.12) 50%,
			transparent 72%
		);
		filter: blur(10px);
		pointer-events: none;
	}
	.wc-ring {
		position: absolute;
		left: 50%;
		top: 46%;
		width: 0;
		height: 0;
		transform-style: preserve-3d;
	}
	.wc-card {
		--w: min(46vw, 700px);
		position: absolute;
		left: calc(var(--w) / -2);
		top: calc(min(56vh, 500px) * -0.46);
		width: var(--w);
		padding: 10px;
		border: 0;
		border-radius: 18px;
		background: linear-gradient(180deg, rgba(22, 44, 66, 0.96), rgba(9, 20, 34, 0.97));
		backdrop-filter: blur(10px);
		color: #eaf3fc;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transform: translateX(calc(var(--x) * var(--w) * 0.62)) translateZ(calc(var(--o) * -420px))
			rotateY(calc(var(--x) * -38deg));
		box-shadow:
			0 0 0 1px hsla(var(--hue), 90%, 60%, 0.55),
			0 0 40px hsla(var(--hue), 90%, 55%, 0.25),
			0 30px 60px rgba(0, 0, 0, 0.5);
		opacity: calc(1 - var(--o) * 0.28);
		filter: saturate(calc(1 - var(--o) * 0.3)) brightness(calc(1 - var(--o) * 0.25));
		transition:
			transform 1.1s cubic-bezier(0.65, 0, 0.25, 1),
			opacity 1s ease,
			filter 1s ease,
			box-shadow 1s ease;
		-webkit-box-reflect: below 10px linear-gradient(transparent 70%, rgba(255, 255, 255, 0.14));
	}
	.wc-card.front {
		box-shadow:
			0 0 0 2px hsla(var(--hue), 95%, 68%, 1),
			0 0 90px hsla(var(--hue), 95%, 55%, 0.6),
			0 30px 80px rgba(0, 0, 0, 0.7);
	}
	.wc-card img {
		display: block;
		width: 100%;
		height: min(40vh, 360px);
		object-fit: contain;
		background: #050b14;
		border-radius: 10px;
	}
	.wc-cap {
		display: block;
		padding: 0.6rem 0.3rem 0.1rem;
		font-size: 0.85rem;
		color: #94b5d0;
	}
	.wc-cap strong {
		display: block;
		color: #eaf3fc;
		font-size: 1rem;
		font-weight: 600;
	}
	@media (max-width: 860px) {
		.wc-card {
			--w: 74vw;
		}
	}
</style>
