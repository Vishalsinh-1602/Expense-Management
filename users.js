const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Create employee (Admin only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    const { email, password, name, role, manager_id, is_manager_approver } = req.body;
    const company_id = req.user.companyId;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO users (company_id, email, password, name, role, manager_id, is_manager_approver) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [company_id, email, hashedPassword, name, role, manager_id, is_manager_approver || false]
        );

        res.status(201).json({ 
            message: 'User created successfully',
            userId: result.insertId
        });

    } catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Get all users in company
router.get('/', auth, async (req, res) => {
    const company_id = req.user.companyId;

    try {
        const [users] = await pool.execute(
            `SELECT id, email, name, role, manager_id, is_manager_approver, created_at
             FROM users 
             WHERE company_id = ?
             ORDER BY role, name`,
            [company_id]
        );

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Update user role
router.put('/:userId/role', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId } = req.params;
    const { role, manager_id, is_manager_approver } = req.body;

    try {
        await pool.execute(
            'UPDATE users SET role = ?, manager_id = ?, is_manager_approver = ? WHERE id = ?',
            [role, manager_id, is_manager_approver, userId]
        );

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('User update error:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

module.exports = router;