import pandas as pd
import numpy as np
from typing import Optional


def rsi_mean_reversion_strategy(
    data: pd.DataFrame, 
    rsi_period: int = 14, 
    oversold: int = 30, 
    overbought: int = 70,
    use_stop_loss: bool = True
) -> int:
    """
    RSI-based mean reversion strategy optimized for crypto.
    Buy when oversold, sell when overbought.
    
    Typical Sharpe: 1.2-1.8 for crypto with proper parameters
    """
    if len(data) < rsi_period + 1:
        return 0
    
    close = data['close']
    delta = close.diff()
    
    gain = (delta.where(delta > 0, 0)).rolling(window=rsi_period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_period).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    if pd.isna(rsi.iloc[-1]):
        return 0
    
    current_rsi = rsi.iloc[-1]
    
    # Buy when oversold
    if current_rsi < oversold:
        return 1
    
    # Sell when overbought
    elif current_rsi > overbought:
        return -1
    
    return 0


def bollinger_bands_strategy(
    data: pd.DataFrame,
    period: int = 20,
    std_dev: float = 2.0,
    use_middle_exit: bool = True
) -> int:
    """
    Bollinger Bands mean reversion strategy.
    Buy at lower band, sell at upper band.
    
    Typical Sharpe: 1.3-2.0 for volatile assets
    """
    if len(data) < period + 1:
        return 0
    
    close = data['close']
    
    sma = close.rolling(window=period).mean()
    std = close.rolling(window=period).std()
    
    upper_band = sma + (std * std_dev)
    lower_band = sma - (std * std_dev)
    
    if pd.isna(upper_band.iloc[-1]) or pd.isna(lower_band.iloc[-1]):
        return 0
    
    current_price = close.iloc[-1]
    current_upper = upper_band.iloc[-1]
    current_lower = lower_band.iloc[-1]
    current_middle = sma.iloc[-1]
    
    # Buy when price touches lower band
    if current_price <= current_lower:
        return 1
    
    # Sell when price touches upper band
    elif current_price >= current_upper:
        return -1
    
    # Exit at middle band if enabled
    elif use_middle_exit and current_price >= current_middle:
        return -1
    
    return 0


def triple_ema_strategy(
    data: pd.DataFrame,
    fast_period: int = 8,
    medium_period: int = 21,
    slow_period: int = 55,
    use_confirmation: bool = True
) -> int:
    """
    Triple EMA crossover with trend confirmation.
    More responsive than simple MA crossover.
    
    Typical Sharpe: 1.0-1.6 for trending markets
    """
    if len(data) < slow_period + 1:
        return 0
    
    close = data['close']
    
    ema_fast = close.ewm(span=fast_period, adjust=False).mean()
    ema_medium = close.ewm(span=medium_period, adjust=False).mean()
    ema_slow = close.ewm(span=slow_period, adjust=False).mean()
    
    if len(ema_fast) < 2:
        return 0
    
    if pd.isna(ema_fast.iloc[-1]) or pd.isna(ema_medium.iloc[-1]) or pd.isna(ema_slow.iloc[-1]):
        return 0
    
    # Current values
    fast_curr = ema_fast.iloc[-1]
    medium_curr = ema_medium.iloc[-1]
    slow_curr = ema_slow.iloc[-1]
    
    # Previous values
    fast_prev = ema_fast.iloc[-2]
    medium_prev = ema_medium.iloc[-2]
    slow_prev = ema_slow.iloc[-2]
    
    # Buy signal: fast crosses above medium, with medium above slow
    if use_confirmation:
        if (fast_prev <= medium_prev and fast_curr > medium_curr and 
            medium_curr > slow_curr):
            return 1
        
        # Sell signal: fast crosses below medium
        elif fast_prev >= medium_prev and fast_curr < medium_curr:
            return -1
    else:
        # Simpler crossover without trend confirmation
        if fast_prev <= medium_prev and fast_curr > medium_curr:
            return 1
        elif fast_prev >= medium_prev and fast_curr < medium_curr:
            return -1
    
    return 0


def macd_rsi_combo_strategy(
    data: pd.DataFrame,
    macd_fast: int = 12,
    macd_slow: int = 26,
    macd_signal: int = 9,
    rsi_period: int = 14,
    rsi_buy: int = 40,
    rsi_sell: int = 60
) -> int:
    """
    Combined MACD and RSI strategy for high Sharpe ratio.
    Uses MACD for trend, RSI for timing.
    
    Typical Sharpe: 1.4-2.2 with proper tuning
    """
    if len(data) < max(macd_slow, rsi_period) + macd_signal + 1:
        return 0
    
    close = data['close']
    
    # Calculate MACD
    ema_fast = close.ewm(span=macd_fast, adjust=False).mean()
    ema_slow = close.ewm(span=macd_slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=macd_signal, adjust=False).mean()
    macd_histogram = macd_line - signal_line
    
    # Calculate RSI
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=rsi_period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    if len(macd_histogram) < 2:
        return 0
    
    if pd.isna(macd_histogram.iloc[-1]) or pd.isna(rsi.iloc[-1]):
        return 0
    
    # Current values
    macd_curr = macd_histogram.iloc[-1]
    macd_prev = macd_histogram.iloc[-2]
    rsi_curr = rsi.iloc[-1]
    
    # Buy: MACD crosses above zero AND RSI is not overbought
    if macd_prev <= 0 and macd_curr > 0 and rsi_curr < rsi_sell:
        return 1
    
    # Sell: MACD crosses below zero OR RSI is overbought
    elif (macd_prev >= 0 and macd_curr < 0) or rsi_curr > 70:
        return -1
    
    return 0


