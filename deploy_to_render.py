#!/usr/bin/env python3
"""
Automated 1-Click Render Deployment Script
Provisions:
  1. Free PostgreSQL Database (upsc_editorial)
  2. Docker Web Service for Spring Boot (linked to Ujjwal3009/Editorials)
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error

RENDER_API_BASE = "https://api.render.com/v1"

def make_request(endpoint, api_key, method="GET", data=None):
    url = f"{RENDER_API_BASE}/{endpoint}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    payload = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return json.loads(err_body), e.code
        except Exception:
            return {"error": err_body}, e.code

def deploy():
    print("=" * 65)
    print("🚀 UPSC Editorial Desk — Automated Render Cloud Deployer")
    print("=" * 65)

    api_key = os.getenv("RENDER_API_KEY")
    if not api_key:
        if len(sys.argv) > 1:
            api_key = sys.argv[1].strip()
        else:
            api_key = input("🔑 Enter your Render API Key: ").strip()

    if not api_key:
        print("[-] Error: Render API Key is required.")
        sys.exit(1)

    # 1. Fetch Owner / User ID
    print("\n[*] Authenticating with Render API...")
    owners, status = make_request("owners", api_key)
    if status != 200 or not owners:
        print(f"[-] Authentication failed (HTTP {status}): {owners}")
        sys.exit(1)

    owner_id = owners[0]["owner"]["id"]
    owner_name = owners[0]["owner"]["name"]
    print(f"[+] Authenticated as: {owner_name} (Owner ID: {owner_id})")

    # 2. Check or Create Free PostgreSQL Database
    print("\n[*] Step 1: Provisioning Free PostgreSQL Database...")
    db_payload = {
        "name": "upsc-editorial-db",
        "databaseName": "upsc_editorial",
        "databaseUser": "upsc_user",
        "ownerId": owner_id,
        "plan": "free",
        "region": "singapore",
        "version": "16"
    }

    db_res, db_status = make_request("postgres", api_key, method="POST", data=db_payload)
    
    db_id = None
    db_name = "upsc-editorial-db"
    if db_status in [200, 201]:
        db_id = db_res.get("id")
        db_name = db_res.get("name", "upsc-editorial-db")
        print(f"[+] Database created successfully! (DB ID: {db_id})")
    else:
        print(f"[*] Response from Render: {db_res.get('message', db_res)}")
        dbs, _ = make_request("postgres", api_key)
        if isinstance(dbs, list):
            for d in dbs:
                p = d.get("postgres", {})
                if "upsc" in p.get("name", "").lower() or "editorial" in p.get("name", "").lower():
                    db_id = p.get("id")
                    db_name = p.get("name")
                    print(f"[+] Found existing database: {db_name} (DB ID: {db_id})")
                    break

    # 3. Create Web Service for Spring Boot
    print("\n[*] Step 2: Provisioning Spring Boot Backend Web Service...")
    service_payload = {
        "type": "web_service",
        "name": "upsc-editorial-backend",
        "ownerId": owner_id,
        "repo": "https://github.com/Ujjwal3009/Editorials",
        "branch": "main",
        "runtime": "docker",
        "plan": "free",
        "region": "singapore",
        "autoDeploy": "yes",
        "envVars": [
            {
                "key": "PORT",
                "value": "8080"
            }
        ]
    }

    svc_res, svc_status = make_request("services", api_key, method="POST", data=service_payload)
    
    service_id = None
    service_url = None

    if svc_status in [200, 201]:
        service_id = svc_res.get("service", {}).get("id") or svc_res.get("id")
        service_url = (svc_res.get("service", {}).get("serviceDetails", {}).get("url") or 
                       svc_res.get("serviceDetails", {}).get("url"))
        print(f"[+] Web Service created successfully! (Service ID: {service_id})")
    else:
        print(f"[*] Response from Render: {svc_res.get('message', svc_res)}")
        svcs, _ = make_request("services", api_key)
        if isinstance(svcs, list):
            for s in svcs:
                srv = s.get("service", s)
                if "upsc" in srv.get("name", "").lower() or "editorial" in srv.get("name", "").lower():
                    service_id = srv.get("id")
                    service_url = srv.get("serviceDetails", {}).get("url")
                    print(f"[+] Found existing service: {srv.get('name')} (ID: {service_id})")
                    break

    # Fallback URL if not yet assigned by Render
    if not service_url and service_id:
        # Fetch service details
        detail, _ = make_request(f"services/{service_id}", api_key)
        service_url = detail.get("serviceDetails", {}).get("url")

    final_url = service_url or "https://upsc-editorial-backend.onrender.com"

    print("\n" + "=" * 65)
    print("🎉 DEPLOYMENT PROVISIONED ON RENDER CLOUD!")
    print("=" * 65)
    print(f"• Database : {db_name} (PostgreSQL 16 - Singapore)")
    print(f"• Backend  : Spring Boot (Docker - Port 8080)")
    print(f"• Live URL : 👉 {final_url}")
    print("\nNext Steps:")
    print("1. Render is building your container (takes ~2-3 mins).")
    print("2. Track build logs live at: https://dashboard.render.com")
    print("3. Deploy frontend to Vercel: https://vercel.com/new")
    print("=" * 65)

if __name__ == "__main__":
    deploy()
