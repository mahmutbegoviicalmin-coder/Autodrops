import asyncio, re, urllib.parse, os
from pathlib import Path
from markdownify import markdownify as md

from playwright.async_api import async_playwright

BASE_URL = "https://openservice.aliexpress.com/doc/api.htm"
OUTPUT = Path("aliexpress_affiliate_api_docs.md")

# Ako želiš samo određene kategorije, upiši ID-eve ovdje (npr. ["20904"])
FILTER_CIDS = None  # ili lista stringova: ["20904"]

# Glavni selektori – generički:
SIDEBAR_LINK_SELECTOR = 'a[href^="#/api"]'
# Pokuša pronaći glavni sadržaj u ovim kandidatima, redom:
CONTENT_ROOT_SELECTORS = [
    "article", "main", ".content", ".doc-content", ".markdown-body", ".container", "body"
]

# Pomoćne funkcije
def to_markdown_table(page, selector="table"):
    tables = page.query_selector_all(selector)
    sections = []
    for t in tables:
        # zaglavljа
        headers = [th.inner_text().strip() for th in t.query_selector_all("thead th")]
        if not headers:
            headers = [th.inner_text().strip() for th in t.query_selector_all("tr th")]

        rows = []
        for tr in t.query_selector_all("tr"):
            cells = [td.inner_text().strip() for td in tr.query_selector_all("td,th")]
            if cells: rows.append(cells)
        if not rows: 
            continue

        # ako je prva vrsta identična zaglavljima, izbaci je
        if headers and rows and rows[0] == headers:
            rows = rows[1:]

        out = []
        if headers:
            out.append("| " + " | ".join(headers) + " |")
            out.append("| " + " | ".join(["---"]*len(headers)) + " |")
        for r in rows:
            out.append("| " + " | ".join(r) + " |")
        sections.append("\n".join(out))
    return "\n\n".join(sections)

def find_main_html(page):
    for sel in CONTENT_ROOT_SELECTORS:
        el = page.query_selector(sel)
        if el:
            return el.inner_html()
    return page.content()

def extract_http_blocks(page):
    blocks = []
    # code/pre blokovi
    for el in page.query_selector_all("pre, code"):
        txt = el.inner_text().strip()
        if re.search(r"\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b\s+/", txt) or txt.startswith("curl "):
            blocks.append(f"```text\n{txt}\n```")
    return "\n\n".join(blocks)

async def scrape():
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "0"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(locale="en-US")
        page = await ctx.new_page()

        print("Opening docs…")
        await page.goto(BASE_URL, wait_until="domcontentloaded")
        # SPA često treba još koji trenutak
        await page.wait_for_timeout(1500)

        # Skupi sve linkove iz sidebar-a / stranice
        links = await page.eval_on_selector_all(
            SIDEBAR_LINK_SELECTOR,
            "els => els.map(e => e.getAttribute('href'))"
        )
        links = list(dict.fromkeys(links))  # uniq, preserve order

        # Filtriraj po cid (ako zadato)
        filtered = []
        for h in links:
            # href: "#/api?cid=20904&path=aliexpress.product....&methodType=GET/POST"
            if not h.startswith("#/api"):
                continue
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(h).query)
            cid = qs.get("cid", [""])[0]
            if FILTER_CIDS and cid not in FILTER_CIDS:
                continue
            filtered.append(h)

        if not filtered:
            print("Nisam našao API linkove. Možda treba prilagoditi SIDEBAR_LINK_SELECTOR.")
            await browser.close()
            return

        sections = []
        total = len(filtered)
        print(f"Found {total} API pages…")

        for i, h in enumerate(filtered, 1):
            url = f"{BASE_URL}{h}"
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(600)  # kratko da se content renderuje

            # Izvuci meta iz URL-a
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(h).query)
            cid = qs.get("cid", [""])[0]
            path = qs.get("path", [""])[0]
            method_type = qs.get("methodType", [""])[0]

            # Naslov (prvi h1/h2)
            title = await page.eval_on_selector(
                "h1, h2", "el => el ? el.innerText.trim() : null"
            )
            if not title:
                title = path or h

            # Markdown od glavnog sadržaja
            html = find_main_html(page)
            content_md = md(html, strip=["script","style"])

            # Tabele → markdown
            tables_md = to_markdown_table(page)

            # HTTP/code blokovi
            code_md = extract_http_blocks(page)

            # Sastavi sekciju
            sec = []
            sec.append(f"# {title}")
            sec.append(f"- **Category ID (cid):** `{cid}`")
            sec.append(f"- **Path:** `{path}`")
            sec.append(f"- **Method(s):** `{method_type}`")
            sec.append(f"- **Source:** {url}\n")

            if code_md:
                sec.append("## Code / HTTP blocks\n" + code_md)
            if tables_md:
                sec.append("## Tables\n" + tables_md)

            sec.append("## Page Content\n" + content_md)

            sections.append("\n\n".join(sec))
            print(f"[{i}/{total}] {title}")

        OUTPUT.write_text("\n\n---\n\n".join(sections), encoding="utf-8")
        print(f"\nDone → {OUTPUT.resolve()}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape())
