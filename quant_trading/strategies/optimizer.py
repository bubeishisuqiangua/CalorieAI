import pandas as pd
import numpy as np
from typing import Callable, Dict, List, Tuple, Any
from itertools import product
from ..backtest.engine import BacktestEngine
from ..backtest.metrics import PerformanceMetrics
from ..utils.logger import get_logger

logger = get_logger(__name__)


class StrategyOptimizer:
    """
    Optimizer for finding best strategy parameters to maximize Sharpe ratio.
    """
    
    def __init__(self, engine: BacktestEngine):
        self.engine = engine
        self.results = []
    
    def grid_search(
        self,
        data: pd.DataFrame,
        strategy_func: Callable,
        param_grid: Dict[str, List[Any]],
        symbol: str = 'ETH-USD',
        target_sharpe: float = 1.5,
        min_trades: int = 10
    ) -> Dict:
        """
        Perform grid search to find optimal parameters.
        
        Args:
            data: Historical price data
            strategy_func: Strategy function to optimize
            param_grid: Dictionary of parameter names and values to test
            symbol: Trading symbol
            target_sharpe: Target Sharpe ratio
            min_trades: Minimum number of trades required
        
        Returns:
            Dictionary with best parameters and results
        """
        logger.info(f"Starting grid search for {strategy_func.__name__}")
        logger.info(f"Parameter grid: {param_grid}")
        
        param_names = list(param_grid.keys())
        param_values = list(param_grid.values())
        
        best_sharpe = -999
        best_params = None
        best_results = None
        
        total_combinations = np.prod([len(v) for v in param_values])
        logger.info(f"Testing {total_combinations} parameter combinations...")
        
        for i, combination in enumerate(product(*param_values)):
            params = dict(zip(param_names, combination))
            
            # Create strategy with these parameters
            def test_strategy(data_window):
                return strategy_func(data_window, **params)
            
            try:
                # Reset engine
                self.engine.portfolio.reset()
                self.engine.trades = []
                self.engine.orders = []
                
                # Run backtest
                results = self.engine.run(data, test_strategy, symbol)
                
                sharpe = results['sharpe_ratio']
                num_trades = results['total_trades']
                
                # Store result
                self.results.append({
                    'params': params.copy(),
                    'sharpe_ratio': sharpe,
                    'total_return': results['total_return_pct'],
                    'max_drawdown': results['max_drawdown'],
                    'win_rate': results['win_rate'],
                    'total_trades': num_trades,
                    'profit_factor': results['profit_factor']
                })
                
                # Update best if this is better
                if sharpe > best_sharpe and num_trades >= min_trades:
                    best_sharpe = sharpe
                    best_params = params.copy()
                    best_results = results
                    
                    logger.info(f"New best! Sharpe: {sharpe:.3f}, Params: {params}")
                    
                    if sharpe >= target_sharpe:
                        logger.info(f"✅ TARGET SHARPE {target_sharpe} ACHIEVED!")
                
                if (i + 1) % 10 == 0:
                    logger.info(f"Progress: {i+1}/{total_combinations} ({(i+1)/total_combinations*100:.1f}%)")
                    
            except Exception as e:
                logger.warning(f"Error testing params {params}: {e}")
                continue
        
        logger.info(f"\nGrid search complete!")
        logger.info(f"Best Sharpe Ratio: {best_sharpe:.3f}")
        logger.info(f"Best Parameters: {best_params}")
        
        if best_sharpe >= target_sharpe:
            logger.info(f"🎉 SUCCESS: Achieved Sharpe ratio of {best_sharpe:.3f} (target: {target_sharpe})")
        else:
            logger.warning(f"⚠️  Did not reach target Sharpe of {target_sharpe}. Best achieved: {best_sharpe:.3f}")
        
        return {
            'best_params': best_params,
            'best_sharpe': best_sharpe,
            'best_results': best_results,
            'all_results': self.results
        }
    
    def get_results_dataframe(self) -> pd.DataFrame:
        """Convert results to DataFrame for analysis."""
        if not self.results:
            return pd.DataFrame()
        
        rows = []
        for r in self.results:
            row = r['params'].copy()
            row.update({
                'sharpe_ratio': r['sharpe_ratio'],
                'total_return': r['total_return'],
                'max_drawdown': r['max_drawdown'],
                'win_rate': r['win_rate'],
                'total_trades': r['total_trades'],
                'profit_factor': r['profit_factor']
            })
            rows.append(row)
        
        df = pd.DataFrame(rows)
        return df.sort_values('sharpe_ratio', ascending=False)
    
    def analyze_parameter_sensitivity(self, param_name: str) -> pd.DataFrame:
        """Analyze how Sharpe ratio varies with a specific parameter."""
        df = self.get_results_dataframe()
        if df.empty or param_name not in df.columns:
            return pd.DataFrame()
        
        sensitivity = df.groupby(param_name).agg({
            'sharpe_ratio': ['mean', 'std', 'max', 'min'],
            'total_return': 'mean',
            'max_drawdown': 'mean'
        }).round(3)
        
        return sensitivity


