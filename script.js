// Initialize the map
const map = L.map('map').setView([51.505, -0.09], 13); // Default location and zoom level

// Add the OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        };
    } else {
        throw new Error('Address not found');
    }
}

async function calculateRoute(start, end, mode) {
    const apiKey = '5b3ce3597851110001cf62485e628efb7ff8440db7e15b707ff40a2d'; // Replace with your ORS API key
    const url = `https://api.openrouteservice.org/v2/directions/${mode}?api_key=${apiKey}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;

    const response = await fetch(url);
    const data = await response.json();

    const routeCoordinates = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    const distance = data.features[0].properties.segments[0].distance / 1000; // Distance in kilometers

    // Display the route on the map
    L.polyline(routeCoordinates, { color: 'blue' }).addTo(map);

    // Fit the map to the route
    map.fitBounds(routeCoordinates);

    return distance; // Return the calculated distance
}

function calculateEmissions(distance, mode) {
    const emissionsFactors = {
        'driving-car': 0.411,  // Example: 411 grams CO2 per mile
        'cycling-regular': 0.0,
        'foot-walking': 0.0,
        'driving-hgv': 0.089,  // Bus example
        'train': 0.045
    };
    return distance * emissionsFactors[mode];
}

document.getElementById('commuteForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    let totalImpact = 0;
    let totalDistance = 0;

    const segments = document.querySelectorAll('.segment');
    for (const segment of segments) {
        const startAddress = segment.querySelector('.start-address').value;
        const endAddress = segment.querySelector('.end-address').value;
        const mode = segment.querySelector('.transport').value;

        try {
            const startCoords = await geocodeAddress(startAddress);
            const endCoords = await geocodeAddress(endAddress);
            const distance = await calculateRoute(startCoords, endCoords, mode);
            totalDistance += distance;
            const impact = calculateEmissions(distance, mode);
            totalImpact += impact;
        } catch (error) {
            console.error('Error processing segment:', error);
        }
    }

    document.getElementById('results').innerText = `Total Distance: ${totalDistance.toFixed(2)} km, Total Impact: ${totalImpact.toFixed(2)} kg CO2`;
});

function addSegment() {
    const segment = document.querySelector('.segment').cloneNode(true);
    segment.querySelectorAll('input').forEach(input => input.value = ''); // Clear input fields
    document.getElementById('segments').appendChild(segment);
}

function removeSegment(button) {
    const segment = button.parentElement;
    if (document.querySelectorAll('.segment').length > 1) {
        segment.remove();
    } else {
        alert("You must have at least one segment.");
    }
}

function resetForm() {
    document.getElementById('commuteForm').reset();
    document.getElementById('results').innerText = '';
    const segmentsContainer = document.getElementById('segments');
    segmentsContainer.innerHTML = '';
    addSegment(); // Add one default segment
}
