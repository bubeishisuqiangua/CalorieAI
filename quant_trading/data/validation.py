import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from ..utils.logger import get_logger

logger = get_logger(__name__)


class DataValidator:
    @staticmethod
    def validate_ohlcv(df: pd.DataFrame) -> Tuple[bool, List[str]]:
        errors = []
        
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            errors.append(f"Missing required columns: {missing_columns}")
            return False, errors
        
        if df.empty:
            errors.append("DataFrame is empty")
            return False, errors
        
        if not isinstance(df.index, pd.DatetimeIndex):
            errors.append("Index must be DatetimeIndex")
            return False, errors
        
        if df['high'].lt(df['low']).any():
            errors.append("High price is less than low price in some rows")
        
        if df['high'].lt(df['open']).any() or df['high'].lt(df['close']).any():
            errors.append("High price is less than open or close price in some rows")
        
        if df['low'].gt(df['open']).any() or df['low'].gt(df['close']).any():
            errors.append("Low price is greater than open or close price in some rows")
        
        if (df[['open', 'high', 'low', 'close', 'volume']] <= 0).any().any():
            errors.append("Found non-positive values in OHLCV data")
        
        if df.isnull().any().any():
            null_cols = df.columns[df.isnull().any()].tolist()
            errors.append(f"Found null values in columns: {null_cols}")
        
        if df.index.duplicated().any():
            errors.append("Found duplicate dates in index")
        
        is_valid = len(errors) == 0
        
        if is_valid:
            logger.info(f"Data validation passed for {len(df)} rows")
        else:
            logger.warning(f"Data validation failed with {len(errors)} errors")
            for error in errors:
                logger.warning(f"  - {error}")
        
        return is_valid, errors
    
    @staticmethod
    def normalize_data(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        if not isinstance(df.index, pd.DatetimeIndex):
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                df.set_index('date', inplace=True)
            elif df.index.name == 'date' or df.index.name == 'Date':
                df.index = pd.to_datetime(df.index)
        
        column_mapping = {
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume',
            'Adj Close': 'adjusted_close'
        }
        df.rename(columns=column_mapping, inplace=True)
        
        df.sort_index(inplace=True)
        
        df.drop_duplicates(inplace=True)
        
        numeric_cols = ['open', 'high', 'low', 'close', 'volume']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        df.dropna(subset=['open', 'high', 'low', 'close', 'volume'], inplace=True)
        
        logger.info(f"Normalized data: {len(df)} rows")
        return df
    
    @staticmethod
    def remove_outliers(df: pd.DataFrame, column: str = 'close', std_threshold: float = 5.0) -> pd.DataFrame:
        df = df.copy()
        
        returns = df[column].pct_change()
        mean_return = returns.mean()
        std_return = returns.std()
        
        outlier_mask = np.abs(returns - mean_return) > (std_threshold * std_return)
        outlier_count = outlier_mask.sum()
        
        if outlier_count > 0:
            logger.warning(f"Removing {outlier_count} outliers from {column}")
            df = df[~outlier_mask]
        
        return df
