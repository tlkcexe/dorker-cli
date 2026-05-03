# Dorker-CLI

A Google dork query generator for ethical reconnaissance. Given a target domain or keyword, it generates **ready-to-use Google search URLs** across 10 attack surface categories — exposed files, login panels, sensitive credentials, subdomains, open directories, vulnerability indicators, emails, cameras, social presence, and technology stack.

> This tool **generates queries only** — it does not automate scraping or send any requests. All searches are performed manually through your browser.

## Features

- **10 Dork Categories:** 90+ hand-crafted dork templates covering the full reconnaissance surface.
- **Ready-to-Use URLs:** Every dork comes with a pre-built Google search URL — click or paste and go.
- **Category Filtering:** Focus on a single attack surface with `--category`.
- **Export to File:** Save all generated dorks and URLs to a `.txt` file with `--out`.
- **Limit Control:** Limit results per category with `--limit` for a focused output.
- **Zero Dependencies:** Only `chalk` is installed. No API keys, no network requests.
- **Clean CLI UI:** Color-coded output using `chalk`, organized by category.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)

## Installation

```bash
git clone https://github.com/yourusername/dorker-cli.git
cd dorker-cli
npm install
```

## Usage

```bash
node dorker-cli.js <target> [options]
```

## Options

| Flag | Description |
|---|---|
| `--category <name>` | Show dorks for one category only |
| `--limit <n>` | Max dorks per category |
| `--out <file>` | Export all dorks + URLs to a file |
| `--list-categories` | Print all available category names |

## Examples

**Full recon on a domain:**
```bash
node dorker-cli.js example.com
```

**Only login panels:**
```bash
node dorker-cli.js example.com --category login
```

**Sensitive files, top 5 dorks:**
```bash
node dorker-cli.js example.com --category sensitive --limit 5
```

**Export everything to a file:**
```bash
node dorker-cli.js example.com --out recon_example.txt
```

**List all categories:**
```bash
node dorker-cli.js --list-categories
```

## Categories

| Key | Label | Dorks |
|---|---|---|
| `files` | Exposed Files | 12 |
| `login` | Login & Admin Panels | 12 |
| `sensitive` | Sensitive Data & Credentials | 14 |
| `subdomains` | Subdomains & Endpoints | 9 |
| `directories` | Open Directories | 8 |
| `vulns` | Vulnerability Indicators | 12 |
| `emails` | Email Addresses | 6 |
| `cameras` | Cameras & Live Feeds | 6 |
| `social` | Social & People | 8 |
| `tech` | Technology Stack | 9 |

## Example Output

```
  [*] Target  » example.com
  [i] Categories: files, login, sensitive, ...
  ──────────────────────────────────────────────────────────────────

  [EXPOSED FILES]  (12 dorks)

  ┌ site:example.com filetype:pdf
  └ https://www.google.com/search?q=site%3Aexample.com+filetype%3Apdf

  ┌ site:example.com filetype:sql
  └ https://www.google.com/search?q=site%3Aexample.com+filetype%3Asql

  ...

  [*] Total dorks generated: 96
  [i] Tip: Paste any Google URL into your browser to run the dork.
```

## Google Dork Operators Reference

| Operator | What it does |
|---|---|
| `site:` | Restrict results to a specific domain |
| `inurl:` | Search within the URL |
| `intitle:` | Search within the page title |
| `filetype:` | Filter by file extension |
| `intext:` | Search within page body text |
| `ext:` | Alternative to `filetype:` |

## Tech Stack

- **Node.js:** Core runtime environment.
- **chalk:** Terminal string styling.

## Disclaimer

This tool is intended for **educational purposes** and **authorized security research** only (bug bounties, penetration testing with written permission, CTFs, self-assessment). Google dorking against targets you do not own or have explicit permission to test may violate the Computer Fraud and Abuse Act (CFAA) or equivalent laws in your country. Always obtain proper authorization before conducting reconnaissance on any external target.
