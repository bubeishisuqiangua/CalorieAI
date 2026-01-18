# Quick Start Guide

Get started with the Quantitative Trading System in 5 minutes!

## Option 1: Quick Test (No Database Required)

Test the system without setting up PostgreSQL:

```bash
cd quant_trading
pip install -r requirements.txt
python test_system.py
```

This will run a comprehensive test suite validating all components.

## Option 2: Full Setup with Database

### Step 1: Install Dependencies

```bash
cd quant_trading
pip install -r requirements.txt
```

### Step 2: Install and Start PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS (with Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Docker:**
```bash
docker run --name postgres-quant \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=quant_trading \
  -p 5432:5432 \
  -d postgres:14
```

### Step 3: Create Database

```bash
# Using psql
createdb quant_trading

# Or using psql command
psql -U postgres -c "CREATE DATABASE quant_trading;"
```

### Step 4: Configure Environment (Optional)

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` if your database settings differ:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quant_trading
LOG_LEVEL=INFO
```

### Step 5: Setup Database Schema

```bash
python setup_db.py
```

### Step 6: Run Example Backtests

```bash
python main.py
```

This will:
1. Fetch SPY (S&P 500 ETF) data from Yahoo Finance
2. Store it in PostgreSQL
3. Run buy-and-hold strategy backtest
4. Run moving average crossover strategy backtest
5. Perform walk-forward analysis
6. Display comprehensive performance metrics

## Expected Output

```
============================================================
BACKTEST PERFORMANCE SUMMARY
============================================================

Capital:
  Initial Capital:      $100,000.00
  Final Equity:         $XXX,XXX.XX
  Total Return:         XX.XX%

Returns:
  Annual Return:        XX.XX%
  Annual Volatility:    XX.XX%

Risk Metrics:
  Sharpe Ratio:         X.XXX
  Sortino Ratio:        X.XXX
  Calmar Ratio:         X.XXX
  Max Drawdown:         -XX.XX%

Trade Statistics:
  Total Trades:         XX
  Win Rate:             XX.XX%
  Profit Factor:        X.XXX
  Average Trade:        $XX.XX
  Average Win:          $XXX.XX
  Average Loss:         $-XX.XX
  Average Duration:     XX.X days
============================================================
```

## Next Steps

### 1. Create Your Own Strategy

Edit `main.py` and add your strategy function:

```python
def my_custom_strategy(data):
    # Your strategy logic here
    # Return 1 to buy, -1 to sell, 0 to hold
    
    if len(data) < 50:
        return 0
    
    # Example: Buy when price is above 50-day moving average
    ma_50 = data['close'].rolling(50).mean().iloc[-1]
    current_price = data['close'].iloc[-1]
    
    if current_price > ma_50:
        return 1
    else:
        return -1
```

### 2. Test Multiple Symbols

```python
symbols = ['SPY', 'QQQ', 'IWM', 'TLT', 'GLD']
fetcher = DataFetcher()

for symbol in symbols:
    df = fetcher.fetch_historical_data(symbol, start_date='2020-01-01')
    results = engine.run(df, my_strategy, symbol)
    PerformanceMetrics.print_summary(results)
```

### 3. Optimize Parameters

```python
# Test different moving average periods
best_sharpe = -999
best_params = None

for short in range(10, 50, 5):
    for long in range(50, 200, 10):
        def strategy(data):
            return ma_crossover_strategy(data, short, long)
        
        results = engine.run(df, strategy, 'SPY')
        
        if results['sharpe_ratio'] > best_sharpe:
            best_sharpe = results['sharpe_ratio']
            best_params = (short, long)

print(f"Best parameters: MA({best_params[0]}/{best_params[1]}) - Sharpe: {best_sharpe:.3f}")
```

### 4. Use Walk-Forward Analysis

Validate your strategy's robustness:

```python
wf_results = engine.walk_forward_analysis(
    data=df,
    strategy=my_strategy,
    symbol='SPY',
    train_size=252,  # 1 year training
    test_size=63,    # 3 months testing
    step_size=21     # Move forward 1 month
)

PerformanceMetrics.print_summary(wf_results['combined_metrics'])
```

## Troubleshooting

### "ModuleNotFoundError"
```bash
# Make sure you're in the right directory and have installed dependencies
cd quant_trading
pip install -r requirements.txt
```

### "Could not connect to database"
```bash
# Check PostgreSQL is running
pg_isready

# Check connection manually
psql -U postgres -d quant_trading
```

### "No data returned for symbol"
```bash
# Check your internet connection
# Try a different symbol (SPY, QQQ, AAPL, etc.)
# Yahoo Finance may temporarily block requests - wait a few minutes
```

### "Permission denied" when creating database
```bash
# On Ubuntu/Debian, use sudo
sudo -u postgres createdb quant_trading

# Or grant permissions
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

## Performance Tips

1. **Limit data range** for faster testing:
   ```python
   df = fetcher.fetch_historical_data('SPY', period='1y')  # Just 1 year
   ```

2. **Use cached data** from database instead of re-fetching:
   ```python
   storage = DataStorage()
   df = storage.load_ohlcv_data('SPY')  # Much faster
   ```

3. **Vectorize your strategy** - avoid loops:
   ```python
   # Good - vectorized
   signals = (data['close'] > data['close'].rolling(50).mean()).astype(int)
   
   # Avoid - loops
   for i in range(len(data)):
       if data['close'].iloc[i] > threshold:
           # ...
   ```

## Resources

- **Full Documentation**: See `README.md`
- **Example Strategies**: See `main.py`
- **Test Suite**: Run `python test_system.py`
- **Database Schema**: See `config/database.py`

## Support

If you encounter issues:

1. Check the logs - they contain detailed error messages
2. Verify all dependencies are installed: `pip list`
3. Ensure PostgreSQL is running: `pg_isready`
4. Test with the included test suite: `python test_system.py`

Happy Trading! 🚀📈
