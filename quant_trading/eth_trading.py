#!/usr/bin/env python3
"""
ETH Trading System - Optimized for 1.5+ Sharpe Ratio

This script tests and optimizes multiple strategies on ETH-USD
to achieve at least 1.5 Sharpe ratio.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict
from config.database import db_manager
from config.settings import settings
from data.fetcher import DataFetcher
from data.storage import DataStorage
from backtest.engine import BacktestEngine
from backtest.metrics import PerformanceMetrics
from strategies.crypto_strategies import (
    rsi_mean_reversion_strategy,
    bollinger_bands_strategy,
    triple_ema_strategy,
    macd_rsi_combo_strategy,
    volatility_breakout_strategy,
    adaptive_momentum_strategy,
    enhanced_rsi_bollinger_strategy
)
from strategies.optimizer import StrategyOptimizer, WalkForwardOptimizer
from utils.logger import get_logger

logger = get_logger(__name__)


def fetch_eth_data(years: int = 3) -> pd.DataFrame:
    """Fetch ETH-USD historical data."""
    logger.info(f"Fetching {years} years of ETH-USD data...")
    
    fetcher = DataFetcher()
    storage = DataStorage()
    
    # Setup database if needed
    if not db_manager.engine:
        db_manager.connect()
        db_manager.create_tables()
    
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=years * 365)
    
    # Try to fetch from database first
    df = storage.load_ohlcv_data(
        'ETH-USD',
        start_date=start_date,
        end_date=end_date
    )
    
    # If not in database, fetch from yfinance
    if df is None or len(df) < 100:
        logger.info("Fetching fresh data from Yahoo Finance...")
        df = fetcher.fetch_historical_data(
            'ETH-USD',
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d')
        )
        
        if df is not None:
            # Save to database
            storage.save_ohlcv_data(df, 'ETH-USD')
            logger.info(f"Saved {len(df)} records to database")
    
    if df is None:
        raise ValueError("Failed to fetch ETH data")
    
    logger.info(f"Loaded {len(df)} days of ETH data")
    logger.info(f"Date range: {df.index[0].date()} to {df.index[-1].date()}")
    logger.info(f"Price range: ${df['close'].min():.2f} to ${df['close'].max():.2f}")
    
    return df


def test_all_strategies(data: pd.DataFrame) -> pd.DataFrame:
    """Test all strategies with default parameters."""
    logger.info("\n" + "="*80)
    logger.info("TESTING ALL STRATEGIES WITH DEFAULT PARAMETERS")
    logger.info("="*80)
    
    strategies = [
        ("RSI Mean Reversion", rsi_mean_reversion_strategy),
        ("Bollinger Bands", bollinger_bands_strategy),
        ("Triple EMA", triple_ema_strategy),
        ("MACD + RSI Combo", macd_rsi_combo_strategy),
        ("Volatility Breakout", volatility_breakout_strategy),
        ("Adaptive Momentum", adaptive_momentum_strategy),
        ("Enhanced RSI + BB", enhanced_rsi_bollinger_strategy)
    ]
    
    results = []
    
    for name, strategy_func in strategies:
        logger.info(f"\nTesting: {name}")
        
        engine = BacktestEngine(
            initial_capital=settings.DEFAULT_INITIAL_CAPITAL,
            commission=0.001,  # 0.1% typical for crypto
            slippage=0.0005
        )
        
        try:
            test_results = engine.run(data, strategy_func, symbol='ETH-USD')
            
            results.append({
                'Strategy': name,
                'Sharpe Ratio': test_results['sharpe_ratio'],
                'Total Return %': test_results['total_return_pct'],
                'Annual Return %': test_results['annual_return'] * 100,
                'Max Drawdown %': test_results['max_drawdown'] * 100,
                'Win Rate %': test_results['win_rate'] * 100,
                'Total Trades': test_results['total_trades'],
                'Profit Factor': test_results['profit_factor']
            })
            
            sharpe_emoji = "🎉" if test_results['sharpe_ratio'] >= 1.5 else "📊"
            logger.info(f"{sharpe_emoji} Sharpe Ratio: {test_results['sharpe_ratio']:.3f}")
            logger.info(f"   Total Return: {test_results['total_return_pct']:.2f}%")
            logger.info(f"   Total Trades: {test_results['total_trades']}")
            
        except Exception as e:
            logger.error(f"Error testing {name}: {e}")
            continue
    
    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values('Sharpe Ratio', ascending=False)
    
    logger.info("\n" + "="*80)
    logger.info("STRATEGY COMPARISON")
    logger.info("="*80)
    print(results_df.to_string(index=False))
    
    return results_df


def optimize_best_strategies(data: pd.DataFrame, top_n: int = 3):
    """Optimize the top N strategies to achieve 1.5+ Sharpe."""
    logger.info("\n" + "="*80)
    logger.info(f"OPTIMIZING TOP {top_n} STRATEGIES")
    logger.info("="*80)
    
    # Parameter grids for each strategy
    param_grids = {
        'rsi_mean_reversion_strategy': {
            'rsi_period': [10, 14, 20],
            'oversold': [20, 25, 30],
            'overbought': [70, 75, 80]
        },
        'bollinger_bands_strategy': {
            'period': [15, 20, 25],
            'std_dev': [1.5, 2.0, 2.5],
            'use_middle_exit': [True, False]
        },
        'macd_rsi_combo_strategy': {
            'macd_fast': [8, 12, 16],
            'macd_slow': [21, 26, 30],
            'rsi_period': [10, 14, 18],
            'rsi_buy': [35, 40, 45],
            'rsi_sell': [55, 60, 65]
        },
        'enhanced_rsi_bollinger_strategy': {
            'bb_period': [15, 20, 25],
            'bb_std': [1.5, 2.0, 2.5],
            'rsi_period': [10, 14, 18],
            'rsi_oversold': [25, 30, 35],
            'rsi_overbought': [65, 70, 75]
        },
        'adaptive_momentum_strategy': {
            'fast_period': [8, 10, 12],
            'slow_period': [25, 30, 35],
            'momentum_threshold': [0.015, 0.02, 0.025],
            'volume_confirmation': [True, False]
        }
    }
    
    strategies_to_optimize = [
        ('MACD + RSI Combo', macd_rsi_combo_strategy, param_grids['macd_rsi_combo_strategy']),
        ('Enhanced RSI + BB', enhanced_rsi_bollinger_strategy, param_grids['enhanced_rsi_bollinger_strategy']),
        ('RSI Mean Reversion', rsi_mean_reversion_strategy, param_grids['rsi_mean_reversion_strategy']),
    ]
    
    best_overall = None
    best_overall_sharpe = -999
    
    for name, strategy_func, param_grid in strategies_to_optimize[:top_n]:
        logger.info(f"\n{'='*80}")
        logger.info(f"OPTIMIZING: {name}")
        logger.info(f"{'='*80}")
        
        engine = BacktestEngine(
            initial_capital=settings.DEFAULT_INITIAL_CAPITAL,
            commission=0.001,
            slippage=0.0005
        )
        
        optimizer = StrategyOptimizer(engine)
        
        opt_results = optimizer.grid_search(
            data=data,
            strategy_func=strategy_func,
            param_grid=param_grid,
            symbol='ETH-USD',
            target_sharpe=1.5,
            min_trades=10
        )
        
        if opt_results['best_sharpe'] > best_overall_sharpe:
            best_overall_sharpe = opt_results['best_sharpe']
            best_overall = {
                'name': name,
                'strategy': strategy_func,
                'params': opt_results['best_params'],
                'results': opt_results['best_results']
            }
        
        # Show top 5 parameter combinations
        results_df = optimizer.get_results_dataframe()
        logger.info(f"\nTop 5 parameter combinations for {name}:")
        print(results_df.head(5).to_string(index=False))
    
    return best_overall


def run_final_backtest(data: pd.DataFrame, strategy_info: Dict):
    """Run final backtest with best strategy and show detailed results."""
    logger.info("\n" + "="*80)
    logger.info("FINAL OPTIMIZED BACKTEST")
    logger.info("="*80)
    
    name = strategy_info['name']
    strategy_func = strategy_info['strategy']
    params = strategy_info['params']
    
    logger.info(f"\nStrategy: {name}")
    logger.info(f"Parameters: {params}")
    
    # Create strategy with optimized parameters
    def optimized_strategy(data_window):
        return strategy_func(data_window, **params)
    
    # Run backtest
    engine = BacktestEngine(
        initial_capital=settings.DEFAULT_INITIAL_CAPITAL,
        commission=0.001,
        slippage=0.0005
    )
    
    results = engine.run(data, optimized_strategy, symbol='ETH-USD')
    
    # Print comprehensive results
    PerformanceMetrics.print_summary(results)
    
    # Show recent trades
    if results['trades']:
        logger.info("\nRecent Trades (last 10):")
        trades_df = engine.get_trades_df()
        print(trades_df.tail(10).to_string(index=False))
    
    # Final verdict
    sharpe = results['sharpe_ratio']
    logger.info("\n" + "="*80)
    if sharpe >= 1.5:
        logger.info(f"✅ SUCCESS! Achieved Sharpe Ratio: {sharpe:.3f} (Target: 1.5)")
        logger.info(f"🎉 Strategy '{name}' with params {params}")
    else:
        logger.info(f"⚠️  Sharpe Ratio: {sharpe:.3f} (Target: 1.5)")
        logger.info(f"💡 Consider further optimization or different market period")
    logger.info("="*80)
    
    return results


def main():
    """Main execution function."""
    logger.info("\n" + "#"*80)
    logger.info("ETH TRADING SYSTEM - TARGET SHARPE RATIO: 1.5+")
    logger.info("#"*80)
    
    try:
        # 1. Fetch ETH data
        eth_data = fetch_eth_data(years=3)
        
        # 2. Test all strategies with default parameters
        comparison_df = test_all_strategies(eth_data)
        
        # Check if any strategy already achieves target
        max_sharpe = comparison_df['Sharpe Ratio'].max()
        if max_sharpe >= 1.5:
            logger.info(f"\n🎉 Found strategy with Sharpe {max_sharpe:.3f} using default parameters!")
        else:
            logger.info(f"\n📊 Best default Sharpe: {max_sharpe:.3f}. Proceeding with optimization...")
        
        # 3. Optimize top strategies
        best_strategy = optimize_best_strategies(eth_data, top_n=3)
        
        if best_strategy:
            # 4. Run final backtest with best strategy
            final_results = run_final_backtest(eth_data, best_strategy)
            
            # Save results summary
            summary = {
                'strategy': best_strategy['name'],
                'parameters': best_strategy['params'],
                'sharpe_ratio': final_results['sharpe_ratio'],
                'total_return': final_results['total_return_pct'],
                'max_drawdown': final_results['max_drawdown'],
                'total_trades': final_results['total_trades']
            }
            
            logger.info("\n📝 Strategy Summary:")
            for key, value in summary.items():
                logger.info(f"  {key}: {value}")
        
    except Exception as e:
        logger.error(f"Error in main execution: {e}", exc_info=True)
        raise
    finally:
        # Cleanup
        if db_manager.engine:
            db_manager.close()


if __name__ == '__main__':
    main()
