#!/usr/bin/env python3
"""
Quick test to verify ETH trading strategy can achieve 1.5+ Sharpe ratio.
Uses sample data to demonstrate the system works.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from quant_trading.backtest.engine import BacktestEngine
from quant_trading.backtest.metrics import PerformanceMetrics
from quant_trading.strategies.crypto_strategies import (
    macd_rsi_combo_strategy,
    enhanced_rsi_bollinger_strategy
)
from quant_trading.utils.logger import get_logger

logger = get_logger(__name__)


def generate_trending_crypto_data(days: int = 500) -> pd.DataFrame:
    """
    Generate synthetic crypto price data with trends and volatility.
    This simulates ETH-like behavior.
    """
    np.random.seed(42)
    dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
    
    # Start price
    price = 2000.0
    prices = [price]
    
    # Generate trending data with mean reversion
    for i in range(1, days):
        # Trend component (slight upward bias)
        trend = 0.001
        
        # Mean reversion component
        if price > 3000:
            mean_reversion = -0.002
        elif price < 1500:
            mean_reversion = 0.002
        else:
            mean_reversion = 0
        
        # Volatility (higher for crypto)
        volatility = np.random.randn() * 0.03
        
        # Combine all components
        daily_return = trend + mean_reversion + volatility
        price = price * (1 + daily_return)
        prices.append(price)
    
    close_prices = np.array(prices)
    
    # Generate OHLCV data
    data = {
        'open': close_prices * (1 + np.random.randn(days) * 0.01),
        'high': close_prices * (1 + np.abs(np.random.randn(days)) * 0.02),
        'low': close_prices * (1 - np.abs(np.random.randn(days)) * 0.02),
        'close': close_prices,
        'volume': np.random.randint(1000000, 50000000, days)
    }
    
    df = pd.DataFrame(data, index=dates)
    
    # Ensure OHLCV consistency
    df['high'] = df[['open', 'high', 'close']].max(axis=1)
    df['low'] = df[['open', 'low', 'close']].min(axis=1)
    
    return df


def test_strategy_sharpe(strategy_func, strategy_name: str, data: pd.DataFrame):
    """Test a strategy and report if it achieves 1.5+ Sharpe."""
    logger.info(f"\n{'='*70}")
    logger.info(f"Testing: {strategy_name}")
    logger.info(f"{'='*70}")
    
    engine = BacktestEngine(
        initial_capital=100000,
        commission=0.001,
        slippage=0.0005
    )
    
    results = engine.run(data, strategy_func, symbol='ETH-USD')
    
    sharpe = results['sharpe_ratio']
    total_return = results['total_return_pct']
    max_dd = results['max_drawdown'] * 100
    trades = results['total_trades']
    win_rate = results['win_rate'] * 100
    
    logger.info(f"Sharpe Ratio:    {sharpe:.3f}")
    logger.info(f"Total Return:    {total_return:.2f}%")
    logger.info(f"Max Drawdown:    {max_dd:.2f}%")
    logger.info(f"Total Trades:    {trades}")
    logger.info(f"Win Rate:        {win_rate:.2f}%")
    
    if sharpe >= 1.5:
        logger.info(f"\n✅ SUCCESS! Achieved target Sharpe of {sharpe:.3f} (≥ 1.5)")
        return True
    else:
        logger.info(f"\n📊 Sharpe {sharpe:.3f} below target 1.5")
        return False


def main():
    logger.info("\n" + "#"*70)
    logger.info("QUICK ETH TRADING STRATEGY TEST")
    logger.info("Testing if strategies can achieve 1.5+ Sharpe ratio")
    logger.info("#"*70)
    
    # Generate synthetic data
    logger.info("\nGenerating synthetic ETH-like price data (500 days)...")
    data = generate_trending_crypto_data(days=500)
    logger.info(f"Data range: {data.index[0].date()} to {data.index[-1].date()}")
    logger.info(f"Price range: ${data['close'].min():.2f} to ${data['close'].max():.2f}")
    
    # Test strategies
    strategies = [
        (macd_rsi_combo_strategy, "MACD + RSI Combo"),
        (enhanced_rsi_bollinger_strategy, "Enhanced RSI + Bollinger Bands")
    ]
    
    results = []
    for strategy_func, name in strategies:
        success = test_strategy_sharpe(strategy_func, name, data)
        results.append((name, success))
    
    # Summary
    logger.info("\n" + "="*70)
    logger.info("SUMMARY")
    logger.info("="*70)
    
    success_count = sum(1 for _, success in results if success)
    
    for name, success in results:
        status = "✅" if success else "📊"
        logger.info(f"{status} {name}")
    
    logger.info("="*70)
    logger.info(f"\n{success_count}/{len(strategies)} strategies achieved target Sharpe ratio (≥1.5)")
    
    if success_count > 0:
        logger.info("\n🎉 System is working! Strategies can achieve 1.5+ Sharpe ratio.")
        logger.info("💡 Next step: Run the full ETH trading system with real data:")
        logger.info("   python -m quant_trading.eth_trading")
    else:
        logger.info("\n💡 With synthetic data, try optimizing parameters or use real market data:")
        logger.info("   python -m quant_trading.eth_trading")
    
    return success_count > 0


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
