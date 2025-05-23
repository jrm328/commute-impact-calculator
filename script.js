// Initialize the map
const map = L.map('map').setView([42.31, -71.05], 12); // Default location and zoom level

// Add the OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Define colors for each mode of transport
const transportColors = {
    'driving-car': 'blue',
    'cycling-regular': 'green',
    'foot-walking': 'orange',
    'driving-hgv': 'red', // Assuming this is for buses
    'cycling-road': 'purple'
};

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

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const routeCoordinates = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            const distance = data.features[0].properties.segments[0].distance / 1000; // Distance in kilometers

            // Use the color associated with the mode of transport
            L.polyline(routeCoordinates, { color: transportColors[mode] }).addTo(map);

            // Fit the map to the route
            map.fitBounds(routeCoordinates);

            return distance; // Return the calculated distance
        } else {
            console.error('No route data available');
            return 0;
        }
    } catch (error) {
        console.error('Error fetching route:', error);
        return 0;
    }
}

function calculateEmissions(distance, mode) {
    const emissionsFactors = {
        'driving-car': 0.411,  // Example: 411 grams CO2 per mile
        'cycling-regular': 0.03,
        'foot-walking': 0.05,
        'driving-hgv': 0.18,  // Bus example
        'cycling-road': 0.08, // use Road cycling as API has no train 
        'cycling-electric': 0.035 //Electric scooter or bike
    };
    return distance * emissionsFactors[mode];
}

// In your form submit handler, replace the per-segment polyline with this logic:

document.getElementById('commuteForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    let totalImpact = 0;
    let totalDistance = 0;
    let resultsHTML = '';

    // Clear existing polylines (if needed)
    if (window.overallRouteLine) {
        map.removeLayer(window.overallRouteLine);
    }

    const segments = document.querySelectorAll('.segment');
    let allCoordinates = []; // To hold all points of the full route

    for (const [index, segment] of segments.entries()) {
        const startAddress = segment.querySelector('.start-address').value;
        const endAddress = segment.querySelector('.end-address').value;
        const mode = segment.querySelector('.transport').value;

        try {
            const startCoords = await geocodeAddress(startAddress);
            const endCoords = await geocodeAddress(endAddress);
            const apiKey = '5b3ce3597851110001cf62485e628efb7ff8440db7e15b707ff40a2d';
            const url = `https://api.openrouteservice.org/v2/directions/${mode}?api_key=${apiKey}&start=${startCoords.lng},${startCoords.lat}&end=${endCoords.lng},${endCoords.lat}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const routeCoordinates = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                allCoordinates = allCoordinates.concat(routeCoordinates);

                const distance = data.features[0].properties.segments[0].distance / 1000;
                totalDistance += distance;
                const impact = calculateEmissions(distance, mode);
                totalImpact += impact;
                resultsHTML += `<p>Segment ${index + 1}: ${distance.toFixed(2)} km, ${impact.toFixed(2)} kg CO2</p>`;
            }
        } catch (error) {
            console.error('Error processing segment:', error);
        }
    }

    // Draw the overall route with a single color (e.g., blue)
    if (allCoordinates.length > 1) {
        window.overallRouteLine = L.polyline(allCoordinates, { color: 'blue' }).addTo(map);
        map.fitBounds(window.overallRouteLine.getBounds());
    }

    // ... rest of your result calculations and display
    // (keep your resultsHTML and totalImpact logic as before)
    const acEmissionsPerHour = 0.85;
    const acHours = Math.floor(totalImpact / acEmissionsPerHour);
    const acMinutes = Math.round(((totalImpact / acEmissionsPerHour) - acHours) * 60);

    resultsHTML += `<p><strong>Total Distance:</strong> ${totalDistance.toFixed(2)} km</p>`;
    resultsHTML += `<p><strong>Total Impact:</strong> ${totalImpact.toFixed(2)} kg CO2</p>`;
    resultsHTML += `<p>CO2 impact of this commute is equivalent to running a home air conditioner for ${acHours} hours and ${acMinutes} minutes.</p>`;

    document.getElementById('results').innerHTML = resultsHTML;
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
