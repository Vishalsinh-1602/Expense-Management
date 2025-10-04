const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Approve/Reject expense
router.post('/:expenseId/decision', auth, async (req, res) => {
    const { expenseId } = req.params;
    const { status, comments } = req.body;
    const approver_id = req.userId;

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Update approval record
            await connection.execute(
                `UPDATE expense_approvals 
                 SET status = ?, comments = ?, approved_at = CURRENT_TIMESTAMP 
                 WHERE expense_id = ? AND approver_id = ?`,
                [status, comments, expenseId, approver_id]
            );

            if (status === 'rejected') {
                // If rejected, update expense status
                await connection.execute(
                    'UPDATE expenses SET status = ? WHERE id = ?',
                    ['rejected', expenseId]
                );
            } else {
                // Check if all approvals are done
                const [approvals] = await connection.execute(
                    `SELECT COUNT(*) as pending_count 
                     FROM expense_approvals 
                     WHERE expense_id = ? AND status = 'pending'`,
                    [expenseId]
                );

                if (approvals[0].pending_count === 0) {
                    // All approvals done, mark expense as approved
                    await connection.execute(
                        'UPDATE expenses SET status = ? WHERE id = ?',
                        ['approved', expenseId]
                    );
                }
            }

            await connection.commit();
            res.json({ message: `Expense ${status} successfully` });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Approval decision error:', error);
        res.status(500).json({ message: 'Error processing approval' });
    }
});

// Get approval history for expense
router.get('/:expenseId/history', auth, async (req, res) => {
    const { expenseId } = req.params;

    try {
        const [history] = await pool.execute(
            `SELECT ea.*, u.name as approver_name
             FROM expense_approvals ea
             JOIN users u ON ea.approver_id = u.id
             WHERE ea.expense_id = ?
             ORDER BY ea.approved_at DESC`,
            [expenseId]
        );

        res.json(history);
    } catch (error) {
        console.error('Error fetching approval history:', error);
        res.status(500).json({ message: 'Error fetching approval history' });
    }
});

module.exports = router;