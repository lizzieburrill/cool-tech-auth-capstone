import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CredentialList = ({ divisionId }) => {
  const [credentials, setCredentials] = useState([]);
  const [newCred, setNewCred] = useState({
    siteName: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  // Fetch credentials when divisionId changes
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/credentials/${divisionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCredentials(res.data);
        setError('');
      } catch (err) {
        setError('Could not load credentials.');
      }
    };
    fetchCredentials();
  }, [divisionId, token]);

  // Handle add credential submit
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        'http://localhost:5000/credentials',
        { ...newCred, divisionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Add new item to list immediately
      setCredentials([...credentials, res.data.credential]);
      setNewCred({ siteName: '', username: '', password: '' }); // Reset form
    } catch (err) {
      alert('Error adding credential');
    }
  };

  // Handle update
  const handleUpdate = async (id) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    try {
      await axios.put(
        `http://localhost:5000/credentials/${id}`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Password updated!');
      // Refresh list
      window.location.reload();
    } catch (err) {
      // Catch the 403 Forbidden if user is 'normal'
      alert(err.response?.data?.error || 'Update failed');
    }
  };

  return (
    <div className="mt-4">
      <h3>Credentials Repository</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* List */}
      <ul className="list-group mb-4">
        {credentials.map((cred) => (
          <li
            key={cred._id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{cred.siteName}</strong> <br />
              <small>
                User: {cred.username} | Pass: {cred.password}
              </small>
            </div>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleUpdate(cred._id)}
            >
              Update
            </button>
          </li>
        ))}
      </ul>

      {/* Add Form */}
      <div className="card p-3 bg-light">
        <h5>Add New Credential</h5>
        <form onSubmit={handleAdd}>
          <div className="row">
            <div className="col-md-4 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Site Name"
                value={newCred.siteName}
                onChange={(e) =>
                  setNewCred({ ...newCred, siteName: e.target.value })
                }
                required
              />
            </div>
            <div className="col-md-4 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Username"
                value={newCred.username}
                onChange={(e) =>
                  setNewCred({ ...newCred, username: e.target.value })
                }
                required
              />
            </div>
            <div className="col-md-3 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Password"
                value={newCred.password}
                onChange={(e) =>
                  setNewCred({ ...newCred, password: e.target.value })
                }
                required
              />
            </div>
            <div className="col-md-1">
              <button className="btn btn-primary w-100">+</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CredentialList;
