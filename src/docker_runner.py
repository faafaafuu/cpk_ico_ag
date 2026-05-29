"""Container runner with a static web server and daily data refresh."""

from __future__ import annotations

import logging
import os
import signal
import threading
import time
from datetime import datetime, timedelta
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from src.main import run as run_cli


logger = logging.getLogger(__name__)
stop_event = threading.Event()


class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Static file handler that prevents stale dashboard data in browsers."""

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def configure_logging() -> None:
    """Configure process-wide logging for the container process."""
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def env_bool(name: str, default: bool) -> bool:
    """Read a boolean environment value."""
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def parse_update_time(value: str) -> tuple[int, int]:
    """Parse HH:MM update time."""
    try:
        hour_text, minute_text = value.strip().split(":", 1)
        hour = int(hour_text)
        minute = int(minute_text)
    except ValueError as exc:
        raise ValueError(f"Invalid UPDATE_TIME={value!r}; expected HH:MM") from exc

    if not 0 <= hour <= 23 or not 0 <= minute <= 59:
        raise ValueError(f"Invalid UPDATE_TIME={value!r}; expected HH:MM")
    return hour, minute


def seconds_until_next_run(update_time: str) -> float:
    """Return seconds until the next scheduled local-time run."""
    hour, minute = parse_update_time(update_time)
    now = datetime.now()
    next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if next_run <= now:
        next_run += timedelta(days=1)
    return (next_run - now).total_seconds()


def refresh_data() -> int:
    """Run the CryptoRank fetcher with container environment defaults."""
    argv = [
        "--status",
        os.getenv("UPDATE_STATUS", "all"),
        "--format",
        os.getenv("FORMAT", "json"),
        "--source",
        os.getenv("UPDATE_SOURCE", "scrape"),
        "--output-dir",
        os.getenv("OUTPUT_DIR", "output"),
    ]
    if env_bool("DEBUG", False):
        argv.append("--debug")

    logger.info("Starting data refresh: python -m src.main %s", " ".join(argv))
    exit_code = run_cli(argv)
    if exit_code == 0:
        logger.info("Data refresh finished successfully")
    else:
        logger.error("Data refresh failed with exit code %s", exit_code)
    return exit_code


def scheduler_loop() -> None:
    """Refresh data on start and then once every day at UPDATE_TIME."""
    update_time = os.getenv("UPDATE_TIME", "06:00")

    if env_bool("RUN_ON_START", True):
        refresh_data()

    while not stop_event.is_set():
        wait_seconds = seconds_until_next_run(update_time)
        logger.info("Next data refresh scheduled in %.0f seconds at %s", wait_seconds, update_time)
        if stop_event.wait(wait_seconds):
            break
        refresh_data()


def handle_shutdown(signum: int, _frame: object) -> None:
    """Signal handler for graceful container shutdown."""
    logger.info("Received signal %s, shutting down", signum)
    stop_event.set()


def serve() -> None:
    """Serve the project directory so /frontend and /output are available."""
    host = os.getenv("HTTP_HOST", "0.0.0.0")
    port = int(os.getenv("HTTP_PORT", "8787"))
    root = Path(os.getenv("WEB_ROOT", ".")).resolve()
    handler = partial(NoCacheHTTPRequestHandler, directory=str(root))
    server = ThreadingHTTPServer((host, port), handler)
    server.timeout = 1

    logger.info("Serving %s on http://%s:%s", root, host, port)
    while not stop_event.is_set():
        server.handle_request()
    server.server_close()


def main() -> None:
    """Container entrypoint."""
    configure_logging()
    if hasattr(time, "tzset"):
        time.tzset()

    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    scheduler = threading.Thread(target=scheduler_loop, name="daily-refresh", daemon=True)
    scheduler.start()
    serve()
    scheduler.join(timeout=5)


if __name__ == "__main__":
    main()
