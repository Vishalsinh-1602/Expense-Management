import React, { useState, useEffect } from 'react';

const ExpenseSubmission = ({ user }) => {
    const [formData, setFormData] = useState({
        amount: '',
        currency: 'USD',
        category_id: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0] // Set default to today
    });
    const [categories, setCategories] = useState([]);
    const [currencies, setCurrencies] = useState(['USD', 'EUR', 'GBP', 'INR']);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchCategories();
        fetchCurrencies();
    }, []);

    const fetchCategories = async () => {
        try {
            // Use mock categories for now
            const mockCategories = [
                { id: 1, name: 'Travel' },
                { id: 2, name: 'Meals' },
                { id: 3, name: 'Office Supplies' },
                { id: 4, name: 'Software' },
                { id: 5, name: 'Training' }
            ];
            setCategories(mockCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchCurrencies = async () => {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=currencies');
            const data = await response.json();
            const currencyList = [...new Set(data.flatMap(country => Object.keys(country.currencies || {})))];
            setCurrencies(currencyList.slice(0, 20));
        } catch (error) {
            console.error('Error fetching currencies:', error);
            // Fallback currencies
            setCurrencies(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY']);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Validate form
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setMessage('Please enter a valid amount');
            setLoading(false);
            return;
        }

        if (!formData.category_id) {
            setMessage('Please select a category');
            setLoading(false);
            return;
        }

        if (!formData.description.trim()) {
            setMessage('Please enter a description');
            setLoading(false);
            return;
        }

        if (!formData.expense_date) {
            setMessage('Please select an expense date');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage('No authentication token found. Please login again.');
                setLoading(false);
                return;
            }

            console.log('Submitting expense:', formData);

            const response = await fetch('http://localhost:5000/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount) // Ensure it's a number
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Expense submitted successfully!');
                // Reset form
                setFormData({
                    amount: '',
                    currency: 'USD',
                    category_id: '',
                    description: '',
                    expense_date: new Date().toISOString().split('T')[0]
                });
            } else {
                setMessage(data.message || `Error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Submission error:', error);
            setMessage('Network error. Please check if the backend server is running on port 5000.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="expense-submission">
            <h2>Submit New Expense</h2>
            
            {message && (
                <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="expense-form">
                <div className="form-group">
                    <label>Amount:</label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Currency:</label>
                    <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        required
                    >
                        {currencies.map(currency => (
                            <option key={currency} value={currency}>
                                {currency}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Category:</label>
                    <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="3"
                        placeholder="Describe the expense purpose..."
                    />
                </div>

                <div className="form-group">
                    <label>Expense Date:</label>
                    <input
                        type="date"
                        name="expense_date"
                        value={formData.expense_date}
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Expense'}
                </button>
            </form>
        </div>
    );
};

export default ExpenseSubmission;