"""Pydantic models and response normalization helpers."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, root_validator, validator


logger = logging.getLogger(__name__)


def _first_present(data: Dict[str, Any], keys: tuple[str, ...]) -> Any:
    """Return the first non-empty value from a dict for a list of possible keys."""
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            return value
    return None


def _safe_float(value: Any) -> Optional[float]:
    """Convert a numeric-looking value to float, logging unexpected input."""
    if value in (None, ""):
        return None
    if isinstance(value, bool):
        logger.warning("Unexpected bool for numeric field: %r", value)
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.replace(",", "").replace("$", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            logger.warning("Unable to cast numeric field to float: %r", value)
            return None
    logger.warning("Unexpected type for numeric field %s: %r", type(value), value)
    return None


def _safe_str(value: Any) -> Optional[str]:
    """Convert scalar values to strings and drop unsupported structured values."""
    if value in (None, ""):
        return None
    if isinstance(value, (str, int, float)):
        return str(value)
    logger.warning("Unexpected type for string field %s: %r", type(value), value)
    return None


def _safe_date(value: Any) -> Optional[str]:
    """Normalize common API date formats to ISO-8601 strings when possible."""
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        timestamp = float(value)
        if timestamp > 10_000_000_000:
            timestamp /= 1000
        return datetime.fromtimestamp(timestamp, tz=timezone.utc).date().isoformat()
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        if cleaned.isdigit():
            return _safe_date(int(cleaned))
        return cleaned
    logger.warning("Unexpected type for date field %s: %r", type(value), value)
    return None


class ICOItem(BaseModel):
    """Normalized ICO/token sale item returned by CryptoRank."""

    id: Optional[str] = None
    name: Optional[str] = None
    symbol: Optional[str] = None
    image: Optional[str] = None
    cryptorank_url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    raised_amount: Optional[float] = None
    raised_currency: Optional[str] = None
    category: Optional[str] = None
    website: Optional[str] = None
    twitter: Optional[str] = None
    telegram: Optional[str] = None
    token_price: Optional[float] = None
    current_price: Optional[float] = None
    roi: Optional[float] = None
    ath_roi: Optional[float] = None
    investors: Optional[List[Dict[str, Any]]] = None
    launchpads: Optional[List[Dict[str, Any]]] = None
    tokenomics: Optional[Dict[str, Any]] = None

    @root_validator(pre=True)
    def normalize_api_payload(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Map known CryptoRank-style keys and common variants to one schema."""
        if not isinstance(values, dict):
            logger.warning("Unexpected ICO item payload type: %s", type(values))
            return {}

        links = values.get("links") if isinstance(values.get("links"), dict) else {}
        social = values.get("social") if isinstance(values.get("social"), dict) else {}
        identifier = _first_present(values, ("id", "key", "slug"))
        category = values.get("category")
        if isinstance(category, dict):
            category = _first_present(category, ("name", "key", "slug"))

        return {
            "id": identifier,
            "name": _first_present(values, ("name", "title")),
            "symbol": _first_present(values, ("symbol", "ticker")),
            "image": _first_present(values, ("image", "logo", "icon")),
            "cryptorank_url": _first_present(values, ("cryptorank_url", "url"))
            or (f"https://cryptorank.io/ico/{identifier}" if identifier else None),
            "start_date": _first_present(
                values,
                ("start_date", "startDate", "start", "dateStart", "when"),
            ),
            "end_date": _first_present(
                values,
                ("end_date", "endDate", "end", "dateEnd", "till"),
            ),
            "status": _first_present(values, ("status", "state")),
            "raised_amount": _first_present(
                values,
                ("raised_amount", "raisedAmount", "raise", "totalRaise"),
            ),
            "raised_currency": _first_present(
                values,
                ("raised_currency", "raisedCurrency", "currency"),
            ),
            "category": category or _first_present(values, ("categoryName", "sector")),
            "website": _first_present(values, ("website", "site")) or links.get("website"),
            "twitter": _first_present(values, ("twitter", "twitterUrl"))
            or links.get("twitter")
            or social.get("twitter"),
            "telegram": _first_present(values, ("telegram", "telegramUrl"))
            or links.get("telegram")
            or social.get("telegram"),
            "token_price": _first_present(
                values,
                ("token_price", "tokenPrice", "salePrice", "price", "priceUSD"),
            ),
            "current_price": _first_present(values, ("current_price", "currentPrice", "price")),
            "roi": _first_present(values, ("roi", "currentRoi")),
            "ath_roi": _first_present(values, ("ath_roi", "athRoi", "athROI")),
            "investors": _first_present(values, ("investors", "funds")),
            "launchpads": _first_present(values, ("launchpads", "platforms")),
            "tokenomics": _first_present(
                values,
                ("tokenomics", "tokenEconomics", "vesting", "tokenInfo"),
            ),
        }

    @validator(
        "id",
        "name",
        "symbol",
        "image",
        "cryptorank_url",
        "status",
        "raised_currency",
        "category",
        "website",
        "twitter",
        "telegram",
        pre=True,
    )
    def cast_optional_str(cls, value: Any) -> Optional[str]:
        """Safely cast scalar fields to string."""
        return _safe_str(value)

    @validator("raised_amount", "token_price", "current_price", "roi", "ath_roi", pre=True)
    def cast_optional_float(cls, value: Any) -> Optional[float]:
        """Safely cast numeric fields to float."""
        return _safe_float(value)

    @validator("start_date", "end_date", pre=True)
    def cast_optional_date(cls, value: Any) -> Optional[str]:
        """Safely normalize date fields."""
        return _safe_date(value)

    @validator("tokenomics", pre=True)
    def cast_tokenomics(cls, value: Any) -> Optional[Dict[str, Any]]:
        """Keep tokenomics as a dictionary when present."""
        if value in (None, ""):
            return None
        if isinstance(value, dict):
            return value
        logger.warning("Unexpected type for tokenomics field %s: %r", type(value), value)
        return None

    @validator("investors", "launchpads", pre=True)
    def cast_named_lists(cls, value: Any) -> Optional[List[Dict[str, Any]]]:
        """Keep investors and launchpads as lists of dictionaries."""
        if value in (None, ""):
            return None
        if not isinstance(value, list):
            logger.warning("Unexpected type for list field %s: %r", type(value), value)
            return None

        normalized: List[Dict[str, Any]] = []
        for item in value:
            if isinstance(item, dict):
                normalized.append(item)
            else:
                logger.warning("Unexpected list item type %s: %r", type(item), item)
        return normalized or None


