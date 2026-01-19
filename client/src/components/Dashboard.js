import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CredentialList from './CredentialList';

const Dashboard = () => {
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const navigate = useNavigate();

  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Fetch Divisions on load
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDivisions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/divisions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDivisions(res.data);
      } catch (err) {
        console.error('Failed to load divisions');
      }
    };
    fetchDivisions();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Welcome, {username}</h1>
        <div>
          {/* Only show this button if role is 'admin' */}
          {role === 'admin' && (
            <button
              className="btn btn-warning me-2"
              onClick={() => navigate('/admin')}
            >
              Admin Panel
            </button>
          )}
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card p-4 shadow-sm">
        <h4>Select a Division</h4>
        <p>Please select a division to view its credential repository.</p>

        <select
          className="form-select mb-3"
          onChange={(e) => setSelectedDivision(e.target.value)}
          value={selectedDivision}
        >
          <option value="">-- Select Division --</option>
          {divisions.map((div) => (
            <option key={div._id} value={div._id}>
              {div.name}
            </option>
          ))}
        </select>

        {/* Only show the list if a division is selected */}
        {selectedDivision && <CredentialList divisionId={selectedDivision} />}
      </div>
    </div>
  );
};

export default Dashboard;
