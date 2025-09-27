import { Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import FaceEnrollmentPage from './pages/FaceEnrollmentPage';
import './App.css';

function HomePage() {
  return (
    <div className="form-container">
      <h1>Welcome to AuraBank</h1>
      <nav style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <Link to="/login" style={{color: 'white'}}>Login</Link>
        <Link to="/register" style={{color: 'white'}}>Register</Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      {/* NEW: Add the container for the animated blobs */}
      <div className="gradient-background">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
      </div>

      {/* Your router remains the same, it will be displayed on top of the background */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/enroll-face" element={<FaceEnrollmentPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;