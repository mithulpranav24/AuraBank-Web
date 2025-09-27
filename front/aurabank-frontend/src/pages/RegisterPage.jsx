import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import '../App.css';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    account_number: ''
  });

  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // This function updates the state whenever you type in an input field
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // This function is called when the form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage("Error: Passwords do not match.");
      return;
    }

    // 2. Check for password strength (at least 8 chars, 1 letter, 1 number)
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,16}$/;
    if (!passwordRegex.test(formData.password)) {
      setMessage("Error: Password must be 8–16 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.");

      return;
    }

    setMessage('Registering...');
    try {
      // We don't send confirmPassword to the backend, so we remove it from the payload
      const { confirmPassword, ...payload } = formData;
      const response = await apiClient.post('/api/register', payload);
      
      if (response.data.status === 'success') {
        setMessage(response.data.message);
        
        // Save the new user's ID to local storage to start their session
        localStorage.setItem('user_id', response.data.user_id);
        
        // Redirect to the face enrollment page after a short delay
        setTimeout(() => {
          navigate('/enroll-face');
        }, 1500);
      }
    } catch (error) {
      if (error.response) {
        setMessage(`Error: ${error.response.data.message}`);
      } else {
        setMessage('An unexpected error occurred.');
      }
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="form-container">
      <h1>Create Your AuraBank Account</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
        <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
        <input type="tel" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} required />
        <input type="text" name="account_number" placeholder="Account Number" value={formData.account_number} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
        <button type="submit">Register and Proceed to Face Scan</button>
      </form>
      {message && <p className="message">{message}</p>}
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link to="/login" style={{ color: 'white' }}>Already have an account? Login</Link>
      </div>
    </div>
  );
}

export default RegisterPage;