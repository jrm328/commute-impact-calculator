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

document.getElementById('commuteForm').addEventListener('submit', function(event) {
    event.preventDefault();
    let totalImpact = 0;

    document.querySelectorAll('.segment').forEach(segment => {
        const mode = segment.querySelector('.transport').value;
        const distance = 10; // Placeholder for distance calculation
        const impact = calculateEmissions(distance, mode);
        totalImpact += impact;
    });

    document.getElementById('results').innerText = `Total Impact: ${totalImpact} kg CO2`;
});

function calculateEmissions(distance, mode) {
    const emissionsFactors = {
        'car': 0.411,
        'bike': 0.0,
        'scooter': 0.05,
        'train': 0.045,
        'bus': 0.089,
        'walk': 0.0
    };
    return distance * emissionsFactors[mode];
}

function resetForm() {
    document.getElementById('commuteForm').reset();
    document.getElementById('results').innerText = '';
    const segmentsContainer = document.getElementById('segments');

// Initialize the map
const map = L.map('map').setView([51.505, -0.09], 13); // Default location and zoom level

// Add the OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);
    segmentsContainer.innerHTML = '';
    addSegment(); // Add one default segment
}

async function calculateRoute(start, end) {
    const apiKey = '5b3ce3597851110001cf62485e628efb7ff8440db7e15b707ff40a2d'; // Replace with your ORS API key
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;

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

// Example usage
const start = { lat: 40.7128, lng: -74.0060 }; // Example start point (New York City)
const end = { lat: 40.73061, lng: -73.935242 }; // Example end point (Brooklyn)
calculateRoute(start, end).then(distance => {
    console.log(`Distance: ${distance.toFixed(2)} km`);
});

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
