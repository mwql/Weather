// GitHub Configuration
const GITHUB_CONFIG = {
    owner: 'mwql', // Your GitHub username
    repo: 'Weather', // Your repository name
    branch: 'main', // or 'master' depending on your default branch
    dataFile: 'data.json'
};

// Get GitHub token from localStorage (set by admin)
function getGitHubToken() {
    // Pre-filled token for convenience (REMEMBER TO REVOKE AND CREATE NEW TOKEN LATER!)
    const hardcodedToken = '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';
    return localStorage.getItem('github_token') || hardcodedToken;
}

// Fetch predictions from GitHub
async function loadPredictions() {
    try {
        const url = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.dataFile}`;
        const response = await fetch(url + '?t=' + Date.now()); // Cache busting
        
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

// Save predictions to GitHub (requires token)
async function savePredictions(predictions) {
    const token = getGitHubToken();
    
    if (!token) {
        alert('GitHub token not found! Please set your token first.');
        return false;
    }
    
    try {
        // First, get the current file SHA
        const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}`;
        const getResponse = await fetch(getUrl, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        let sha = null;
        if (getResponse.ok) {
            const fileData = await getResponse.json();
            sha = fileData.sha;
        }
        
        // Update the file
        const content = btoa(JSON.stringify(predictions, null, 2));
        const updateUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}`;
        
        const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Update weather predictions',
                content: content,
                sha: sha,
                branch: GITHUB_CONFIG.branch
            })
        });
        
        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            throw new Error(error.message || 'Failed to save predictions');
        }
        
        return true;
    } catch (error) {
        console.error('Error saving predictions:', error);
        alert('Error saving: ' + error.message);
        return false;
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
    
    const isAdmin = !!document.getElementById('admin-dashboard');
    
    predictions.forEach((pred, index) => {
        const card = document.createElement('div');
        card.className = 'prediction-card';
        
        let icon = '❓';
        if (pred.condition.includes('Sunny')) icon = '☀️';
        else if (pred.condition.includes('Cloudy')) icon = '☁️';
        else if (pred.condition.includes('Rainy')) icon = '🌧️';
        else if (pred.condition.includes('Stormy')) icon = '⛈️';
        else if (pred.condition.includes('Snowy')) icon = '❄️';
        else if (pred.condition.includes('Windy')) icon = '💨';
        
        let deleteBtn = '';
        if (isAdmin) {
            deleteBtn = `<button class="delete-btn" onclick="deletePrediction(${index})" style="margin-left: auto; background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>`;
        }
        
        const dateObj = new Date(pred.date + 'T00:00:00');
        const cardDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
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

// Delete a prediction
window.deletePrediction = async function(index) {
    if (!confirm("Are you sure you want to delete this forecast?")) return;
    
    const predictions = await loadPredictions();
    predictions.splice(index, 1);
    
    const success = await savePredictions(predictions);
    if (success) {
        displayPredictions(predictions);
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
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
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                loadAndDisplayPredictions();
            } else {
                loginError.style.display = 'block';
                passwordInput.value = '';
            }
        });
    }
    
    // 3. Handle Form Submission (admin.html only)
    const form = document.getElementById('prediction-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const dateInput = document.getElementById('forecast-date').value;
            const condition = document.getElementById('condition').value;
            const temperature = document.getElementById('temperature').value;
            const notes = document.getElementById('notes').value;
            
            if (!dateInput || !condition || !temperature) return;
            
            const predictions = await loadPredictions();
            
            predictions.unshift({
                date: dateInput,
                condition,
                temperature,
                notes,
                timestamp: new Date().toISOString(),
                author: 'Admin'
            });
            
            const success = await savePredictions(predictions);
            if (success) {
                form.reset();
                alert('Forecast uploaded successfully!');
                // Wait a bit for GitHub to update, then reload
                setTimeout(loadAndDisplayPredictions, 2000);
            }
        });
    }
    
    // 4. Load and display predictions
    async function loadAndDisplayPredictions() {
        const predictions = await loadPredictions();
        displayPredictions(predictions);
    }
    
    // Initial load
    if (document.getElementById('predictions-list')) {
        loadAndDisplayPredictions();
        
        // Poll for updates every 5 seconds (only on index.html, not admin)
        if (!document.getElementById('admin-dashboard')) {
            setInterval(loadAndDisplayPredictions, 5000);
        }
    }
});
