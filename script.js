document.addEventListener('DOMContentLoaded', () => {
    // 1. Display "Today" on other.html
    const inlineDateDisplay = document.getElementById('target-date-inline');
    if (inlineDateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        inlineDateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // 2. Admin Login Logic (admin.html only)
    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('admin-password');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('admin-dashboard');
    const loginError = document.getElementById('login-error');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const password = passwordInput.value;
            if (password === '1') {
                // Success
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                loadPredictions(); // Load existing ones so admin can see them
            } else {
                // Failure
                loginError.style.display = 'block';
                passwordInput.value = '';
            }
        });
    }

    // 3. Handle Form Submission (admin.html only now)
    const form = document.getElementById('prediction-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const dateInput = document.getElementById('forecast-date').value;
            const condition = document.getElementById('condition').value;
            const temperature = document.getElementById('temperature').value;
            const notes = document.getElementById('notes').value;

            if (!dateInput || !condition || !temperature) return;

            const prediction = {
                id: Date.now(),
                date: dateInput, // Store the selected date
                condition,
                temperature,
                notes,
                timestamp: new Date().toLocaleString(),
                author: 'Admin' // Mark as official
            };

            savePrediction(prediction);
            form.reset();
            alert('Forecast uploaded successfully!');
            loadPredictions(); // Reload list to show new item
        });
    }

    // 4. Load and Display Predictions (index.html & admin.html)
    const listContainer = document.getElementById('predictions-list');
    const targetDateDisplay = document.getElementById('target-date-display'); // Main header on index.html

    if (listContainer) {
        loadPredictions();
    }

    function savePrediction(prediction) {
        let predictions = JSON.parse(localStorage.getItem('weatherPredictions')) || [];
        predictions.unshift(prediction); // Add to top
        localStorage.setItem('weatherPredictions', JSON.stringify(predictions));
    }

    function loadPredictions() {
        if (!listContainer) return;

        const predictions = JSON.parse(localStorage.getItem('weatherPredictions')) || [];
        listContainer.innerHTML = '';

        // Update main header on index.html to show date of the LATEST prediction
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

        const isAdmin = !!document.getElementById('admin-dashboard');

        predictions.forEach(pred => {
            const card = document.createElement('div');
            card.className = 'prediction-card';
            
            // Map condition to icon
            let icon = '❓';
            if (pred.condition.includes('Sunny')) icon = '☀️';
            else if (pred.condition.includes('Cloudy')) icon = '☁️';
            else if (pred.condition.includes('Rainy')) icon = '🌧️';
            else if (pred.condition.includes('Stormy')) icon = '⛈️';
            else if (pred.condition.includes('Snowy')) icon = '❄️';
            else if (pred.condition.includes('Windy')) icon = '💨';

            let deleteBtn = '';
            if (isAdmin) {
                deleteBtn = `<button class="delete-btn" onclick="deletePrediction(${pred.id})" style="margin-left: auto; background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>`;
            }

            // Format date for the card
            const cardDate = new Date(pred.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            card.innerHTML = `
                <div class="weather-icon">${icon}</div>
                <div class="prediction-details">
                    <h4>${pred.condition} <span style="font-size: 0.8rem; opacity: 0.6; font-weight: normal;">(${cardDate})</span></h4>
                    <p class="temp">${pred.temperature}°C</p>
                    ${pred.notes ? `<p class="note">${pred.notes}</p>` : ''}
                </div>
                ${deleteBtn}
            `;
            listContainer.appendChild(card);
        });
    }

    // Expose delete function globally so onclick works
    window.deletePrediction = function(id) {
        let predictions = JSON.parse(localStorage.getItem('weatherPredictions')) || [];
        predictions = predictions.filter(p => p.id !== id);
        localStorage.setItem('weatherPredictions', JSON.stringify(predictions));
        loadPredictions();
    };
});
