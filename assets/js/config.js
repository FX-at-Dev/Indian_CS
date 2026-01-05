// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'
  : 'https://indian-cs.onrender.com'; // Replace with your actual backend URL

export default API_BASE_URL;
