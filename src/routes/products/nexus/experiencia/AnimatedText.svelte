<script>
	/**
	 * Título que aparece letra por letra desde el centro hacia afuera, con
	 * cambio de peso (Outfit variable). Las palabras no se parten al ajustar línea.
	 */
	let { text = '', tag = 'h1', className = '', delay = 0, step = 28, show = true } = $props();

	let words = $derived.by(() => {
		const chars = [...text];
		const center = (chars.length - 1) / 2;
		let index = 0;
		return text.split(' ').map((word) => {
			const letters = [...word].map((ch) => {
				const d = Math.abs(index - center);
				index += 1;
				return { ch, d };
			});
			index += 1; // espacio
			return letters;
		});
	});
</script>

<svelte:element this={tag} class="xp-atext {className}" class:show aria-label={text}>
	{#each words as word, w (w)}
		<span class="xp-aword" aria-hidden="true">
			{#each word as letter, i (i)}
				<span class="xp-achar" style="--ad:{delay + letter.d * step}ms">{letter.ch}</span>
			{/each}
		</span>
	{/each}
</svelte:element>

<style>
	.xp-aword {
		display: inline-block;
		white-space: nowrap;
		margin-right: 0.26em;
	}
	.xp-aword:last-child {
		margin-right: 0;
	}
	.xp-achar {
		display: inline-block;
		opacity: 0;
		filter: blur(10px);
		transform: translateY(0.35em) scale(0.9);
		font-variation-settings: 'wght' 200;
		font-weight: 200;
	}
	.show .xp-achar {
		animation: xp-achar 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
		animation-delay: var(--ad);
	}
	@keyframes xp-achar {
		60% {
			opacity: 1;
			filter: blur(0);
		}
		to {
			opacity: 1;
			filter: blur(0);
			transform: none;
			font-weight: var(--xp-weight, 650);
			font-variation-settings: 'wght' var(--xp-weight, 650);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.xp-achar {
			opacity: 1;
			filter: none;
			transform: none;
			font-weight: var(--xp-weight, 650);
		}
		.show .xp-achar {
			animation: none;
		}
	}
</style>
