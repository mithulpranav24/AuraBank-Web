import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("Connecting to the database...")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    print("Connection successful.")

    # SQL command to create the 'users' table
    create_users_table = """
                         CREATE TABLE IF NOT EXISTS users (
                                                              id SERIAL PRIMARY KEY,
                                                              name VARCHAR(100) NOT NULL,
                             username VARCHAR(50) UNIQUE NOT NULL,
                             email VARCHAR(100) UNIQUE NOT NULL,
                             phone_number VARCHAR(20) UNIQUE,
                             password_hash VARCHAR(255) NOT NULL,
                             face_descriptor REAL[],
                             balance NUMERIC(10, 2) DEFAULT 0.00
                             ); \
                         """

    # SQL command to create the 'transactions' table
    create_transactions_table = """
                                CREATE TABLE IF NOT EXISTS transactions (
                                                                            id SERIAL PRIMARY KEY,
                                                                            sender_id INTEGER NOT NULL,
                                                                            recipient_account_number VARCHAR(50) NOT NULL,
                                    amount NUMERIC(10, 2) NOT NULL,
                                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                                            FOREIGN KEY (sender_id) REFERENCES users (id)
                                    ); \
                                """

    print("Creating tables...")
    cursor.execute(create_users_table)
    cursor.execute(create_transactions_table)

    conn.commit()
    print("Tables created successfully.")

except psycopg2.Error as e:
    print(f"Error connecting to or setting up the database: {e}")
finally:
    if 'cursor' in locals() and cursor is not None:
        cursor.close()
    if 'conn' in locals() and conn is not None:
        conn.close()
    print("Database connection closed.")