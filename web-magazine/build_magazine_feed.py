#!/usr/bin/env python3
import json, urllib.request, xml.etree.ElementTree as ET, re, html
from datetime import datetime

FEEDS = [
    ("DONNA & SESSO", "The Guardian · Sex", "https://www.theguardian.com/lifeandstyle/sex/rss"),
    ("DONNA & SESSO", "Cosmopolitan · Sex & Love", "https://www.cosmopolitan.com/rss/all.xml/"),
    ("DONNA & SESSO", "Marie Claire · Eros & Coppia", "https://www.marieclaire.it/rss/sesso-e-eros.xml"),
    ("DONNA & SESSO", "GQ Italia · Relazioni", "https://www.gqitalia.it/feed/rss"),
    ("DONNA & SESSO", "Vice · Sex & Culture", "https://www.vice.com/en/rss/topic/sex"),
    ("LESBO", "Autostraddle · Queer & Lesbian", "https://www.autostraddle.com/feed/"),
    ("LESBO", "GO Magazine · Lesbian Culture", "https://gomag.com/feed/"),
    ("GAY", "Gay.it · Cultura & Attualità", "https://www.gay.it/feed"),
    ("GAY", "PinkNews · LGBTQ+ News", "https://www.thepinknews.com/feed/"),
    ("GAY", "Advocate · Queer Voices", "https://www.advocate.com/feeds/feed.rss"),
    ("TRANS", "INTO · Trans & Queer Culture", "https://www.intomore.com/feed/"),
    ("TRANS", "Them · Trans & Gender", "https://www.them.us/feed/rss"),
    ("PORNO MISTO", "Il Post · Cultura & Media", "https://www.ilpost.it/feed/"),
    ("PORNO MISTO", "XBIZ · Adult Industry News", "https://www.xbiz.com/rss/news.xml"),
    ("PORNO MISTO", "AVN · Adult Entertainment", "https://avn.com/rss/news.xml")
]

def clean_txt(raw):
    if not raw:
        return ""
    txt = re.sub(r"<[^>]+>", " ", html.unescape(raw))
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt[:340] + ("..." if len(txt) > 340 else "")

base_path = "/var/www/velvet-magazine/articles.json"
existing = []
try:
    existing = json.load(open(base_path, encoding="utf-8"))
except Exception:
    existing = []

# Conserva gli editoriali curati originali
curated = [a for a in existing if not a.get("isLiveFeed")]
live_items = []
seen_urls = {a.get("sourceUrl") for a in curated}

for cat, src_name, feed_url in FEEDS:
    try:
        req = urllib.request.Request(feed_url, headers={"User-Agent": "OurVelvetMagazineBot/2.0"})
        with urllib.request.urlopen(req, timeout=7) as resp:
            xml_data = resp.read()
        root = ET.fromstring(xml_data)
        items = root.findall(".//item")[:4]
        if not items:
            items = root.findall(".//{http://www.w3.org/2005/Atom}entry")[:4]

        for idx, it in enumerate(items):
            title_el = it.find("title") or it.find("{http://www.w3.org/2005/Atom}title")
            link_el = it.find("link") or it.find("{http://www.w3.org/2005/Atom}link")
            desc_el = it.find("description") or it.find("{http://www.w3.org/2005/Atom}summary")
            date_el = it.find("pubDate") or it.find("{http://www.w3.org/2005/Atom}updated")

            title = clean_txt(title_el.text if title_el is not None else "")
            link = ""
            if link_el is not None:
                link = link_el.attrib.get("href") or (link_el.text or "").strip()
            desc = clean_txt(desc_el.text if desc_el is not None else "")
            pub = (date_el.text[:16] if (date_el is not None and date_el.text) else datetime.now().strftime("%d %b %Y"))

            if not title or not link or link in seen_urls:
                continue
            seen_urls.add(link)

            art_id = f"live-{abs(hash(link))}"
            live_items.append({
                "id": art_id,
                "isLiveFeed": True,
                "category": cat,
                "badge": "RASSEGNA INTERNAZIONALE",
                "title": title,
                "subtitle": desc or f"Approfondimento selezionato dalla redazione Our Velvet da {src_name}.",
                "sourceName": src_name,
                "sourceDate": pub,
                "sourceUrl": link,
                "readTime": "3 min",
                "editorial": [
                    desc or f"Questo servizio pubblicato da {src_name} affronta un tema centrale per la cultura adulta contemporanea, il desiderio consapevole e le dinamiche relazionali senza tabù.",
                    f"La redazione di Our Velvet Magazine seleziona quotidianamente le testate internazionali più autorevoli — da The Guardian e Cosmopolitan fino alle riviste queer, trans e di settore — per offrire ai membri del club una rassegna completa, elegante e diretta alla fonte originale."
                ]
            })
    except Exception:
        continue

merged = curated + live_items
json.dump(merged, open(base_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"OK: Rivista aggiornata ({len(curated)} editoriali + {len(live_items)} articoli da {len(FEEDS)} testate).")
