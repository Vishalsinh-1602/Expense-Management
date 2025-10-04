// backend/routes/workflows.js
const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Create approval workflow
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, min_amount, max_amount, steps } = req.body;
    const company_id = req.user.companyId;

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Create workflow
            const [workflowResult] = await connection.execute(
                'INSERT INTO approval_workflows (company_id, name, min_amount, max_amount) VALUES (?, ?, ?, ?)',
                [company_id, name, min_amount, max_amount]
            );

            const workflowId = workflowResult.insertId;

            // Create workflow steps
            for (const step of steps) {
                await connection.execute(
                    'INSERT INTO workflow_steps (workflow_id, approver_role, sequence_order) VALUES (?, ?, ?)',
                    [workflowId, step.approver_role, step.sequence_order]
                );
            }

            await connection.commit();
            res.status(201).json({ message: 'Workflow created successfully' });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Workflow creation error:', error);
        res.status(500).json({ message: 'Error creating workflow' });
    }
});

module.exports = router;