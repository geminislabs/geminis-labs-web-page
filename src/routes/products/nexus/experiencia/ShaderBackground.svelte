<script>
	/**
	 * Fondo WebGL por escena. Cuatro estilos propios, inspirados en referencias
	 * visuales (no es código copiado):
	 *  - silk: fbm con deformación de dominio y brillo sedoso.
	 *  - aurora: bandas de ruido en capas, viñeta y grano.
	 *  - swirl: gradiente con remolino lento.
	 *  - fold: paneles de vidrio plegado con pliegues iluminados.
	 * `mask` oscurece una elipse (x, y, rx, ry en 0–1) donde vive el contenido.
	 */
	import { onMount } from 'svelte';

	let { preset = null, reduced = false, lite = false } = $props();

	const MODES = { silk: 0, aurora: 1, swirl: 2, fold: 3, smoke: 4 };

	const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
	const FRAG = `
precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec3 uC0,uC1,uC2,uC3;uniform int uMode;
uniform vec4 uMask;uniform float uMaskK;uniform float uIntensity;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
vec3 pal(float t){t=clamp(t,0.,1.);if(t<.33)return mix(uC0,uC1,t/.33);if(t<.66)return mix(uC1,uC2,(t-.33)/.33);return mix(uC2,uC3,(t-.66)/.34);}
void main(){
vec2 uv=gl_FragCoord.xy/uRes;vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;float t=uTime;vec3 col;
if(uMode==0){
 vec2 q=vec2(fbm(p*1.5+t*.05),fbm(p*1.5+vec2(5.2,1.3)-t*.04));
 vec2 r=vec2(fbm(p*1.5+3.*q+vec2(1.7,9.2)+t*.07),fbm(p*1.5+3.*q+vec2(8.3,2.8)-t*.05));
 float f=fbm(p*1.5+3.5*r);
 float s=.5+.5*sin(f*10.+r.x*6.+t*.35);
 col=pal(f*1.05)*(.45+.75*s*s);
}else if(uMode==1){
 float n1=fbm(vec2(p.x*1.1+t*.035,p.y*2.4-t*.025));
 float n2=fbm(vec2(p.x*1.8-t*.045,p.y*1.2+t*.02)+4.);
 float b1=smoothstep(.2,0.,abs(p.y+.12-(n1-.5)*1.));
 float b2=smoothstep(.26,0.,abs(p.y-.22-(n2-.5)*.9));
 float rays=.5+.5*sin(p.x*18.+n1*6.+t*.2);
 col=uC0+uC1*b1*(.7+.5*rays)+uC2*b2*.85+uC3*pow(n1*n2,2.)*.9;
}else if(uMode==2){
 float r=length(p);float a=atan(p.y,p.x)+.9*sin(t*.12)/(r+.35)+t*.04;
 vec2 s=vec2(cos(a),sin(a))*r;float f=fbm(s*2.2+t*.03);
 col=pal(.5+.5*sin(f*5.+s.x*2.5+t*.18));col*=.65+.55*f;
}else if(uMode==3){
 float ca=cos(-.42),sa=sin(-.42);vec2 q=vec2(ca*p.x-sa*p.y,sa*p.x+ca*p.y);
 col=uC0*(.7+.5*uv.y);
 for(int i=0;i<6;i++){float fi=float(i);
  float e=-.78+fi*.26+.17*sin(q.x*1.25+t*.16+fi*1.9)+.06*sin(q.x*2.9-t*.11+fi*.7);
  float d=q.y-e;
  float sheet=smoothstep(0.,.006,d);
  vec3 sc=mix(uC2,uC1,clamp(d*2.4,0.,1.));
  sc*=.75+.25*sin(q.x*1.7+fi+t*.1);
  col=mix(col,sc,sheet*.92);
  float rim=exp(-abs(d)*160.)*1.3+exp(-abs(d)*22.)*.28;
  col+=uC3*rim*(.55+.45*sin(q.x*1.8+t*.35+fi*2.1));
 }
}else{
 vec2 w=vec2(fbm(p*1.3+vec2(t*.025,-t*.018)),fbm(p*1.3+vec2(3.1,7.4)-t*.02));
 float f=fbm(p*1.6+2.4*w+vec2(-t*.04,t*.01));
 col=pal(f*1.15)*(.55+.7*f*f);
}
float vig=smoothstep(1.3,.2,length(p*vec2(.85,1.1)));col*=mix(.3,1.,vig);
vec2 d=(uv-uMask.xy)/uMask.zw;col*=1.-uMaskK*smoothstep(1.,0.,length(d));
col+=(hash(gl_FragCoord.xy+fract(t*.7)*91.)-.5)*.03;
gl_FragColor=vec4(col*uIntensity,1.);}`;

	let canvas = $state(null);
	let visible = $state(false);
	let gl;
	let program;
	let uniforms = {};
	let current = null;
	let raf = 0;
	let start = 0;
	let swapTimer;

	function hexToRgb(hex) {
		const n = parseInt(hex.replace('#', ''), 16);
		return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
	}

	function compile(type, src) {
		const s = gl.createShader(type);
		gl.shaderSource(s, src);
		gl.compileShader(s);
		return s;
	}

	function setup() {
		gl = canvas.getContext('webgl', {
			antialias: false,
			alpha: false,
			powerPreference: 'high-performance'
		});
		if (!gl) return false;
		program = gl.createProgram();
		gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
		gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
		gl.useProgram(program);
		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		const loc = gl.getAttribLocation(program, 'a');
		gl.enableVertexAttribArray(loc);
		gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
		for (const name of [
			'uRes',
			'uTime',
			'uC0',
			'uC1',
			'uC2',
			'uC3',
			'uMode',
			'uMask',
			'uMaskK',
			'uIntensity'
		]) {
			uniforms[name] = gl.getUniformLocation(program, name);
		}
		return true;
	}

	function resize() {
		if (!canvas) return;
		const scale = lite ? 0.5 : Math.min(window.devicePixelRatio || 1, 1) * 0.75;
		canvas.width = Math.round(window.innerWidth * scale);
		canvas.height = Math.round(window.innerHeight * scale);
		gl?.viewport(0, 0, canvas.width, canvas.height);
	}

	function apply(p) {
		const colors = p.colors.map(hexToRgb);
		gl.uniform3fv(uniforms.uC0, colors[0]);
		gl.uniform3fv(uniforms.uC1, colors[1]);
		gl.uniform3fv(uniforms.uC2, colors[2]);
		gl.uniform3fv(uniforms.uC3, colors[3]);
		gl.uniform1i(uniforms.uMode, MODES[p.mode] ?? 0);
		gl.uniform4fv(uniforms.uMask, p.mask ?? [0.5, 0.5, 0.01, 0.01]);
		gl.uniform1f(uniforms.uMaskK, p.maskK ?? 0);
		gl.uniform1f(uniforms.uIntensity, p.intensity ?? 1);
	}

	function frame(t) {
		raf = requestAnimationFrame(frame);
		if (!current) return;
		gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
		gl.uniform1f(uniforms.uTime, reduced ? 12 : ((t - start) / 1000) * (current.speed ?? 1));
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}

	// Cambio de preset: fundido a negro, cambio y fundido de entrada.
	$effect(() => {
		const next = preset;
		if (!gl) return;
		clearTimeout(swapTimer);
		if (!next) {
			visible = false;
			swapTimer = setTimeout(() => (current = null), 700);
			return;
		}
		if (current && current.key === next.key) return;
		visible = false;
		swapTimer = setTimeout(
			() => {
				current = next;
				apply(next);
				visible = true;
			},
			current ? 420 : 0
		);
	});

	onMount(() => {
		if (!setup()) return;
		resize();
		window.addEventListener('resize', resize);
		start = performance.now();
		raf = requestAnimationFrame(frame);
		if (preset) {
			current = preset;
			apply(preset);
			visible = true;
		}
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(swapTimer);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<canvas bind:this={canvas} class="xp-shader" class:visible aria-hidden="true"></canvas>

<style>
	.xp-shader {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100dvh;
		display: block;
		z-index: 0;
		opacity: 0;
		transition: opacity 0.7s ease;
		pointer-events: none;
	}
	.xp-shader.visible {
		opacity: 1;
	}
</style>
