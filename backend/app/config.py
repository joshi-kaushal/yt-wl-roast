from pydantic_settings import BaseSettings

class Settings(BaseSettings):
	CORS_ORIGINS: list[str] = ["*"]
	YT_WL_API_KEY: str
	OPENROUTER_API_KEY: str
	OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
	MODEL: str = "google/gemma-4-26b-a4b-it:free"
	RATE_LIMIT_PER_MINUTE: int = 10
	HOST: str = "0.0.0.0"
	PORT: int = 8000

	model_config = {
		"env_file":".env"
	}


settings = Settings()