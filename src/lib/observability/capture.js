import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { recordJsError } from './journey.js';
import { scrubAttrs, scrubMessage } from './scrubber.js';

const SERVICE = 'geminis-labs-web-page';
const seen = typeof WeakSet === 'function' ? new WeakSet() : null;
let browserInstalled = false;
let nodeInstalled = false;

/**
 * @param {unknown} error
 * @returns {string}
 */
export function classifyError(error) {
	const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
	if (name === 'AbortError' || name === 'TimeoutError') return 'timeout';
	if (name === 'TypeError' || name === 'ReferenceError' || name === 'SyntaxError') {
		return 'programming';
	}
	return 'programming';
}

/**
 * @param {number} severityNumber
 * @param {string} severityText
 * @param {unknown} message
 * @param {Record<string, unknown>} [attrs]
 */
function emitLog(severityNumber, severityText, message, attrs) {
	try {
		logs.getLogger(SERVICE).emit({
			severityNumber,
			severityText,
			body: scrubMessage(message),
			attributes: scrubAttrs(attrs ?? {})
		});
	} catch {
		/* fail-open */
	}
}

/**
 * @param {unknown} message
 * @param {Record<string, unknown>} [attrs]
 */
export function logWarn(message, attrs) {
	emitLog(SeverityNumber.WARN, 'WARN', message, attrs);
}

/**
 * @param {unknown} message
 * @param {Record<string, unknown>} [attrs]
 */
export function logError(message, attrs) {
	emitLog(SeverityNumber.ERROR, 'ERROR', message, attrs);
}

/**
 * @param {unknown} error
 * @param {string} [_source]
 */
export function reportUnhandled(error, _source) {
	try {
		if (error && typeof error === 'object' && seen) {
			if (seen.has(error)) return;
			seen.add(error);
		}
		const category = classifyError(error);
		const rawMessage =
			error instanceof Error ? error.message : error != null ? String(error) : 'unhandled error';
		const rawStack = error instanceof Error && error.stack ? error.stack : '';
		/** @type {Record<string, unknown>} */
		const attrs = { error_category: category };
		if (rawStack) attrs.stack = scrubMessage(rawStack);
		logError(rawMessage, attrs);
		recordJsError({ errorCategory: category });
	} catch {
		/* fail-open */
	}
}

export function installBrowserErrorCapture() {
	if (browserInstalled || typeof window === 'undefined') return;
	browserInstalled = true;

	const onError = (event) => {
		const err = event instanceof ErrorEvent ? event.error || event.message : event;
		reportUnhandled(err, 'browser');
	};
	const onRejection = (event) => {
		reportUnhandled(event?.reason ?? event, 'browser');
	};

	window.addEventListener('error', onError);
	window.addEventListener('unhandledrejection', onRejection);
	window.onerror = function onWindowError(message, _source, _lineno, _colno, error) {
		reportUnhandled(error || message, 'browser');
		return false;
	};
}

export function installNodeErrorCapture() {
	if (nodeInstalled || typeof process === 'undefined' || typeof process.on !== 'function') return;
	nodeInstalled = true;
	process.on('uncaughtException', (error) => {
		reportUnhandled(error, 'node');
	});
	process.on('unhandledRejection', (reason) => {
		reportUnhandled(reason, 'node');
	});
}
