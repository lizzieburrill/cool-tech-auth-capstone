import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [ous, setOus] = useState([]);
  const [selectedDiv, setSelectedDiv] = useState('');
  const [selectedOu, setSelectedOu] = useState('');
  const token = localStorage.getItem('token');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Users
        const userRes = await axios.get('http://localhost:5000/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(userRes.data);

        // Fetch Divisions
        const divRes = await axios.get('http://localhost:5000/divisions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDivisions(divRes.data);

        // Fetch OUs
        const ouRes = await axios.get('http://localhost:5000/ous', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOus(ouRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [token]);

  // Function to handle role change
  const changeRole = async (userId, newRole) => {
    // Confirm before changing to prevent accidental clicks
    if (
      !window.confirm(
        `Are you sure you want to change this user's role to ${newRole}?`
      )
    )
      return;

    try {
      await axios.put(
        `http://localhost:5000/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Role Updated!');
      window.location.reload(); // Refresh to show the new state
    } catch (err) {
      alert('Error updating role');
    }
  };

  // Assign Division
  const assignDivision = async (userId) => {
    if (!selectedDiv) return;
    try {
      await axios.post(
        `http://localhost:5000/users/${userId}/divisions`,
        { divisionId: selectedDiv },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (err) {
      alert('Error assigning division');
    }
  };

  // Remove Division
  const removeDivision = async (userId, divId) => {
    if (!window.confirm('Remove this division?')) return;
    try {
      await axios.delete(
        `http://localhost:5000/users/${userId}/divisions/${divId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (err) {
      alert('Error removing division');
    }
  };

  // Assign OU
  const assignOu = async (userId) => {
    if (!selectedOu) return;
    try {
      await axios.post(
        `http://localhost:5000/users/${userId}/ous`,
        { ouId: selectedOu },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (err) {
      alert('Error assigning OU');
    }
  };

  // Remove OU
  const removeOu = async (userId, ouId) => {
    if (!window.confirm('Remove this OU?')) return;
    try {
      await axios.delete(`http://localhost:5000/users/${userId}/ous/${ouId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.reload();
    } catch (err) {
      alert('Error removing OU');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Admin Panel</h2>
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>User & Role</th>
              <th>Divisions</th>
              <th>Org Units</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                {/* User and role selector column */}
                <td style={{ minWidth: '200px' }}>
                  <strong>{user.username}</strong>
                  <div className="mt-2">
                    <label className="small text-muted">Role:</label>
                    <select
                      className="form-select form-select-sm mt-1"
                      value={user.role}
                      onChange={(e) => changeRole(user._id, e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="management">Management</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </td>

                {/* Divisions column */}
                <td>
                  {user.divisions.map((d) => (
                    <span
                      key={d._id}
                      className="badge bg-info text-dark me-1 mb-1"
                    >
                      {d.name}
                      <span
                        style={{
                          cursor: 'pointer',
                          marginLeft: '5px',
                          fontWeight: 'bold',
                        }}
                        onClick={() => removeDivision(user._id, d._id)}
                      >
                        x
                      </span>
                    </span>
                  ))}
                  <div className="input-group input-group-sm mt-2">
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
                      className="btn btn-outline-primary"
                      onClick={() => assignDivision(user._id)}
                    >
                      +
                    </button>
                  </div>
                </td>

                {/* OU column */}
                <td>
                  {user.organisationUnits &&
                    user.organisationUnits.map((ou) => (
                      <span
                        key={ou._id}
                        className="badge bg-warning text-dark me-1 mb-1"
                      >
                        {ou.name}
                        <span
                          style={{
                            cursor: 'pointer',
                            marginLeft: '5px',
                            fontWeight: 'bold',
                          }}
                          onClick={() => removeOu(user._id, ou._id)}
                        >
                          x
                        </span>
                      </span>
                    ))}
                  <div className="input-group input-group-sm mt-2">
                    <select
                      className="form-select"
                      onChange={(e) => setSelectedOu(e.target.value)}
                    >
                      <option value="">Assign OU...</option>
                      {ous.map((o) => (
                        <option key={o._id} value={o._id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => assignOu(user._id)}
                    >
                      +
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
