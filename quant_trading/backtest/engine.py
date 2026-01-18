import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Callable
from datetime import datetime
from .portfolio import Portfolio
from .orders import Order, OrderSide, OrderType, Trade
from .metrics import PerformanceMetrics
from ..utils.logger import get_logger

logger = get_logger(__name__)


class BacktestEngine:
    def __init__(
        self,
        initial_capital: float = 100000.0,
        commission: float = 0.001,
        slippage: float = 0.0005
    ):
        self.initial_capital = initial_capital
        self.commission = commission
        self.slippage = slippage
        self.portfolio = Portfolio(initial_capital)
        self.trades: List[Trade] = []
        self.orders: List[Order] = []
        self.metrics = PerformanceMetrics()
        
    def run(
        self,
        data: pd.DataFrame,
        strategy: Callable,
        symbol: str = 'SYMBOL'
    ) -> Dict:
        logger.info(f"Starting backtest for {symbol} with {len(data)} bars")
        
        self.portfolio.reset()
        self.trades = []
        self.orders = []
        
        if 'close' not in data.columns:
            raise ValueError("Data must contain 'close' column")
        
        data = data.copy()
        data['symbol'] = symbol
        
        entry_price = None
        entry_date = None
        position_size = 0
        
        for i in range(len(data)):
            current_date = data.index[i]
            current_bar = data.iloc[i]
            current_price = current_bar['close']
            
            signal = strategy(data.iloc[:i+1])
            
            current_prices = {symbol: current_price}
            
            if signal == 1 and not self.portfolio.has_position(symbol):
                shares = self._calculate_position_size(current_price)
                
                if shares > 0:
                    order = Order(
                        symbol=symbol,
                        side=OrderSide.BUY,
                        quantity=shares,
                        order_type=OrderType.MARKET,
                        timestamp=current_date
                    )
                    order.commission = self.commission
                    order.slippage = self.slippage
                    
                    if self.portfolio.execute_order(order, current_price):
                        self.orders.append(order)
                        entry_price = current_price
                        entry_date = current_date
                        position_size = shares
                        logger.debug(f"BUY {shares} shares at ${current_price:.2f} on {current_date.date()}")
            
            elif signal == -1 and self.portfolio.has_position(symbol):
                position = self.portfolio.get_position(symbol)
                shares_to_sell = position.quantity
                
                order = Order(
                    symbol=symbol,
                    side=OrderSide.SELL,
                    quantity=shares_to_sell,
                    order_type=OrderType.MARKET,
                    timestamp=current_date
                )
                order.commission = self.commission
                order.slippage = self.slippage
                
                if self.portfolio.execute_order(order, current_price):
                    self.orders.append(order)
                    
                    if entry_price is not None and entry_date is not None:
                        trade = Trade(
                            symbol=symbol,
                            entry_date=entry_date,
                            entry_price=entry_price,
                            exit_date=current_date,
                            exit_price=current_price,
                            quantity=position_size,
                            side=OrderSide.BUY,
                            commission=(order.commission + self.commission) * current_price * position_size
                        )
                        self.trades.append(trade)
                        logger.debug(f"SELL {shares_to_sell} shares at ${current_price:.2f} on {current_date.date()}, P&L: ${trade.pnl:.2f}")
                    
                    entry_price = None
                    entry_date = None
                    position_size = 0
            
            self.portfolio.update_history(current_date, current_prices)
        
        if self.portfolio.has_position(symbol):
            position = self.portfolio.get_position(symbol)
            final_price = data.iloc[-1]['close']
            final_date = data.index[-1]
            
            if entry_price is not None and entry_date is not None:
                trade = Trade(
                    symbol=symbol,
                    entry_date=entry_date,
                    entry_price=entry_price,
                    exit_date=final_date,
                    exit_price=final_price,
                    quantity=position_size,
                    side=OrderSide.BUY,
                    commission=self.commission * final_price * position_size
                )
                self.trades.append(trade)
                logger.debug(f"Closing position at end: {position_size} shares at ${final_price:.2f}")
        
        equity_curve = pd.Series(
            self.portfolio.equity_history,
            index=self.portfolio.timestamp_history
        )
        
        results = self.metrics.generate_summary(
            equity_curve=equity_curve,
            trades=self.trades,
            initial_capital=self.initial_capital
        )
        
        results['equity_curve'] = equity_curve
        results['trades'] = self.trades
        results['orders'] = self.orders
        
        logger.info(f"Backtest complete: {len(self.trades)} trades, Final Equity: ${results['final_equity']:.2f}")
        
        return results
    
    def _calculate_position_size(self, price: float) -> float:
        available_cash = self.portfolio.cash * 0.95
        shares = int(available_cash / price)
        return shares
    
    def walk_forward_analysis(
        self,
        data: pd.DataFrame,
        strategy: Callable,
        symbol: str = 'SYMBOL',
        train_size: int = 252,
        test_size: int = 63,
        step_size: int = 63
    ) -> Dict:
        logger.info(f"Starting walk-forward analysis: train={train_size}, test={test_size}, step={step_size}")
        
        all_results = []
        start_idx = 0
        
        while start_idx + train_size + test_size <= len(data):
            train_end = start_idx + train_size
            test_end = train_end + test_size
            
            train_data = data.iloc[start_idx:train_end]
            test_data = data.iloc[train_end:test_end]
            
            logger.info(f"Window {len(all_results)+1}: Train {train_data.index[0].date()} to {train_data.index[-1].date()}, "
                       f"Test {test_data.index[0].date()} to {test_data.index[-1].date()}")
            
            self.portfolio.reset()
            
            test_results = self.run(test_data, strategy, symbol)
            all_results.append({
                'train_start': train_data.index[0],
                'train_end': train_data.index[-1],
                'test_start': test_data.index[0],
                'test_end': test_data.index[-1],
                'results': test_results
            })
            
            start_idx += step_size
        
        combined_metrics = self._combine_walk_forward_results(all_results)
        
        logger.info(f"Walk-forward analysis complete: {len(all_results)} windows")
        
        return {
            'windows': all_results,
            'combined_metrics': combined_metrics
        }
    
    def _combine_walk_forward_results(self, results: List[Dict]) -> Dict:
        if not results:
            return {}
        
        all_trades = []
        all_equity = []
        
        for window in results:
            all_trades.extend(window['results']['trades'])
            if len(all_equity) == 0:
                all_equity = window['results']['equity_curve'].tolist()
            else:
                equity_curve = window['results']['equity_curve']
                scaling_factor = all_equity[-1] / equity_curve.iloc[0]
                scaled_equity = (equity_curve * scaling_factor).tolist()
                all_equity.extend(scaled_equity[1:])
        
        combined_equity = pd.Series(all_equity)
        
        combined_metrics = self.metrics.generate_summary(
            equity_curve=combined_equity,
            trades=all_trades,
            initial_capital=self.initial_capital
        )
        
        return combined_metrics
    
    def get_trades_df(self) -> pd.DataFrame:
        if not self.trades:
            return pd.DataFrame()
        
        trades_data = []
        for trade in self.trades:
            trades_data.append({
                'symbol': trade.symbol,
                'entry_date': trade.entry_date,
                'entry_price': trade.entry_price,
                'exit_date': trade.exit_date,
                'exit_price': trade.exit_price,
                'quantity': trade.quantity,
                'pnl': trade.pnl,
                'return_pct': trade.return_pct * 100,
                'duration': trade.duration
            })
        
        return pd.DataFrame(trades_data)
