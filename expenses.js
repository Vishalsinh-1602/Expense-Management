const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Submit expense
router.post('/', auth, async (req, res) => {
    const { amount, currency, category_id, description, expense_date } = req.body;
    const employee_id = req.userId;
    const company_id = req.user.companyId;

    console.log('Expense submission received:', { amount, currency, category_id, description, expense_date });

    // Validation
    if (!amount || !currency || !category_id || !description || !expense_date) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    try {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Get company currency
            const [companies] = await connection.execute(
                'SELECT currency FROM companies WHERE id = ?',
                [company_id]
            );
            
            if (companies.length === 0) {
                throw new Error('Company not found');
            }

            const companyCurrency = companies[0].currency;

            // Convert amount to company currency (simplified for demo)
            let converted_amount = parseFloat(amount);
            if (currency !== companyCurrency) {
                // For demo, use fixed conversion rates
                const conversionRates = {
                    'USD': 1,
                    'EUR': 0.85,
                    'GBP': 0.73,
                    'INR': 75.0,
                    'CAD': 1.25,
                    'AUD': 1.35,
                    'JPY': 110.0
                };
                const rate = conversionRates[currency] || 1;
                converted_amount = parseFloat(amount) * rate;
            }

            // Insert expense
            const [result] = await connection.execute(
                `INSERT INTO expenses (employee_id, company_id, amount, currency, converted_amount, category_id, description, expense_date) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [employee_id, company_id, parseFloat(amount), currency, converted_amount, category_id, description, expense_date]
            );

            // Get user's manager if is_manager_approver is true
            const [users] = await connection.execute(
                'SELECT manager_id, is_manager_approver FROM users WHERE id = ?',
                [employee_id]
            );

            const user = users[0];
            
            if (user && user.is_manager_approver && user.manager_id) {
                // Create approval record for manager
                await connection.execute(
                    'INSERT INTO expense_approvals (expense_id, approver_id, status) VALUES (?, ?, "pending")',
                    [result.insertId, user.manager_id]
                );
                console.log('Approval record created for manager:', user.manager_id);
            }

            await connection.commit();

            res.status(201).json({ 
                message: 'Expense submitted successfully',
                expenseId: result.insertId
            });

        } catch (error) {
            await connection.rollback();
            console.error('Transaction error:', error);
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Expense submission error:', error);
        res.status(500).json({ 
            message: 'Error submitting expense',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user's expenses
router.get('/my-expenses', auth, async (req, res) => {
    const employee_id = req.userId;

    try {
        const [expenses] = await pool.execute(
            `SELECT e.*, c.name as category_name
             FROM expenses e
             LEFT JOIN expense_categories c ON e.category_id = c.id
             WHERE e.employee_id = ?
             ORDER BY e.created_at DESC`,
            [employee_id]
        );

        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Error fetching expenses' });
    }
});

// Get expenses pending approval
router.get('/pending-approval', auth, async (req, res) => {
    const approver_id = req.userId;

    try {
        const [expenses] = await pool.execute(
            `SELECT e.*, u.name as employee_name, c.name as category_name
             FROM expenses e
             JOIN users u ON e.employee_id = u.id
             JOIN expense_categories c ON e.category_id = c.id
             JOIN expense_approvals ea ON e.id = ea.expense_id
             WHERE ea.approver_id = ? AND ea.status = 'pending'
             ORDER BY e.created_at DESC`,
            [approver_id]
        );

        res.json(expenses);
    } catch (error) {
        console.error('Error fetching pending expenses:', error);
        res.status(500).json({ message: 'Error fetching pending expenses' });
    }
});

module.exports = router;