import pandas as pd
from datetime import datetime
from typing import Optional, List
from sqlalchemy import and_, delete
from sqlalchemy.dialects.postgresql import insert
from ..config.database import db_manager, OHLCV
from ..utils.logger import get_logger

logger = get_logger(__name__)


class DataStorage:
    def __init__(self):
        self.db_manager = db_manager
    
    def save_ohlcv_data(self, df: pd.DataFrame, symbol: str, if_exists: str = 'replace') -> bool:
        try:
            session = self.db_manager.get_session()
            
            if if_exists == 'replace':
                delete_stmt = delete(OHLCV).where(OHLCV.symbol == symbol)
                session.execute(delete_stmt)
                logger.info(f"Deleted existing data for {symbol}")
            
            records = []
            for idx, row in df.iterrows():
                record = OHLCV(
                    symbol=symbol,
                    date=idx if isinstance(idx, datetime) else pd.to_datetime(idx),
                    open=float(row['open']),
                    high=float(row['high']),
                    low=float(row['low']),
                    close=float(row['close']),
                    volume=float(row['volume']),
                    adjusted_close=float(row['adjusted_close']) if 'adjusted_close' in row and pd.notna(row['adjusted_close']) else None
                )
                records.append(record)
            
            if if_exists == 'append':
                stmt = insert(OHLCV).values([
                    {
                        'symbol': r.symbol,
                        'date': r.date,
                        'open': r.open,
                        'high': r.high,
                        'low': r.low,
                        'close': r.close,
                        'volume': r.volume,
                        'adjusted_close': r.adjusted_close
                    } for r in records
                ])
                stmt = stmt.on_conflict_do_update(
                    constraint='uix_symbol_date',
                    set_={
                        'open': stmt.excluded.open,
                        'high': stmt.excluded.high,
                        'low': stmt.excluded.low,
                        'close': stmt.excluded.close,
                        'volume': stmt.excluded.volume,
                        'adjusted_close': stmt.excluded.adjusted_close
                    }
                )
                session.execute(stmt)
            else:
                session.bulk_save_objects(records)
            
            session.commit()
            logger.info(f"Saved {len(records)} records for {symbol}")
            session.close()
            return True
            
        except Exception as e:
            logger.error(f"Error saving data for {symbol}: {e}")
            if session:
                session.rollback()
                session.close()
            return False
    
    def load_ohlcv_data(
        self,
        symbol: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Optional[pd.DataFrame]:
        try:
            session = self.db_manager.get_session()
            
            query = session.query(OHLCV).filter(OHLCV.symbol == symbol)
            
            if start_date:
                query = query.filter(OHLCV.date >= start_date)
            if end_date:
                query = query.filter(OHLCV.date <= end_date)
            
            query = query.order_by(OHLCV.date)
            
            results = query.all()
            session.close()
            
            if not results:
                logger.warning(f"No data found for {symbol}")
                return None
            
            data = []
            for row in results:
                data.append({
                    'date': row.date,
                    'open': row.open,
                    'high': row.high,
                    'low': row.low,
                    'close': row.close,
                    'volume': row.volume,
                    'adjusted_close': row.adjusted_close
                })
            
            df = pd.DataFrame(data)
            df.set_index('date', inplace=True)
            
            logger.info(f"Loaded {len(df)} records for {symbol}")
            return df
            
        except Exception as e:
            logger.error(f"Error loading data for {symbol}: {e}")
            return None
    
    def get_available_symbols(self) -> List[str]:
        try:
            session = self.db_manager.get_session()
            symbols = session.query(OHLCV.symbol).distinct().all()
            session.close()
            return [s[0] for s in symbols]
        except Exception as e:
            logger.error(f"Error getting available symbols: {e}")
            return []
    
    def get_date_range(self, symbol: str) -> Optional[tuple]:
        try:
            session = self.db_manager.get_session()
            query = session.query(OHLCV).filter(OHLCV.symbol == symbol)
            
            min_date = query.order_by(OHLCV.date.asc()).first()
            max_date = query.order_by(OHLCV.date.desc()).first()
            
            session.close()
            
            if min_date and max_date:
                return (min_date.date, max_date.date)
            return None
            
        except Exception as e:
            logger.error(f"Error getting date range for {symbol}: {e}")
            return None
    
    def delete_symbol_data(self, symbol: str) -> bool:
        try:
            session = self.db_manager.get_session()
            delete_stmt = delete(OHLCV).where(OHLCV.symbol == symbol)
            result = session.execute(delete_stmt)
            session.commit()
            logger.info(f"Deleted {result.rowcount} records for {symbol}")
            session.close()
            return True
        except Exception as e:
            logger.error(f"Error deleting data for {symbol}: {e}")
            if session:
                session.rollback()
                session.close()
            return False
