"""Eau de Deal: endringer gjort i appen (legg til vare, ønsket pris, slutt å følge).

Appen legger igjen en kommentar på handleliste-issuet. Ved hver prissjekk leses
kommentarene her, products.txt oppdateres, og kommentaren slettes.
Bare kommentarer fra eieren av repoet blir fulgt.

Her ligger også hent(), som henter sider litt roligere og prøver igjen hvis en
butikk svarer «for mange forespørsler» (HTTP 429).
"""
import json
import time
import urllib.error
import urllib.parse

MERKE = "Eau de Deal-kommando"


def key_for(url):
    return url.split("?")[0].split("#")[0].rstrip("/")


def _fmt(n):
    n = float(n)
    return str(int(n)) if n.is_integer() else f"{n:.2f}".rstrip("0")


def _target(v):
    try:
        v = float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return None
    return v if v > 0 else None


def _url_of(line):
    s = line.strip()
    if not s or s.startswith("#") or s.startswith("["):
        return None
    return s.split("|")[0].strip()


def _in_group(lines, i):
    j = i - 1
    while j >= 0 and lines[j].strip():
        if lines[j].strip().startswith("["):
            return True
        j -= 1
    return False


def _group_header(lines, name):
    for i, ln in enumerate(lines):
        s = ln.strip()
        if s.startswith("[") and s.endswith("]"):
            nm = s[1:-1].split("|")[0].strip()
            if nm.lower() == name.lower():
                return i, nm
    return None, None


def _single(lines, uid):
    for i, ln in enumerate(lines):
        u = _url_of(ln)
        if u and key_for(u) == uid and not _in_group(lines, i):
            return i, u
    return None, None


def apply(lines, cmd):
    """Endrer linjene i products.txt. Returnerer en beskrivelse, eller None."""
    kind = cmd.get("cmd")
    t = _target(cmd.get("target"))
    uid = str(cmd.get("id") or "")

    if kind == "add":
        url = str(cmd.get("url") or "").strip()
        if not url.startswith(("http://", "https://")) or " " in url:
            return None
        if any(_url_of(ln) and key_for(_url_of(ln)) == key_for(url) for ln in lines):
            return None
        while lines and not lines[-1].strip():
            lines.pop()
        i, need_blank = len(lines) - 1, False
        while i >= 0 and lines[i].strip():
            if lines[i].strip().startswith("["):
                need_blank = True
            i -= 1
        if need_blank:
            lines.append("")
        lines.append(url + (f" | {_fmt(t)}" if t else ""))
        lines.append("")
        return f"la til {url}"

    if kind == "target":
        if uid.startswith("g:"):
            i, nm = _group_header(lines, uid[2:])
            if i is None:
                return None
            lines[i] = f"[{nm}" + (f" | {_fmt(t)}" if t else "") + "]"
        else:
            i, u = _single(lines, uid)
            if i is None:
                return None
            lines[i] = u + (f" | {_fmt(t)}" if t else "")
        return f"ønsket pris for {uid}: {_fmt(t) if t else 'fjernet'}"

    if kind == "remove":
        if uid.startswith("g:"):
            i, nm = _group_header(lines, uid[2:])
            if i is None:
                return None
            j = i + 1
            while j < len(lines) and lines[j].strip():
                j += 1
            del lines[i:j]
        else:
            i, u = _single(lines, uid)
            if i is None:
                return None
            del lines[i]
        return f"sluttet å følge {uid}"
    return None


def run(gh, repo, issue_number, products_file):
    owner = repo.split("/")[0].lower()
    comments = gh("GET", f"/repos/{repo}/issues/{issue_number}/comments?per_page=100") or []
    with open(products_file, encoding="utf-8") as f:
        lines = f.read().split("\n")
    changed, done = False, []
    for c in comments:
        body = c.get("body") or ""
        if MERKE not in body or (c.get("user") or {}).get("login", "").lower() != owner:
            continue
        try:
            cmd = json.loads(body[body.index("{"): body.rindex("}") + 1])
            msg = apply(lines, cmd)
            if msg:
                changed = True
                print("APP   " + msg)
        except Exception as e:
            print(f"APP   hoppet over en kommando ({e})")
        done.append(c["id"])
    if changed:
        with open(products_file, "w", encoding="utf-8") as f:
            f.write("\n".join(lines).rstrip("\n") + "\n")
    for cid in done:
        try:
            gh("DELETE", f"/repos/{repo}/issues/comments/{cid}")
        except Exception as e:
            print(f"APP   klarte ikke å slette kommentar {cid} ({e})")
    return changed


def forbered(gh, repo, state, find_issue, read_products, products_file):
    """Tar inn endringer fra appen og returnerer produktlisten."""
    try:
        issue = find_issue(state)
        if issue:
            run(gh, repo, issue[0], products_file)
    except Exception as e:
        print(f"Kunne ikke lese endringer fra appen: {e}")
    return read_products()


_last = {}


def hent(fetch, url):
    """Henter en side med pause mellom besøk hos samme butikk, og prøver igjen ved 429/503."""
    host = urllib.parse.urlsplit(url).netloc
    wait = 3 - (time.time() - _last.get(host, 0))
    if wait > 0:
        time.sleep(wait)
    for forsok in range(3):
        _last[host] = time.time()
        try:
            return fetch(url)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and forsok < 2:
                ra = (e.headers or {}).get("Retry-After") or ""
                pause = min(60, int(ra)) if ra.isdigit() else 20 * (forsok + 1)
                print(f"VENT  {host} svarte {e.code}, prøver igjen om {pause} s")
                time.sleep(pause)
                continue
            raise
