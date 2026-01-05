// =========================================
// INDIAN CIVIC SENSE - FINAL APP.JS (COMPLETE & READY)
// =========================================

const API_BASE = "http://localhost:10000/api";
let detailMapInstance = null; // Global map instance for gallery modal

// -----------------------------------------------------------------------------
// SECTION: CORE HELPER FUNCTIONS (API Communication)
// -----------------------------------------------------------------------------

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

        if (res.status === 401) {
            IP.logout();
            return { error: "Session expired. Please log in again." };
        }

        const contentType = res.headers.get("content-type");
        if (!res.ok) {
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                throw new Error(data.error || "Something went wrong");
            } else {
                const text = await res.text();
                throw new Error(`Server returned status ${res.status}. Check API.`);
            }
        }
        return res.json();

    } catch (err) {
        console.error(`API Error on ${endpoint}:`, err);
        return { error: err.message };
    }
}

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// -----------------------------------------------------------------------------
// SECTION: AUTHENTICATION LOGIC
// -----------------------------------------------------------------------------

function currentUser() {
    const token = localStorage.getItem("token");
    if (!token) {
        return null;
    }

    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error("Invalid token format");
        }
        const payload = JSON.parse(atob(parts[1]));
        return payload.user;
    } catch (err) {
        console.error("Failed to decode token:", err.message);
        localStorage.removeItem('token');
        return null;
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

async function handleAuthForm(form, endpoint) {
    const errorDiv = form.querySelector('.auth-error');
    const submitButton = form.querySelector('button[type="submit"]');
    if (errorDiv) errorDiv.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (result.error) {
        if (errorDiv) errorDiv.textContent = result.error;
        submitButton.disabled = false;
        submitButton.textContent = form.id.includes('login') ? 'Login' : 'Register';
    } else {
        if (endpoint.includes('register')) {
            alert('✅ Registration successful! Please login.');
            window.location.href = 'login.html';
        } else {
            localStorage.setItem('token', result.token);
            window.location.href = 'index.html';
        }
    }
}

// -----------------------------------------------------------------------------
// SECTION: REPORT STATUS & MODAL LOGIC
// -----------------------------------------------------------------------------

/**
 * Handles the final submission of the proof and closes the report on the backend.
 * This is the core logic for the 'Mark as Closed' button within the modal.
 */
async function handleClosureSubmit(reportId) {
    const proofInput = document.getElementById("proof-photo-input");
    const notesInput = document.getElementById("proof-notes-input");
    const errorDiv = document.getElementById("proof-error");
    const button = document.getElementById("final-close-btn");

    if (!proofInput || !button || !errorDiv) return;

    // 1. Validation Check (Must upload a photo)
    if (!proofInput.files || proofInput.files.length === 0) {
        errorDiv.textContent = "⚠️ Please upload a Proof Photo before closing.";
        return;
    }
    
    // 2. Button State Change
    errorDiv.textContent = '';
    button.disabled = true;
    button.textContent = 'Uploading Proof...';

    const photoFile = proofInput.files[0];
    const resolutionImageUrl = await fileToDataURL(photoFile); // Photo to Base64

    const payload = {
        resolutionImageUrl: resolutionImageUrl,
        resolutionNotes: notesInput.value,
    };

    // 3. API Call to Backend (PATCH /:id/close)
    const result = await apiRequest(`/reports/${reportId}/close`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    
    // 4. Handle Response
    if (result && !result.error) {
        alert("✅ Report successfully closed with proof!");
        document.getElementById("report-modal").close(); 
        IP.initGalleryPage(); // Reload gallery to show updated status
    } else {
        errorDiv.textContent = result.error || "Failed to close report.";
        button.disabled = false;
        button.textContent = 'Mark as Closed';
    }
}

/**
 * Placeholder/old function to fulfill IP.closeReport() calls on main gallery cards.
 * It opens the modal for the official to provide proof.
 */
async function closeReport(reportId) {
    // This function ensures that clicking the button on the *main* gallery card
    // takes the user to the proof submission modal.
    IP.showReportDetails(reportId);
}

/**
 * Fetches single report data and displays it in the modal (including map and closure form).
 */
async function showReportDetails(reportId) {
    const modal = document.getElementById("report-modal");
    const modalTitle = document.getElementById("modal-title");
    
    if (!modal) return;
    const modalMapContainer = document.getElementById("modal-map"); 
    if (!modalMapContainer) return;

    modalTitle.textContent = "Loading details...";
    if (modal.showModal) modal.showModal(); else modal.style.display = 'block'; 

    // --- Backend Fetch ---
    const report = await apiRequest(`/reports/${reportId}`, { method: 'GET' });

    if (report.error) {
        modalTitle.textContent = `Error: ${report.error}`;
        return;
    }

    const closureSection = document.getElementById("closure-proof-section");
    const modalActions = document.getElementById("modal-actions");
    
    // --- Data Mapping & Auth Check ---
    const statusText = report.status || 'Active';
    const statusClass = statusText === 'Closed' ? 'success' : 'danger';
    const user = currentUser();
    const isAdmin = user && (user.role === 'admin' || user.role === 'government');
    
    // --- HTML Elements fill ---
    modalTitle.textContent = report.title;
    document.getElementById("modal-image").src = report.imageUrl || report.img || 'https://via.placeholder.com/300x200?text=No+Image';
    document.getElementById("modal-reporter").textContent = `Reported by: ${report.reporterName || 'Anonymous'}`;
    document.getElementById("modal-date").textContent = new Date(report.createdAt).toLocaleDateString();
    document.getElementById("modal-description").textContent = report.description;
    document.getElementById("modal-status").className = `tag ${statusClass}`;
    document.getElementById("modal-status").textContent = statusText;
    document.getElementById("modal-severity").textContent = `Severity: ${report.severity}`;
    document.getElementById("modal-coords").textContent = `Lat: ${report.lat.toFixed(6)}, Lng: ${report.lng.toFixed(6)} | City: ${report.city || 'N/A'}`;
    
    // --- Proof Section Visibility and Button Logic ---
    if (closureSection) {
        if (statusText !== 'Closed' && isAdmin) {
            // If active and user is admin, show the proof upload section
            closureSection.style.display = 'block';
            modalActions.innerHTML = `<button class="btn secondary" id="final-close-btn" onclick="IP.handleClosureSubmit('${report._id}')">Mark as Closed</button>`;
        } else {
            // Hide the proof upload section
            closureSection.style.display = 'none';
            
            // Show resolution notes if closed
            if (statusText === 'Closed' && report.resolutionNotes) {
                modalActions.innerHTML = `<p class="help">Resolution Notes: ${report.resolutionNotes}</p>`;
            } else {
                 modalActions.innerHTML = '';
            }
        }
    }

    // 🚀 Map initialization for Modal 🚀
    if (detailMapInstance) detailMapInstance.remove();
    
    // Leaflet requires a short delay when initializing inside a modal
    setTimeout(() => {
        if (typeof L !== 'undefined') {
            detailMapInstance = L.map('modal-map').setView([report.lat, report.lng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(detailMapInstance);
            L.marker([report.lat, report.lng]).addTo(detailMapInstance);
            detailMapInstance.invalidateSize(); 
        } else {
             console.error("Leaflet library (L) is not defined for the modal map.");
        }
    }, 50); 
}

// Global Modal Close Handler
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("report-modal");
    const closeBtn = document.getElementById("modal-close-btn");
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.close();
            // Map instance ko remove kar do jab modal band ho jaye
            if (detailMapInstance) {
                 detailMapInstance.remove();
                 detailMapInstance = null;
            }
            // Clear proof inputs on modal close (for next open)
            const proofInput = document.getElementById("proof-photo-input");
            const notesInput = document.getElementById("proof-notes-input");
            const errorDiv = document.getElementById("proof-error");
            if (proofInput) proofInput.value = '';
            if (notesInput) notesInput.value = '';
            if (errorDiv) errorDiv.textContent = '';
        });
    }
});


