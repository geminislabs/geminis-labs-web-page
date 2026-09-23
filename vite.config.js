import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const gitCommit = (() => {
	try {
		return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return '';
	}
})();

function otlpEndpointForBuild(mode) {
	if (process.env.OTLP_ENDPOINT != null) return String(process.env.OTLP_ENDPOINT).trim();
	if (process.env.DEPLOY_ENV === 'production' || process.env.DEPLOY_ENV === 'test') return '';
	if (mode === 'production') return '';
	return 'http://localhost:4318';
}

export default defineConfig(({ mode }) => ({
	plugins: [tailwindcss(), sveltekit()],
	ssr: {
		noExternal: [/^@opentelemetry\/(?!sdk-trace-node|context-async-hooks|instrumentation-http)/]
	},
	define: {
		__SERVICE_NAME__: JSON.stringify(pkg.name),
		__SERVICE_VERSION__: JSON.stringify(pkg.version),
		__DEPLOY_ENV__: JSON.stringify(process.env.DEPLOY_ENV || 'local'),
		__RUNTIME_VERSION__: JSON.stringify(process.version),
		__GIT_COMMIT__: JSON.stringify(gitCommit),
		__OTLP_ENDPOINT__: JSON.stringify(otlpEndpointForBuild(mode))
	},
	server: {
		port: 5174,
		strictPort: true
	},
	preview: {
		port: 4174
	},
	test: {
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./vitest-setup.js'],
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			reportsDirectory: './coverage',
			include: ['src/lib/**/*.{js,ts}'],
			exclude: [
				'src/routes/**',
				'src/lib/components/**',
				'src/lib/billing/**',
				'src/lib/index.js',
				'src/**/*.spec.{js,ts}',
				'src/**/*.test.{js,ts}',
				'src/app.html',
				'src/app.css',
				'**/*.config.{js,ts}',
				'**/vitest-setup*'
			],
			thresholds: {
				lines: 90,
				functions: 90,
				branches: 70,
				statements: 90
			}
		}
	}
}));
