import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const userId = localStorage.getItem('user_id');

    // If user ID exists, show the page. Otherwise, redirect to login.
    return userId ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;