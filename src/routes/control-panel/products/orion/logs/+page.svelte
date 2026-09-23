<script>
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
	const API_PLATFORM_LOGS_ENDPOINT = '/api/v1/api-platform/logs';
	const API_PLATFORM_LOGS_STATS_ENDPOINT = '/api/v1/api-platform/logs/stats';
	const DEFAULT_LIMIT = 50;

	let filterStatus = 'all';
	let filterMethod = 'all';
	let search = '';
	let logs = [];
	let logsError = null;
	let logsLoading = true;
	let loadingMore = false;
	let nextCursor = null;
	let logsStats = null;
	let statsError = null;
	let didMount = false;
	let searchDebounceId;
	let logsQueryTrigger;
	let filteredLogs;

	onMount(async () => {
		didMount = true;
		await loadStats();
	});

	$: logsQueryTrigger = `${filterMethod}|${search.trim()}`;

	$: filteredLogs = logs.filter((l) => {
		if (filterStatus === '2xx') return l.status_code >= 200 && l.status_code < 300;
		if (filterStatus === '4xx') return l.status_code >= 400 && l.status_code < 500;
		if (filterStatus === '5xx') return l.status_code >= 500;
		return true;
	});

	$: if (didMount && logsQueryTrigger) {
		scheduleLogsReload();
	}

	function scheduleLogsReload() {
		clearTimeout(searchDebounceId);
		searchDebounceId = setTimeout(() => {
			loadLogs({ reset: true });
		}, 250);
	}

	function getAuthToken() {
		return (
			sessionStorage.getItem('geminis_id_token') || sessionStorage.getItem('geminis_access_token')
		);
	}

	function buildLogsQuery({ cursor = null } = {}) {
		const params = new SvelteURLSearchParams();
		params.set('limit', String(DEFAULT_LIMIT));
		if (cursor) params.set('cursor', cursor);
		if (filterMethod !== 'all') params.set('method', filterMethod);
		if (search.trim()) params.set('endpoint', search.trim());
		return params;
	}

	async function loadStats() {
		statsError = null;
		try {
			const token = getAuthToken();
			if (!token) throw new Error('No hay sesión activa');
			const res = await fetch(`${API_BASE_URL}${API_PLATFORM_LOGS_STATS_ENDPOINT}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json'
				}
			});
			if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
			logsStats = await res.json();
		} catch (e) {
			statsError = e.message;
		}
	}

	async function loadLogs({ reset = false, cursor = null } = {}) {
		if (reset) {
			logsLoading = true;
			logsError = null;
			nextCursor = null;
		} else {
			loadingMore = true;
		}

		try {
			const token = getAuthToken();
			if (!token) throw new Error('No hay sesión activa');

			const params = buildLogsQuery({ cursor });
			const res = await fetch(`${API_BASE_URL}${API_PLATFORM_LOGS_ENDPOINT}?${params.toString()}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json'
				}
			});
			if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
			const data = await res.json();
			const items = Array.isArray(data?.items) ? data.items : [];
			logs = reset ? items : [...logs, ...items];
			nextCursor = data?.next_cursor ?? null;
		} catch (e) {
			logsError = e.message;
		} finally {
			logsLoading = false;
			loadingMore = false;
		}
	}

	async function loadMore() {
		if (!nextCursor || loadingMore) return;
		await loadLogs({ reset: false, cursor: nextCursor });
	}

	function formatTime(iso) {
		if (!iso) return '—';
		return new Date(iso).toLocaleTimeString('es-MX', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function formatNumber(value) {
		const n = Number(value ?? 0);
		return Number.isFinite(n) ? n.toLocaleString('es-MX') : '0';
	}

	function formatRate(value) {
		const n = Number(value ?? 0);
		return Number.isFinite(n) ? `${(n * 100).toFixed(2)}%` : '0.00%';
	}

	function statusMeta(c) {
		if (c < 300)
			return { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' };
		if (c < 500)
			return { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' };
		return { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' };
	}

	function latencyColor(ms) {
		return ms < 100 ? '#4ade80' : ms < 500 ? '#fbbf24' : '#f87171';
	}

	function methodColor(m) {
		return m === 'GET' ? '#38bdf8' : '#a78bfa';
	}
</script>

<svelte:head><title>Logs — Orion | Geminis Labs</title></svelte:head>

<!-- ───── KPIs ───── -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">
	{#each [{ label: 'Solicitudes hoy', value: logsStats ? formatNumber(logsStats.requests_today) : '—', color: '#818cf8', border: 'rgba(99,102,241,0.25)', glow: 'rgba(99,102,241,0.08)' }, { label: 'Tasa de éxito', value: logsStats ? formatRate(logsStats.success_rate) : '—', color: '#4ade80', border: 'rgba(74,222,128,0.25)', glow: 'rgba(74,222,128,0.06)' }, { label: 'Latencia p50', value: logsStats?.p50_latency_ms != null ? `${Math.round(logsStats.p50_latency_ms)} ms` : '—', color: '#34d399', border: 'rgba(52,211,153,0.25)', glow: 'rgba(52,211,153,0.06)' }, { label: 'Errores 24 h', value: logsStats ? formatNumber(logsStats.errors_24h) : '—', color: '#fbbf24', border: 'rgba(251,191,36,0.25)', glow: 'rgba(251,191,36,0.06)' }] as k (k.label)}
		<div
			style="position:relative;overflow:hidden;background:rgba(10,16,26,0.75);border:1px solid {k.border};border-radius:16px;padding:22px 20px;"
		>
			<div
				style="position:absolute;top:-20px;right:-20px;width:70px;height:70px;border-radius:50%;background:{k.glow};pointer-events:none;"
			></div>
			<div
				style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:{k.color};margin-bottom:10px;"
			>
				{k.label}
			</div>
			<div style="font-size:28px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums;">
				{k.value}
			</div>
		</div>
	{/each}
</div>

{#if statsError}
	<div
		style="display:flex;align-items:center;gap:8px;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:10px 14px;margin-bottom:14px;"
	>
		<span style="font-size:12px;color:#f87171;flex:1;"
			>No se pudieron cargar las estadísticas: {statsError}</span
		>
		<button
			on:click={loadStats}
			style="border-radius:8px;border:1px solid rgba(239,68,68,0.2);background:rgba(239,68,68,0.08);padding:4px 10px;font-size:11px;font-weight:600;color:#f87171;cursor:pointer;"
			>Reintentar</button
		>
	</div>
{/if}

<!-- ───── Filtros ───── -->
<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
	<div style="position:relative;flex:1;min-width:200px;">
		<svg
			style="position:absolute;left:12px;top:50%;transform:translateY(-50%);"
			width="13"
			height="13"
			fill="none"
			viewBox="0 0 24 24"
			stroke="#475569"
			stroke-width="2"
			><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="M21 21l-4.35-4.35" /></svg
		>
		<input
			bind:value={search}
			placeholder="Filtrar por ruta, clave, IP…"
			style="width:100%;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(10,16,26,0.6);padding:8px 12px 8px 32px;font-size:12px;color:#e2e8f0;outline:none;box-sizing:border-box;"
		/>
	</div>
	<!-- Status -->
	<div
		style="display:flex;gap:3px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:9px;padding:3px;"
	>
		{#each [['all', 'Todos'], ['2xx', '2xx'], ['4xx', '4xx'], ['5xx', '5xx']] as [v, l] (v)}
			<button
				on:click={() => (filterStatus = v)}
				style="border-radius:6px;border:none;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;background:{filterStatus ===
				v
					? 'rgba(99,102,241,0.8)'
					: 'transparent'};color:{filterStatus === v ? '#fff' : '#64748b'};">{l}</button
			>
		{/each}
	</div>
	<!-- Método -->
	<div
		style="display:flex;gap:3px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:9px;padding:3px;"
	>
		{#each [['all', 'Todos'], ['GET', 'GET'], ['POST', 'POST']] as [v, l] (v)}
			<button
				on:click={() => (filterMethod = v)}
				style="border-radius:6px;border:none;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;background:{filterMethod ===
				v
					? 'rgba(99,102,241,0.8)'
					: 'transparent'};color:{filterMethod === v ? '#fff' : '#64748b'};">{l}</button
			>
		{/each}
	</div>
	<button
		style="border-radius:9px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);padding:8px 12px;font-size:12px;color:#64748b;cursor:pointer;"
		>↓ Exportar CSV</button
	>
</div>

<!-- ───── Tabla de logs ───── -->
<div
	style="background:rgba(10,16,26,0.75);border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;"
>
	<div style="overflow-x:auto;">
		<table style="width:100%;min-width:760px;border-collapse:collapse;font-size:12px;">
			<thead>
				<tr style="background:rgba(0,0,0,0.3);">
					{#each ['Hora', 'Método', 'Endpoint', 'Estado', 'Latencia', 'API Key', 'IP', ''] as col (col)}
						<th
							style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#334155;border-bottom:1px solid rgba(255,255,255,0.05);white-space:nowrap;"
							>{col}</th
						>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if logsLoading}
					<tr>
						<td colspan="8" style="padding:24px;text-align:center;color:#334155;font-size:13px;"
							>Cargando logs…</td
						>
					</tr>
				{:else}
					{#each filteredLogs as l (l.id)}
						{@const st = statusMeta(l.status_code)}
						<tr
							style="border-bottom:1px solid rgba(255,255,255,0.025);{l.status_code >= 500
								? 'background:rgba(248,113,113,0.03);'
								: l.status_code >= 400
									? 'background:rgba(251,191,36,0.02);'
									: ''}"
						>
							<td
								style="padding:11px 14px;font-family:monospace;font-size:11px;color:#475569;white-space:nowrap;"
								>{formatTime(l.created_at)}</td
							>
							<td style="padding:11px 14px;">
								<code
									style="border-radius:5px;background:rgba({l.method === 'GET'
										? '56,189,248'
										: '167,139,250'},0.1);padding:2px 6px;font-size:10px;font-weight:700;color:{methodColor(
										l.method
									)};">{l.method}</code
								>
							</td>
							<td
								style="padding:11px 14px;font-family:monospace;font-size:11px;color:#94a3b8;white-space:nowrap;"
								>{l.endpoint}</td
							>
							<td style="padding:11px 14px;">
								<span
									style="display:inline-flex;align-items:center;gap:3px;border-radius:99px;border:1px solid {st.border};background:{st.bg};padding:2px 7px;font-size:10px;font-weight:700;color:{st.color};"
									>{l.status_code}</span
								>
							</td>
							<td
								style="padding:11px 14px;font-family:monospace;font-size:11px;font-weight:600;color:{latencyColor(
									l.latency_ms
								)};font-variant-numeric:tabular-nums;white-space:nowrap;"
								>{l.latency_ms >= 1000
									? (l.latency_ms / 1000).toFixed(1) + 's'
									: l.latency_ms + 'ms'}</td
							>
							<td
								style="padding:11px 14px;font-family:monospace;font-size:10px;color:#475569;white-space:nowrap;"
								>{l.api_key_id?.slice(0, 8)}…</td
							>
							<td
								style="padding:11px 14px;font-family:monospace;font-size:10px;color:#334155;white-space:nowrap;"
								>{l.ip}</td
							>
							<td style="padding:11px 14px;">
								<button
									style="border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);padding:3px 8px;font-size:10px;color:#475569;cursor:pointer;"
									>Ver</button
								>
							</td>
						</tr>
					{/each}
				{/if}
				{#if !logsLoading && filteredLogs.length === 0}
					<tr
						><td colspan="8" style="padding:40px;text-align:center;color:#334155;font-size:13px;"
							>Sin registros para los filtros seleccionados.</td
						></tr
					>
				{/if}
			</tbody>
		</table>
	</div>
	<div
		style="padding:10px 14px;border-top:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between;"
	>
		<span style="font-size:11px;color:#334155;">{filteredLogs.length} registros visibles</span>
		{#if logsError}
			<button
				on:click={() => loadLogs({ reset: true })}
				style="border-radius:8px;border:1px solid rgba(239,68,68,0.2);background:rgba(239,68,68,0.08);padding:4px 10px;font-size:11px;font-weight:600;color:#f87171;cursor:pointer;"
				>Reintentar</button
			>
		{:else if nextCursor}
			<button
				on:click={loadMore}
				disabled={loadingMore}
				style="border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);padding:4px 10px;font-size:11px;font-weight:600;color:#94a3b8;cursor:{loadingMore
					? 'not-allowed'
					: 'pointer'};opacity:{loadingMore ? 0.7 : 1};"
				>{loadingMore ? 'Cargando…' : 'Cargar más'}</button
			>
		{:else}
			<span style="font-size:11px;color:#334155;">No hay más registros</span>
		{/if}
	</div>
</div>
