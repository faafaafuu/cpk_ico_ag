"""Tests for CryptoRank API client behavior."""

from __future__ import annotations

from unittest.mock import Mock

import pytest
import requests

from src.api_client import CryptoRankClient, RetryableAPIError
from src.config import Settings


def make_settings() -> Settings:
    """Create deterministic test settings."""
    return Settings(
        cryptorank_api_key="test-key",
        cryptorank_base_url="https://api.example.test/v1",
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


def test_fetch_icos_success_with_offset_pagination() -> None:
    """Client collects all pages until total count is reached."""
    client = CryptoRankClient(make_settings())
    client.session.get = Mock(
        side_effect=[
            make_response(
                200,
                {
                    "data": [
                        {"id": 1, "name": "Alpha", "symbol": "ALP"},
                        {"id": 2, "name": "Beta", "symbol": "BET"},
                    ],
                    "total": 3,
                },
            ),
            make_response(
                200,
                {"data": [{"id": 3, "name": "Gamma", "symbol": "GAM"}], "total": 3},
            ),
        ]
    )

    items = client.fetch_icos("past")

    assert [item.name for item in items] == ["Alpha", "Beta", "Gamma"]
    assert client.session.get.call_count == 2
    assert client.session.get.call_args_list[0].kwargs["params"] == {
        "limit": 2,
        "offset": 0,
    }
    assert client.session.get.call_args_list[1].kwargs["params"] == {
        "limit": 2,
        "offset": 2,
    }


def test_request_json_retries_after_429() -> None:
    """429 is retryable and succeeds on a later attempt."""
    client = CryptoRankClient(make_settings())
    client.session.get = Mock(
        side_effect=[
            make_response(429, {"message": "rate limit"}),
            make_response(200, {"data": [], "total": 0}),
        ]
    )

    payload = client._request_json("/ico/past", {"limit": 2, "offset": 0})

    assert payload == {"data": [], "total": 0}
    assert client.session.get.call_count == 2


def test_fetch_icos_empty_list() -> None:
    """Client returns an empty list when API has no records."""
    client = CryptoRankClient(make_settings())
    client.session.get = Mock(return_value=make_response(200, {"data": [], "total": 0}))

    assert client.fetch_icos("upcoming") == []


def test_request_json_raises_after_repeated_429() -> None:
    """Repeated 429 responses eventually surface a retryable error."""
    client = CryptoRankClient(make_settings())
    client.session.get = Mock(return_value=make_response(429, {"message": "rate limit"}))

    with pytest.raises(RetryableAPIError):
        client._request_json("/ico/past", {"limit": 2, "offset": 0})

