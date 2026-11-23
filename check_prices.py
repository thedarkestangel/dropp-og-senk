#!/usr/bin/env python3
"""Dropp & Senk: sjekker priser på produktsider og sender push-varsel til iPhone via ntfy.

- products.txt: hva som skal følges (enkeltlenker eller produktgrupper på tvers av butikker)
- prices.json: prishistorikk
- GitHub-issuet «Dropp & Senk – handleliste»: avkrysningsliste. Huk av et produkt når du har
  kjøpt det, så slutter overvåkningen. Fjern haken for å starte igjen.
Bruker kun Pythons standardbibliotek.
"""
import html as htmlmod
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_FILE = os.path.join(ROOT, "products.txt")
STATE_FILE = os.path.join(ROOT, "prices.json")
APP_DATA_FILE = os.path.join(ROOT, "docs", "data.json")
NTFY_SERVER = os.environ.get("NTFY_SERVER", "https://ntfy.sh").rstrip("/")
NTFY_TOPIC = os.environ.get("NTFY_TOPIC", "").strip()
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPOSITORY = os.environ.get("GITHUB_REPOSITORY", "")
ISSUE_TITLE = "Dropp & Senk – handleliste"
ERROR_ALERT_AFTER = 3  # varsle om feil etter så mange mislykte sjekker på rad

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")


# ---------- Lesing av pris ----------

def parse_number(raw):
    if raw is None:
        return None
    s = str(raw).replace(" ", " ").strip()
    s = re.sub(r",-$|-$", "", s)
    s = re.sub(r"[^\d.,]", "", s)
    if not s:
        return None
    lc, ld = s.rfind(","), s.rfind(".")
    if lc > -1 and ld > -1:
        s = s.replace(".", "").replace(",", ".") if lc > ld else s.replace(",", "")
    elif lc > -1:
        s = s.replace(",", "") if len(s) - lc - 1 == 3 else s.replace(",", ".")
    elif ld > -1 and len(s) - ld - 1 == 3 and len(s) > 4:
        s = s.replace(".", "")
    try:
        n = float(s)
    except ValueError:
        return None
    return n if n > 0 else None


def _walk_offers(node, depth=0):
    if depth > 8 or node is None:
        return None
    if isinstance(node, list):
        for n in node:
            p = _walk_offers(n, depth + 1)
            if p:
                return p
        return None
    if not isinstance(node, dict):
        return None
    t = node.get("@type", "")
    t = ",".join(t) if isinstance(t, list) else str(t)
    if "Offer" in t or "price" in node or "lowPrice" in node:
        spec = node.get("priceSpecification") or {}
        if isinstance(spec, list):
            spec = spec[0] if spec else {}
        p = parse_number(node.get("price") or node.get("lowPrice") or spec.get("price"))
        if p:
            return p
    for key in ("offers", "@graph", "hasVariant", "mainEntity"):
        if key in node:
            p = _walk_offers(node[key], depth + 1)
            if p:
                return p
    return None


def _walk_name(node, depth=0):
    if depth > 6 or node is None:
        return None
    if isinstance(node, list):
        for n in node:
            r = _walk_name(n, depth + 1)
            if r:
                return r
        return None
    if isinstance(node, dict):
        t = node.get("@type", "")
        t = ",".join(t) if isinstance(t, list) else str(t)
        if "Product" in t and node.get("name"):
            return str(node["name"])
        for key in ("@graph", "mainEntity"):
            if key in node:
                r = _walk_name(node[key], depth + 1)
                if r:
                    return r
    return None


def extract(page):
    """Returnerer (pris, metode, navn)."""
    name = None
    for m in re.finditer(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', page, re.S | re.I):
        try:
            data = json.loads(m.group(1).strip())
        except Exception:
            continue
        name = name or _walk_name(data)
        p = _walk_offers(data)
        if p:
            return p, "json-ld", name

    if not name:
        m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)', page, re.I) \
            or re.search(r"<title[^>]*>(.*?)</title>", page, re.S | re.I)
        if m:
            name = htmlmod.unescape(m.group(1)).strip()

    for rx in (
        r'<meta[^>]+(?:property|name)=["\'](?:product:price:amount|og:price:amount)["\'][^>]+content=["\']([^"\']+)',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:product:price:amount|og:price:amount)["\']',
        r'itemprop=["\']price["\'][^>]*content=["\']([^"\']+)',
        r'content=["\']([^"\']+)["\'][^>]*itemprop=["\']price["\']',
    ):
        m = re.search(rx, page, re.I)
        if m and parse_number(m.group(1)):
            return parse_number(m.group(1)), "meta", name

    text = htmlmod.unescape(re.sub(r"<script.*?</script>|<style.*?</style>", " ", page, flags=re.S | re.I))
    text = re.sub(r"<[^>]+>", " ", text)
    m = re.search(r"(?:kr\.?|NOK)\s*(\d[\d\s.]*(?:,\d{2})?)|(\d[\d\s.]*(?:,\d{2})?)\s*(?:kr\b|NOK|,-)", text, re.I)
    if m:
        p = parse_number(m.group(1) or m.group(2))
        if p:
            return p, "tekst", name
    return None, None, name


