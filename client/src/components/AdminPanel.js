import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [ous, setOus] = useState([]); // New state for OUs
  const [selectedDiv, setSelectedDiv] = useState('');
  const [selectedOu, setSelectedOu] = useState(''); // New state for selecting OU
  const token = localStorage.getItem('token');

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Users (with populated divisions AND OUs)
        const userRes = await axios.get('http://localhost:5000/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(userRes.data);

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

  // Change role function

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
      alert('Error');
    }
  };

  // Added remove Division
  const removeDivision = async (userId, divId) => {
    if (!window.confirm('Remove this division?')) return;
    try {
      await axios.delete(
        `http://localhost:5000/users/${userId}/divisions/${divId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      window.location.reload();
    } catch (err) {
      alert('Error removing division');
    }
  };

  // Added assign OU
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
      alert('Error');
    }
  };

  // Added remove OU
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
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Username</th>
            <th>Divisions</th>
            <th>Org Units</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>
                {user.username} <br />
                <small className="text-muted">{user.role}</small>
              </td>

              {/* Divisions column */}
              <td>
                {user.divisions.map((d) => (
                  <span
                    key={d._id}
                    className="badge bg-info text-dark me-1 mb-1"
                  >
                    {d.name}
                    {/* 'X' to remove */}
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

              <td>
                {/* Role actions etc */}
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    /* ... */
                  }}
                >
                  Edit Role
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
