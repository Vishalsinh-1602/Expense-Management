import React, { useState, useEffect } from 'react';

const ApprovalQueue = ({ user }) => {
    const [pendingExpenses, setPendingExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingExpenses();
    }, []);

    const fetchPendingExpenses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/expenses/pending-approval', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPendingExpenses(data);
            }
        } catch (error) {
            console.error('Error fetching pending expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (expenseId, status) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/approvals/${expenseId}/decision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, comments: `${status} by ${user.name}` })
            });

            if (response.ok) {
                // Remove the approved/rejected expense from the list
                setPendingExpenses(prev => prev.filter(expense => expense.id !== expenseId));
                alert(`Expense ${status} successfully`);
            }
        } catch (error) {
            console.error('Error processing approval:', error);
            alert('Error processing approval');
        }
    };

    if (loading) {
        return <div>Loading pending approvals...</div>;
    }

    return (
        <div className="approval-queue">
            <h2>Pending Approvals</h2>
            
            {pendingExpenses.length === 0 ? (
                <p>No pending approvals.</p>
            ) : (
                <div className="approval-list">
                    {pendingExpenses.map(expense => (
                        <div key={expense.id} className="approval-item">
                            <div className="expense-details">
                                <h3>{expense.description}</h3>
                                <p><strong>Employee:</strong> {expense.employee_name}</p>
                                <p><strong>Amount:</strong> {expense.amount} {expense.currency}</p>
                                <p><strong>Category:</strong> {expense.category_name}</p>
                                <p><strong>Date:</strong> {new Date(expense.expense_date).toLocaleDateString()}</p>
                            </div>
                            <div className="approval-actions">
                                <button 
                                    className="approve-btn"
                                    onClick={() => handleApproval(expense.id, 'approved')}
                                >
                                    Approve
                                </button>
                                <button 
                                    className="reject-btn"
                                    onClick={() => handleApproval(expense.id, 'rejected')}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApprovalQueue;