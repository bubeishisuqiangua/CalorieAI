# Quantitative Trading System

A production-ready quantitative trading infrastructure with comprehensive data pipeline, backtesting engine, and performance analytics.

## Features

### Data Pipeline
- **Data Fetcher**: Wrapper around yfinance for fetching historical OHLCV data
- **Data Storage**: PostgreSQL-based storage with efficient indexing
- **Data Validation**: Comprehensive validation and normalization pipeline
- Multi-asset support with configurable date ranges

### Backtesting Engine
- **Vectorized Operations**: High-performance backtesting using pandas/numpy
- **Portfolio Management**: Track positions, cash, and equity over time
- **Order Execution**: Realistic market order simulation with slippage and commissions
- **Performance Metrics**:
  - Returns: Daily, cumulative, and annualized
  - Risk-adjusted metrics: Sharpe ratio, Sortino ratio, Calmar ratio
  - Drawdown analysis: Maximum drawdown and recovery periods
  - Trade statistics: Win rate, profit factor, average trade metrics
- **Walk-Forward Analysis**: Robust strategy validation using rolling windows

## Installation

### Prerequisites
- Python 3.10 or higher
- PostgreSQL 12 or higher

### Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure database:**

Create a PostgreSQL database:
```bash
createdb quant_trading
```

Set environment variables (optional - defaults are provided):
```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quant_trading"
export LOG_LEVEL="INFO"
```

Or create a `.env` file:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quant_trading
LOG_LEVEL=INFO
```

3. **Run the example:**
```bash
python -m quant_trading.main
```

## Project Structure

```
quant_trading/
├── data/
│   ├── fetcher.py          # yfinance wrapper for data fetching
│   ├── storage.py          # PostgreSQL operations
│   └── validation.py       # Data quality checks and normalization
├── backtest/
│   ├── engine.py           # Core backtesting logic
│   ├── portfolio.py        # Portfolio state management
│   ├── metrics.py          # Performance calculations
│   └── orders.py           # Order and trade management
├── config/
│   ├── database.py         # Database connection and schema
│   └── settings.py         # Configuration settings
├── utils/
│   └── logger.py           # Logging utilities
├── main.py                 # Entry point with examples
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## Usage

### Basic Backtest

```python
from quant_trading.data.fetcher import DataFetcher
from quant_trading.backtest.engine import BacktestEngine
from quant_trading.backtest.metrics import PerformanceMetrics

# Fetch data
fetcher = DataFetcher()
df = fetcher.fetch_historical_data('SPY', start_date='2020-01-01', end_date='2023-12-31')

# Define strategy
def my_strategy(data):
    if len(data) == 1:
        return 1  # Buy on first bar
    return 0      # Hold

# Run backtest
engine = BacktestEngine(initial_capital=100000, commission=0.001, slippage=0.0005)
results = engine.run(df, my_strategy, symbol='SPY')

# Print results
PerformanceMetrics.print_summary(results)
```

### Creating Custom Strategies

A strategy is a function that takes historical data and returns a signal:
- `1`: Buy signal
- `0`: Hold (no action)
- `-1`: Sell signal

Example - Moving Average Crossover:

```python
def ma_crossover_strategy(data, short_window=20, long_window=50):
    if len(data) < long_window + 1:
        return 0
    
    short_ma = data['close'].rolling(window=short_window).mean()
    long_ma = data['close'].rolling(window=long_window).mean()
    
    if pd.isna(short_ma.iloc[-1]) or pd.isna(long_ma.iloc[-1]):
        return 0
    
    # Buy when short MA crosses above long MA
    if short_ma.iloc[-2] <= long_ma.iloc[-2] and short_ma.iloc[-1] > long_ma.iloc[-1]:
        return 1
    
    # Sell when short MA crosses below long MA
    elif short_ma.iloc[-2] >= long_ma.iloc[-2] and short_ma.iloc[-1] < long_ma.iloc[-1]:
        return -1
    
    return 0
```

### Walk-Forward Analysis

```python
wf_results = engine.walk_forward_analysis(
    data=df,
    strategy=my_strategy,
    symbol='SPY',
    train_size=252,  # 1 year training
    test_size=63,    # 3 months testing
    step_size=63     # Move forward 3 months
)

PerformanceMetrics.print_summary(wf_results['combined_metrics'])
```

### Data Storage

```python
from quant_trading.data.storage import DataStorage
from quant_trading.config.database import db_manager

# Setup database
db_manager.connect()
db_manager.create_tables()

# Store data
storage = DataStorage()
storage.save_ohlcv_data(df, symbol='SPY')

# Load data
df = storage.load_ohlcv_data('SPY', start_date='2020-01-01', end_date='2023-12-31')

# Get available symbols
symbols = storage.get_available_symbols()
```

## Database Schema

### OHLCV Table

```sql
CREATE TABLE ohlcv_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    date TIMESTAMP NOT NULL,
    open FLOAT NOT NULL,
    high FLOAT NOT NULL,
    low FLOAT NOT NULL,
    close FLOAT NOT NULL,
    volume FLOAT NOT NULL,
    adjusted_close FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(symbol, date)
);

CREATE INDEX idx_symbol_date ON ohlcv_data(symbol, date);
```

