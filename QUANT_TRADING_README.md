# Quantitative Trading System

This repository contains a complete, production-ready quantitative trading infrastructure implemented in Python.

## 🚀 Quick Start

### Option 1: Quick Test (No Database Required)

```bash
cd quant_trading
pip install -r requirements.txt
python -m quant_trading.test_system
```

### Option 2: Full System with Live Data

```bash
# 1. Install dependencies
cd quant_trading
pip install -r requirements.txt

# 2. Setup PostgreSQL
# (See QUICKSTART.md for database installation)

# 3. Setup database schema
python -m quant_trading.setup_db

# 4. Run example backtests
python -m quant_trading.main
```

## 📁 Project Location

The quantitative trading system is located in the `quant_trading/` directory:

```
quant_trading/
├── data/              # Data fetching, storage, validation
├── backtest/          # Backtesting engine and metrics
├── config/            # Database and settings configuration
├── utils/             # Shared utilities
├── main.py           # Example entry point
├── test_system.py    # Test suite
├── setup_db.py       # Database setup script
├── requirements.txt  # Python dependencies
├── README.md         # Full documentation
├── QUICKSTART.md     # 5-minute guide
└── PROJECT_SUMMARY.md # Complete overview
```

## ✨ Key Features

### Data Pipeline
- ✅ Yahoo Finance integration (yfinance)
- ✅ PostgreSQL storage with indexing
- ✅ Data validation and normalization
- ✅ Multi-asset support
- ✅ Configurable date ranges

### Backtesting Engine
- ✅ Vectorized operations for performance
- ✅ Portfolio management (positions, cash, equity)
- ✅ Order execution (market orders)
- ✅ Realistic slippage and commission modeling
- ✅ Comprehensive performance metrics
- ✅ Trade logging with P&L
- ✅ Walk-forward analysis

### Performance Metrics
- Sharpe Ratio
- Sortino Ratio
- Calmar Ratio
- Maximum Drawdown
- Win Rate
- Profit Factor
- Average trade statistics

## 📊 Example Results

### Buy-and-Hold Strategy (SPY, 5 years)
- Total Return: ~56%
- Sharpe Ratio: ~0.54
- Max Drawdown: ~-24%

### Moving Average Crossover (SPY, 5 years)
- Total Return: ~28%
- Sharpe Ratio: ~0.40
- Max Drawdown: ~-18%
- Win Rate: ~53%

## 🔧 System Requirements

- Python 3.10+
- PostgreSQL 12+ (optional for testing)

## 📖 Documentation

- **[README.md](quant_trading/README.md)**: Complete system documentation
- **[QUICKSTART.md](quant_trading/QUICKSTART.md)**: Get started in 5 minutes
- **[PROJECT_SUMMARY.md](quant_trading/PROJECT_SUMMARY.md)**: Project overview
- **[EXAMPLE_OUTPUT.md](quant_trading/EXAMPLE_OUTPUT.md)**: Understanding results

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd quant_trading
python -m quant_trading.test_system
```

Expected output:
```
✓ PASSED: Data Validation
✓ PASSED: Portfolio Management
✓ PASSED: Backtest Engine
✓ PASSED: Performance Metrics
✓ PASSED: MA Crossover Strategy
Results: 5/5 tests passed
```

## 🎯 Usage Example

```python
from quant_trading.data.fetcher import DataFetcher
from quant_trading.backtest.engine import BacktestEngine
from quant_trading.backtest.metrics import PerformanceMetrics

# Fetch data
fetcher = DataFetcher()
df = fetcher.fetch_historical_data('SPY', start_date='2020-01-01')

# Define strategy
def my_strategy(data):
    if len(data) == 1:
        return 1  # Buy signal
    return 0      # Hold

# Run backtest
engine = BacktestEngine(initial_capital=100000)
results = engine.run(df, my_strategy, symbol='SPY')

# Print results
PerformanceMetrics.print_summary(results)
```

## 🏗️ Architecture

### Clean Separation of Concerns
- **Data Layer**: Fetching, validation, storage
- **Backtest Layer**: Portfolio, orders, execution
- **Analysis Layer**: Metrics and reporting
- **Config Layer**: Database and settings

### Extensibility
- Easy to add new strategies
- Simple to add custom metrics
- Pluggable data sources
- Expandable order types

## 📦 Dependencies

Core libraries:
- pandas>=2.0.0
- numpy>=1.24.0
- sqlalchemy>=2.0.0
- psycopg2-binary>=2.9.0
- yfinance>=0.2.28
- python-dotenv>=1.0.0
- tabulate>=0.9.0

## 🚀 Phase 1 Complete

All Phase 1 objectives have been successfully completed:

✅ Data Pipeline with PostgreSQL  
✅ yfinance Integration  
✅ Data Validation & Normalization  
✅ Backtesting Engine  
✅ Portfolio Management  
✅ Order Execution with Slippage/Commissions  
✅ Comprehensive Performance Metrics  
✅ Trade Logging  
✅ Walk-Forward Testing  
✅ Example Strategies  
✅ Full Documentation  

## 🔮 Future Enhancements

Potential Phase 2 features:
- Advanced order types (limit, stop-loss)
- Multi-asset portfolio backtesting
- Parameter optimization
- Real-time data streaming
- Machine learning integration
- Risk management modules
- Visualization dashboards
- Paper trading capabilities

## 📝 License

This is a foundational infrastructure for quantitative trading research and education.

## 🤝 Contributing

The system is designed for easy extension:
1. Follow existing code structure
2. Add comprehensive logging
3. Include error handling
4. Write clear docstrings

## 📧 Support

For detailed documentation and troubleshooting:
- Check the comprehensive README in `quant_trading/`
- Review the QUICKSTART guide
- Run the test suite for validation
- Check logs for detailed error messages

---

**Built with**: Python, PostgreSQL, pandas, numpy, yfinance, SQLAlchemy

**Status**: Phase 1 Complete ✅

**Test Coverage**: 5/5 tests passing ✅

**Documentation**: Comprehensive ✅
