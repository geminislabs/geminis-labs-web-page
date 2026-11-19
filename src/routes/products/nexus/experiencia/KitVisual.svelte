<script>
	/** Lo que incluye el alta: equipo GPS, SIM, instalación y la app. Dibujado, no foto. */
	let { screen = '' } = $props();
</script>

<div class="kit" aria-hidden="true">
	<svg class="kit-links" viewBox="0 0 400 420">
		<path d="M120 150 C 190 150, 200 230, 270 230" />
		<path d="M110 300 C 170 300, 190 250, 262 250" />
	</svg>

	<div class="kit-gps float" style="--f:0s">
		<div class="gps-body">
			<span class="gps-led g"></span>
			<span class="gps-led b"></span>
			<span class="gps-name">GPS 4G</span>
			<span class="gps-grill"></span>
		</div>
		<span class="kit-label">Equipo GPS</span>
	</div>

	<div class="kit-sim float" style="--f:-2s">
		<div class="sim-body"><span class="sim-chip"></span></div>
		<span class="kit-label">SIM con datos</span>
	</div>

	<div class="kit-phone float" style="--f:-1s">
		<div class="phone-body">
			<span class="phone-notch"></span>
			{#if screen}<img src={screen} alt="" />{/if}
		</div>
		<span class="kit-label">Plataforma web y app</span>
	</div>

	<div class="kit-tool float" style="--f:-3s">
		<svg viewBox="0 0 24 24"
			><path
				d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"
			/></svg
		>
		<span class="kit-label">Instalación</span>
	</div>
</div>

<style>
	.kit {
		position: relative;
		width: 100%;
		aspect-ratio: 400 / 420;
		max-height: 62vh;
	}
	.kit-links {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.kit-links path {
		fill: none;
		stroke: rgba(73, 242, 176, 0.5);
		stroke-width: 1.5;
		stroke-dasharray: 4 6;
		animation: dash 1.4s linear infinite;
	}
	@keyframes dash {
		to {
			stroke-dashoffset: -20;
		}
	}
	.float {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		animation: float 6s ease-in-out infinite;
		animation-delay: var(--f);
	}
	@keyframes float {
		50% {
			translate: 0 -10px;
		}
	}
	.kit-label {
		font-size: 0.8rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #b9c6ff;
		white-space: nowrap;
	}
	.kit-gps {
		left: 4%;
		top: 18%;
	}
	.gps-body {
		position: relative;
		width: 120px;
		height: 82px;
		border-radius: 16px;
		background: linear-gradient(160deg, #2a3350, #11162a);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.15),
			0 20px 40px rgba(0, 0, 0, 0.5),
			0 0 40px rgba(59, 84, 214, 0.35);
	}
	.gps-led {
		position: absolute;
		top: 14px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		animation: blink 1.6s steps(2) infinite;
	}
	.gps-led.g {
		left: 16px;
		background: #49f2b0;
		box-shadow: 0 0 10px #49f2b0;
	}
	.gps-led.b {
		left: 30px;
		background: #4f8dff;
		box-shadow: 0 0 10px #4f8dff;
		animation-delay: -0.8s;
	}
	@keyframes blink {
		50% {
			opacity: 0.25;
		}
	}
	.gps-name {
		position: absolute;
		right: 14px;
		top: 10px;
		font:
			700 10px Outfit,
			sans-serif;
		letter-spacing: 0.12em;
		color: #c9d3ff;
	}
	.gps-grill {
		position: absolute;
		left: 16px;
		right: 16px;
		bottom: 14px;
		height: 22px;
		border-radius: 6px;
		background: repeating-linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.08) 0 3px,
			transparent 3px 7px
		);
	}
	.kit-sim {
		left: 8%;
		top: 62%;
	}
	.sim-body {
		position: relative;
		width: 74px;
		height: 52px;
		border-radius: 6px 14px 6px 6px;
		background: linear-gradient(150deg, #e8ecff, #9aa6d6);
		box-shadow: 0 16px 30px rgba(0, 0, 0, 0.45);
	}
	.sim-chip {
		position: absolute;
		left: 14px;
		top: 13px;
		width: 30px;
		height: 24px;
		border-radius: 5px;
		background:
			linear-gradient(90deg, transparent 45%, rgba(0, 0, 0, 0.25) 46% 54%, transparent 55%),
			linear-gradient(0deg, transparent 45%, rgba(0, 0, 0, 0.25) 46% 54%, transparent 55%),
			linear-gradient(135deg, #f7d77c, #c9a13d);
	}
	.kit-phone {
		right: 4%;
		top: 10%;
	}
	.phone-body {
		position: relative;
		width: 150px;
		height: 300px;
		padding: 26px 8px 12px;
		border-radius: 28px;
		background: #05070f;
		box-shadow:
			0 0 0 2px #2c3561,
			0 30px 60px rgba(0, 0, 0, 0.6),
			0 0 60px rgba(73, 242, 176, 0.25);
		overflow: hidden;
	}
	.phone-notch {
		position: absolute;
		top: 9px;
		left: 50%;
		width: 46px;
		height: 8px;
		margin-left: -23px;
		border-radius: 6px;
		background: #1a2140;
	}
	.phone-body img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
		border-radius: 14px;
	}
	.kit-tool {
		left: 40%;
		top: 78%;
	}
	.kit-tool svg {
		width: 40px;
		height: 40px;
		padding: 10px;
		border-radius: 50%;
		background: rgba(59, 84, 214, 0.25);
		box-shadow: 0 0 0 1px rgba(185, 198, 255, 0.4);
		fill: #c9d3ff;
	}
	@media (prefers-reduced-motion: reduce) {
		.float,
		.kit-links path,
		.gps-led {
			animation: none;
		}
	}
</style>
