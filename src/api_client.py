"""CryptoRank API client with pagination, retries, and normalization."""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Literal

import requests
from requests import Response
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from src.config import Settings
from src.models import ICOItem, ICOResponse


logger = logging.getLogger(__name__)


class CryptoRankAPIError(RuntimeError):
    """Raised when CryptoRank API cannot be queried successfully."""


class RetryableAPIError(CryptoRankAPIError):
    """Raised for temporary API failures eligible for retry."""


class CryptoRankClient:
    """Small production-oriented client for CryptoRank ICO endpoints."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Accept": "application/json",
                "User-Agent": "cryptorank-ico-cli/1.0",
            }
        )
        if settings.cryptorank_auth_mode == "bearer":
            self.session.headers["Authorization"] = (
                f"Bearer {settings.cryptorank_api_key}"
            )
        else:
            self.session.headers["x-api-key"] = settings.cryptorank_api_key

    def fetch_icos(self, status: Literal["past", "upcoming"]) -> List[ICOItem]:
        """Fetch all ICO records for a status using configured pagination."""
        endpoint = f"/ico/{status}"
        items: List[ICOItem] = []
        offset = 0
        page = 1
        limit = self.settings.page_limit

        while True:
            params = self._pagination_params(limit=limit, offset=offset, page=page)
            logger.info("Fetching %s ICOs with params=%s", status, params)
            payload = self._request_json(endpoint=endpoint, params=params)
            response = ICOResponse.parse_obj(payload)
            page_items = response.items

            if not page_items:
                logger.info("No more %s ICOs returned by API", status)
                break

            items.extend(page_items)
            logger.info("Fetched %s/%s %s ICOs", len(items), response.total, status)

            if response.total is not None and len(items) >= response.total:
                break
            if len(page_items) < limit:
                break

            offset += limit
            page += 1
            if self.settings.request_delay:
                time.sleep(self.settings.request_delay)

        return items

    def _pagination_params(self, limit: int, offset: int, page: int) -> Dict[str, int]:
        """Build pagination params for offset or page based APIs."""
        if self.settings.pagination_mode == "page":
            return {"limit": limit, "page": page}
        return {"limit": limit, "offset": offset}

    @retry(
        reraise=True,
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=1, max=30),
        retry=retry_if_exception_type((RetryableAPIError, requests.RequestException)),
    )
    def _request_json(self, endpoint: str, params: Dict[str, int]) -> Any:
        """Perform a GET request and return decoded JSON with retry handling."""
        url = f"{self.settings.cryptorank_base_url}{endpoint}"
        try:
            response = self.session.get(
                url,
                params=params,
                timeout=self.settings.timeout_seconds,
            )
        except requests.RequestException as exc:
            logger.warning("Network error while requesting %s: %s", url, exc)
            raise

        self._raise_for_status(response)

        try:
            return response.json()
        except ValueError as exc:
            raise CryptoRankAPIError("CryptoRank returned invalid JSON") from exc

    @staticmethod
    def _raise_for_status(response: Response) -> None:
        """Translate HTTP status codes into actionable exceptions."""
        if response.status_code in {429, 500, 502, 503, 504}:
            logger.warning(
                "Temporary CryptoRank API error HTTP %s: %s",
                response.status_code,
                response.text[:300],
            )
            raise RetryableAPIError(f"Temporary API error HTTP {response.status_code}")

        if response.status_code in {401, 403}:
            raise CryptoRankAPIError(
                "CryptoRank authentication failed. Check CRYPTORANK_API_KEY "
                "and CRYPTORANK_AUTH_MODE."
            )

        if 400 <= response.status_code < 500:
            raise CryptoRankAPIError(
                f"CryptoRank request failed HTTP {response.status_code}: "
                f"{response.text[:300]}"
            )

        if response.status_code >= 500:
            raise RetryableAPIError(f"CryptoRank server error HTTP {response.status_code}")