## Performance Metrics

### Risk-Adjusted Returns

- **Sharpe Ratio**: Measures excess return per unit of volatility
- **Sortino Ratio**: Similar to Sharpe but only considers downside volatility
- **Calmar Ratio**: Annual return divided by maximum drawdown

### Trade Statistics

- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Gross profit divided by gross loss
- **Average Trade**: Mean P&L per trade
- **Average Win/Loss**: Mean profit of winning trades vs losing trades

### Drawdown Analysis

- **Maximum Drawdown**: Largest peak-to-trough decline
- **Drawdown Date**: When maximum drawdown occurred
- **Recovery**: Time to recover from drawdowns

## Configuration

### Settings (config/settings.py)

```python
DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/quant_trading'
LOG_LEVEL = 'INFO'
DEFAULT_COMMISSION = 0.001  # 0.1% per trade
DEFAULT_SLIPPAGE = 0.0005   # 0.05% slippage
DEFAULT_INITIAL_CAPITAL = 100000.0
```

## Advanced Features

### Position Sizing

The default implementation uses 95% of available cash per trade. Customize by overriding:

```python
class MyEngine(BacktestEngine):
    def _calculate_position_size(self, price: float) -> float:
        # Custom position sizing logic
        risk_per_trade = 0.02  # Risk 2% per trade
        shares = int((self.portfolio.cash * risk_per_trade) / price)
        return shares
```

### Custom Commissions and Slippage

```python
engine = BacktestEngine(
    initial_capital=100000,
    commission=0.002,  # 0.2% commission
    slippage=0.001     # 0.1% slippage
)
```

### Multiple Assets

```python
symbols = ['SPY', 'QQQ', 'IWM', 'TLT']
fetcher = DataFetcher()
data_dict = fetcher.fetch_multiple_symbols(symbols, start_date='2020-01-01')

for symbol, df in data_dict.items():
    results = engine.run(df, my_strategy, symbol)
    PerformanceMetrics.print_summary(results)
```

## Logging

All components use comprehensive logging:

```python
from quant_trading.utils.logger import get_logger

logger = get_logger(__name__, level='DEBUG')
logger.info("Custom log message")
```

## Examples

The `main.py` file includes three complete examples:

1. **Buy and Hold Strategy**: Simple baseline strategy
2. **Moving Average Crossover**: Classic technical strategy
3. **Walk-Forward Analysis**: Robust validation technique

Run them with:
```bash
python -m quant_trading.main
```

## Extending the System

### Adding New Metrics

```python
from quant_trading.backtest.metrics import PerformanceMetrics

class MyMetrics(PerformanceMetrics):
    @staticmethod
    def calculate_custom_metric(equity_curve):
        # Your custom calculation
        return result
```

### Adding New Order Types

```python
from quant_trading.backtest.orders import OrderType

class OrderType(Enum):
    MARKET = 'market'
    LIMIT = 'limit'
    STOP = 'stop'  # New order type
```

### Custom Data Sources

```python
from quant_trading.data.fetcher import DataFetcher

class MyDataFetcher(DataFetcher):
    def fetch_from_api(self, symbol, api_key):
        # Custom data source implementation
        pass
```

## Best Practices

1. **Always validate data** before backtesting
2. **Use realistic commissions and slippage** to avoid overly optimistic results
3. **Run walk-forward analysis** to validate strategy robustness
4. **Monitor drawdowns** - a high return with high drawdown may not be acceptable
5. **Consider transaction costs** - high-frequency strategies may be unprofitable
6. **Test on multiple assets** to ensure strategy generalization
7. **Avoid overfitting** - simpler strategies often perform better out-of-sample

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d quant_trading
```

### Data Fetching Issues

```python
# Check yfinance status
import yfinance as yf
ticker = yf.Ticker('SPY')
print(ticker.info)
```

### Memory Issues with Large Datasets

```python
# Load data in chunks
for year in range(2015, 2024):
    df = storage.load_ohlcv_data(
        'SPY',
        start_date=f'{year}-01-01',
        end_date=f'{year}-12-31'
    )
    results = engine.run(df, strategy, 'SPY')
```

## Performance Optimization

1. **Use vectorized operations** - avoid loops where possible
2. **Index database queries** - the schema includes optimized indexes
3. **Cache frequently accessed data** - load once, use multiple times
4. **Batch database operations** - use bulk inserts
5. **Limit data range** - only load necessary date ranges

## Contributing

To extend this system:

1. Follow the existing code structure
2. Add comprehensive logging
3. Include validation and error handling
4. Write clear docstrings
5. Test with multiple assets and time periods

## License

This is a foundational infrastructure for quantitative trading research and education.

## Support

For issues or questions:
- Check the logs for detailed error messages
- Ensure database is properly configured
- Verify data is available for the requested symbols and dates
- Review the examples in `main.py`

## Future Enhancements

Potential additions for Phase 2:
- Multi-asset portfolio backtesting
- Limit orders and stop-loss orders
- Real-time data streaming
- Parameter optimization
- Machine learning integration
- Risk management modules
- Portfolio rebalancing strategies
- Event-driven backtesting
- Performance attribution analysis
