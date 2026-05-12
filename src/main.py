"""Command-line interface for downloading CryptoRank ICO lists."""

from __future__ import annotations

import argparse
import csv
import json
import logging
import sys
from pathlib import Path
from typing import Iterable, Literal

from pydantic import ValidationError

from src.api_client import CryptoRankAPIError, CryptoRankClient
from src.config import Settings
from src.models import ICOItem
from src.scraper import CryptoRankPageScraper


logger = logging.getLogger(__name__)


StatusArg = Literal["past", "upcoming", "all"]
OutputFormat = Literal["json", "csv", "both"]
Source = Literal["auto", "api", "scrape"]


def configure_logging(debug: bool = False) -> None:
    """Configure process-wide logging."""
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def build_parser() -> argparse.ArgumentParser:
    """Build CLI argument parser."""
    parser = argparse.ArgumentParser(
        description="Download past and upcoming ICO lists from CryptoRank API.",
    )
    parser.add_argument(
        "--status",
        choices=("past", "upcoming", "all"),
        default="all",
        help="ICO list to fetch.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Directory for output files. Overrides OUTPUT_DIR.",
    )
    parser.add_argument(
        "--format",
        choices=("json", "csv", "both"),
        default=None,
        help="Output format. Overrides FORMAT.",
    )
    parser.add_argument(
        "--source",
        choices=("auto", "api", "scrape"),
        default="auto",
        help="Data source: REST API, public page-data scraper, or API with scraper fallback.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging.",
    )
    return parser


def write_json(path: Path, items: Iterable[ICOItem]) -> None:
    """Write ICO items to UTF-8 JSON."""
    payload = [item.dict() for item in items]
    with path.open("w", encoding="utf-8") as file_obj:
        json.dump(payload, file_obj, ensure_ascii=False, indent=2)
        file_obj.write("\n")


def write_csv(path: Path, items: Iterable[ICOItem]) -> None:
    """Write ICO items to UTF-8 CSV."""
    rows = [item.dict() for item in items]
    fieldnames = list(ICOItem.__fields__.keys())
    with path.open("w", encoding="utf-8", newline="") as file_obj:
        writer = csv.DictWriter(file_obj, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            for key, value in row.items():
                if isinstance(value, (dict, list)):
                    row[key] = json.dumps(value, ensure_ascii=False)
            writer.writerow(row)


def save_items(
    output_dir: Path,
    status: Literal["past", "upcoming"],
    output_format: OutputFormat,
    items: list[ICOItem],
) -> None:
    """Persist fetched items to requested output formats."""
    output_dir.mkdir(parents=True, exist_ok=True)
    if output_format in ("json", "both"):
        json_path = output_dir / f"{status}_icos.json"
        write_json(json_path, items)
        logger.info("Saved %s items to %s", len(items), json_path)
    if output_format in ("csv", "both"):
        csv_path = output_dir / f"{status}_icos.csv"
        write_csv(csv_path, items)
        logger.info("Saved %s items to %s", len(items), csv_path)


def statuses_to_fetch(status: StatusArg) -> list[Literal["past", "upcoming"]]:
    """Expand CLI status argument."""
    if status == "all":
        return ["past", "upcoming"]
    return [status]


def run(argv: list[str] | None = None) -> int:
    """Run the CLI and return a process exit code."""
    parser = build_parser()
    args = parser.parse_args(argv)
    configure_logging(debug=args.debug)

    try:
        settings = Settings()
    except ValidationError as exc:
        logger.error("Invalid configuration: %s", exc)
        return 2

    output_dir = args.output_dir or settings.output_dir
    output_format = args.format or settings.output_format
    api_client = CryptoRankClient(settings)
    scraper = CryptoRankPageScraper(settings)

    try:
        for status in statuses_to_fetch(args.status):
            items = fetch_items(
                status=status,
                source=args.source,
                api_client=api_client,
                scraper=scraper,
            )
            save_items(output_dir, status, output_format, items)
    except CryptoRankAPIError as exc:
        logger.error("%s", exc)
        return 1
    except Exception:
        logger.exception("Unexpected failure")
        return 1

    return 0


def fetch_items(
    status: Literal["past", "upcoming"],
    source: Source,
    api_client: CryptoRankClient,
    scraper: CryptoRankPageScraper,
) -> list[ICOItem]:
    """Fetch items from selected source."""
    if source == "scrape":
        return scraper.fetch_icos(status)
    if source == "api":
        return api_client.fetch_icos(status)

    try:
        return api_client.fetch_icos(status)
    except CryptoRankAPIError as exc:
        logger.warning(
            "REST API source failed for %s ICOs: %s. Falling back to scraper.",
            status,
            exc,
        )
        return scraper.fetch_icos(status)


def main() -> None:
    """Entrypoint for `python -m src.main`."""
    sys.exit(run())


if __name__ == "__main__":
    main()
