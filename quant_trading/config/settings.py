import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/quant_trading'
    )
    
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    DEFAULT_COMMISSION = 0.001
    DEFAULT_SLIPPAGE = 0.0005
    
    DEFAULT_INITIAL_CAPITAL = 100000.0
    

settings = Settings()
