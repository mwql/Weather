import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const predictionsCollection = collection(db, "predictions");

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
            if (password === '1') { // Password from user request
                // Success
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                // No need to call loadPredictions() manually, onSnapshot handles it
            } else {
                // Failure
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

            try {
                await addDoc(predictionsCollection, {
                    date: dateInput,
                    condition,
                    temperature,
                    notes,
                    timestamp: new Date().toISOString(), // ISO string for sorting
                    author: 'Admin'
                });
                form.reset();
                alert('Forecast uploaded successfully!');
            } catch (e) {
                console.error("Error adding document: ", e);
                alert("Error uploading forecast. Check console for details.");
            }
        });
    }

    // 4. Real-time Listener for Predictions (index.html & admin.html)
    const listContainer = document.getElementById('predictions-list');
    const targetDateDisplay = document.getElementById('target-date-display');

    if (listContainer) {
        // Order by timestamp descending (newest first)
        const q = query(predictionsCollection, orderBy("timestamp", "desc"));

        onSnapshot(q, (snapshot) => {
            listContainer.innerHTML = '';
            const predictions = [];
            
            snapshot.forEach((doc) => {
                predictions.push({ id: doc.id, ...doc.data() });
            });

            // Update main header on index.html
            if (targetDateDisplay && predictions.length > 0) {
                // Since we sort by timestamp desc, the first one is the latest uploaded
                // But user might want the latest *forecast date*. 
                // For now, let's stick to the latest uploaded one as per previous logic, 
                // or we could sort by 'date' field. 
                // Let's use the first one from the list (latest added).
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
                
                let icon = '❓';
                if (pred.condition.includes('Sunny')) icon = '☀️';
                else if (pred.condition.includes('Cloudy')) icon = '☁️';
                else if (pred.condition.includes('Rainy')) icon = '🌧️';
                else if (pred.condition.includes('Stormy')) icon = '⛈️';
                else if (pred.condition.includes('Snowy')) icon = '❄️';
                else if (pred.condition.includes('Windy')) icon = '💨';

                let deleteBtn = '';
                if (isAdmin) {
                    deleteBtn = `<button class="delete-btn" onclick="deletePrediction('${pred.id}')" style="margin-left: auto; background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>`;
                }

                // Fix date parsing for display (handle YYYY-MM-DD string)
                // We need to be careful with timezones when creating Date from YYYY-MM-DD
                // Appending 'T00:00:00' helps keep it local or at least consistent
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
        }, (error) => {
            console.error("Error getting documents: ", error);
            if (error.code === 'permission-denied' || error.code === 'failed-precondition') {
                 listContainer.innerHTML = '<p class="empty-state" style="color: red;">Error: Missing Firebase Config. Please add your keys in script.js</p>';
            }
        });
    }

    // Expose delete function globally
    window.deletePrediction = async function(id) {
        if (!confirm("Are you sure you want to delete this forecast?")) return;
        try {
            await deleteDoc(doc(db, "predictions", id));
            // onSnapshot will automatically update the UI
        } catch (e) {
            console.error("Error removing document: ", e);
            alert("Error deleting forecast.");
        }
    };
});