class ICOResponse(BaseModel):
    """Normalized paginated response from CryptoRank."""

    items: List[ICOItem] = Field(default_factory=list)
    total: Optional[int] = None

    @root_validator(pre=True)
    def normalize_response(cls, values: Any) -> Dict[str, Any]:
        """Support common response shapes from REST APIs.

        Official docs are rendered at https://api.cryptorank.io/v2/docs and may
        change. This parser accepts `data`, `items`, `result.data`, and plain lists.
        """
        if isinstance(values, list):
            return {"items": values, "total": None}
        if not isinstance(values, dict):
            logger.warning("Unexpected API response type: %s", type(values))
            return {"items": [], "total": None}

        result = values.get("result")
        candidates = [
            values.get("data"),
            values.get("items"),
            values.get("rows"),
            values.get("list"),
        ]
        if isinstance(result, dict):
            candidates.extend(
                [
                    result.get("data"),
                    result.get("items"),
                    result.get("rows"),
                    result.get("list"),
                ]
            )
        elif isinstance(result, list):
            candidates.append(result)

        items = next((candidate for candidate in candidates if isinstance(candidate, list)), [])
        total = _first_present(values, ("total", "count", "totalCount"))
        if total is None and isinstance(result, dict):
            total = _first_present(result, ("total", "count", "totalCount"))

        return {"items": items, "total": total}

    @validator("total", pre=True)
    def cast_total(cls, value: Any) -> Optional[int]:
        """Safely cast total count."""
        if value in (None, ""):
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            logger.warning("Unable to cast total to int: %r", value)
            return None