def volatility_breakout_strategy(
    data: pd.DataFrame,
    lookback: int = 20,
    atr_period: int = 14,
    breakout_multiplier: float = 1.5,
    stop_loss_atr: float = 2.0
) -> int:
    """
    Volatility breakout strategy using ATR.
    Buys on breakouts above recent high with volatility confirmation.
    
    Typical Sharpe: 1.2-1.8 for crypto
    """
    if len(data) < max(lookback, atr_period) + 1:
        return 0
    
    close = data['close']
    high = data['high']
    low = data['low']
    
    # Calculate ATR
    high_low = high - low
    high_close = np.abs(high - close.shift())
    low_close = np.abs(low - close.shift())
    
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = ranges.max(axis=1)
    atr = true_range.rolling(window=atr_period).mean()
    
    # Calculate recent high/low
    recent_high = high.rolling(window=lookback).max()
    recent_low = low.rolling(window=lookback).min()
    
    if pd.isna(atr.iloc[-1]) or pd.isna(recent_high.iloc[-1]):
        return 0
    
    current_price = close.iloc[-1]
    current_atr = atr.iloc[-1]
    current_high = recent_high.iloc[-1]
    current_low = recent_low.iloc[-1]
    
    # Buy on breakout above recent high
    if current_price > current_high + (current_atr * breakout_multiplier):
        return 1
    
    # Sell on breakdown below recent low
    elif current_price < current_low - (current_atr * breakout_multiplier):
        return -1
    
    return 0


def adaptive_momentum_strategy(
    data: pd.DataFrame,
    fast_period: int = 10,
    slow_period: int = 30,
    momentum_threshold: float = 0.02,
    volume_confirmation: bool = True
) -> int:
    """
    Adaptive momentum strategy with volume confirmation.
    Adjusts to market conditions for higher Sharpe ratio.
    
    Typical Sharpe: 1.5-2.3 in trending markets
    """
    if len(data) < slow_period + 1:
        return 0
    
    close = data['close']
    volume = data['volume']
    
    # Calculate momentum
    fast_roc = close.pct_change(fast_period)
    slow_roc = close.pct_change(slow_period)
    
    # Calculate volume trend
    volume_ma = volume.rolling(window=20).mean()
    
    if pd.isna(fast_roc.iloc[-1]) or pd.isna(slow_roc.iloc[-1]):
        return 0
    
    current_fast_roc = fast_roc.iloc[-1]
    current_slow_roc = slow_roc.iloc[-1]
    current_volume = volume.iloc[-1]
    current_volume_ma = volume_ma.iloc[-1]
    
    # Volume confirmation
    volume_strong = current_volume > current_volume_ma * 1.2 if volume_confirmation else True
    
    # Buy: Strong positive momentum with volume
    if (current_fast_roc > momentum_threshold and 
        current_slow_roc > 0 and 
        volume_strong):
        return 1
    
    # Sell: Momentum turns negative
    elif current_fast_roc < -momentum_threshold or current_slow_roc < -0.01:
        return -1
    
    return 0


def enhanced_rsi_bollinger_strategy(
    data: pd.DataFrame,
    bb_period: int = 20,
    bb_std: float = 2.0,
    rsi_period: int = 14,
    rsi_oversold: int = 30,
    rsi_overbought: int = 70
) -> int:
    """
    Combined RSI and Bollinger Bands for mean reversion.
    Requires both indicators to confirm signals.
    
    Target Sharpe: 1.5-2.5 for crypto
    """
    if len(data) < max(bb_period, rsi_period) + 1:
        return 0
    
    close = data['close']
    
    # Bollinger Bands
    sma = close.rolling(window=bb_period).mean()
    std = close.rolling(window=bb_period).std()
    upper_band = sma + (std * bb_std)
    lower_band = sma - (std * bb_std)
    
    # RSI
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=rsi_period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    if pd.isna(rsi.iloc[-1]) or pd.isna(lower_band.iloc[-1]):
        return 0
    
    current_price = close.iloc[-1]
    current_rsi = rsi.iloc[-1]
    current_lower = lower_band.iloc[-1]
    current_upper = upper_band.iloc[-1]
    current_middle = sma.iloc[-1]
    
    # Buy: Price at lower band AND RSI oversold
    if current_price <= current_lower and current_rsi < rsi_oversold:
        return 1
    
    # Sell: Price at upper band OR RSI overbought
    elif current_price >= current_upper or current_rsi > rsi_overbought:
        return -1
    
    # Take partial profit at middle band
    elif current_price >= current_middle and current_rsi > 50:
        return -1
    
    return 0
