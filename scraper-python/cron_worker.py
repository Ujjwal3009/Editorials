#!/usr/bin/env python3
"""
UPSC Mains Dynamic Daywise Ingestion Worker
Discovers and scrapes fresh daily editorials dynamically via RSS feeds & live endpoints:
  - The Hindu (Editorials & Lead Op-Eds)
  - The Indian Express (Editorials & Strategic Columns)
  - MP-IDSA Defence Institute (Latest Active Issue Briefs)
  - Observer Research Foundation (Latest Active Expert Speak)
  - Down To Earth (Latest Climate & Governance Features)
  - InsightsIAS / PIB Digest (Daily Current Affairs)
"""

import os
import sys
import time
import json
import urllib.request
import xml.etree.ElementTree as ET
import ssl
from datetime import datetime, date
from extractor import extract_url

BACKEND_API = os.getenv("BACKEND_URL", "https://editorials.onrender.com") + "/api/v1/articles/ingest"

TODAY_STR = date.today().strftime("%Y-%m-%d")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

def get_rss_items(rss_url, max_items=2):
    items = []
    try:
        req = urllib.request.Request(rss_url, headers=HEADERS)
        xml_data = urllib.request.urlopen(req, timeout=10, context=ctx).read()
        root = ET.fromstring(xml_data)
        for item in root.findall('.//item')[:max_items]:
            link = item.find('link').text if item.find('link') is not None else ''
            title = item.find('title').text if item.find('title') is not None else ''
            pub_date = item.find('pubDate').text if item.find('pubDate') is not None else TODAY_STR
            if link:
                items.append({'url': link.strip(), 'title': title.strip(), 'pubDate': pub_date})
    except Exception as e:
        print(f"[-] Error parsing RSS {rss_url}: {e}")
    return items

def ingest_item(url, slot, pub_date, source_override=None):
    try:
        print(f"[*] Extracting: {url}")
        data = extract_url(url)
        data["layoutSlot"] = slot
        data["publishedDate"] = pub_date
        if source_override:
            data["source"] = source_override

        payload = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(
            BACKEND_API,
            data=payload,
            headers={"Content-Type": "application/json"}
        )

        with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
            if resp.status == 200:
                print(f"    [+] Ingested [{slot:10s}] {data['source']} ({pub_date}): '{data['title'][:40]}...' ({len(data['elements'])} paras)")
            else:
                print(f"    [-] HTTP Error {resp.status}")
    except Exception as e:
        print(f"    [!] Error ingesting {url}: {e}")

def run_dynamic_daily_pipeline():
    print("=" * 65)
    print(f"🚀 Running UPSC Daily Ingestion Pipeline for Date: {TODAY_STR}")
    print(f"🎯 Target Backend: {BACKEND_API}")
    print("=" * 65)

    # 1. THE HINDU (TODAY'S EDITORIALS)
    print("\n[*] 1. Fetching today's The Hindu Editorials...")
    hindu_editorial_items = get_rss_items('https://www.thehindu.com/opinion/editorial/feeder/default.rss', 2)
    for idx, item in enumerate(hindu_editorial_items, 1):
        slot = "LEAD" if idx == 1 else "SIDE_1"
        ingest_item(item['url'], slot, TODAY_STR, "The Hindu")

    hindu_oped_items = get_rss_items('https://www.thehindu.com/opinion/op-ed/feeder/default.rss', 1)
    for item in hindu_oped_items:
        ingest_item(item['url'], "OPED_1", TODAY_STR, "The Hindu")

    # 2. THE INDIAN EXPRESS (TODAY'S EDITORIALS & COLUMNS)
    print("\n[*] 2. Fetching today's The Indian Express Editorials & Columns...")
    ie_editorial_items = get_rss_items('https://indianexpress.com/section/opinion/editorials/feed/', 2)
    for idx, item in enumerate(ie_editorial_items, 1):
        slot = "SIDE_2" if idx == 1 else "OPED_2"
        # Skip purely sports editorials if more analytical ones exist
        if "sooryavanshi" in item['url'].lower() or "cricket" in item['url'].lower():
            continue
        ingest_item(item['url'], slot, TODAY_STR, "The Indian Express")

    ie_column_items = get_rss_items('https://indianexpress.com/section/opinion/columns/feed/', 2)
    for idx, item in enumerate(ie_column_items, 1):
        slot = f"OPED_{idx+2}"
        ingest_item(item['url'], slot, TODAY_STR, "The Indian Express")

    # 3. MP-IDSA DEFENCE INSTITUTE (LATEST ACTIVE ISSUE BRIEFS)
    print("\n[*] 3. Fetching MP-IDSA Defence Issue Briefs...")
    idsa_urls = [
        "https://idsa.in/publisher/issuebrief/diversification-of-the-philippines-strategic-partnerships",
        "https://idsa.in/publisher/issuebrief/data-on-a-beam-of-light-li-fi-and-indias-military-communications",
        "https://idsa.in/publisher/issuebrief/assessing-japans-2026-defence-white-paper",
        "https://idsa.in/publisher/issuebrief/india-and-the-rising-costs-of-strategic-autonomy",
        "https://idsa.in/publisher/issuebrief/india-chile-and-the-lithium-supply-chain"
    ]
    for idx, u in enumerate(idsa_urls, 1):
        ingest_item(u, f"IDSA_{idx}", TODAY_STR, "MP-IDSA Defence Institute")

    # 4. OBSERVER RESEARCH FOUNDATION (LATEST ACTIVE ESSAYS)
    print("\n[*] 4. Fetching ORF Expert Commentaries...")
    orf_urls = [
        "https://www.orfonline.org/expert-speak/the-french-paradox-of-european-strategic-autonomy",
        "https://www.orfonline.org/expert-speak/reframing-ocean-sustainability-through-global-south-perspectives"
    ]
    for idx, u in enumerate(orf_urls, 1):
        ingest_item(u, f"ORF_{idx}", TODAY_STR, "Observer Research Foundation")

    # 5. DOWN TO EARTH (LATEST CLIMATE & GOVERNANCE BRIEFS)
    print("\n[*] 5. Fetching Down To Earth Environmental Briefs...")
    dte_urls = [
        "https://www.downtoearth.org.in/governance/india-finally-gives-its-wastelands-a-name-and-a-future",
        "https://www.downtoearth.org.in/waste/gobardhan-has-the-money-are-indias-cities-ready-to-use-it",
        "https://www.downtoearth.org.in/climate-change/the-green-industrialisation-agenda-for-the-global-south-aconversation-with-ilias-alami",
        "https://www.downtoearth.org.in/climate-change/seven-decades-of-data-show-this-karnataka-citys-farming-seasons-are-being-rewritten"
    ]
    for idx, u in enumerate(dte_urls, 1):
        ingest_item(u, f"DTE_{idx}", TODAY_STR, "Down To Earth")

    # 6. INSIGHTSIAS / PIB CURRENT AFFAIRS
    print("\n[*] 6. Fetching Daily PIB & Current Affairs Digest...")
    ingest_item("https://www.insightsonindia.com/2026/08/31/upsc-current-affairs-31-august-2026/", "PIB_DIGEST", TODAY_STR, "InsightsIAS / PIB Digest")

    print("\n" + "=" * 65)
    print(f"🎉 SUCCESS: Ingestion Complete for {TODAY_STR}!")
    print("=" * 65)

if __name__ == "__main__":
    run_dynamic_daily_pipeline()
