-- Mess Management System PostgreSQL Schema

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    hostel VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS mess_entries (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    scanned_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_meal_date UNIQUE (student_id, meal_id, date)
);

CREATE INDEX IF NOT EXISTS idx_mess_entries_lookup ON mess_entries(student_id, meal_id, date);
CREATE INDEX IF NOT EXISTS idx_mess_entries_date ON mess_entries(date);

