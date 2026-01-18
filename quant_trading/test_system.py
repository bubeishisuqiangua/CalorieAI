#!/usr/bin/env python3
"""
Test script to validate the quantitative trading system installation.
Tests all major components without requiring a database connection.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from quant_trading.data.validation import DataValidator
from quant_trading.backtest.engine import BacktestEngine
from quant_trading.backtest.portfolio import Portfolio, Position
from quant_trading.backtest.orders import Order, OrderSide, OrderType, Trade
from quant_trading.backtest.metrics import PerformanceMetrics
from quant_trading.utils.logger import get_logger

logger = get_logger(__name__)


def generate_sample_data(symbol='TEST', days=252):
    """Generate sample OHLCV data for testing."""
    dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
    
    np.random.seed(42)
    close_prices = 100 * np.exp(np.random.randn(days).cumsum() * 0.02)
    
    data = {
        'open': close_prices * (1 + np.random.randn(days) * 0.01),
        'high': close_prices * (1 + np.abs(np.random.randn(days)) * 0.02),
        'low': close_prices * (1 - np.abs(np.random.randn(days)) * 0.02),
        'close': close_prices,
        'volume': np.random.randint(1000000, 10000000, days)
    }
    
    df = pd.DataFrame(data, index=dates)
    df['high'] = df[['open', 'high', 'close']].max(axis=1)
    df['low'] = df[['open', 'low', 'close']].min(axis=1)
    
    return df


def test_data_validation():
    logger.info("\n" + "="*60)
    logger.info("TEST 1: Data Validation")
    logger.info("="*60)
    
    df = generate_sample_data()
    validator = DataValidator()
    
    is_valid, errors = validator.validate_ohlcv(df)
    
    if is_valid:
        logger.info("✓ Data validation passed")
        return True
    else:
        logger.error(f"✗ Data validation failed: {errors}")
        return False


def test_portfolio():
    logger.info("\n" + "="*60)
    logger.info("TEST 2: Portfolio Management")
    logger.info("="*60)
    
    portfolio = Portfolio(initial_capital=100000)
    
    order = Order(
        symbol='TEST',
        side=OrderSide.BUY,
        quantity=100,
        order_type=OrderType.MARKET
    )
    order.commission = 0.001
    order.slippage = 0.0005
    
    success = portfolio.execute_order(order, 100.0)
    
    if not success:
        logger.error("✗ Failed to execute buy order")
        return False
    
    logger.debug(f"Has position TEST: {portfolio.has_position('TEST')}")
    logger.debug(f"Positions: {portfolio.positions}")
    
    if not portfolio.has_position('TEST'):
        logger.error("✗ Position not created")
        return False
    
    position = portfolio.get_position('TEST')
    if position.quantity != 100:
        logger.error(f"✗ Wrong position size: {position.quantity}")
        return False
    
    current_prices = {'TEST': 110.0}
    equity = portfolio.get_total_equity(current_prices)
    
    logger.info(f"✓ Portfolio tests passed")
    logger.info(f"  Initial capital: $100,000.00")
    logger.info(f"  Position: 100 shares @ $100.00")
    logger.info(f"  Current price: $110.00")
    logger.info(f"  Total equity: ${equity:,.2f}")
    
    return True


def test_backtest_engine():
    logger.info("\n" + "="*60)
    logger.info("TEST 3: Backtest Engine")
    logger.info("="*60)
    
    df = generate_sample_data(days=252)
    
    def simple_strategy(data):
        if len(data) == 1:
            return 1
        elif len(data) == len(df):
            return -1
        return 0
    
    engine = BacktestEngine(
        initial_capital=100000,
        commission=0.001,
        slippage=0.0005
    )
    
    results = engine.run(df, simple_strategy, symbol='TEST')
    
    if 'final_equity' not in results:
        logger.error("✗ Backtest failed to produce results")
        return False
    
    logger.info(f"✓ Backtest engine tests passed")
    logger.info(f"  Initial capital: ${results['initial_capital']:,.2f}")
    logger.info(f"  Final equity: ${results['final_equity']:,.2f}")
    logger.info(f"  Total return: {results['total_return_pct']:.2f}%")
    logger.info(f"  Total trades: {results['total_trades']}")
    
    return True


def test_metrics():
    logger.info("\n" + "="*60)
    logger.info("TEST 4: Performance Metrics")
    logger.info("="*60)
    
    dates = pd.date_range(end=datetime.now(), periods=252, freq='D')
    equity_curve = pd.Series(
        100000 * (1 + np.random.randn(252).cumsum() * 0.01),
        index=dates
    )
    
    returns = PerformanceMetrics.calculate_returns(equity_curve)
    sharpe = PerformanceMetrics.calculate_sharpe_ratio(returns)
    sortino = PerformanceMetrics.calculate_sortino_ratio(returns)
    max_dd = PerformanceMetrics.calculate_max_drawdown(equity_curve)
    
    logger.info(f"✓ Metrics calculation tests passed")
    logger.info(f"  Sharpe Ratio: {sharpe:.3f}")
    logger.info(f"  Sortino Ratio: {sortino:.3f}")
    logger.info(f"  Max Drawdown: {max_dd['max_drawdown']*100:.2f}%")
    
    return True


def test_moving_average_strategy():
    logger.info("\n" + "="*60)
    logger.info("TEST 5: Moving Average Crossover Strategy")
    logger.info("="*60)
    
    df = generate_sample_data(days=252)
    
    def ma_crossover(data, short_window=20, long_window=50):
        if len(data) < long_window + 1:
            return 0
        
        short_ma = data['close'].rolling(window=short_window).mean()
        long_ma = data['close'].rolling(window=long_window).mean()
        
        if pd.isna(short_ma.iloc[-1]) or pd.isna(long_ma.iloc[-1]):
            return 0
        
        if len(short_ma) < 2:
            return 0
        
        if short_ma.iloc[-2] <= long_ma.iloc[-2] and short_ma.iloc[-1] > long_ma.iloc[-1]:
            return 1
        elif short_ma.iloc[-2] >= long_ma.iloc[-2] and short_ma.iloc[-1] < long_ma.iloc[-1]:
            return -1
        
        return 0
    
    engine = BacktestEngine(initial_capital=100000)
    results = engine.run(df, ma_crossover, symbol='TEST')
    
    logger.info(f"✓ Moving average strategy tests passed")
    logger.info(f"  Total trades: {results['total_trades']}")
    logger.info(f"  Win rate: {results['win_rate']*100:.2f}%")
    logger.info(f"  Final equity: ${results['final_equity']:,.2f}")
    
    return True


def run_all_tests():
    logger.info("\n" + "#"*60)
    logger.info("QUANTITATIVE TRADING SYSTEM - TEST SUITE")
    logger.info("#"*60)
    
    tests = [
        ("Data Validation", test_data_validation),
        ("Portfolio Management", test_portfolio),
        ("Backtest Engine", test_backtest_engine),
        ("Performance Metrics", test_metrics),
        ("MA Crossover Strategy", test_moving_average_strategy),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            logger.error(f"✗ Test '{name}' raised exception: {e}")
            results.append((name, False))
    
    logger.info("\n" + "="*60)
    logger.info("TEST SUMMARY")
    logger.info("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        logger.info(f"{status}: {name}")
    
    logger.info("="*60)
    logger.info(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("✓ All tests passed! System is ready to use.")
        logger.info("\nNext steps:")
        logger.info("1. Set up PostgreSQL database")
        logger.info("2. Run: python -m quant_trading.setup_db")
        logger.info("3. Run: python -m quant_trading.main")
    else:
        logger.error("✗ Some tests failed. Please check the errors above.")
    
    logger.info("="*60 + "\n")
    
    return passed == total


if __name__ == '__main__':
    success = run_all_tests()
    exit(0 if success else 1)
