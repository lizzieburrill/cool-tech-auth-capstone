import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDiv, setSelectedDiv] = useState('');
  const token = localStorage.getItem('token');

  // Fetch users and divisions on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get('http://localhost:5000/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(userRes.data);

        const divRes = await axios.get('http://localhost:5000/divisions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDivisions(divRes.data);
      } catch (err) {
        alert('Access Denied: You are not an Admin!');
      }
    };
    fetchData();
  }, [token]);

  // Handle role change
  const changeRole = async (userId, newRole) => {
    try {
      await axios.put(
        `http://localhost:5000/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Role Updated!');
      window.location.reload(); // Refresh to see changes
    } catch (err) {
      alert('Error updating role');
    }
  };

  // Handle assigning division
  const assignDivision = async (userId) => {
    if (!selectedDiv) return alert('Select a division first');
    try {
      await axios.post(
        `http://localhost:5000/users/${userId}/divisions`,
        { divisionId: selectedDiv },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User Assigned!');
      window.location.reload();
    } catch (err) {
      alert('Error assigning division');
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin Panel</h2>

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Username</th>
              <th>Current Role</th>
              <th>Assigned Divisions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>
                  <select
                    value={user.role}
                    className="form-select form-select-sm"
                    onChange={(e) => changeRole(user._id, e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="management">Management</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  {user.divisions.map((d) => (
                    <span key={d._id} className="badge bg-info text-dark me-1">
                      {d.name}
                    </span>
                  ))}
                </td>
                <td>
                  <div className="input-group input-group-sm">
                    <select
                      className="form-select"
                      onChange={(e) => setSelectedDiv(e.target.value)}
                    >
                      <option value="">Assign Div...</option>
                      {divisions.map((div) => (
                        <option key={div._id} value={div._id}>
                          {div.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary"
                      onClick={() => assignDivision(user._id)}
                    >
                      Add
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
