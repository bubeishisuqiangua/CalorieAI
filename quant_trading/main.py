#!/usr/bin/env python3
import pandas as pd
from datetime import datetime, timedelta
from config.database import db_manager
from config.settings import settings
from data.fetcher import DataFetcher
from data.storage import DataStorage
from backtest.engine import BacktestEngine
from backtest.metrics import PerformanceMetrics
from utils.logger import get_logger

logger = get_logger(__name__)


def buy_and_hold_strategy(data: pd.DataFrame) -> int:
    """
    Simple buy-and-hold strategy.
    Returns:
        1: Buy signal (on first bar)
        0: Hold
        -1: Sell signal (never, except at end)
    """
    if len(data) == 1:
        return 1
    return 0


def moving_average_crossover_strategy(data: pd.DataFrame, short_window: int = 20, long_window: int = 50) -> int:
    """
    Moving average crossover strategy.
    Buy when short MA crosses above long MA.
    Sell when short MA crosses below long MA.
    """
    if len(data) < long_window + 1:
        return 0
    
    short_ma = data['close'].rolling(window=short_window).mean()
    long_ma = data['close'].rolling(window=long_window).mean()
    
    if len(short_ma) < 2 or pd.isna(short_ma.iloc[-1]) or pd.isna(long_ma.iloc[-1]):
        return 0
    
    current_short = short_ma.iloc[-1]
    current_long = long_ma.iloc[-1]
    prev_short = short_ma.iloc[-2]
    prev_long = long_ma.iloc[-2]
    
    if prev_short <= prev_long and current_short > current_long:
        return 1
    
    elif prev_short >= prev_long and current_short < current_long:
        return -1
    
    return 0


def setup_database():
    logger.info("Setting up database...")
    
    if not db_manager.connect():
        logger.error("Failed to connect to database")
        return False
    
    if not db_manager.create_tables():
        logger.error("Failed to create tables")
        return False
    
    logger.info("Database setup complete")
    return True


def fetch_and_store_data(symbol: str = 'SPY', start_date: str = None, end_date: str = None):
    logger.info(f"Fetching data for {symbol}...")
    
    fetcher = DataFetcher()
    storage = DataStorage()
    
    if start_date is None:
        start_date = (datetime.now() - timedelta(days=5*365)).strftime('%Y-%m-%d')
    if end_date is None:
        end_date = datetime.now().strftime('%Y-%m-%d')
    
    df = fetcher.fetch_historical_data(
        symbol=symbol,
        start_date=start_date,
        end_date=end_date
    )
    
    if df is None:
        logger.error(f"Failed to fetch data for {symbol}")
        return None
    
    if storage.save_ohlcv_data(df, symbol):
        logger.info(f"Successfully saved {len(df)} records for {symbol}")
        return df
    else:
        logger.error(f"Failed to save data for {symbol}")
        return None


def load_data_from_db(symbol: str = 'SPY'):
    logger.info(f"Loading data for {symbol} from database...")
    
    storage = DataStorage()
    df = storage.load_ohlcv_data(symbol)
    
    if df is None:
        logger.error(f"No data found for {symbol} in database")
        return None
    
    logger.info(f"Loaded {len(df)} records for {symbol}")
    return df


def run_backtest_example():
    logger.info("="*60)
    logger.info("QUANTITATIVE TRADING SYSTEM - BACKTEST EXAMPLE")
    logger.info("="*60)
    
    if not setup_database():
        logger.error("Database setup failed. Exiting.")
        return
    
    symbol = 'SPY'
    
    df = fetch_and_store_data(symbol)
    
    if df is None:
        logger.info("Attempting to load data from database...")
        df = load_data_from_db(symbol)
    
    if df is None:
        logger.error("Cannot proceed without data. Exiting.")
        return
    
    logger.info(f"\nData range: {df.index[0].date()} to {df.index[-1].date()}")
    logger.info(f"Total bars: {len(df)}")
    logger.info(f"Starting price: ${df['close'].iloc[0]:.2f}")
    logger.info(f"Ending price: ${df['close'].iloc[-1]:.2f}")
    
    logger.info("\n" + "="*60)
    logger.info("STRATEGY 1: BUY AND HOLD")
    logger.info("="*60)
    
    engine = BacktestEngine(
        initial_capital=settings.DEFAULT_INITIAL_CAPITAL,
        commission=settings.DEFAULT_COMMISSION,
        slippage=settings.DEFAULT_SLIPPAGE
    )
    
    results = engine.run(df, buy_and_hold_strategy, symbol)
    
    PerformanceMetrics.print_summary(results)
    
    logger.info("\n" + "="*60)
    logger.info("STRATEGY 2: MOVING AVERAGE CROSSOVER (20/50)")
    logger.info("="*60)
    
    engine2 = BacktestEngine(
        initial_capital=settings.DEFAULT_INITIAL_CAPITAL,
        commission=settings.DEFAULT_COMMISSION,
        slippage=settings.DEFAULT_SLIPPAGE
    )
    
    results2 = engine2.run(df, moving_average_crossover_strategy, symbol)
    
    PerformanceMetrics.print_summary(results2)
    
    if results2['trades']:
        logger.info("\nRecent Trades:")
        trades_df = engine2.get_trades_df()
        print(trades_df.tail(10).to_string(index=False))
    
    logger.info("\n" + "="*60)
    logger.info("WALK-FORWARD ANALYSIS")
    logger.info("="*60)
    
    if len(df) >= 378:
        wf_results = engine.walk_forward_analysis(
            data=df,
            strategy=moving_average_crossover_strategy,
            symbol=symbol,
            train_size=252,
            test_size=63,
            step_size=63
        )
        
        logger.info(f"\nCompleted {len(wf_results['windows'])} walk-forward windows")
        logger.info("\nCombined Walk-Forward Results:")
        PerformanceMetrics.print_summary(wf_results['combined_metrics'])
    else:
        logger.info("Not enough data for walk-forward analysis (need at least 378 days)")
    
    db_manager.close()
    
    logger.info("\n" + "="*60)
    logger.info("BACKTEST COMPLETE")
    logger.info("="*60)


if __name__ == '__main__':
    run_backtest_example()
