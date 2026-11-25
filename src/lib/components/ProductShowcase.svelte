<script>
	/**
	 * «Nuestros productos» al estilo de las marcas premium: los tres productos a
	 * la vista, cada uno en su propio bloque con su tema, logotipo, frase,
	 * estado, dos llamadas a la acción y su visual vivo. El detalle de cómo se
	 * contrata vive en la página de cada producto.
	 */
	import { onMount } from 'svelte';
	import { products } from '$lib/data/products.js';
	import ProductVisual from './ProductVisual.svelte';

	let blocks = $state([]);
	let inView = $state({});
	let reduced = $state(false);

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const io = new IntersectionObserver(
			(entries) => {
				const next = { ...inView };
				for (const e of entries) next[e.target.dataset.product] = e.isIntersecting;
				inView = next;
			},
			{ threshold: 0.2 }
		);
		for (const b of blocks) if (b) io.observe(b);
		return () => io.disconnect();
	});
</script>

<div class="ps">
	{#each products as p, i (p.id)}
		<article
			class="ps-block ps-{p.id}"
			class:flip={i % 2 === 1}
			class:seen={inView[p.id]}
			data-product={p.id}
			bind:this={blocks[i]}
			aria-labelledby="ps-{p.id}-name"
		>
			<div class="ps-copy">
				<div class="ps-brand">
					<img src={p.mark} alt="" class="ps-mark" loading="lazy" decoding="async" />
					<div>
						<p class="ps-kind">{p.kind}</p>
						<h3 class="ps-name" id="ps-{p.id}-name">{p.name}</h3>
					</div>
				</div>
				<p class="ps-line">{p.oneLiner}</p>
				<p class="ps-problem">{p.problem}</p>
				<ol class="ps-steps">
					{#each p.howItWorks as step, si (step)}
						<li><span>{si + 1}</span>{step}</li>
					{/each}
				</ol>
				<p class="ps-meta">
					<span class="ps-state">En operación</span>
					<span class="ps-for">{p.audience}</span>
				</p>
				<div class="ps-actions">
					<a
						class="ps-cta"
						href={p.href}
						target={p.external ? '_blank' : null}
						rel={p.external ? 'noopener noreferrer' : null}
					>
						{p.primaryCta} <span aria-hidden="true">→</span>
					</a>
					{#if p.secondaryCta}
						<a class="ps-cta2" href={p.secondaryCta.href}>{p.secondaryCta.label}</a>
					{/if}
				</div>
			</div>
			<div class="ps-visual">
				<span class="ps-halo" aria-hidden="true"></span>
				<ProductVisual id={p.id} active={!!inView[p.id]} {reduced} />
			</div>
		</article>
	{/each}
</div>

<style>
	.ps {
		display: flex;
		flex-direction: column;
		gap: clamp(1.2rem, 2.5vw, 2rem);
		width: min(1240px, 100% - 2rem);
		margin: 0 auto;
	}
	.ps-block {
		--acc: 62, 193, 40;
		--ink: #f4f1e8;
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: clamp(1.5rem, 4vw, 4rem);
		align-items: center;
		min-height: min(78vh, 720px);
		padding: clamp(1.8rem, 4vw, 3.5rem);
		overflow: hidden;
		border-radius: 28px;
		color: var(--ink);
		background:
			radial-gradient(ellipse 60% 70% at 78% 50%, rgba(var(--acc), 0.14), transparent 70%),
			linear-gradient(160deg, #0d1711 0%, #060a08 100%);
		box-shadow:
			0 30px 80px rgba(3, 8, 6, 0.35),
			inset 0 0 0 1px rgba(var(--acc), 0.18);
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity 0.8s ease,
			transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.ps-block.seen {
		opacity: 1;
		transform: none;
	}
	.ps-orion {
		--acc: 210, 218, 226;
		background:
			radial-gradient(ellipse 60% 70% at 22% 50%, rgba(var(--acc), 0.1), transparent 70%),
			linear-gradient(160deg, #15181b 0%, #08090a 100%);
	}
	.ps-signum {
		--acc: 229, 72, 77;
		background:
			radial-gradient(ellipse 60% 70% at 78% 50%, rgba(var(--acc), 0.16), transparent 70%),
			linear-gradient(160deg, #1a0b0b 0%, #0a0505 100%);
	}
	.flip .ps-copy {
		order: 2;
	}
	.ps-brand {
		display: flex;
		align-items: center;
		gap: 1.1rem;
		margin-bottom: 1.4rem;
	}
	.ps-mark {
		width: clamp(64px, 7vw, 96px);
		height: clamp(64px, 7vw, 96px);
		object-fit: contain;
		filter: drop-shadow(0 0 18px rgba(var(--acc), 0.45));
	}
	.ps-kind {
		margin: 0 0 0.3rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(var(--acc), 0.95);
	}
	.ps-name {
		margin: 0;
		font-family: 'Dune Rise', system-ui, sans-serif;
		font-size: clamp(2.2rem, 4.4vw, 3.8rem);
		font-weight: 400;
		letter-spacing: 0.04em;
		line-height: 1;
		color: var(--ink);
	}
	.ps-line {
		margin: 0 0 0.7rem;
		font-size: clamp(1.25rem, 2vw, 1.7rem);
		font-weight: 600;
		line-height: 1.25;
	}
	.ps-problem {
		margin: 0 0 1.3rem;
		font-size: 1rem;
		line-height: 1.55;
		color: rgba(244, 241, 232, 0.68);
	}
	.ps-steps {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0 0 1.3rem;
		padding: 0;
		list-style: none;
	}
	.ps-steps li {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.4rem 0.8rem 0.4rem 0.45rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.05);
		box-shadow: inset 0 0 0 1px rgba(var(--acc), 0.22);
		font-size: 0.85rem;
	}
	.ps-steps span {
		display: grid;
		place-items: center;
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 50%;
		background: rgba(var(--acc), 0.2);
		font-size: 0.72rem;
		font-weight: 700;
	}
	.ps-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem;
		margin: 0 0 1.6rem;
		font-size: 0.85rem;
		color: rgba(244, 241, 232, 0.6);
	}
	.ps-state {
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		box-shadow: inset 0 0 0 1px rgba(0, 255, 136, 0.45);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #00ff88;
	}
	.ps-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem 1.4rem;
	}
	.ps-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.85rem 1.5rem;
		border-radius: 999px;
		background: rgb(var(--acc));
		font-weight: 700;
		color: #071009;
		text-decoration: none;
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease;
	}
	.ps-orion .ps-cta {
		color: #0b0d0f;
	}
	.ps-signum .ps-cta {
		color: #fff;
	}
	.ps-cta:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 26px rgba(var(--acc), 0.35);
	}
	.ps-cta2 {
		font-weight: 600;
		color: rgba(244, 241, 232, 0.8);
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	.ps-visual {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 380px;
	}
	.ps-halo {
		position: absolute;
		width: 70%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(var(--acc), 0.16), transparent 70%);
		filter: blur(20px);
		pointer-events: none;
	}
	@media (max-width: 900px) {
		.ps-block {
			grid-template-columns: 1fr;
			min-height: 0;
		}
		.flip .ps-copy {
			order: 0;
		}
		.ps-visual {
			min-height: 320px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ps-block {
			transition: none;
			opacity: 1;
			transform: none;
		}
	}
</style>
