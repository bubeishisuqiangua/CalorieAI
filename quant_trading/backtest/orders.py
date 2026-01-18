from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class OrderType(Enum):
    MARKET = 'market'
    LIMIT = 'limit'


class OrderSide(Enum):
    BUY = 'buy'
    SELL = 'sell'


class OrderStatus(Enum):
    PENDING = 'pending'
    FILLED = 'filled'
    CANCELLED = 'cancelled'
    REJECTED = 'rejected'


@dataclass
class Order:
    symbol: str
    side: OrderSide
    quantity: float
    order_type: OrderType = OrderType.MARKET
    limit_price: Optional[float] = None
    timestamp: Optional[datetime] = None
    status: OrderStatus = OrderStatus.PENDING
    filled_price: Optional[float] = None
    filled_quantity: Optional[float] = None
    commission: float = 0.0
    slippage: float = 0.0
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
    
    def fill(self, price: float, commission: float = 0.0, slippage: float = 0.0):
        self.status = OrderStatus.FILLED
        self.filled_price = price
        self.filled_quantity = self.quantity
        self.commission = commission
        self.slippage = slippage
    
    def cancel(self):
        self.status = OrderStatus.CANCELLED
    
    def reject(self):
        self.status = OrderStatus.REJECTED
    
    @property
    def total_cost(self) -> float:
        if self.status != OrderStatus.FILLED:
            return 0.0
        
        base_cost = self.filled_price * self.filled_quantity
        
        if self.side == OrderSide.BUY:
            return base_cost * (1 + self.commission + self.slippage)
        else:
            return base_cost * (1 - self.commission - self.slippage)
    
    def __repr__(self):
        return (f"Order(symbol={self.symbol}, side={self.side.value}, "
                f"quantity={self.quantity}, status={self.status.value})")


@dataclass
class Trade:
    symbol: str
    entry_date: datetime
    entry_price: float
    exit_date: datetime
    exit_price: float
    quantity: float
    side: OrderSide
    commission: float = 0.0
    
    @property
    def pnl(self) -> float:
        if self.side == OrderSide.BUY:
            return (self.exit_price - self.entry_price) * self.quantity - self.commission
        else:
            return (self.entry_price - self.exit_price) * self.quantity - self.commission
    
    @property
    def return_pct(self) -> float:
        if self.side == OrderSide.BUY:
            return (self.exit_price - self.entry_price) / self.entry_price
        else:
            return (self.entry_price - self.exit_price) / self.entry_price
    
    @property
    def duration(self) -> int:
        return (self.exit_date - self.entry_date).days
    
    def __repr__(self):
        return (f"Trade(symbol={self.symbol}, entry={self.entry_date.date()}, "
                f"exit={self.exit_date.date()}, pnl={self.pnl:.2f})")
