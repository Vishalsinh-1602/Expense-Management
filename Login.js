import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        country: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = isSignup ? 'http://localhost:5000/api/auth/signup' : 'http://localhost:5000/api/auth/login';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data.user, data.token);
            } else {
                setError(data.message || 'Authentication failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>{isSignup ? 'Create Company & Admin Account' : 'Login'}</h2>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    {isSignup && (
                        <>
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="country"
                                placeholder="Country"
                                value={formData.country}
                                onChange={handleChange}
                                required
                            />
                        </>
                    )}
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
                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Login')}
                    </button>
                </form>
                
                <p>
                    {isSignup ? 'Already have an account?' : "Don't have an account?"}
                    <button 
                        type="button" 
                        className="link-button"
                        onClick={() => setIsSignup(!isSignup)}
                    >
                        {isSignup ? 'Login' : 'Create Company'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;