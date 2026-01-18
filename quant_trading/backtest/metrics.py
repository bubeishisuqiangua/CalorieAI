import numpy as np
import pandas as pd
from typing import List, Dict, Optional
from .orders import Trade
from ..utils.logger import get_logger

logger = get_logger(__name__)


class PerformanceMetrics:
    @staticmethod
    def calculate_returns(equity_curve: pd.Series) -> pd.Series:
        return equity_curve.pct_change().fillna(0)
    
    @staticmethod
    def calculate_cumulative_returns(equity_curve: pd.Series) -> pd.Series:
        initial_value = equity_curve.iloc[0]
        return (equity_curve / initial_value) - 1
    
    @staticmethod
    def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.0, periods: int = 252) -> float:
        if len(returns) < 2 or returns.std() == 0:
            return 0.0
        
        excess_returns = returns - (risk_free_rate / periods)
        sharpe = excess_returns.mean() / returns.std() * np.sqrt(periods)
        return float(sharpe)
    
    @staticmethod
    def calculate_sortino_ratio(returns: pd.Series, risk_free_rate: float = 0.0, periods: int = 252) -> float:
        if len(returns) < 2:
            return 0.0
        
        excess_returns = returns - (risk_free_rate / periods)
        downside_returns = returns[returns < 0]
        
        if len(downside_returns) == 0 or downside_returns.std() == 0:
            return 0.0
        
        sortino = excess_returns.mean() / downside_returns.std() * np.sqrt(periods)
        return float(sortino)
    
    @staticmethod
    def calculate_max_drawdown(equity_curve: pd.Series) -> Dict[str, float]:
        cumulative = equity_curve.copy()
        running_max = cumulative.expanding().max()
        drawdown = (cumulative - running_max) / running_max
        
        max_dd = drawdown.min()
        max_dd_idx = drawdown.idxmin()
        
        if pd.isna(max_dd):
            return {'max_drawdown': 0.0, 'max_drawdown_date': None}
        
        return {
            'max_drawdown': float(max_dd),
            'max_drawdown_date': max_dd_idx
        }
    
    @staticmethod
    def calculate_calmar_ratio(returns: pd.Series, equity_curve: pd.Series, periods: int = 252) -> float:
        if len(returns) < 2:
            return 0.0
        
        annual_return = returns.mean() * periods
        max_dd = PerformanceMetrics.calculate_max_drawdown(equity_curve)['max_drawdown']
        
        if max_dd == 0:
            return 0.0
        
        calmar = annual_return / abs(max_dd)
        return float(calmar)
    
    @staticmethod
    def calculate_win_rate(trades: List[Trade]) -> float:
        if not trades:
            return 0.0
        
        winning_trades = [t for t in trades if t.pnl > 0]
        return len(winning_trades) / len(trades)
    
    @staticmethod
    def calculate_profit_factor(trades: List[Trade]) -> float:
        if not trades:
            return 0.0
        
        gross_profit = sum(t.pnl for t in trades if t.pnl > 0)
        gross_loss = abs(sum(t.pnl for t in trades if t.pnl < 0))
        
        if gross_loss == 0:
            return float('inf') if gross_profit > 0 else 0.0
        
        return gross_profit / gross_loss
    
    @staticmethod
    def calculate_average_trade(trades: List[Trade]) -> Dict[str, float]:
        if not trades:
            return {
                'avg_trade': 0.0,
                'avg_win': 0.0,
                'avg_loss': 0.0,
                'avg_duration': 0.0
            }
        
        winning_trades = [t for t in trades if t.pnl > 0]
        losing_trades = [t for t in trades if t.pnl < 0]
        
        return {
            'avg_trade': np.mean([t.pnl for t in trades]),
            'avg_win': np.mean([t.pnl for t in winning_trades]) if winning_trades else 0.0,
            'avg_loss': np.mean([t.pnl for t in losing_trades]) if losing_trades else 0.0,
            'avg_duration': np.mean([t.duration for t in trades])
        }
    
    @staticmethod
    def calculate_volatility(returns: pd.Series, periods: int = 252) -> float:
        if len(returns) < 2:
            return 0.0
        return float(returns.std() * np.sqrt(periods))
    
    @staticmethod
    def generate_summary(
        equity_curve: pd.Series,
        trades: List[Trade],
        initial_capital: float,
        risk_free_rate: float = 0.0
    ) -> Dict:
        if equity_curve.empty:
            logger.warning("Empty equity curve provided")
            return {}
        
        returns = PerformanceMetrics.calculate_returns(equity_curve)
        cumulative_returns = PerformanceMetrics.calculate_cumulative_returns(equity_curve)
        
        final_equity = equity_curve.iloc[-1]
        total_return = (final_equity - initial_capital) / initial_capital
        
        summary = {
            'initial_capital': initial_capital,
            'final_equity': final_equity,
            'total_return': total_return,
            'total_return_pct': total_return * 100,
            'cumulative_return': cumulative_returns.iloc[-1],
            'annual_return': returns.mean() * 252,
            'annual_volatility': PerformanceMetrics.calculate_volatility(returns),
            'sharpe_ratio': PerformanceMetrics.calculate_sharpe_ratio(returns, risk_free_rate),
            'sortino_ratio': PerformanceMetrics.calculate_sortino_ratio(returns, risk_free_rate),
            'calmar_ratio': PerformanceMetrics.calculate_calmar_ratio(returns, equity_curve),
            'max_drawdown': PerformanceMetrics.calculate_max_drawdown(equity_curve)['max_drawdown'],
            'max_drawdown_date': PerformanceMetrics.calculate_max_drawdown(equity_curve)['max_drawdown_date'],
            'total_trades': len(trades),
            'win_rate': PerformanceMetrics.calculate_win_rate(trades),
            'profit_factor': PerformanceMetrics.calculate_profit_factor(trades),
        }
        
        trade_stats = PerformanceMetrics.calculate_average_trade(trades)
        summary.update(trade_stats)
        
        return summary
    
    @staticmethod
    def print_summary(summary: Dict):
        print("\n" + "="*60)
        print("BACKTEST PERFORMANCE SUMMARY")
        print("="*60)
        
        print(f"\nCapital:")
        print(f"  Initial Capital:      ${summary['initial_capital']:,.2f}")
        print(f"  Final Equity:         ${summary['final_equity']:,.2f}")
        print(f"  Total Return:         {summary['total_return_pct']:.2f}%")
        
        print(f"\nReturns:")
        print(f"  Annual Return:        {summary['annual_return']*100:.2f}%")
        print(f"  Annual Volatility:    {summary['annual_volatility']*100:.2f}%")
        
        print(f"\nRisk Metrics:")
        print(f"  Sharpe Ratio:         {summary['sharpe_ratio']:.3f}")
        print(f"  Sortino Ratio:        {summary['sortino_ratio']:.3f}")
        print(f"  Calmar Ratio:         {summary['calmar_ratio']:.3f}")
        print(f"  Max Drawdown:         {summary['max_drawdown']*100:.2f}%")
        
        print(f"\nTrade Statistics:")
        print(f"  Total Trades:         {summary['total_trades']}")
        print(f"  Win Rate:             {summary['win_rate']*100:.2f}%")
        print(f"  Profit Factor:        {summary['profit_factor']:.3f}")
        print(f"  Average Trade:        ${summary['avg_trade']:.2f}")
        print(f"  Average Win:          ${summary['avg_win']:.2f}")
        print(f"  Average Loss:         ${summary['avg_loss']:.2f}")
        print(f"  Average Duration:     {summary['avg_duration']:.1f} days")
        
        print("="*60 + "\n")
