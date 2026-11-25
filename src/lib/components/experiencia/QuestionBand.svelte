<script>
	/**
	 * La pregunta de la experiencia: Querétaro de noche, inclinado como desde un
	 * avión, con humo cálido y estelas sobre las vías reales. Primero la frase y,
	 * al entrar en pantalla, la pregunta palabra por palabra.
	 */
	import { onMount } from 'svelte';
	import ShaderBackground from './ShaderBackground.svelte';
	import ExperienceWorld from './ExperienceWorld.svelte';

	const SMOKE = {
		key: 'pregunta',
		mode: 'smoke',
		colors: ['#060302', '#2a1205', '#7a3a0e', '#f2a14a'],
		intensity: 0.85
	};
	const QUESTION =
		'¿Qué descubrimos cuando dejamos de mirar puntos y empezamos a entender movimientos?';
	const WORDS = QUESTION.split(' ');

	let host = $state(null);
	let near = $state(false);
	let shown = $state(false);
	let reduced = $state(false);
	let lite = $state(false);

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		lite = window.innerWidth <= 768;
		const pre = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					near = true;
					pre.disconnect();
				}
			},
			{ rootMargin: '500px' }
		);
		const vis = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					shown = true;
					vis.disconnect();
				}
			},
			{ threshold: 0.45 }
		);
		pre.observe(host);
		vis.observe(host);
		return () => {
			pre.disconnect();
			vis.disconnect();
		};
	});
</script>

<div class="qb" class:shown bind:this={host}>
	<div class="qb-bg" aria-hidden="true">
		{#if near}
			<ShaderBackground preset={SMOKE} contained {reduced} {lite} />
			<div class="qb-world">
				<ExperienceWorld sceneId="pregunta" contained {reduced} {lite} />
			</div>
		{/if}
	</div>
	<div class="qb-fog" aria-hidden="true"></div>

	<div class="qb-inner">
		<p class="qb-kicker">La pregunta que nos mueve</p>
		<p class="qb-lead">Cada mañana, la ciudad entera se pone en movimiento.</p>
		<h2 class="qb-question" aria-label={QUESTION}>
			{#each WORDS as w, i (i)}
				<span style="--i:{i}" aria-hidden="true">{w}</span>
			{/each}
		</h2>
		<ul class="qb-wwh">
			<li><strong>Dónde</strong> está cada unidad</li>
			<li><strong>Cuándo</strong> ocurrió cada evento</li>
			<li><strong>Qué pasó</strong> y qué hacer</li>
		</ul>
	</div>

	<p class="qb-src">Vías reales de Querétaro: © OpenStreetMap contributors</p>
</div>

<style>
	.qb {
		position: relative;
		height: 100vh;
		min-height: 600px;
		display: flex;
		align-items: center;
		overflow: hidden;
		background: #060302;
		color: #fff4e6;
		font-family: Outfit, system-ui, sans-serif;
	}
	.qb-bg {
		position: absolute;
		inset: 0;
	}
	.qb-world {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}
	.qb-fog {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			radial-gradient(ellipse 70% 60% at 50% 45%, rgba(6, 3, 2, 0.55), transparent 75%),
			linear-gradient(180deg, #060302 0%, transparent 18%, transparent 80%, #060302 100%);
	}
	.qb-inner {
		position: relative;
		z-index: 1;
		width: min(980px, 100% - 3rem);
		margin: 0 auto;
		text-align: center;
	}
	.qb-kicker {
		margin: 0 0 0.9rem;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: #f2a14a;
	}
	.qb-lead {
		margin: 0 0 1.2rem;
		font-size: clamp(1.05rem, 1.6vw, 1.35rem);
		color: rgba(255, 236, 214, 0.8);
		opacity: 0;
		transition: opacity 1s ease 0.2s;
	}
	.qb-question {
		margin: 0;
		font-size: clamp(2rem, 4.4vw, 4rem);
		line-height: 1.1;
		font-weight: 700;
		color: #fff4e6;
		text-shadow: 0 4px 40px rgba(0, 0, 0, 0.6);
	}
	.qb-question span {
		display: inline-block;
		margin: 0 0.13em;
		opacity: 0;
		filter: blur(8px);
		transform: translateY(14px);
		transition:
			opacity 0.7s ease,
			filter 0.7s ease,
			transform 0.7s ease;
		transition-delay: calc(0.9s + var(--i) * 0.07s);
	}
	.qb-wwh {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 1.8rem 0 0;
		padding: 0;
		list-style: none;
		opacity: 0;
		transform: translateY(10px);
		transition:
			opacity 0.8s ease 2.4s,
			transform 0.8s ease 2.4s;
	}
	.qb-wwh li {
		padding: 0.55rem 1rem;
		border-radius: 999px;
		background: rgba(20, 10, 4, 0.7);
		box-shadow: inset 0 0 0 1px rgba(242, 161, 74, 0.35);
		font-size: 0.95rem;
		color: rgba(255, 236, 214, 0.85);
	}
	.qb-wwh strong {
		color: #f2a14a;
	}
	.shown .qb-lead,
	.shown .qb-wwh {
		opacity: 1;
		transform: none;
	}
	.shown .qb-question span {
		opacity: 1;
		filter: none;
		transform: none;
	}
	.qb-src {
		position: absolute;
		right: 1.5rem;
		bottom: 1rem;
		z-index: 1;
		margin: 0;
		font-size: 0.72rem;
		color: rgba(255, 236, 214, 0.4);
	}
	@media (prefers-reduced-motion: reduce) {
		.qb-lead,
		.qb-wwh,
		.qb-question span {
			transition: none;
		}
	}
</style>