def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "nb-NO,nb;q=0.9,no;q=0.8,en;q=0.5",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        charset = r.headers.get_content_charset() or "utf-8"
        return r.read().decode(charset, errors="replace")


# ---------- Varsler ----------

ISSUE_URL = None  # settes når handlelisten er funnet


def notify(title, message, url=None, tags="moneybag", priority="default"):
    if not NTFY_TOPIC:
        print(f"[varsel uten NTFY_TOPIC] {title}: {message}")
        return
    headers = {"Title": title.encode("utf-8"), "Tags": tags, "Priority": priority}
    if url:
        headers["Click"] = url
    actions = []
    if url:
        actions.append(f"view, Åpne butikk, {url}")
    if ISSUE_URL:
        actions.append(f"view, Handleliste, {ISSUE_URL}")
    if actions:
        headers["Actions"] = "; ".join(actions).encode("utf-8")
    req = urllib.request.Request(f"{NTFY_SERVER}/{NTFY_TOPIC}", data=message.encode("utf-8"),
                                 headers=headers, method="POST")
    try:
        urllib.request.urlopen(req, timeout=20).read()
    except Exception as e:
        print(f"Klarte ikke å sende varsel: {e}", file=sys.stderr)


def kr(n):
    s = f"{n:,.2f}".replace(",", " ").replace(".", ",")
    return (s[:-3] if s.endswith(",00") else s) + " kr"


def drop_message(old, new):
    diff = old - new
    pct = f"{diff / old * 100:.1f}".replace(".", ",")
    return f"{kr(old)} → {kr(new)}  (−{kr(diff)}, −{pct} %)"


# ---------- Handleliste (GitHub-issue med avkrysning) ----------

