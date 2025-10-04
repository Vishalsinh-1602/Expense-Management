const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Auth route working!' });
});

// Signup/First Login
router.post('/signup', async (req, res) => {
    console.log('Signup request received:', req.body);
    
    const { email, password, name, country = 'United States' } = req.body;
    
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    try {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Use USD as default currency for now to avoid API issues
            const currency = 'USD';

            // Create company
            const [companyResult] = await connection.execute(
                'INSERT INTO companies (name, country, currency) VALUES (?, ?, ?)',
                [`${name}'s Company`, country, currency]
            );

            const companyId = companyResult.insertId;

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create admin user
            const [userResult] = await connection.execute(
                'INSERT INTO users (company_id, email, password, name, role, is_manager_approver) VALUES (?, ?, ?, ?, "admin", TRUE)',
                [companyId, email, hashedPassword, name]
            );

            await connection.commit();

            // Generate token
            const token = jwt.sign(
                { userId: userResult.insertId, role: 'admin' },
                process.env.JWT_SECRET || 'fallback-secret-key',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Company and admin user created successfully',
                token,
                user: {
                    id: userResult.insertId,
                    email,
                    name,
                    role: 'admin',
                    companyId
                }
            });

        } catch (error) {
            await connection.rollback();
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Email already exists' });
            }
            
            console.error('Signup transaction error:', error);
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            message: 'Error creating account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                companyId: user.company_id
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;