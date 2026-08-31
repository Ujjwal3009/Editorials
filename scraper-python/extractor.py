#!/usr/bin/env python3
"""
UPSC Mains Universal Editorial & PIB Extractor
Supported Sources:
  - The Hindu (Editorials, Op-Eds, Ground Zero)
  - The Indian Express (Opinion, Editorial, Explained, Columns)
  - Observer Research Foundation (ORF - Expert Speak, Commentaries)
  - MP-IDSA (Manohar Parrikar Institute for Defence Studies - Issue Briefs)
  - Down To Earth (Climate Change, Ecology, Energy, Sustainable Agriculture)
  - InsightsIAS / PIB Digest (Daily Curated PIB, Schemes & Mains Value Addition)
"""

import sys
import json
import re
import urllib.request
import ssl
from typing import Dict, Any, List

def get_http_headers() -> Dict[str, str]:
    return {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
    }

def clean_html(text: str) -> str:
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&quot;', '"', text)
    text = re.sub(r'&#039;|&#39;', "'", text)
    text = re.sub(r'&#8217;', "'", text)
    text = re.sub(r'&#8216;', "'", text)
    text = re.sub(r'&#8220;', '"', text)
    text = re.sub(r'&#8221;', '"', text)
    text = re.sub(r'&#8212;', '—', text)
    text = re.sub(r'&#8211;', '–', text)
    return re.sub(r'\s+', ' ', text).strip()

def parse_the_hindu(html: str, url: str) -> Dict[str, Any]:
    title_m = re.search(r'<h1[^>]*class=[\'"][^\'"]*title[^\'"]*[\'"][^>]*>(.*?)</h1>', html, re.DOTALL | re.IGNORECASE)
    title = clean_html(title_m.group(1)) if title_m else "The Hindu Editorial"
    title = re.sub(r'\s*-\s*The Hindu$', '', title)

    sub_m = re.search(r'<h2[^>]*class=[\'"][^\'"]*sub-title[^\'"]*[\'"][^>]*>(.*?)</h2>', html, re.DOTALL | re.IGNORECASE)
    subtitle = clean_html(sub_m.group(1)) if sub_m else ""

    author_m = re.search(r'["\']authorName["\']\s*:\s*["\']([^"\']+)["\']', html)
    author = clean_html(author_m.group(1)) if author_m else "The Hindu Desk"

    date_m = re.search(r'["\']publishDate["\']\s*:\s*["\']([^"\']+)["\']', html)
    pub_date = date_m.group(1)[:10] if date_m else "2026-08-31"

    body_m = re.search(
        r'<div[^>]*class=[\'"][^\'"]*articlebodycontent[^\'"]*[\'"][^>]*>(.*?)(?:<div[^>]*class=[\'"][^\'"]*(?:articleblock-container|comments-shares|related-topics)[^\'"]*[\'"]|</div>\s*</div>)',
        html,
        re.DOTALL | re.IGNORECASE
    )
    body_html = body_m.group(1) if body_m else html

    elements: List[Dict[str, str]] = []
    tokens = re.findall(r'<(p|h[2-4])[^>]*>(.*?)</\1>', body_html, re.DOTALL | re.IGNORECASE)
    for tag, raw_inner in tokens:
        txt = clean_html(raw_inner)
        if len(txt) < 30 or "READ LATER" in txt or "Photo Credit" in txt or txt.startswith("Editorial |"):
            continue
        if tag.startswith('h'):
            elements.append({"type": "heading", "text": txt})
        else:
            elements.append({"type": "paragraph", "text": txt})

    return {
        "source": "The Hindu",
        "url": url,
        "title": title,
        "subtitle": subtitle,
        "author": author,
        "publishedDate": pub_date,
        "elements": elements,
        "fullText": "\n\n".join([f"### {e['text']}" if e['type'] == 'heading' else e['text'] for e in elements])
    }

