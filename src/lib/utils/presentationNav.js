/**
 * Navegación determinista por escenas y revelaciones («beats») para la
 * experiencia de presentación. Lógica pura: sin DOM, sin estado global.
 *
 * Una escena se describe como `{ id, beats }`, donde `beats` es el número de
 * revelaciones adicionales que tiene después de entrar (0 = una sola vista).
 */

/**
 * @typedef {{ scene: number, beat: number }} NavState
 * @typedef {{ id: string, beats: number }} SceneDef
 */

/** @param {number} value @param {number} min @param {number} max */
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

/**
 * Avanza un beat; si la escena ya mostró todo, pasa a la siguiente.
 * @param {NavState} state
 * @param {SceneDef[]} scenes
 * @returns {NavState}
 */
export function advance(state, scenes) {
	const current = scenes[state.scene];
	if (!current) return { scene: 0, beat: 0 };
	if (state.beat < current.beats) return { scene: state.scene, beat: state.beat + 1 };
	if (state.scene < scenes.length - 1) return { scene: state.scene + 1, beat: 0 };
	return state;
}

/**
 * Retrocede un beat; desde el primer beat vuelve al estado final legible de
 * la escena anterior.
 * @param {NavState} state
 * @param {SceneDef[]} scenes
 * @returns {NavState}
 */
export function retreat(state, scenes) {
	if (state.beat > 0) return { scene: state.scene, beat: state.beat - 1 };
	if (state.scene > 0) {
		const previous = scenes[state.scene - 1];
		return { scene: state.scene - 1, beat: previous.beats };
	}
	return state;
}

/**
 * Salta a una escena por índice o id. `atEnd` la abre ya revelada por completo.
 * @param {SceneDef[]} scenes
 * @param {number | string} target
 * @param {{ atEnd?: boolean }} [options]
 * @returns {NavState | null}
 */
export function goTo(scenes, target, { atEnd = false } = {}) {
	const index = typeof target === 'number' ? target : scenes.findIndex((s) => s.id === target);
	if (index < 0 || index >= scenes.length) return null;
	return { scene: index, beat: atEnd ? scenes[index].beats : 0 };
}

/**
 * Progreso global 0–1 contando cada beat como un paso.
 * @param {NavState} state
 * @param {SceneDef[]} scenes
 */
export function progress(state, scenes) {
	const total = scenes.reduce((sum, s) => sum + s.beats + 1, 0);
	if (total <= 1) return 1;
	let done = 0;
	for (let i = 0; i < state.scene; i++) done += scenes[i].beats + 1;
	done += state.beat;
	return clamp(done / (total - 1), 0, 1);
}

/**
 * Convierte la rueda/trackpad en pasos discretos: acumula delta hasta un
 * umbral, emite un paso y se bloquea un tiempo para ignorar la inercia.
 * @param {{ threshold?: number, cooldown?: number, now?: () => number }} [options]
 * @returns {(deltaY: number) => -1 | 0 | 1}
 */
export function createWheelGate({ threshold = 60, cooldown = 700, now = () => Date.now() } = {}) {
	let accumulated = 0;
	let lockedUntil = 0;
	return (deltaY) => {
		const t = now();
		if (t < lockedUntil) {
			// Mientras dura la inercia se sigue alargando el bloqueo.
			lockedUntil = Math.max(lockedUntil, t + cooldown / 2);
			accumulated = 0;
			return 0;
		}
		if (Math.sign(deltaY) !== Math.sign(accumulated)) accumulated = 0;
		accumulated += deltaY;
		if (Math.abs(accumulated) < threshold) return 0;
		const step = accumulated > 0 ? 1 : -1;
		accumulated = 0;
		lockedUntil = t + cooldown;
		return step;
	};
}

/**
 * Dirección de un gesto táctil: 1 = siguiente (deslizar hacia arriba o a la
 * izquierda), -1 = anterior, 0 = gesto demasiado corto.
 * @param {number} dx
 * @param {number} dy
 * @param {number} [minDistance]
 * @returns {-1 | 0 | 1}
 */
export function swipeStep(dx, dy, minDistance = 50) {
	const horizontal = Math.abs(dx) > Math.abs(dy);
	const delta = horizontal ? dx : dy;
	if (Math.abs(delta) < minDistance) return 0;
	return delta < 0 ? 1 : -1;
}

/** Teclas que avanzan / retroceden (compatibles con presentadores tipo clicker). */
export const NEXT_KEYS = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'];
export const PREV_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];

/**
 * Traduce una tecla a una acción de navegación.
 * @param {string} key
 * @returns {'next' | 'prev' | 'first' | 'last' | 'menu' | 'fullscreen' | 'live' | 'close' | null}
 */
export function keyAction(key) {
	if (NEXT_KEYS.includes(key)) return 'next';
	if (PREV_KEYS.includes(key)) return 'prev';
	switch (key) {
		case 'Home':
			return 'first';
		case 'End':
			return 'last';
		case 'm':
		case 'M':
			return 'menu';
		case 'f':
		case 'F':
			return 'fullscreen';
		case 'd':
		case 'D':
			return 'live';
		case 'Escape':
			return 'close';
		default:
			return null;
	}
}
