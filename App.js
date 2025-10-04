import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ExpenseSubmission from './components/ExpenseSubmission';
import ExpenseHistory from './components/ExpenseHistory';
import ApprovalQueue from './components/ApprovalQueue';
import UserManagement from './components/UserManagement';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route 
                        path="/login" 
                        element={!user ? <Login onLogin={login} /> : <Navigate to="/dashboard" />} 
                    />
                    <Route 
                        path="/dashboard" 
                        element={user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/submit-expense" 
                        element={user ? <ExpenseSubmission user={user} /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/my-expenses" 
                        element={user ? <ExpenseHistory user={user} /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/approvals" 
                        element={user && (user.role === 'manager' || user.role === 'admin') ? 
                            <ApprovalQueue user={user} /> : <Navigate to="/dashboard" />} 
                    />
                    <Route 
                        path="/users" 
                        element={user && user.role === 'admin' ? 
                            <UserManagement user={user} /> : <Navigate to="/dashboard" />} 
                    />
                    <Route 
                        path="/" 
                        element={<Navigate to={user ? "/dashboard" : "/login"} />} 
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;