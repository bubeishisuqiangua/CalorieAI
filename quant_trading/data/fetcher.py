import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, List
from ..utils.logger import get_logger
from .validation import DataValidator

logger = get_logger(__name__)


class DataFetcher:
    def __init__(self):
        self.validator = DataValidator()
    
    def fetch_historical_data(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: str = '1y',
        interval: str = '1d'
    ) -> Optional[pd.DataFrame]:
        try:
            logger.info(f"Fetching data for {symbol} from {start_date or 'period=' + period} to {end_date or 'now'}")
            
            ticker = yf.Ticker(symbol)
            
            if start_date and end_date:
                df = ticker.history(start=start_date, end=end_date, interval=interval)
            else:
                df = ticker.history(period=period, interval=interval)
            
            if df.empty:
                logger.error(f"No data returned for {symbol}")
                return None
            
            df = self.validator.normalize_data(df)
            
            is_valid, errors = self.validator.validate_ohlcv(df)
            if not is_valid:
                logger.error(f"Data validation failed for {symbol}: {errors}")
                return None
            
            df['symbol'] = symbol
            
            logger.info(f"Successfully fetched {len(df)} rows for {symbol}")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
            return None
    
    def fetch_multiple_symbols(
        self,
        symbols: List[str],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: str = '1y',
        interval: str = '1d'
    ) -> Dict[str, pd.DataFrame]:
        results = {}
        
        for symbol in symbols:
            df = self.fetch_historical_data(
                symbol=symbol,
                start_date=start_date,
                end_date=end_date,
                period=period,
                interval=interval
            )
            
            if df is not None:
                results[symbol] = df
            else:
                logger.warning(f"Skipping {symbol} due to fetch failure")
        
        logger.info(f"Fetched data for {len(results)}/{len(symbols)} symbols")
        return results
    
    def get_latest_price(self, symbol: str) -> Optional[float]:
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period='1d')
            
            if data.empty:
                return None
            
            return float(data['Close'].iloc[-1])
            
        except Exception as e:
            logger.error(f"Error getting latest price for {symbol}: {e}")
            return None
    
    def get_info(self, symbol: str) -> dict:
        try:
            ticker = yf.Ticker(symbol)
            return ticker.info
        except Exception as e:
            logger.error(f"Error getting info for {symbol}: {e}")
            return {}
