#!/usr/bin/env python3
"""
Database setup script for the quantitative trading system.
Creates the database schema and tables.
"""
from config.database import db_manager
from utils.logger import get_logger

logger = get_logger(__name__)


def main():
    logger.info("Starting database setup...")
    
    if not db_manager.connect():
        logger.error("Failed to connect to database. Please check your DATABASE_URL.")
        logger.error("Example: postgresql://postgres:postgres@localhost:5432/quant_trading")
        return False
    
    logger.info("Connected to database successfully")
    
    if not db_manager.create_tables():
        logger.error("Failed to create tables")
        return False
    
    logger.info("Tables created successfully")
    logger.info("Database setup complete!")
    
    db_manager.close()
    return True


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