def gh(method, path, body=None):
    req = urllib.request.Request(
        f"https://api.github.com{path}", method=method,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers={"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json",
                 "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json",
                 "User-Agent": "prisvakt"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8") or "null")


def find_or_create_issue(state):
    """Returnerer (nummer, body, html_url) eller None hvis GitHub ikke er tilgjengelig."""
    if not (GITHUB_TOKEN and GITHUB_REPOSITORY):
        return None
    repo = GITHUB_REPOSITORY
    num = state.get("_issue")
    if num:
        try:
            it = gh("GET", f"/repos/{repo}/issues/{num}")
            if it and it.get("state") == "open":
                return it["number"], it.get("body") or "", it["html_url"]
        except Exception:
            pass
    for it in gh("GET", f"/repos/{repo}/issues?state=open&per_page=100") or []:
        if it.get("title") == ISSUE_TITLE and "pull_request" not in it:
            state["_issue"] = it["number"]
            return it["number"], it.get("body") or "", it["html_url"]
    it = gh("POST", f"/repos/{repo}/issues", {"title": ISSUE_TITLE, "body": "Oppretter liste …"})
    state["_issue"] = it["number"]
    return it["number"], it.get("body") or "", it["html_url"]


CHECK_RE = re.compile(r"^\s*[-*]\s*\[([ xX])\].*?<!--\s*id:(.+?)\s*-->", re.M)


def checked_ids(body):
    return {m.group(2).strip() for m in CHECK_RE.finditer(body or "") if m.group(1).lower() == "x"}


def known_ids(body):
    return {m.group(2).strip() for m in CHECK_RE.finditer(body or "")}


def render_issue(units, state, bought):
    tz = ZoneInfo("Europe/Oslo")
    lines = ["Huk av det du har **kjøpt**, så slutter Dropp & Senk å overvåke det. "
             "Fjern haken for å starte igjen. Listen oppdateres ved hver prissjekk.", ""]
    active, done = [], []
    for u in units:
        uid = u["id"]
        info = state.get("_status", {}).get(uid, {})
        name = info.get("name") or u["label"]
        if uid in bought:
            done.append(f"- [x] ~~{name}~~ <!-- id:{uid} -->")
            continue
        parts = []
        if info.get("price") is not None:
            p = kr(info["price"])
            parts.append(f"**{p}** hos {info['store']}" if u["group"] else f"**{p}**")
        else:
            parts.append("pris ikke lest ennå")
        if info.get("lowest") is not None and info.get("price") is not None and info["lowest"] < info["price"]:
            parts.append(f"laveste {kr(info['lowest'])}")
        if info.get("target"):
            parts.append(f"mål {kr(info['target'])}")
        link = f" · [åpne]({info['url']})" if info.get("url") else ""
        active.append(f"- [ ] {name} — {' · '.join(parts)}{link} <!-- id:{uid} -->")
    lines += active or ["_Ingenting overvåkes nå._"]
    if done:
        lines += ["", "### Kjøpt", *done]
    lines += ["", f"_Sist sjekket {datetime.now(tz).strftime('%d.%m.%Y kl. %H:%M')}_"]
    return "\n".join(lines)


# ---------- Produktliste ----------

def read_products():
    """Leser products.txt og returnerer en liste med «enheter» som overvåkes.

    Enkeltlenke:   URL              eller  URL | ønsket pris
    Produktgruppe: [Produktnavn]    eller  [Produktnavn | ønsket pris]
                   etterfulgt av én lenke per butikk/variant. Gruppen varer til en tom
                   linje eller en ny [gruppe]. Du varsles om billigste pris i gruppen.
    """
    units, cur = [], None
    with open(PRODUCTS_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                cur = None
                continue
            if line.startswith("#"):
                continue
            m = re.match(r"^\[(.+)\]$", line)
            if m:
                parts = [p.strip() for p in m.group(1).split("|")]
                cur = {"id": "g:" + parts[0].lower(), "label": parts[0], "group": parts[0],
                       "target": parse_number(parts[1]) if len(parts) > 1 else None, "urls": []}
                units.append(cur)
                continue
            parts = [p.strip() for p in line.split("|")]
            if cur:
                cur["urls"].append(parts[0])
            else:
                url = parts[0]
                slug = key_for(url).rstrip("/").split("/")[-1].replace("-", " ")
                units.append({"id": key_for(url), "label": slug.capitalize(), "group": None,
                              "target": parse_number(parts[1]) if len(parts) > 1 else None, "urls": [url]})
    return units


def key_for(url):
    # Samme produkt selv om søkeparametere (?sq=..., utm_...) varierer
    return url.split("?")[0].split("#")[0].rstrip("/")


def store_of(url):
    return re.sub(r"^www\.", "", url.split("/")[2]) if "//" in url else url


def clean_name(name):
    return re.sub(r"\s*[|–-]\s*[^|–-]*(?:megastore|elkjøp|elkjop|kjell|google store|\.no|\.com)[^|–-]*$",
                  "", name, flags=re.I).strip()


# ---------- Hovedløkke ----------

def check_url(url, state, label_for_errors):
    """Henter én side. Returnerer (pris, navn) eller (None, None) ved feil."""
    k = key_for(url)
    entry = state.setdefault(k, {"url": url, "name": None, "history": [], "errors": 0, "lowest": None})
    try:
        price, method, name = extract(fetch(url))
        if name:
            entry["name"] = clean_name(name)
        if price is None:
            raise RuntimeError("fant ingen pris på siden")
    except Exception as e:
        entry["errors"] = entry.get("errors", 0) + 1
        print(f"FEIL  {url}: {e}")
        if entry["errors"] == ERROR_ALERT_AFTER:
            notify("Dropp & Senk: får ikke lest pris", f"{label_for_errors}\n{store_of(url)}: {e}",
                   url=url, tags="warning")
        return None, None
    entry["errors"] = 0
    hist = entry["history"]
    if not hist or hist[-1]["price"] != price:
        hist.append({"t": datetime.now(timezone.utc).isoformat(timespec="seconds"), "price": price})
    entry["lowest"] = price if entry.get("lowest") is None else min(entry["lowest"], price)
    print(f"OK    {store_of(url)}: {kr(price)} ({method}) – {entry['name'] or ''}")
    return price, entry["name"]


def main():
    global ISSUE_URL
    state = {}
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, encoding="utf-8") as f:
            state = json.load(f)
    first_run = not any(not k.startswith("_") for k in state)
    status = state.setdefault("_status", {})
    units = read_products()

    issue = None
    try:
        issue = find_or_create_issue(state)
    except Exception as e:
        print(f"Handlelisten er ikke tilgjengelig ({e}). Fortsetter uten.", file=sys.stderr)
    bought = checked_ids(issue[1]) if issue else set()
    if issue:
        ISSUE_URL = issue[2]

    summary = []
    for u in units:
        uid = u["id"]
        if uid in bought:
            print(f"KJØPT {u['label']} – hoppes over")
            continue
        offers = []
        for url in u["urls"]:
            price, name = check_url(url, state, u["group"] or u["label"])
            if price is not None:
                offers.append((price, url, name or ""))
        if not offers:
            continue

        best_price, best_url, best_name = min(offers)
        store = store_of(best_url)
        st = status.setdefault(uid, {"price": None, "store": None, "lowest": None})
        prev, prev_store, lowest = st.get("price"), st.get("store"), st.get("lowest")
        display = u["group"] or best_name or u["label"]
        st.update(name=display, url=best_url, target=u["target"])
        summary.append(f"{display}: {kr(best_price)}" + (f" hos {store}" if u["group"] else ""))

        if prev is not None and best_price < prev:
            is_low = lowest is None or best_price < lowest
            msg = ""
            if u["group"]:
                msg = f"Billigst nå hos {store}" + (f"\n{best_name}" if best_name else "") + "\n"
            msg += drop_message(prev, best_price)
            if u["group"] and prev_store and prev_store != store:
                msg += f"\n(før billigst hos {prev_store})"
            if is_low:
                msg += "\nLaveste pris så langt!"
            notify(f"Prisfall: {display}", msg, url=best_url, tags="chart_with_downwards_trend",
                   priority="high" if is_low else "default")
        t = u["target"]
        if t and best_price <= t and (prev is None or prev > t):
            notify(f"Ønsket pris nådd: {display}",
                   f"{kr(best_price)}" + (f" hos {store}" if u["group"] else "") + f" (målet var {kr(t)})",
                   url=best_url, tags="tada", priority="high")
        st.update(price=best_price, store=store,
                  lowest=best_price if lowest is None else min(lowest, best_price))
        st["offers"] = [{"price": p, "url": url_, "store": store_of(url_), "name": n} for p, url_, n in sorted(offers)]
        h = st.setdefault("history", [])
        if not h or h[-1]["price"] != best_price or h[-1].get("store") != store:
            h.append({"t": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                      "price": best_price, "store": store})

    # Oppdater handlelisten. Les den på nytt rett før lagring, så haker du satte
    # mens sjekken kjørte ikke blir overskrevet.
    if issue:
        try:
            fresh = gh("GET", f"/repos/{GITHUB_REPOSITORY}/issues/{issue[0]}")
            fresh_body = fresh.get("body") or ""
            bought = checked_ids(fresh_body) | (bought - known_ids(fresh_body))
            gh("PATCH", f"/repos/{GITHUB_REPOSITORY}/issues/{issue[0]}",
               {"body": render_issue(units, state, bought)})
        except Exception as e:
            print(f"Klarte ikke å oppdatere handlelisten: {e}", file=sys.stderr)

    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    write_app_data(units, state, bought, issue)

    if first_run and summary:
        notify("Dropp & Senk er i gang", "Følger nå:\n" + "\n".join(summary), tags="white_check_mark")


def write_app_data(units, state, bought, issue):
    """Lager docs/data.json som appen leser."""
    products = []
    for u in units:
        st = state.get("_status", {}).get(u["id"], {})
        hist = st.get("history", [])
        prices = [x["price"] for x in hist]
        products.append({
            "id": u["id"],
            "name": st.get("name") or u["label"],
            "group": bool(u["group"]),
            "target": u["target"],
            "price": st.get("price"),
            "store": st.get("store"),
            "url": st.get("url") or (u["urls"][0] if u["urls"] else None),
            "lowest": min(prices) if prices else None,
            "highest": max(prices) if prices else None,
            "first": prices[0] if prices else None,
            "history": hist,
            "offers": st.get("offers", []),
            "bought": u["id"] in bought,
        })
    data = {
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "repo": GITHUB_REPOSITORY or None,
        "issue": {"number": issue[0], "url": issue[2]} if issue else None,
        "products": products,
    }
    os.makedirs(os.path.dirname(APP_DATA_FILE), exist_ok=True)
    with open(APP_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()

