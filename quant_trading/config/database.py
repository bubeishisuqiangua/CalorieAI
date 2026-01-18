from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Index, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from .settings import settings
from ..utils.logger import get_logger

logger = get_logger(__name__)

Base = declarative_base()


class OHLCV(Base):
    __tablename__ = 'ohlcv_data'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    adjusted_close = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('symbol', 'date', name='uix_symbol_date'),
        Index('idx_symbol_date', 'symbol', 'date'),
    )
    
    def __repr__(self):
        return f"<OHLCV(symbol={self.symbol}, date={self.date}, close={self.close})>"


class DatabaseManager:
    def __init__(self, database_url: str = None):
        self.database_url = database_url or settings.DATABASE_URL
        self.engine = None
        self.SessionLocal = None
        
    def connect(self):
        try:
            self.engine = create_engine(
                self.database_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20
            )
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            logger.info(f"Connected to database successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            return False
    
    def create_tables(self):
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("Database tables created successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to create tables: {e}")
            return False
    
    def get_session(self):
        if self.SessionLocal is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self.SessionLocal()
    
    def close(self):
        if self.engine:
            self.engine.dispose()
            logger.info("Database connection closed")


db_manager = DatabaseManager()