// -----------------------------------------------------------------------------
// SECTION: PAGE INITIALIZERS
// -----------------------------------------------------------------------------

function initAuthPage(pageType) {
    const form = document.getElementById(`${pageType}-form`);
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAuthForm(form, `/auth/${pageType}`);
        });
    }
}

/**
 * Report Upload page initialization (Map setup and form submission)
 */
async function initUploadPage() {
    const form = document.getElementById("report-form");
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById("upload-error");

    // --- MAP AND BUTTON LOGIC ---
    // Wait for Leaflet to load (fixes 'L is not defined')
    const waitForLeaflet = setInterval(() => {
        if (typeof L !== 'undefined') {
            clearInterval(waitForLeaflet);
            initializeMap();
        }
    }, 100);

    function initializeMap() {
        const mapElement = document.getElementById("map");
        if (!mapElement) return;

        const latInput = document.getElementById("lat");
        const lngInput = document.getElementById("lng");

        try {
            const map = L.map("map").setView([20.5937, 78.9629], 5);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            let marker;

            const setMarker = (lat, lng) => {
                if (marker) marker.remove();
                marker = L.marker([lat, lng]).addTo(map);
                latInput.value = lat.toFixed(6);
                lngInput.value = lng.toFixed(6);
            };

            const clearMarker = () => {
                if (marker) marker.remove();
                marker = null;
                latInput.value = "";
                lngInput.value = "";
            };

            map.on("click", (e) => setMarker(e.latlng.lat, e.latlng.lng));

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(({ coords }) => {
                    map.setView([coords.latitude, coords.longitude], 13);
                    setMarker(coords.latitude, coords.longitude);
                }, (err) => {
                    console.log("Geolocation error:", err.message);
                });
            }

            const autoLocateBtn = document.getElementById("auto-locate");
            if (autoLocateBtn) autoLocateBtn.addEventListener("click", () => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => { map.setView([pos.coords.latitude, pos.coords.longitude], 15); setMarker(pos.coords.latitude, pos.coords.longitude); },
                        (err) => { alert("⚠️ Could not get location: " + err.message); }
                    );
                } else { alert("❌ Geolocation is not supported in your browser."); }
            });

            const clearMapBtn = document.getElementById("clear-map");
            if (clearMapBtn) clearMapBtn.addEventListener("click", clearMarker);

        } catch (err) {
            console.error("Map initialization error:", err);
            if (errorDiv) errorDiv.textContent = "Failed to load map. Please refresh the page.";
        }
    }
    // --- END OF MAP AND BUTTON LOGIC ---


    // Form submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (errorDiv) errorDiv.textContent = '';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const file = formData.get('photo');

        const lat = document.getElementById("lat")?.value;
        const lng = document.getElementById("lng")?.value;

        const user = currentUser();
        const reporterName = user ? (user.name || user.email) : "Anonymous User";
        
        const city = data.city; 

        if (!data.title || !data.description || !file || !lat || !lng || !city) { 
            if (errorDiv) errorDiv.textContent = "Please fill all fields (Title, Description, City), upload a photo, and pick a map location.";
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        const imageUrl = await fileToDataURL(file);

        const payload = {
            title: data.title,
            description: data.description,
            severity: data.severity,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            imageUrl: imageUrl,
            reporterName: reporterName,
            city: city, 
        };

        const result = await apiRequest('/reports', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (result && !result.error) {
            alert("✅ Report submitted successfully! Thank you for your civic sense.");
            window.location.href = "gallery.html";
        } else {
            if (errorDiv) errorDiv.textContent = result.error || "An unknown error occurred.";
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Report';
        }
    });
}


