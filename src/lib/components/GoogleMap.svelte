<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let apiKey = '';
	export let center = { lat: 19.4326, lng: -99.1332 }; // Ciudad de México por defecto
	export let zoom = 10;
	export let markers = [];

	let mapContainer;
	let map;
	let googleInstance;
	let googleMarkers = [];

	onMount(async () => {
		if (!browser) return; // Solo ejecutar en el cliente

		if (!apiKey) {
			console.error('Google Maps API Key is required');
			return;
		}

		// Importar dinámicamente para evitar problemas de SSR
		// js-api-loader 2: `Loader` ya no existe. Las opciones sólo se toman la
		// primera vez; al volver a montar el componente se ignoran.
		const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
		setOptions({ key: apiKey, v: 'weekly' });

		try {
			await Promise.all([importLibrary('maps'), importLibrary('places')]);
			googleInstance = window.google;
			initMap();
		} catch (error) {
			console.error('Error loading Google Maps:', error);
		}
	});

	async function initMap() {
		map = new googleInstance.maps.Map(mapContainer, {
			center: center,
			zoom: zoom,
			styles: [
				{
					featureType: 'poi',
					elementType: 'labels',
					stylers: [{ visibility: 'off' }]
				}
			]
		});

		// Crear marcadores iniciales
		await updateMarkers();
	}

	async function updateMarkers() {
		if (!map || !browser || !googleInstance) return;

		// Limpiar marcadores existentes
		googleMarkers.forEach((marker) => marker.setMap(null));
		googleMarkers = [];

		// Crear nuevos marcadores
		markers.forEach((device) => {
			const marker = new googleInstance.maps.Marker({
				position: { lat: device.lat, lng: device.lng },
				map: map,
				title: device.name || `Equipo ${device.id}`,
				icon: {
					url: device.icon || 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
					scaledSize: new googleInstance.maps.Size(32, 32)
				}
			});

			// Info window para mostrar información del dispositivo
			const infoWindow = new googleInstance.maps.InfoWindow({
				content: `
					<div class="p-2">
						<h3 class="font-bold text-lg">${device.name || `Equipo ${device.id}`}</h3>
						<p class="text-sm text-gray-600">ID: ${device.id}</p>
						<p class="text-sm text-gray-600">Última actualización: ${device.lastUpdate || 'N/A'}</p>
						${device.speed ? `<p class="text-sm text-gray-600">Velocidad: ${device.speed} km/h</p>` : ''}
					</div>
				`
			});

			marker.addListener('click', () => {
				infoWindow.open(map, marker);
			});

			googleMarkers.push(marker);
		});
	}

	// Observar cambios en los marcadores
	$: if (map && markers && browser) {
		updateMarkers();
	}
</script>

<div bind:this={mapContainer} class="h-full w-full"></div>

<style>
	div {
		min-height: 100vh;
	}
</style>
