import axios from 'axios';

// Create a pre-configured instance of Axios
const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:5000', // Your Flask server's address
    withCredentials: true // This is the crucial part
});

export default apiClient;