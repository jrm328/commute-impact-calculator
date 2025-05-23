function addSegment() {
    const segment = document.querySelector('.segment').cloneNode(true);
    document.getElementById('segments').appendChild(segment);
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
