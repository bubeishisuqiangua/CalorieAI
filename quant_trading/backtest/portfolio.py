from typing import Dict, Optional
from datetime import datetime
from .orders import Order, OrderSide, OrderStatus
from ..utils.logger import get_logger

logger = get_logger(__name__)


class Position:
    def __init__(self, symbol: str, quantity: float = 0.0, avg_price: float = 0.0):
        self.symbol = symbol
        self.quantity = quantity
        self.avg_price = avg_price
    
    def add(self, quantity: float, price: float):
        if self.quantity + quantity < 0:
            raise ValueError(f"Cannot reduce position below 0: current={self.quantity}, adding={quantity}")
        
        if self.quantity == 0:
            self.avg_price = price
            self.quantity = quantity
        else:
            total_cost = (self.quantity * self.avg_price) + (quantity * price)
            self.quantity += quantity
            if self.quantity > 0:
                self.avg_price = total_cost / self.quantity
            else:
                self.avg_price = 0
    
    def remove(self, quantity: float) -> bool:
        if quantity > self.quantity:
            logger.warning(f"Cannot remove {quantity} from position of {self.quantity}")
            return False
        
        self.quantity -= quantity
        if self.quantity == 0:
            self.avg_price = 0
        
        return True
    
    def market_value(self, current_price: float) -> float:
        return self.quantity * current_price
    
    def unrealized_pnl(self, current_price: float) -> float:
        return (current_price - self.avg_price) * self.quantity
    
    def __repr__(self):
        return f"Position(symbol={self.symbol}, quantity={self.quantity}, avg_price={self.avg_price:.2f})"


class Portfolio:
    def __init__(self, initial_capital: float = 100000.0):
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.positions: Dict[str, Position] = {}
        self.equity_history = []
        self.cash_history = []
        self.timestamp_history = []
    
    def get_position(self, symbol: str) -> Optional[Position]:
        return self.positions.get(symbol)
    
    def has_position(self, symbol: str) -> bool:
        position = self.positions.get(symbol)
        return position is not None and position.quantity > 0
    
    def execute_order(self, order: Order, current_price: float) -> bool:
        if order.status == OrderStatus.FILLED:
            logger.warning("Order already filled")
            return False
        
        cost = current_price * order.quantity
        total_cost = cost * (1 + order.commission + order.slippage)
        
        if order.side == OrderSide.BUY:
            if self.cash < total_cost:
                logger.warning(f"Insufficient funds: need ${total_cost:.2f}, have ${self.cash:.2f}")
                order.reject()
                return False
            
            self.cash -= total_cost
            
            if order.symbol not in self.positions:
                self.positions[order.symbol] = Position(order.symbol)
            
            self.positions[order.symbol].add(order.quantity, current_price)
            
        elif order.side == OrderSide.SELL:
            if not self.has_position(order.symbol):
                logger.warning(f"No position in {order.symbol} to sell")
                order.reject()
                return False
            
            position = self.positions[order.symbol]
            if position.quantity < order.quantity:
                logger.warning(f"Insufficient shares: need {order.quantity}, have {position.quantity}")
                order.reject()
                return False
            
            proceeds = cost * (1 - order.commission - order.slippage)
            self.cash += proceeds
            
            position.remove(order.quantity)
            
            if position.quantity == 0:
                del self.positions[order.symbol]
        
        order.fill(current_price, order.commission, order.slippage)
        
        return True
    
    def get_total_equity(self, current_prices: Dict[str, float]) -> float:
        positions_value = sum(
            pos.market_value(current_prices.get(symbol, 0))
            for symbol, pos in self.positions.items()
        )
        return self.cash + positions_value
    
    def update_history(self, timestamp: datetime, current_prices: Dict[str, float]):
        self.timestamp_history.append(timestamp)
        self.cash_history.append(self.cash)
        self.equity_history.append(self.get_total_equity(current_prices))
    
    def get_position_value(self, symbol: str, current_price: float) -> float:
        position = self.positions.get(symbol)
        if position is None:
            return 0.0
        return position.market_value(current_price)
    
    def get_all_positions(self) -> Dict[str, Position]:
        return {symbol: pos for symbol, pos in self.positions.items() if pos.quantity > 0}
    
    def reset(self):
        self.cash = self.initial_capital
        self.positions = {}
        self.equity_history = []
        self.cash_history = []
        self.timestamp_history = []
    
    def __repr__(self):
        return f"Portfolio(cash=${self.cash:.2f}, positions={len(self.positions)})"
