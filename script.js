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
    segmentsContainer.innerHTML = '';
    addSegment(); // Add one default segment
}
