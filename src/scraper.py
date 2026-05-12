"""Public CryptoRank page-data scraper for ICO/token sale tables."""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Literal

import requests
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from src.api_client import CryptoRankAPIError, RetryableAPIError
from src.config import Settings
from src.models import ICOItem, ICOResponse


logger = logging.getLogger(__name__)


class CryptoRankPageScraper:
    """Scrape ICO data from CryptoRank public page-data endpoints.

    CryptoRank renders `/ico` and `/upcoming-ico` from the public frontend API
    endpoint `/v0/round/{status}`. It uses POST with `limit` and `skip`.
    This is a fallback for plans where REST `/v2/currencies/public-sales` is
    closed, while the public website table is visible.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 cryptorank-ico-cli/1.0",
                "Origin": "https://cryptorank.io",
            }
        )

    def fetch_icos(self, status: Literal["past", "upcoming"]) -> List[ICOItem]:
        """Fetch all public page-data rows for a status."""
        items: List[ICOItem] = []
        skip = 0
        limit = self.settings.page_limit

        while True:
            payload = {
                "limit": limit,
                "skip": skip,
                "filters": {},
                "locale": "en",
            }
            logger.info("Scraping %s ICOs with payload=%s", status, payload)
            data = self._request_rounds(status=status, payload=payload)
            response = ICOResponse.parse_obj(data)
            page_items = [self._with_status(item, status) for item in response.items]

            if not page_items:
                logger.info("No more public %s ICO rows returned", status)
                break

            items.extend(page_items)
            logger.info("Scraped %s/%s %s ICO rows", len(items), response.total, status)

            if response.total is not None and len(items) >= response.total:
                break
            if len(page_items) < limit:
                break

            skip += limit
            if self.settings.request_delay:
                time.sleep(self.settings.request_delay)

        return items

    @retry(
        reraise=True,
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=1, max=30),
        retry=retry_if_exception_type((RetryableAPIError, requests.RequestException)),
    )
    def _request_rounds(
        self,
        status: Literal["past", "upcoming"],
        payload: Dict[str, Any],
    ) -> Any:
        """Request one page from the public frontend API."""
        url = f"{self.settings.cryptorank_frontend_api_url}/round/{status}"
        referer = "https://cryptorank.io/ico"
        if status == "upcoming":
            referer = "https://cryptorank.io/upcoming-ico"

        try:
            response = self.session.post(
                url,
                json=payload,
                timeout=self.settings.timeout_seconds,
                headers={"Referer": referer},
            )
        except requests.RequestException as exc:
            logger.warning("Network error while scraping %s: %s", url, exc)
            raise

        if response.status_code in {429, 500, 502, 503, 504}:
            raise RetryableAPIError(
                f"Temporary CryptoRank public endpoint error HTTP "
                f"{response.status_code}"
            )
        if response.status_code >= 400:
            raise CryptoRankAPIError(
                f"CryptoRank public endpoint failed HTTP {response.status_code}: "
                f"{response.text[:300]}"
            )

        try:
            return response.json()
        except ValueError as exc:
            raise CryptoRankAPIError(
                "CryptoRank public endpoint returned invalid JSON"
            ) from exc

    @staticmethod
    def _with_status(
        item: ICOItem,
        status: Literal["past", "upcoming"],
    ) -> ICOItem:
        """Fill status when the public endpoint omits it."""
        if item.status:
            return item
        data = item.dict()
        data["status"] = status
        return ICOItem.parse_obj(data)
