-- ==========================================================
-- Database Schema for Book Store Web Application
-- Compliant with Lab 9.1 - Lab 9.7 (MySQL / Aiven Cloud)
-- ==========================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS bookstore_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE bookstore_db;

-- 2. Create Users Table (Lab 9.2 - 9.5)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_verified TINYINT(1) DEFAULT 1,
    verification_token VARCHAR(255) DEFAULT NULL,
    role ENUM('viewer', 'editor', 'admin', 'manager') NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Create Books Table (Lab 9.1)
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(150) NOT NULL DEFAULT '',
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    category VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Seed Users with Bcrypt Hashes (Password = '123456')
-- Hash: $2b$10$lQcwnl2Ecf7xCQVpAuybQerp9dUIiqV3WyrqOTRaYRiYIbjPjqR0q
INSERT INTO users (name, email, password, is_verified, role) VALUES
('User A', 'usera@test.com', '$2b$10$lQcwnl2Ecf7xCQVpAuybQerp9dUIiqV3WyrqOTRaYRiYIbjPjqR0q', 1, 'viewer'),
('User B', 'userb@test.com', '$2b$10$lQcwnl2Ecf7xCQVpAuybQerp9dUIiqV3WyrqOTRaYRiYIbjPjqR0q', 1, 'editor'),
('User C', 'userc@test.com', '$2b$10$lQcwnl2Ecf7xCQVpAuybQerp9dUIiqV3WyrqOTRaYRiYIbjPjqR0q', 1, 'admin'),
('Manager', 'manager@test.com', '$2b$10$lQcwnl2Ecf7xCQVpAuybQerp9dUIiqV3WyrqOTRaYRiYIbjPjqR0q', 1, 'manager'),
('Chaisak Phukoet', '67310072@go.buu.ac.th', '$2b$10$lQcwnl2Ecf7xCQVpAuybQerp9dUIiqV3WyrqOTRaYRiYIbjPjqR0q', 1, 'admin')
ON DUPLICATE KEY UPDATE 
    name=VALUES(name),
    password=VALUES(password),
    is_verified=VALUES(is_verified),
    role=VALUES(role);

-- 5. Seed Initial Books Data
INSERT INTO books (title, author, price, stock, category) VALUES
('พื้นฐานการเขียนโปรแกรม', 'สมชาย ใจดี', 250.00, 10, 'Programming'),
('เรียนรู้ IoT ด้วย ESP32', 'วิชัย ขี้โมโห', 320.00, 5, 'IoT'),
('Data Science เบื้องต้น', 'ออร่า เจ้าถิ่น', 450.00, 8, 'Data Science'),
('Cloud Native Architecture', 'สุชาติ พัฒนา', 590.00, 15, 'Cloud Computing'),
('Full Stack Web Development with Node & React', 'กมลวรรณ เก่งกาจ', 499.00, 12, 'Web Development')
ON DUPLICATE KEY UPDATE title=VALUES(title);