def parse_indian_express(html: str, url: str) -> Dict[str, Any]:
    title_m = re.search(r'<h1[^>]*class=[\'"][^\'"]*native_story_title[^\'"]*[\'"][^>]*>(.*?)</h1>', html, re.DOTALL) or re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    title = clean_html(title_m.group(1)) if title_m else "Indian Express Editorial"
    title = re.sub(r'\s*\|\s*The Indian Express$', '', title)

    sub_m = re.search(r'<h2[^>]*class=[\'"][^\'"]*story-sub-title[^\'"]*[\'"][^>]*>(.*?)</h2>', html, re.DOTALL | re.IGNORECASE) or re.search(r'<h2[^>]*>(.*?)</h2>', html, re.DOTALL)
    subtitle = clean_html(sub_m.group(1)) if sub_m else ""

    author_m = re.search(r'<a[^>]*class=[\'"][^\'"]*story-byline[^\'"]*[\'"][^>]*>(.*?)</a>', html, re.DOTALL) or re.search(r'["\']author["\']\s*:\s*\{[^}]*["\']name["\']\s*:\s*["\']([^"\']+)["\']', html)
    author = clean_html(author_m.group(1)) if author_m else "IE Bureau"

    date_m = re.search(r'["\']datePublished["\']\s*:\s*["\']([^"\']+)["\']', html)
    pub_date = date_m.group(1)[:10] if date_m else "2026-08-31"

    story_m = re.search(r'<div[^>]*class=[\'"][^\'"]*story_details[^\'"]*[\'"][^>]*>(.*?)<div[^>]*class=[\'"][^\'"]*app-download-wrap[^\'"]*[\'"]', html, re.DOTALL)
    story_html = story_m.group(1) if story_m else html

    elements = []
    for p in re.findall(r'<p[^>]*>(.*?)</p>', story_html, re.DOTALL):
        txt = clean_html(p)
        if len(txt) > 30 and not txt.startswith("Also Read") and not "Express Premium" in txt and not "Click here" in txt:
            elements.append({"type": "paragraph", "text": txt})

    return {
        "source": "The Indian Express",
        "url": url,
        "title": title,
        "subtitle": subtitle,
        "author": author,
        "publishedDate": pub_date,
        "elements": elements,
        "fullText": "\n\n".join([e["text"] for e in elements])
    }

def parse_orf(html: str, url: str) -> Dict[str, Any]:
    title = ""
    author = "ORF Research"
    pub_date = "2026-08-31"
    
    json_ld_m = re.search(r'<script[^>]*type=[\'"]application/ld\+json[\'"][^>]*>(.*?)</script>', html, re.DOTALL)
    if json_ld_m:
        try:
            data = json.loads(json_ld_m.group(1))
            if isinstance(data, dict):
                title = data.get("headline", "")
                if "author" in data and isinstance(data["author"], dict):
                    author = data["author"].get("name", author)
                if "datePublished" in data:
                    pub_date = data["datePublished"][:10]
        except Exception:
            pass

    if not title:
        title_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
        title = clean_html(title_m.group(1)) if title_m else "ORF Expert Commentary"
    title = clean_html(title)

    sub_m = re.search(r'<blockquote>\s*<p>(.*?)</p>\s*</blockquote>', html, re.DOTALL | re.IGNORECASE)
    subtitle = clean_html(sub_m.group(1)) if sub_m else ""

    h1_idx = html.find('<h1')
    body_region = html[h1_idx:] if h1_idx != -1 else html
    tags_idx = body_region.find('tags/')
    if tags_idx != -1:
        body_region = body_region[:tags_idx]

    elements = []
    tokens = re.findall(r'<(p|h[2-3])[^>]*>(.*?)</\1>', body_region, re.DOTALL | re.IGNORECASE)
    for tag, raw_inner in tokens:
        txt = clean_html(raw_inner)
        if len(txt) < 30 or "Subscribe to" in txt or "Photo Credit" in txt:
            continue
        if tag.startswith('h'):
            elements.append({"type": "heading", "text": txt})
        else:
            elements.append({"type": "paragraph", "text": txt})

    return {
        "source": "Observer Research Foundation",
        "url": url,
        "title": title,
        "subtitle": subtitle,
        "author": author,
        "publishedDate": pub_date,
        "elements": elements,
        "fullText": "\n\n".join([f"### {e['text']}" if e['type'] == 'heading' else e['text'] for e in elements])
    }

