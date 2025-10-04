import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Dashboard = ({ user, onLogout }) => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Expense Management System</h1>
                <div className="user-info">
                    <span>Welcome, {user.name} ({user.role})</span>
                    <button onClick={onLogout}>Logout</button>
                </div>
            </header>

            <nav className="dashboard-nav">
                <Link 
                    to="/dashboard" 
                    className={location.pathname === '/dashboard' ? 'active' : ''}
                >
                    Overview
                </Link>
                <Link 
                    to="/submit-expense" 
                    className={location.pathname === '/submit-expense' ? 'active' : ''}
                >
                    Submit Expense
                </Link>
                <Link 
                    to="/my-expenses" 
                    className={location.pathname === '/my-expenses' ? 'active' : ''}
                >
                    My Expenses
                </Link>
                {(user.role === 'manager' || user.role === 'admin') && (
                    <Link 
                        to="/approvals" 
                        className={location.pathname === '/approvals' ? 'active' : ''}
                    >
                        Approvals
                    </Link>
                )}
                {user.role === 'admin' && (
                    <Link 
                        to="/users" 
                        className={location.pathname === '/users' ? 'active' : ''}
                    >
                        User Management
                    </Link>
                )}
            </nav>

            <main className="dashboard-content">
                <div className="welcome-section">
                    <h2>Welcome to your Expense Management Dashboard</h2>
                    <div className="quick-stats">
                        <div className="stat-card">
                            <h3>Quick Actions</h3>
                            <ul>
                                <li><Link to="/submit-expense">Submit New Expense</Link></li>
                                <li><Link to="/my-expenses">View Expense History</Link></li>
                                {user.role === 'manager' && (
                                    <li><Link to="/approvals">Review Pending Approvals</Link></li>
                                )}
                                {user.role === 'admin' && (
                                    <>
                                        <li><Link to="/users">Manage Users</Link></li>
                                        <li><Link to="/approvals">Review All Approvals</Link></li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;