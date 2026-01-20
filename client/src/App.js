import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

// Separate component for the Navbar so it can use hooks
const Navigation = () => {
  const location = useLocation(); // Forces re-render on route change
  const navigate = useNavigate();

  // Check auth status
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear(); // Clear all data
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        {/* Brand link goes to Dashboard if logged in, else Home */}
        <Link className="navbar-brand" to={token ? '/dashboard' : '/'}>
          Cool Tech Auth
        </Link>

        <div>
          {token ? (
            <>
              {/* Logged in view */}
              <span className="navbar-text me-3 text-white">
                Signed in as {localStorage.getItem('username')}
              </span>

              {role === 'admin' && (
                <Link className="btn btn-warning me-2" to="/admin">
                  Admin Panel
                </Link>
              )}

              <Link className="btn btn-outline-light me-2" to="/dashboard">
                Dashboard
              </Link>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Logged out view */}
              <Link className="btn btn-outline-light me-2" to="/login">
                Login
              </Link>
              <Link className="btn btn-warning" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <Navigation /> {/* Navbar is now inside router */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route
          path="/"
          element={
            <div className="text-center mt-5">
              <h1>Credential Management System</h1>
              <p>Please login or register to continue.</p>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
