from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    schwab_client_id: str = ""
    schwab_client_secret: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
