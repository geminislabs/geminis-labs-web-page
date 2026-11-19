<script>
	/**
	 * Público de la sala: fotografías con transparencia de personas de espaldas,
	 * en dos bloques con un pasillo ancho al centro. Se oscurece hacia el espectador.
	 */
	let { left = '', right = '' } = $props();
</script>

<div class="aud" aria-hidden="true">
	<div class="aud-block aud-left"><img src={left} alt="" /></div>
	<div class="aud-block aud-right"><img src={right} alt="" /></div>
	<div class="aud-shade"></div>
</div>

<style>
	.aud {
		position: relative;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.aud-block {
		position: absolute;
		bottom: -14%;
		width: 43%;
	}
	.aud-left {
		left: -5%;
	}
	.aud-right {
		right: -5%;
	}
	.aud-block img {
		display: block;
		width: 100%;
		height: auto;
		filter: brightness(0.9) saturate(1.05);
	}
	/* Las filas cercanas al espectador se pierden en la oscuridad. */
	.aud-shade {
		position: absolute;
		inset: 0 -5% -40% -5%;
		background: linear-gradient(180deg, transparent 30%, rgba(1, 3, 6, 0.5) 55%, #010306 80%);
	}
</style>
