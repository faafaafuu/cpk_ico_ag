"""Tests for the public CryptoRank page-data scraper."""

from __future__ import annotations

from unittest.mock import Mock

import requests

from src.config import Settings
from src.scraper import CryptoRankPageScraper


def make_settings() -> Settings:
    """Create deterministic scraper test settings."""
    return Settings(
        cryptorank_api_key="test-key",
        cryptorank_base_url="https://api.example.test/v2",
        cryptorank_frontend_api_url="https://frontend.example.test/v0",
        request_delay=0,
        page_limit=2,
        _env_file=None,
    )


def make_response(status_code: int, payload: object) -> Mock:
    """Build a mock requests.Response-like object."""
    response = Mock(spec=requests.Response)
    response.status_code = status_code
    response.text = str(payload)
    response.json.return_value = payload
    return response


def test_scraper_collects_all_pages() -> None:
    """Scraper paginates with skip/limit until total is reached."""
    scraper = CryptoRankPageScraper(make_settings())
    scraper.session.post = Mock(
        side_effect=[
            make_response(
                201,
                {
                    "data": [
                        {"id": 1, "name": "Alpha", "symbol": "ALP"},
                        {"id": 2, "name": "Beta", "symbol": "BET"},
                    ],
                    "total": 3,
                },
            ),
            make_response(
                201,
                {"data": [{"id": 3, "name": "Gamma", "symbol": "GAM"}], "total": 3},
            ),
        ]
    )

    items = scraper.fetch_icos("upcoming")

    assert [item.name for item in items] == ["Alpha", "Beta", "Gamma"]
    assert all(item.status == "upcoming" for item in items)
    assert scraper.session.post.call_args_list[0].kwargs["json"]["skip"] == 0
    assert scraper.session.post.call_args_list[1].kwargs["json"]["skip"] == 2