async function initGalleryPage() {
    const galleryGrid = document.getElementById("gallery-grid");
    if (!galleryGrid) return;

    galleryGrid.innerHTML = '<div class="alert">Loading reports...</div>';

    try {
        const reports = await apiRequest('/reports', { method: 'GET' });

        if (reports.error) {
            galleryGrid.innerHTML = `<div class="alert" style="color: var(--danger)">${reports.error}</div>`;
            return;
        }

        if (!reports || reports.length === 0) {
            galleryGrid.innerHTML = '<div class="alert">No reports found. Be the first to report an issue!</div>';
            return;
        }

        const user = currentUser();
        const isAdmin = user && (user.role === 'admin' || user.role === 'government');

        galleryGrid.innerHTML = reports.map(r => {
            const imageUrl = r.imageUrl || r.img || 'https://via.placeholder.com/280x200?text=No+Image';
            const reporterName = r.reporterName || 'Anonymous';
            const statusClass = r.status === 'Closed' ? 'success' : 'danger';
            const statusText = r.status || 'Active';

            const closeButton = (r.status !== 'Closed' && isAdmin)
                ? `<button class="btn secondary" onclick="IP.showReportDetails('${r._id}')">Mark as Closed</button>`
                : '';

            return `
                <div class="item card" id="report-${r._id}" onclick="IP.showReportDetails('${r._id}')">
                    <img src="${imageUrl}" alt="${r.title}" />
                    <div style="padding: 10px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 16px;">${r.title}</h3>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${r.description}</p>
                        <div class="meta">
                            <span class="badge">${reporterName}</span>
                            <span class="tag ${statusClass}">${statusText}</span>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: #999;">
                            📍 ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)} | 
                            🔥 ${r.severity}
                        </div>
                    </div>
                    <div class="actions">
                        ${closeButton}
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Gallery loading error:", err);
        galleryGrid.innerHTML = '<div class="alert" style="color: var(--danger)">Failed to load reports. Please try again.</div>';
    }
}


async function initLeaderboardPage() { 
     const leaderboardGrid = document.getElementById("leaderboard-grid");
     if (!leaderboardGrid) return;
     leaderboardGrid.innerHTML = '<div class="alert">Loading leaderboard...</div>';

     try {
         const reports = await apiRequest('/reports', { method: 'GET' });

         if (reports.error || !reports || reports.length === 0) {
             leaderboardGrid.innerHTML = '<div class="alert">No data available.</div>';
             return;
         }

         const counts = {};
         reports.forEach(r => {
             const name = r.reporterName || 'Anonymous';
             counts[name] = (counts[name] || 0) + 1;
         });

         const sorted = Object.entries(counts)
             .sort((a, b) => b[1] - a[1])
             .slice(0, 10);

         leaderboardGrid.innerHTML = sorted.map(([name, count], idx) => `
             <div class="card">
                 <h3>#${idx + 1} ${name}</h3>
                 <p class="help">${count} report${count > 1 ? 's' : ''}</p>
             </div>
         `).join('');

     } catch (err) {
         console.error("Leaderboard error:", err);
         leaderboardGrid.innerHTML = '<div class="alert" style="color: var(--danger)">Failed to load leaderboard.</div>';
     }
}

async function renderKpis() { 
    try {
        const kpis = await apiRequest('/reports/kpis', { method: 'GET' });
        
        if (kpis && !kpis.error) {
            const totalEl = document.getElementById('k-total');
            const openEl = document.getElementById('k-open');
            const severeEl = document.getElementById('k-severe');
            const usersEl = document.getElementById('k-users');

            if (totalEl) totalEl.textContent = kpis.total || 0;
            if (openEl) openEl.textContent = kpis.open || 0;
            if (severeEl) severeEl.textContent = kpis.severe || 0;
            if (usersEl) usersEl.textContent = kpis.users || 0;
        }
    } catch (err) {
        console.error("KPI rendering error:", err);
    }
}


// -----------------------------------------------------------------------------
// SECTION: GLOBAL INITIALIZATION
// -----------------------------------------------------------------------------

window.IP = {
    initAuthPage,
    initUploadPage,
    initGalleryPage,
    initLeaderboardPage,
    renderKpis,
    currentUser,
    logout,
    closeReport,
    showReportDetails,
    handleClosureSubmit
};

function setupNavbarAuth() {
    const user = currentUser();
    const navUser = document.getElementById("nav-user");
    const loginBtn = document.querySelector('a[href="login.html"]');
    const registerBtn = document.querySelector('a[href="register.html"]'); 

    if (user) {
        if (navUser) {
            navUser.style.display = "inline-block";
            navUser.textContent = user.name || user.email;
        }
        if (loginBtn) {
            loginBtn.outerHTML = '<button class="btn secondary" onclick="IP.logout()">Logout</button>';
        }
        if (registerBtn) {
            registerBtn.remove();
        }
    } else {
        if (navUser) navUser.style.display = "none";
    }
}

function highlightActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || "index.html";
    document.querySelectorAll("nav .nav-links a").forEach(a => {
        if (a.getAttribute("href") === currentPage) {
            a.classList.add("active");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupNavbarAuth();
    highlightActiveNavLink();

    const currentPage = window.location.pathname.split('/').pop() || "index.html";

    if (currentPage === 'login.html') {
        IP.initAuthPage("login");
    } else if (currentPage === 'register.html') {
        IP.initAuthPage("register");
    } else if (currentPage === 'upload.html') {
        IP.initUploadPage();
    } else if (currentPage === 'gallery.html') {
        IP.initGalleryPage();
    } else if (currentPage === 'leaderboard.html') {
        IP.initLeaderboardPage();
    } else if (currentPage === 'index.html' || currentPage === '') {
        IP.renderKpis();
    }
});