const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        // Connect to MySQL without selecting database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        console.log('Connected to MySQL server');

        // Create database if not exists
        await connection.execute(
            `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'expense_management'}`
        );
        console.log('Database created or already exists');

        // Use the database
        await connection.execute(
            `USE ${process.env.DB_NAME || 'expense_management'}`
        );

        // Create tables
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS companies (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                country VARCHAR(100) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Companies table created');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                company_id INT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                role ENUM('admin', 'manager', 'employee') NOT NULL,
                manager_id INT NULL,
                is_manager_approver BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id),
                FOREIGN KEY (manager_id) REFERENCES users(id)
            )
        `);
        console.log('Users table created');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS expense_categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                company_id INT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                FOREIGN KEY (company_id) REFERENCES companies(id)
            )
        `);
        console.log('Expense categories table created');

        // Insert default categories
        await connection.execute(`
            INSERT IGNORE INTO expense_categories (name, description) VALUES
            ('Travel', 'Business travel expenses'),
            ('Meals', 'Business meals and entertainment'),
            ('Office Supplies', 'Office equipment and supplies'),
            ('Software', 'Software subscriptions and licenses'),
            ('Training', 'Professional development and training')
        `);
        console.log('Default categories inserted');

        console.log('Database setup completed successfully!');

    } catch (error) {
        console.error('Database setup failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();