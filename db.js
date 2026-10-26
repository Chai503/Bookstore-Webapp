// Database connection configuration - Lab 9.6 & 9.7
// Reads configuration from Environment Variables

try {
    require('dotenv').config();
} catch (e) {
    if (typeof process.loadEnvFile === 'function') {
        try { process.loadEnvFile(); } catch (err) {}
    }
}

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
const DB_NAME = process.env.DB_NAME || 'bookstore_db';
const DB_SSL = process.env.DB_SSL_REQUIRED === 'true' || process.env.DB_SSL === 'true';

let mysqlPool = null;
let sqliteDb = null;
let useSqlite = false;

// Attempt to initialize MySQL pool if mysql2 is available
try {
    const mysql = require('mysql2/promise');
    const poolConfig = {
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

    if (DB_SSL) {
        poolConfig.ssl = { rejectUnauthorized: false };
    }

    mysqlPool = mysql.createPool(poolConfig);
} catch (err) {
    // mysql2 package not found or module loading issue
    useSqlite = true;
}

function getSqliteDb() {
    if (!sqliteDb) {
        const { DatabaseSync } = require('node:sqlite');
        const path = require('node:path');
        const dbPath = path.resolve(__dirname, 'db.sqlite3');
        sqliteDb = new DatabaseSync(dbPath);

        // Ensure compatibility view & triggers for 'books' table in SQLite
        try {
            sqliteDb.exec(`
                CREATE VIEW IF NOT EXISTS books AS 
                SELECT id, title, author, price, stock, category, created_at, updated_at 
                FROM Book_of_Bau_Bau_book;

                CREATE TRIGGER IF NOT EXISTS books_insert INSTEAD OF INSERT ON books
                BEGIN
                    INSERT INTO Book_of_Bau_Bau_book (title, author, price, stock, category, created_at, updated_at)
                    VALUES (new.title, coalesce(new.author, ''), new.price, coalesce(new.stock, 0), coalesce(new.category, ''), datetime('now'), datetime('now'));
                END;

                CREATE TRIGGER IF NOT EXISTS books_update INSTEAD OF UPDATE ON books
                BEGIN
                    UPDATE Book_of_Bau_Bau_book 
                    SET title = new.title, author = new.author, price = new.price, stock = new.stock, category = new.category, updated_at = datetime('now')
                    WHERE id = old.id;
                END;

                CREATE TRIGGER IF NOT EXISTS books_delete INSTEAD OF DELETE ON books
                BEGIN
                    DELETE FROM Book_of_Bau_Bau_book WHERE id = old.id;
                END;
            `);
        } catch (e) {}
    }
    return sqliteDb;
}

module.exports = {
    // Database connection details exposed for verification
    config: {
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        database: DB_NAME
    },

    query: async (sql, params = []) => {
        // If MySQL is active and not flagged to fallback
        if (mysqlPool && !useSqlite) {
            try {
                return await mysqlPool.query(sql, params);
            } catch (err) {
                // If MySQL connection refused, fallback gracefully to local SQLite
                if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
                    console.warn(`[Database] MySQL (${DB_HOST}:${DB_PORT}) unreachable (${err.code}). Using local SQLite fallback.`);
                    useSqlite = true;
                } else {
                    throw err;
                }
            }
        }

        // SQLite fallback query execution
        const db = getSqliteDb();
        const stmt = db.prepare(sql);
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            const rows = stmt.all(...params);
            return [rows];
        } else {
            const info = stmt.run(...params);
            return [info];
        }
    }
};
