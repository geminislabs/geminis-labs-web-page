import { describe, it, expect } from 'vitest';
import {
	advance,
	retreat,
	goTo,
	progress,
	createWheelGate,
	swipeStep,
	keyAction
} from './presentationNav.js';

const scenes = [
	{ id: 'a', beats: 0 },
	{ id: 'b', beats: 2 },
	{ id: 'c', beats: 1 }
];

describe('advance', () => {
	it('avanza beats dentro de la escena y luego pasa a la siguiente', () => {
		expect(advance({ scene: 0, beat: 0 }, scenes)).toEqual({ scene: 1, beat: 0 });
		expect(advance({ scene: 1, beat: 0 }, scenes)).toEqual({ scene: 1, beat: 1 });
		expect(advance({ scene: 1, beat: 2 }, scenes)).toEqual({ scene: 2, beat: 0 });
	});

	it('se queda en el último estado al final', () => {
		const end = { scene: 2, beat: 1 };
		expect(advance(end, scenes)).toBe(end);
	});

	it('reinicia ante un estado inválido', () => {
		expect(advance({ scene: 9, beat: 0 }, scenes)).toEqual({ scene: 0, beat: 0 });
	});
});

describe('retreat', () => {
	it('retrocede beats y vuelve al final legible de la escena anterior', () => {
		expect(retreat({ scene: 1, beat: 2 }, scenes)).toEqual({ scene: 1, beat: 1 });
		expect(retreat({ scene: 2, beat: 0 }, scenes)).toEqual({ scene: 1, beat: 2 });
	});

	it('no retrocede antes del inicio', () => {
		const start = { scene: 0, beat: 0 };
		expect(retreat(start, scenes)).toBe(start);
	});
});

describe('goTo', () => {
	it('salta por índice o id', () => {
		expect(goTo(scenes, 2)).toEqual({ scene: 2, beat: 0 });
		expect(goTo(scenes, 'b', { atEnd: true })).toEqual({ scene: 1, beat: 2 });
	});

	it('devuelve null si no existe', () => {
		expect(goTo(scenes, 'zz')).toBeNull();
		expect(goTo(scenes, 5)).toBeNull();
	});
});

describe('progress', () => {
	it('va de 0 a 1 contando cada beat', () => {
		expect(progress({ scene: 0, beat: 0 }, scenes)).toBe(0);
		expect(progress({ scene: 2, beat: 1 }, scenes)).toBe(1);
		expect(progress({ scene: 1, beat: 1 }, scenes)).toBeCloseTo(2 / 5);
	});

	it('es 1 con una sola vista', () => {
		expect(progress({ scene: 0, beat: 0 }, [{ id: 'x', beats: 0 }])).toBe(1);
	});
});

describe('createWheelGate', () => {
	it('acumula hasta el umbral y emite un solo paso', () => {
		let t = 0;
		const gate = createWheelGate({ threshold: 50, cooldown: 500, now: () => t });
		expect(gate(30)).toBe(0);
		expect(gate(30)).toBe(1);
		t = 100;
		expect(gate(200)).toBe(0); // inercia bloqueada
		t = 2000;
		expect(gate(-80)).toBe(-1);
	});

	it('reinicia el acumulado al cambiar de dirección', () => {
		const gate = createWheelGate({ threshold: 50, now: () => 0 });
		expect(gate(40)).toBe(0);
		expect(gate(-40)).toBe(0);
		expect(gate(-20)).toBe(-1);
	});

	it('usa valores por defecto', () => {
		const gate = createWheelGate();
		expect(gate(10)).toBe(0);
	});
});

describe('swipeStep', () => {
	it('detecta dirección horizontal y vertical', () => {
		expect(swipeStep(-80, 5)).toBe(1);
		expect(swipeStep(80, 5)).toBe(-1);
		expect(swipeStep(3, -90)).toBe(1);
		expect(swipeStep(3, 90)).toBe(-1);
	});

	it('ignora gestos cortos', () => {
		expect(swipeStep(10, 10)).toBe(0);
	});
});

describe('keyAction', () => {
	it('mapea teclas a acciones', () => {
		expect(keyAction('ArrowRight')).toBe('next');
		expect(keyAction('PageUp')).toBe('prev');
		expect(keyAction('Home')).toBe('first');
		expect(keyAction('End')).toBe('last');
		expect(keyAction('m')).toBe('menu');
		expect(keyAction('F')).toBe('fullscreen');
		expect(keyAction('d')).toBe('live');
		expect(keyAction('Escape')).toBe('close');
		expect(keyAction('x')).toBeNull();
	});
});