def parse_idsa(html: str, url: str) -> Dict[str, Any]:
    title_m = re.search(r'<title>(.*?)</title>', html, re.DOTALL | re.IGNORECASE)
    title = clean_html(title_m.group(1)) if title_m else "MP-IDSA Strategic Issue Brief"
    title = re.sub(r'\s*-\s*MP-IDSA$', '', title).strip()

    sub_m = re.search(r'<meta[^>]*property=[\'"]og:description[\'"][^>]*content=[\'"]Summary\s*(.*?)[\'"]', html, re.DOTALL | re.IGNORECASE)
    subtitle = clean_html(sub_m.group(1)) if sub_m else ""
    subtitle = re.sub(r'\.\.\.\s*Continue reading.*$', '', subtitle)

    author = "MP-IDSA Strategic Desk"
    author_m = re.search(r'<span[^>]*class=[\'"][^\'"]*author[^\'"]*[\'"][^>]*>(.*?)</span>', html, re.DOTALL | re.IGNORECASE)
    if author_m:
        author = clean_html(author_m.group(1))

    date_m = re.search(r'["\']datePublished["\']\s*:\s*["\']([^"\']+)["\']', html)
    pub_date = date_m.group(1)[:10] if date_m else "2026-08-31"

    elements = []
    for p in re.findall(r'<p[^>]*>(.*?)</p>', html, re.DOTALL):
        txt = clean_html(p)
        if len(txt) > 40 and not "Facebook" in txt and not "Twitter" in txt and not "YouTube" in txt and not "LinkedIn" in txt and not "Disclaimer:" in txt:
            elements.append({"type": "paragraph", "text": txt})

    return {
        "source": "MP-IDSA Defence Institute",
        "url": url,
        "title": title,
        "subtitle": subtitle,
        "author": author,
        "publishedDate": pub_date,
        "elements": elements,
        "fullText": "\n\n".join([e["text"] for e in elements])
    }

def parse_down_to_earth(html: str, url: str) -> Dict[str, Any]:
    title_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL | re.IGNORECASE)
    title = clean_html(title_m.group(1)) if title_m else "Down To Earth Analysis"

    sub_m = re.search(r'<meta[^>]*property=[\'"]og:description[\'"][^>]*content=[\'"](.*?)[\'"]', html, re.DOTALL | re.IGNORECASE)
    subtitle = clean_html(sub_m.group(1)) if sub_m else ""

    author = "Down To Earth Bureau"
    auth_m = re.search(r'class=[\'"][^\'\"]*author[^\'\"]*[\'"][^>]*>(.*?)<', html, re.DOTALL | re.IGNORECASE)
    if auth_m and len(auth_m.group(1).strip()) > 3:
        author = clean_html(auth_m.group(1))

    date_m = re.search(r'["\']datePublished["\']\s*:\s*["\']([^"\']+)["\']', html) or re.search(r'property=[\'"]article:published_time[\'"][^>]*content=[\'"]([^"\']+)[\'"]', html)
    pub_date = date_m.group(1)[:10] if date_m else "2026-08-31"

    elements = []
    for p in re.findall(r'<p[^>]*>(.*?)</p>', html, re.DOTALL):
        txt = clean_html(p)
        txt = re.sub(r'^CopiedListen to this article\s*', '', txt)
        if len(txt) > 50 and not "Down To Earth" in txt and not "Subscribe" in txt and not "Follow us" in txt and not "Advertisement" in txt:
            elements.append({"type": "paragraph", "text": txt})

    return {
        "source": "Down To Earth",
        "url": url,
        "title": title,
        "subtitle": subtitle,
        "author": author,
        "publishedDate": pub_date,
        "elements": elements,
        "fullText": "\n\n".join([e["text"] for e in elements])
    }

