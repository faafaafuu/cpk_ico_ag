"""Application configuration loaded from environment variables."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseSettings, Field, validator


load_dotenv()


class Settings(BaseSettings):
    """Runtime settings for the CryptoRank ICO agent.

    Values are intentionally environment-driven. Put local defaults in `.env`;
    keep secrets out of source control.
    """

    cryptorank_api_key: str = Field(..., env="CRYPTORANK_API_KEY")
    cryptorank_base_url: str = Field(..., env="CRYPTORANK_BASE_URL")
    cryptorank_auth_mode: Literal["x-api-key", "bearer"] = Field(
        "x-api-key",
        env="CRYPTORANK_AUTH_MODE",
    )
    request_delay: float = Field(1.5, env="REQUEST_DELAY")
    output_dir: Path = Field(Path("output"), env="OUTPUT_DIR")
    output_format: Literal["json", "csv", "both"] = Field("json", env="FORMAT")
    page_limit: int = Field(100, env="PAGE_LIMIT")
    pagination_mode: Literal["offset", "page"] = Field(
        "offset",
        env="PAGINATION_MODE",
    )
    timeout_seconds: float = Field(30.0, env="TIMEOUT_SECONDS")

    @validator("cryptorank_base_url")
    def normalize_base_url(cls, value: str) -> str:
        """Remove trailing slash to make endpoint joins predictable."""
        normalized = value.strip().rstrip("/")
        if not normalized:
            raise ValueError("CRYPTORANK_BASE_URL must not be empty")
        return normalized

    @validator("request_delay")
    def validate_request_delay(cls, value: float) -> float:
        """Keep delay non-negative."""
        if value < 0:
            raise ValueError("REQUEST_DELAY must be >= 0")
        return value

    @validator("page_limit")
    def validate_page_limit(cls, value: int) -> int:
        """Keep page size within a sane API-friendly range."""
        if value <= 0:
            raise ValueError("PAGE_LIMIT must be > 0")
        return value

    class Config:
        """Pydantic BaseSettings options."""

        env_file = ".env"
        env_file_encoding = "utf-8"

