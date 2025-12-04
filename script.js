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
    
    // Normalize date format (handles "2026-1-1" -> "2026-01-01")
    function normalizeDate(dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const month = parts[1].padStart(2, '0');
            const day = parts[2].padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    }
    
    // Update main header on index.html
    if (targetDateDisplay && predictions.length > 0) {
        const normalizedDate = normalizeDate(predictions[0].date);
        const latestDate = new Date(normalizedDate);
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
        
        // Normalize and parse date
        const normalizedDate = normalizeDate(pred.date);
        const dateObj = new Date(normalizedDate + 'T00:00:00');
        
        // English month names
        const englishMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = englishMonths[dateObj.getMonth()];
        const day = dateObj.getDate();
        const cardDate = `${month} ${day}`;
        
        // Handle "to date" if provided
        let dateRange = cardDate;
        if (pred.toDate) {
            const normalizedToDate = normalizeDate(pred.toDate);
            const toDateObj = new Date(normalizedToDate + 'T00:00:00');
            const toMonth = englishMonths[toDateObj.getMonth()];
            const toDay = toDateObj.getDate();
            dateRange = `${cardDate} - ${toMonth} ${toDay}`;
        }
        
        card.innerHTML = `
            <div class="weather-icon">${icon}</div>
            <div class="prediction-details">
                <h4>${pred.condition} <span style="font-size: 0.8rem; opacity: 0.6; font-weight: normal;">(${dateRange})</span></h4>
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
    
    // Initial load (only loads once when page is opened/refreshed)
    if (document.getElementById('predictions-list')) {
        loadAndDisplayPredictions();
        
        // Poll for updates every 60 seconds
        setInterval(loadAndDisplayPredictions, 60000);
    }
});
