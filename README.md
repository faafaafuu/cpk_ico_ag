# CryptoRank ICO CLI Agent

Production-ready CLI agent for downloading full `past` and `upcoming` ICO lists from CryptoRank API.

## Project Tree

```text
.
├── .env.example
├── README.md
├── requirements.txt
├── src
│   ├── __init__.py
│   ├── api_client.py
│   ├── config.py
│   ├── main.py
│   └── models.py
└── tests
    └── test_api_client.py
```

## Setup

1. Create a virtual environment:

```bash
python3 -m venv .venv
. .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Get a CryptoRank API key:

- Open https://cryptorank.io/public-api/dashboard
- Create or select an API plan.
- Generate an API key.
- Copy `.env.example` to `.env` and set `CRYPTORANK_API_KEY`.

The public dashboard currently documents `x-api-key: YOUR_KEY`. The CLI also supports bearer auth through `CRYPTORANK_AUTH_MODE=bearer` if your plan/docs require it. Official API docs are linked from https://api.cryptorank.io/v2/docs; the page is JavaScript-rendered, so endpoint and response parsing are intentionally configurable and tolerant.

## Run

Fetch both lists:

```bash
python -m src.main --status all
```

Fetch only past ICOs and save both JSON and CSV:

```bash
python -m src.main --status past --format both --output-dir data
```

Fetch upcoming ICOs with debug logs:

```bash
python -m src.main --status upcoming --debug
```

Run tests:

```bash
pytest
```

## Output Example

```json
[
  {
    "id": "123",
    "name": "Example Protocol",
    "symbol": "EXM",
    "start_date": "2026-01-15",
    "end_date": "2026-01-20",
    "status": "upcoming",
    "raised_amount": 2500000.0,
    "raised_currency": "USD",
    "category": "DeFi",
    "website": "https://example.org",
    "twitter": "https://x.com/example",
    "telegram": "https://t.me/example",
    "token_price": 0.05,
    "tokenomics": {
      "tokensForSale": "50000000",
      "allocationOfSupply": "5%"
    }
  }
]
```