class WalkForwardOptimizer:
    """
    Walk-forward optimization for more robust parameter selection.
    """
    
    def __init__(self, engine: BacktestEngine):
        self.engine = engine
    
    def optimize(
        self,
        data: pd.DataFrame,
        strategy_func: Callable,
        param_grid: Dict[str, List[Any]],
        symbol: str = 'ETH-USD',
        train_size: int = 252,
        test_size: int = 63,
        step_size: int = 63,
        target_sharpe: float = 1.5
    ) -> Dict:
        """
        Perform walk-forward optimization.
        
        Optimizes on training period, validates on test period.
        """
        logger.info("Starting walk-forward optimization...")
        
        all_test_results = []
        start_idx = 0
        window_num = 0
        
        while start_idx + train_size + test_size <= len(data):
            window_num += 1
            train_end = start_idx + train_size
            test_end = train_end + test_size
            
            train_data = data.iloc[start_idx:train_end]
            test_data = data.iloc[train_end:test_end]
            
            logger.info(f"\nWindow {window_num}:")
            logger.info(f"  Train: {train_data.index[0].date()} to {train_data.index[-1].date()}")
            logger.info(f"  Test:  {test_data.index[0].date()} to {test_data.index[-1].date()}")
            
            # Optimize on training data
            optimizer = StrategyOptimizer(self.engine)
            opt_results = optimizer.grid_search(
                train_data,
                strategy_func,
                param_grid,
                symbol,
                target_sharpe=target_sharpe,
                min_trades=5
            )
            
            best_params = opt_results['best_params']
            train_sharpe = opt_results['best_sharpe']
            
            logger.info(f"  Train Sharpe: {train_sharpe:.3f} with params {best_params}")
            
            # Test on out-of-sample data
            def test_strategy(data_window):
                return strategy_func(data_window, **best_params)
            
            self.engine.portfolio.reset()
            self.engine.trades = []
            test_results = self.engine.run(test_data, test_strategy, symbol)
            
            test_sharpe = test_results['sharpe_ratio']
            logger.info(f"  Test Sharpe:  {test_sharpe:.3f}")
            
            all_test_results.append({
                'window': window_num,
                'train_sharpe': train_sharpe,
                'test_sharpe': test_sharpe,
                'params': best_params,
                'results': test_results
            })
            
            start_idx += step_size
        
        # Calculate average out-of-sample performance
        avg_test_sharpe = np.mean([r['test_sharpe'] for r in all_test_results])
        
        logger.info(f"\nWalk-Forward Optimization Complete")
        logger.info(f"Average Out-of-Sample Sharpe: {avg_test_sharpe:.3f}")
        
        if avg_test_sharpe >= target_sharpe:
            logger.info(f"🎉 SUCCESS: Achieved average Sharpe of {avg_test_sharpe:.3f}")
        else:
            logger.warning(f"⚠️  Average Sharpe {avg_test_sharpe:.3f} below target {target_sharpe}")
        
        return {
            'avg_test_sharpe': avg_test_sharpe,
            'windows': all_test_results,
            'num_windows': window_num
        }
