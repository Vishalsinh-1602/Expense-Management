import React, { useState, useEffect } from 'react';

const ExpenseHistory = ({ user }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/expenses/my-expenses', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading expenses...</div>;
    }

    return (
        <div className="expense-history">
            <h2>My Expense History</h2>
            
            {expenses.length === 0 ? (
                <p>No expenses found.</p>
            ) : (
                <table className="expenses-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Currency</th>
                            <th>Category</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                                <td>{expense.description}</td>
                                <td>{expense.amount}</td>
                                <td>{expense.currency}</td>
                                <td>{expense.category_name}</td>
                                <td className={`status ${expense.status}`}>
                                    {expense.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ExpenseHistory;