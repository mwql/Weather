// Fetch predictions from local data.json
async function loadPredictions() {
    try {
        const response = await fetch('data.json?t=' + Date.now()); // Cache busting
        
        if (!response.ok) {
            throw new Error('Failed to load predictions');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading predictions:', error);
        return [];
    }
}

// Display predictions on the page
function displayPredictions(predictions) {
    const listContainer = document.getElementById('predictions-list');
    const targetDateDisplay = document.getElementById('target-date-display');
    
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    // Update main header on index.html
    if (targetDateDisplay && predictions.length > 0) {
        const latestDate = new Date(predictions[0].date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        targetDateDisplay.textContent = latestDate.toLocaleDateString('en-US', options);
    } else if (targetDateDisplay) {
        targetDateDisplay.textContent = "Waiting for update...";
    }
    
    if (predictions.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No official forecasts yet.</p>';
        return;
    }
    
    predictions.forEach((pred) => {
        const card = document.createElement('div');
        card.className = 'prediction-card';
        
        let icon = '❓';
        if (pred.condition.includes('Sunny')) icon = '☀️';
        else if (pred.condition.includes('Cloudy')) icon = '☁️';
        else if (pred.condition.includes('Rainy')) icon = '🌧️';
        else if (pred.condition.includes('Stormy')) icon = '⛈️';
        else if (pred.condition.includes('Snowy')) icon = '❄️';
        else if (pred.condition.includes('Windy')) icon = '💨';
        
        const dateObj = new Date(pred.date + 'T00:00:00');
        const cardDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        card.innerHTML = `
            <div class="weather-icon">${icon}</div>
            <div class="prediction-details">
                <h4>${pred.condition} <span style="font-size: 0.8rem; opacity: 0.6; font-weight: normal;">(${cardDate})</span></h4>
                <p class="temp">${pred.temperature}°C</p>
                ${pred.notes ? `<p class="note">${pred.notes}</p>` : ''}
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Display "Today" on other.html
    const inlineDateDisplay = document.getElementById('target-date-inline');
    if (inlineDateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        inlineDateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }
    
    // 2. Load and display predictions
    async function loadAndDisplayPredictions() {
        const predictions = await loadPredictions();
        displayPredictions(predictions);
    }
    
    // Initial load
    if (document.getElementById('predictions-list')) {
        loadAndDisplayPredictions();
        
        // Poll for updates every 5 seconds
        setInterval(loadAndDisplayPredictions, 5000);
    }
});