def parse_insights_ias(html: str, url: str) -> Dict[str, Any]:
    """Extracts curated daily PIB, Government Schemes & Mains value-addition summaries."""
    title_m = re.search(r'<h1[^>]*class=[\'"][^\'"]*entry-title[^\'"]*[\'"][^>]*>(.*?)</h1>', html, re.DOTALL) or re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    title = clean_html(title_m.group(1)) if title_m else "InsightsIAS Daily PIB & Current Affairs"

    date_m = re.search(r'/(\d{4})/(\d{2})/(\d{2})/', url)
    pub_date = f"{date_m.group(1)}-{date_m.group(2)}-{date_m.group(3)}" if date_m else "2026-08-31"

    author = "InsightsIAS Editorial Team"
    subtitle = "Daily Curated PIB Summaries, Cabinet Approvals & Mains Enrichment (CME)"

    entry_m = re.search(r'<div[^>]*class=[\'"][^\'"]*entry-content[^\'"]*[\'"][^>]*>(.*?)</div>\s*<!-- \.entry-content -->', html, re.DOTALL)
    body_html = entry_m.group(1) if entry_m else html

    elements = []
    # Capture headings (h2, h3, h4) and content blocks (p, li)
    tokens = re.findall(r'<(h[2-4]|p|li)[^>]*>(.*?)</\1>', body_html, re.DOTALL | re.IGNORECASE)
    for tag, raw_inner in tokens:
        txt = clean_html(raw_inner)
        if len(txt) < 25 or "Search Here" in txt or "Download PDF" in txt or "Telegram" in txt or "Join our" in txt:
            continue
        if tag.startswith('h'):
            elements.append({"type": "heading", "text": f"📌 {txt}"})
        elif tag == 'li':
            elements.append({"type": "paragraph", "text": f"• {txt}"})
        else:
            elements.append({"type": "paragraph", "text": txt})

    return {
        "source": "InsightsIAS / PIB Digest",
        "url": url,
        "title": title,
        "subtitle": subtitle,
        "author": author,
        "publishedDate": pub_date,
        "elements": elements,
        "fullText": "\n\n".join([f"### {e['text']}" if e['type'] == 'heading' else e['text'] for e in elements])
    }

def extract_editorial(url: str) -> Dict[str, Any]:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers=get_http_headers())
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            if "thehindu.com" in url:
                return parse_the_hindu(html, url)
            elif "indianexpress.com" in url:
                return parse_indian_express(html, url)
            elif "orfonline.org" in url:
                return parse_orf(html, url)
            elif "idsa.in" in url:
                return parse_idsa(html, url)
            elif "downtoearth.org.in" in url:
                return parse_down_to_earth(html, url)
            elif "insightsonindia.com" in url or "insightsias.com" in url:
                return parse_insights_ias(html, url)
            else:
                return {
                    "source": "Web",
                    "url": url,
                    "title": "Editorial Analysis",
                    "author": "Editorial Desk",
                    "publishedDate": "2026-08-31",
                    "elements": [{"type": "paragraph", "text": clean_html(html)[:1000]}],
                    "fullText": clean_html(html)[:1000]
                }
    except Exception as e:
        return {"error": str(e), "url": url}

extract_url = extract_editorial

if __name__ == "__main__":
    test_url = sys.argv[1] if len(sys.argv) > 1 else "https://www.insightsonindia.com/2026/08/31/upsc-current-affairs-31-august-2026/"
    res = extract_editorial(test_url)
    print(f"Source: {res.get('source')}")
    print(f"Title: {res.get('title')}")
    print(f"Author: {res.get('author')}")
    print(f"Date: {res.get('publishedDate')}")
    print(f"Elements: {len(res.get('elements', []))}")
    if res.get('elements'):
        print(f"P1: {res['elements'][0]['text'][:100]}...")
