
const API_BASE = "http://localhost:5000/api";

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

    const responseData = await res.json();
    if (!res.ok) {
      throw new Error(responseData.error || 'Something went wrong');
    }
    return responseData;

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


function currentUser() {
  const token = localStorage.getItem("token");
  // Check karo ki token hai bhi ya nahi
  if (!token) {
    return null;
  }

  try {
    const parts = token.split('.');
    // Check karo ki token 3 parts (header.payload.signature) wala hai ya nahi
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

/**
 * User ko logout karta hai.
 */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/**
 * Auth forms (Login/Register) ko handle karta hai.
 */
async function handleAuthForm(form, endpoint) {
  const errorDiv = form.querySelector('.auth-error'); // Make sure your HTML has <div class="auth-error"></div> in the form
  const submitButton = form.querySelector('button[type="submit"]');
  errorDiv.textContent = '';
  submitButton.disabled = true;
  submitButton.textContent = 'Processing...';

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const result = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (result.error) {
    errorDiv.textContent = result.error;
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


function initAuthPage(pageType) { // pageType will be 'login' or 'register'
  const form = document.getElementById(`${pageType}-form`);
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAuthForm(form, `/auth/${pageType}`);
    });
  }
}

async function initUploadPage() {
  if (!currentUser()) {
    alert("⚠️ You must be logged in to report an issue.");
    window.location.href = "login.html";
    return;
  }

  const form = document.getElementById("report-form");
  if (!form) return;

  const latInput = document.getElementById("lat");
  const lngInput = document.getElementById("lng");
  const submitButton = form.querySelector('button[type="submit"]');
  const errorDiv = document.getElementById("upload-error"); // HTML mein ek <div id="upload-error" class="help danger"></div> bana lo

  const map = L.map("map").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  let marker;

  const setMarker = (latlng) => {
    if (marker) marker.remove();
    marker = L.marker(latlng).addTo(map);
    latInput.value = latlng.lat.toFixed(6);
    lngInput.value = latlng.lng.toFixed(6);
  };

  map.on("click", (e) => setMarker(e.latlng));
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    const userLocation = { lat: coords.latitude, lng: coords.longitude };
    map.setView(userLocation, 13);
    setMarker(userLocation);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const file = formData.get('photo');

    if (!data.title || !data.description || !file || !data.lat || !data.lng) {
      errorDiv.textContent = "Please fill all fields, upload a photo, and pick a map location.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    // PRODUCTION NOTE: Base64 is not good for large images.
    // Real app mein, backend par 'multer' use karke multipart/form-data handle karna chahiye.
    // Aur image ko Cloudinary ya S3 jaise service par upload karna chahiye.
    const imageUrl = await fileToDataURL(file);

    const payload = {
      title: data.title,
      description: data.description,
      severity: data.severity,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      imageUrl: imageUrl,
    };

    const result = await apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result && !result.error) {
      alert("✅ Report submitted successfully!");
      window.location.href = "gallery.html";
    } else {
      errorDiv.textContent = result.error || "An unknown error occurred.";
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Report';
    }
  });
}

/**
 * Gallery page ko setup karta hai.
 */
async function initGalleryPage() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  grid.innerHTML = "Loading reports...";

  const reports = await apiRequest('/reports');
  grid.innerHTML = "";

  if (!reports || reports.error || !reports.length) {
    return grid.innerHTML = `<div class="alert">No reports found. <a href="upload.html">Be the first to submit one!</a></div>`;
  }

  reports.forEach((r) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <img src="${r.imageUrl}" alt="${r.title}" loading="lazy"/>
      <div class="meta">
        <div>
          <div style="font-weight:700">${r.title}</div>
          <small class="muted">By: ${r.reporterName} on ${new Date(r.createdAt).toLocaleDateString()}</small>
        </div>
        <span class="tag">${r.severity}</span>
      </div>
    `;
    grid.appendChild(item);
  });
}

/**
 * Leaderboard page ko setup karta hai. (NOW IMPLEMENTED)
 */
async function initLeaderboardPage() {
  const tbody = document.getElementById("lb-body");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';

  const data = await apiRequest('/reports/leaderboard');

  if (data && !data.error && data.length) {
    tbody.innerHTML = "";
    data.forEach((user, index) => {
      const row = `
        <tr>
          <td>#${index + 1}</td>
          <td>${user.email}</td>
          <td>${user.count}</td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } else {
    tbody.innerHTML = '<tr><td colspan="3">No data to display.</td></tr>';
  }
}

/**
 * Dashboard KPIs ko render karta hai. (NOW IMPLEMENTED)
 */
async function renderKpis() {
  const stats = await apiRequest('/reports/kpis');
  if (stats && !stats.error) {
    document.getElementById("k-total").textContent = stats.total || 0;
    document.getElementById("k-open").textContent = stats.open || 0;
    document.getElementById("k-severe").textContent = stats.severe || 0;
    document.getElementById("k-users").textContent = stats.users || 0;
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
};

/**
 * Navbar mein Login/Register/Logout buttons ko user ke auth state ke hisaab se update karta hai.
 */
// Is poore function ko copy karke apne app.js mein daal do

function setupNavbarAuth() {
    const user = currentUser();
    // User ka naam dikhane wala span bhi dhoondo
    const navUser = document.getElementById("nav-user"); 
    const loginBtn = document.querySelector('a[href="login.html"]');
    const registerBtn = document.querySelector('a[href="register.html"]');

    if (user) {
        // AGAR USER LOGGED IN HAI:

        // User ka naam/email dikhao (YEH PART MISSING THA)
        if (navUser) {
            navUser.style.display = "inline-block";
            navUser.textContent = user.name || user.email; // Agar 'name' hai toh woh, nahi toh email
        }
        
        // Login button ko Logout mein badlo
        if (loginBtn) {
            loginBtn.outerHTML = '<button class="btn secondary" onclick="IP.logout()">Logout</button>';
        }
        
        // Register button ko hata do
        if (registerBtn) {
            registerBtn.remove();
        }
        
    } else {
        // AGAR USER LOGGED OUT HAI:
        
        // User ka naam wala span hide karo (YEH PART BHI MISSING THA)
        if (navUser) {
            navUser.style.display = "none";
        }
    }
}

/**
 * Current page ke nav link ko 'active' class dekar highlight karta hai.
 */
function highlightActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || "index.html";
  document.querySelectorAll("nav .nav-links a").forEach(a => {
    if (a.getAttribute("href") === currentPage) {
      a.classList.add("active");
    }
  });
}

// Har page load pe ye script chalegi.
document.addEventListener("DOMContentLoaded", () => {
  setupNavbarAuth();
  highlightActiveNavLink();
});