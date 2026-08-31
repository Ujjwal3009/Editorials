#!/usr/bin/env python3
"""
UPSC Mains Daywise Ingestion Worker
Multi-Tier Ingestion Strategy:
  1. Daily Newspapers (The Hindu, The Indian Express): Strictly today's daily editions.
  2. Research Institutes & Think Tanks (MP-IDSA, ORF, Down To Earth, PIB): Top-5 Rolling Active Research Briefs.
"""

import os
import sys
import time
import json
import urllib.request
import ssl
from extractor import extract_url

BACKEND_API = os.getenv("BACKEND_URL", "http://localhost:8080") + "/api/v1/articles/ingest"

COMPREHENSIVE_EDITION_TARGETS = [
    # =========================================================================
    # 📰 DAILY MORNING NEWSPAPERS (STRICTLY AUGUST 31, 2026)
    # =========================================================================
    {
        "url": "https://www.thehindu.com/opinion/op-ed/a-shared-disaster-beyond-borders-and-geopolitics/article71401817.ece",
        "slot": "LEAD",
        "date": "2026-08-31",
        "source": "The Hindu"
    },
    {
        "url": "https://www.thehindu.com/opinion/editorial/escape-velocity-on-what-indias-space-sector-must-focus-on/article71389175.ece",
        "slot": "SIDE_1",
        "date": "2026-08-31",
        "source": "The Hindu"
    },
    {
        "url": "https://indianexpress.com/article/opinion/editorials/himalayan-glacier-risks-nepal-floods-10856158/",
        "slot": "SIDE_2",
        "date": "2026-08-31",
        "source": "The Indian Express"
    },
    {
        "url": "https://indianexpress.com/article/opinion/columns/indias-central-asia-strategy-needs-less-romance-more-realism-10849030/",
        "slot": "OPED_1",
        "date": "2026-08-31",
        "source": "The Indian Express"
    },

    # =========================================================================
    # 🎖️ MP-IDSA DEFENCE INSTITUTE (TOP 5 ACTIVE ISSUE BRIEFS)
    # =========================================================================
    {
        "url": "https://idsa.in/publisher/issuebrief/diversification-of-the-philippines-strategic-partnerships",
        "slot": "OPED_4",
        "date": "2026-08-31",
        "source": "MP-IDSA Defence Institute"
    },
    {
        "url": "https://idsa.in/publisher/issuebrief/data-on-a-beam-of-light-li-fi-and-indias-military-communications",
        "slot": "OPED_5",
        "date": "2026-08-31",
        "source": "MP-IDSA Defence Institute"
    },
    {
        "url": "https://idsa.in/publisher/issuebrief/assessing-japans-2026-defence-white-paper",
        "slot": "IDSA_3",
        "date": "2026-08-21",
        "source": "MP-IDSA Defence Institute"
    },
    {
        "url": "https://idsa.in/publisher/issuebrief/india-and-the-rising-costs-of-strategic-autonomy",
        "slot": "IDSA_4",
        "date": "2026-07-24",
        "source": "MP-IDSA Defence Institute"
    },
    {
        "url": "https://idsa.in/publisher/issuebrief/india-chile-and-the-lithium-supply-chain",
        "slot": "IDSA_5",
        "date": "2026-07-21",
        "source": "MP-IDSA Defence Institute"
    },

    # =========================================================================
    # 🌐 OBSERVER RESEARCH FOUNDATION (TOP ACTIVE COMMENTARIES)
    # =========================================================================
    {
        "url": "https://www.orfonline.org/expert-speak/the-french-paradox-of-european-strategic-autonomy",
        "slot": "OPED_2",
        "date": "2026-08-31",
        "source": "Observer Research Foundation"
    },
    {
        "url": "https://www.orfonline.org/expert-speak/reframing-ocean-sustainability-through-global-south-perspectives",
        "slot": "OPED_3",
        "date": "2026-08-31",
        "source": "Observer Research Foundation"
    },

    # =========================================================================
    # 🌿 DOWN TO EARTH (TOP ACTIVE CLIMATE, ECOLOGY & ENERGY BRIEFS)
    # =========================================================================
    {
        "url": "https://www.downtoearth.org.in/governance/india-finally-gives-its-wastelands-a-name-and-a-future",
        "slot": "OPED_6",
        "date": "2026-08-31",
        "source": "Down To Earth"
    },
    {
        "url": "https://www.downtoearth.org.in/waste/gobardhan-has-the-money-are-indias-cities-ready-to-use-it",
        "slot": "OPED_7",
        "date": "2026-08-31",
        "source": "Down To Earth"
    },
    {
        "url": "https://www.downtoearth.org.in/climate-change/the-green-industrialisation-agenda-for-the-global-south-aconversation-with-ilias-alami",
        "slot": "DTE_3",
        "date": "2026-08-28",
        "source": "Down To Earth"
    },
    {
        "url": "https://www.downtoearth.org.in/climate-change/seven-decades-of-data-show-this-karnataka-citys-farming-seasons-are-being-rewritten",
        "slot": "DTE_4",
        "date": "2026-08-25",
        "source": "Down To Earth"
    },

    # =========================================================================
    # 🏛️ INSIGHTSIAS / PIB GOVERNMENT DIGEST
    # =========================================================================
    {
        "url": "https://www.insightsonindia.com/2026/08/31/upsc-current-affairs-31-august-2026/",
        "slot": "PIB_DIGEST",
        "date": "2026-08-31",
        "source": "InsightsIAS / PIB Digest"
    }
]

def run_pipeline():
    print("[*] Running UPSC Multi-Tier Rolling Ingestion Pipeline...")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    for item in COMPREHENSIVE_EDITION_TARGETS:
        url = item["url"]
        slot = item["slot"]
        date = item["date"]
        source = item["source"]
        try:
            print(f"[*] Extracting: {url}")
            data = extract_url(url)
            data["layoutSlot"] = slot
            data["publishedDate"] = date
            if source:
                data["source"] = source

            payload = json.dumps(data).encode('utf-8')
            req = urllib.request.Request(
                BACKEND_API,
                data=payload,
                headers={"Content-Type": "application/json"}
            )

            with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
                if resp.status == 200:
                    print(f"    [+] Ingested [{slot:8s}] {data['source']} ({date}): '{data['title'][:35]}...' ({len(data['elements'])} paras)")
                else:
                    print(f"    [-] HTTP Error {resp.status}")
        except Exception as e:
            print(f"    [!] Error ingesting {url}: {e}")

if __name__ == "__main__":
    run_pipeline()
