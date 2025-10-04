import React, { useState, useEffect } from 'react';

const UserManagement = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'employee',
        manager_id: '',
        is_manager_approver: false
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('User created successfully');
                setShowForm(false);
                setFormData({
                    email: '',
                    password: '',
                    name: '',
                    role: 'employee',
                    manager_id: '',
                    is_manager_approver: false
                });
                fetchUsers(); // Refresh the list
            } else {
                const data = await response.json();
                alert(data.message || 'Error creating user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Error creating user');
        }
    };

    const updateUserRole = async (userId, newRole) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                alert('User role updated successfully');
                fetchUsers(); // Refresh the list
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Error updating user role');
        }
    };

    if (loading) {
        return <div>Loading users...</div>;
    }

    const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');

    return (
        <div className="user-management">
            <div className="user-management-header">
                <h2>User Management</h2>
                <button 
                    className="add-user-btn"
                    onClick={() => setShowForm(true)}
                >
                    Add New User
                </button>
            </div>

            {showForm && (
                <div className="user-form-overlay">
                    <div className="user-form">
                        <h3>Create New User</h3>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                            </select>
                            <select
                                name="manager_id"
                                value={formData.manager_id}
                                onChange={handleChange}
                            >
                                <option value="">Select Manager (Optional)</option>
                                {managers.map(manager => (
                                    <option key={manager.id} value={manager.id}>
                                        {manager.name} ({manager.role})
                                    </option>
                                ))}
                            </select>
                            <label>
                                <input
                                    type="checkbox"
                                    name="is_manager_approver"
                                    checked={formData.is_manager_approver}
                                    onChange={handleChange}
                                />
                                Can approve expenses as manager
                            </label>
                            <div className="form-actions">
                                <button type="submit">Create User</button>
                                <button type="button" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="users-list">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Manager Approver</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(userItem => (
                            <tr key={userItem.id}>
                                <td>{userItem.name}</td>
                                <td>{userItem.email}</td>
                                <td>{userItem.role}</td>
                                <td>{userItem.is_manager_approver ? 'Yes' : 'No'}</td>
                                <td>
                                    {userItem.role !== 'admin' && (
                                        <select
                                            value={userItem.role}
                                            onChange={(e) => updateUserRole(userItem.id, e.target.value)}
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="manager">Manager</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;