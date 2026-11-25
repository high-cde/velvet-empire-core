#!/usr/bin/env python3
import json, urllib.request, xml.etree.ElementTree as ET, re, html
from datetime import datetime

FEEDS = [
    # DONNA & SESSO
    ("DONNA & SESSO", "The Guardian · Sex", "https://www.theguardian.com/lifeandstyle/sex/rss"),
    ("DONNA & SESSO", "Cosmopolitan · Sex & Love", "https://www.cosmopolitan.com/rss/all.xml/"),
    ("DONNA & SESSO", "Marie Claire · Eros & Coppia", "https://www.marieclaire.it/rss/sesso-e-eros.xml"),
    ("DONNA & SESSO", "GQ Italia · Relazioni", "https://www.gqitalia.it/feed/rss"),
    ("DONNA & SESSO", "Vice · Sex & Culture", "https://www.vice.com/en/rss/topic/sex"),
    ("DONNA & SESSO", "Elle · Love & Desire", "https://www.elle.com/rss/all.xml/"),
    ("DONNA & SESSO", "Allure · Intimacy & Body", "https://www.allure.com/feed/rss"),
    # LESBO
    ("LESBO", "Autostraddle · Queer & Lesbian", "https://www.autostraddle.com/feed/"),
    ("LESBO", "GO Magazine · Lesbian Culture", "https://gomag.com/feed/"),
    ("LESBO", "DIVA Magazine · Lesbian & Bi", "https://diva-magazine.com/feed/"),
    ("LESBO", "AfterEllen · Women & Queer", "https://afterellen.com/feed/"),
    # GAY
    ("GAY", "Gay.it · Cultura & Attualità", "https://www.gay.it/feed"),
    ("GAY", "PinkNews · LGBTQ+ News", "https://www.thepinknews.com/feed/"),
    ("GAY", "Advocate · Queer Voices", "https://www.advocate.com/feeds/feed.rss"),
    ("GAY", "Out Magazine · Culture & Nightlife", "https://www.out.com/feeds/feed.rss"),
    # TRANS
    ("TRANS", "INTO · Trans & Queer Culture", "https://www.intomore.com/feed/"),
    ("TRANS", "Them · Trans & Gender", "https://www.them.us/feed/rss"),
    ("TRANS", "TransAdvocate · Voices & News", "https://www.transadvocate.com/feed"),
    # PORNO MISTO & INDUSTRIA 18+
    ("PORNO MISTO", "XBIZ · Adult Industry News", "https://www.xbiz.com/rss/news.xml"),
    ("PORNO MISTO", "AVN · Adult Entertainment", "https://avn.com/rss/news.xml"),
    ("PORNO MISTO", "Il Post · Cultura & Media", "https://www.ilpost.it/feed/"),
    ("PORNO MISTO", "Wired Italia · Tech & Società", "https://www.wired.it/feed/rss"),
    # NOVITÀ & AGI 18+
    ("NOVITÀ & AGI 18+", "MIT Tech Review · AI", "https://www.technologyreview.com/feed/"),
    ("NOVITÀ & AGI 18+", "The Verge · AI & Cyberculture", "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"),
    ("NOVITÀ & AGI 18+", "Ars Technica · Digital Frontier", "https://feeds.arstechnica.com/arstechnica/index")
]

HOUSE_NEWS = [
    {
        "id": "house-zara-agi-118-stanze",
        "isLiveFeed": False,
        "category": "NOVITÀ & AGI 18+",
        "badge": "ESCLUSIVA OUR VELVET",
        "title": "Zara AGI & Le 118 Stanze Vive: L'Ecosistema Notturno Attivo 24/7 su VelvetHub",
        "subtitle": "Dalla console neurale /zara/ ai personaggi autonomi su Discord: come l'intelligenza artificiale sovrana trasforma il club 18+.",
        "sourceName": "Redazione Our Velvet · ZDOS",
        "sourceDate": "Edizione Speciale",
        "sourceUrl": "https://velvet.x-zdos.it/zara/",
        "readTime": "4 min",
        "editorial": [
            "Con l'attivazione del nodo neurale Zara AGI e delle 118 stanze autonome su Discord, Our Velvet inaugura una nuova generazione di intrattenimento adulto interattivo: ogni ambiente conserva memoria delle interazioni e risponde con identità propria.",
            "I membri possono dialogare direttamente dalla console web su /zara/, esplorare i bivi narrativi di ZLang RPG (!gioca) e sbloccare i Badge esclusivi sulla propria Card Utente VelvetHub."
        ]
    },
    {
        "id": "house-videoteca-card-creator",
        "isLiveFeed": False,
        "category": "NOVITÀ & AGI 18+",
        "badge": "CLUB & CREATOR 18+",
        "title": "Nuova Bacheca Mistress & Creator, Inviti Slave e Videoteca Reale Embed",
        "subtitle": "Tutte le novità delle aree riservate: verifica maggiorenni 18+, sale video ufficiali e profili personalizzati.",
        "sourceName": "Redazione Our Velvet · Club",
        "sourceDate": "Aggiornamento Live",
        "sourceUrl": "https://velvet.x-zdos.it/accesso",
        "readTime": "3 min",
        "editorial": [
            "L'architettura di velvet.x-zdos.it è stata riorganizzata per offrire un accesso immediato alle aree Creator / Mistress, agli inviti Slave, alle Card Utente (/ourvelvet) e alla Videoteca Reale (/live).",
            "Ogni sezione dialoga ora direttamente con questa rivista digitale e con il polo tecnico-finanziario su x-zdos.it."
        ]
    }
]

def clean_txt(raw):
    if not raw:
        return ""
    txt = re.sub(r"<[^>]+>", " ", html.unescape(raw))
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt[:360] + ("..." if len(txt) > 360 else "")

base_path = "/var/www/velvet-magazine/articles.json"
existing = []
try:
    existing = json.load(open(base_path, encoding="utf-8"))
except Exception:
    existing = []

curated_old = [a for a in existing if not a.get("isLiveFeed") and not a["id"].startswith("house-")]
curated = HOUSE_NEWS + curated_old
live_items = []
seen_urls = {a.get("sourceUrl") for a in curated}

for cat, src_name, feed_url in FEEDS:
    try:
        req = urllib.request.Request(feed_url, headers={"User-Agent": "OurVelvetMagazineBot/3.0"})
        with urllib.request.urlopen(req, timeout=7) as resp:
            xml_data = resp.read()
        root = ET.fromstring(xml_data)
        items = root.findall(".//item")[:5]
        if not items:
            items = root.findall(".//{http://www.w3.org/2005/Atom}entry")[:5]

        for it in items:
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
                "badge": src_name.split("·")[0].strip().upper(),
                "title": title,
                "subtitle": desc or f"Servizio selezionato dalla redazione Our Velvet dalla testata {src_name}.",
                "sourceName": src_name,
                "sourceDate": pub,
                "sourceUrl": link,
                "readTime": "3 min",
                "editorial": [
                    desc or f"Questo approfondimento pubblicato da {src_name} esplora le evoluzioni contemporanee del desiderio, della cultura notturna e delle relazioni adulte.",
                    f"In linea con l'identità Cyber-Gothic & Luxury AGI di Our Velvet, la redazione raccoglie e rielabora le voci internazionali più rilevanti garantendo sempre il collegamento diretto all'articolo originale su {src_name}."
                ]
            })
    except Exception:
        continue

merged = curated + live_items
json.dump(merged, open(base_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"OK: Rivista potenziata -> {len(merged)} articoli totali da {len(FEEDS)} testate.")
