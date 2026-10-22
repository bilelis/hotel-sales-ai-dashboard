#!/usr/bin/env python3
"""
Migrates SQLite data from hotel.db to MongoDB collections required by hotel-api:
  - meta
  - daily_kpis
  - monthly_kpis
  - department_revenue_monthly
  - reservations (embedded document with charges, payments, guest, room, channel)

Outputs:
  - NDJSON and JSON files in 'data base/hotel_mongo_data/'
  - A mongosh loader script 'data base/load_hotel_api_db.js' to import directly into MongoDB 'hotel'
"""

import os
import json
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "hotel.db")
OUT_DIR = os.path.join(BASE_DIR, "hotel_mongo_data")

os.makedirs(OUT_DIR, exist_ok=True)

def to_iso_date_obj(date_str):
    return {"$date": f"{date_str}T00:00:00.000Z"}

def run():
    print(f"[*] Connecting to SQLite database: {DB_PATH}")
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # 1. Meta
    print("[*] Processing meta...")
    cur.execute("SELECT key, value FROM meta")
    meta_docs = []
    for k, v in cur.fetchall():
        meta_docs.append({"_id": k, "key": k, "value": v})
    # Ensure data_as_of is present
    if not any(d["_id"] == "data_as_of" for d in meta_docs):
        meta_docs.append({"_id": "data_as_of", "key": "data_as_of", "value": "2026-10-17"})
    write_data("meta", meta_docs)

    # 2. Daily KPIs (from v_daily_kpis view)
    print("[*] Processing daily_kpis...")
    cur.execute("""
        SELECT stay_date, year, month, rooms_sold, rooms_available, occupancy_pct, room_revenue, adr, revpar
        FROM v_daily_kpis
        ORDER BY stay_date
    """)
    daily_kpis = []
    for row in cur.fetchall():
        stay_date, year, month, rooms_sold, rooms_available, occupancy_pct, room_revenue, adr, revpar = row
        daily_kpis.append({
            "_id": stay_date,
            "date": to_iso_date_obj(stay_date),
            "stayDate": stay_date,
            "year": year,
            "month": month,
            "roomsSold": rooms_sold,
            "roomsAvailable": rooms_available,
            "occupancyPct": occupancy_pct,
            "roomRevenue": room_revenue,
            "adr": adr if adr is not None else 0.0,
            "revpar": revpar if revpar is not None else 0.0
        })
    write_data("daily_kpis", daily_kpis)

    # 3. Monthly KPIs (from v_monthly_kpis view)
    print("[*] Processing monthly_kpis...")
    cur.execute("""
        SELECT year_month, year, month, rooms_sold, rooms_available, occupancy_pct, room_revenue, adr, revpar
        FROM v_monthly_kpis
        ORDER BY year_month
    """)
    monthly_kpis = []
    for row in cur.fetchall():
        ym, year, month, rooms_sold, rooms_available, occupancy_pct, room_revenue, adr, revpar = row
        monthly_kpis.append({
            "_id": ym,
            "yearMonth": ym,
            "year": year,
            "month": month,
            "roomsSold": rooms_sold,
            "roomsAvailable": rooms_available,
            "occupancyPct": occupancy_pct,
            "roomRevenue": room_revenue,
            "adr": adr if adr is not None else 0.0,
            "revpar": revpar if revpar is not None else 0.0
        })
    write_data("monthly_kpis", monthly_kpis)

    # 4. Department Revenue Monthly (from v_revenue_by_department view)
    print("[*] Processing department_revenue_monthly...")
    cur.execute("""
        SELECT year_month, department, revenue
        FROM v_revenue_by_department
        ORDER BY year_month, department
    """)
    dept_rev = []
    for row in cur.fetchall():
        ym, dept, rev = row
        dept_rev.append({
            "yearMonth": ym,
            "department": dept,
            "revenue": rev
        })
    write_data("department_revenue_monthly", dept_rev)

    # 5. Build lookup maps for reservations
    print("[*] Loading reference tables for reservations...")
    cur.execute("SELECT department_id, name FROM departments")
    dept_map = dict(cur.fetchall())

    cur.execute("SELECT channel_id, name, channel_type FROM channels")
    chan_map = {row[0]: {"name": row[1], "type": row[2]} for row in cur.fetchall()}

    cur.execute("SELECT room_type_id, name FROM room_types")
    rt_map = dict(cur.fetchall())

    cur.execute("SELECT room_id, room_number, room_type_id FROM rooms")
    room_map = {row[0]: {"number": row[1], "type": rt_map.get(row[2], "")} for row in cur.fetchall()}

    cur.execute("SELECT guest_id, first_name, last_name, nationality FROM guests")
    guest_map = {row[0]: {"name": f"{row[1]} {row[2]}".strip(), "nationality": row[3]} for row in cur.fetchall()}

    # 6. Load folio_charges grouped by reservation_id
    print("[*] Loading folio_charges (68,000+ rows)...")
    cur.execute("""
        SELECT charge_id, reservation_id, department_id, charge_date, description, amount
        FROM folio_charges
        ORDER BY charge_id
    """)
    charges_by_res = {}
    for cid, rid, did, cdate, desc, amt in cur.fetchall():
        charges_by_res.setdefault(rid, []).append({
            "chargeId": cid,
            "department": dept_map.get(did, "Other"),
            "date": to_iso_date_obj(cdate),
            "description": desc,
            "amount": amt
        })

    # 7. Load reservations
    print("[*] Building embedded reservations documents...")
    cur.execute("""
        SELECT reservation_id, confirmation_code, guest_id, room_id, channel_id,
               booking_date, check_in, check_out, nights, adults, children, meal_plan,
               purpose, rate_per_night, status, cancellation_date
        FROM reservations
        ORDER BY reservation_id
    """)
    reservations = []
    for row in cur.fetchall():
        (rid, code, gid, rmid, chid, bdate, cin, cout, nights, adults, children,
         meal_plan, purpose, rpn, status, cdate) = row

        g = guest_map.get(gid, {"name": "", "nationality": ""})
        rm = room_map.get(rmid, {"number": "", "type": ""})
        ch = chan_map.get(chid, {"name": "", "type": ""})
        c_list = charges_by_res.get(rid, [])
        total_charges = round(sum(c["amount"] for c in c_list), 2)

        doc = {
            "_id": rid,
            "confirmationCode": code,
            "guestId": gid,
            "guestName": g["name"],
            "guestNationality": g["nationality"],
            "room": {
                "id": rmid,
                "number": rm["number"],
                "type": rm["type"]
            },
            "channel": {
                "id": chid,
                "name": ch["name"],
                "type": ch["type"]
            },
            "bookingDate": to_iso_date_obj(bdate),
            "checkIn": to_iso_date_obj(cin),
            "checkOut": to_iso_date_obj(cout),
            "nights": nights,
            "adults": adults,
            "children": children,
            "mealPlan": meal_plan,
            "purpose": purpose,
            "ratePerNight": rpn,
            "status": status,
            "cancellationDate": to_iso_date_obj(cdate) if cdate else None,
            "totalCharges": total_charges,
            "charges": c_list
        }
        reservations.append(doc)

    write_data("reservations", reservations)
    con.close()

    print("[+] Generating mongosh loader script...")
    generate_loader()
    print("[+] All done!")

def write_data(name, docs):
    ndjson_path = os.path.join(OUT_DIR, f"{name}.ndjson")
    json_path = os.path.join(OUT_DIR, f"{name}.json")

    with open(ndjson_path, "w", encoding="utf-8") as f_nd:
        for doc in docs:
            f_nd.write(json.dumps(doc, ensure_ascii=False) + "\n")

    with open(json_path, "w", encoding="utf-8") as f_j:
        json.dump(docs, f_j, ensure_ascii=False, indent=2)

    print(f"  -> {name}: {len(docs):,} documents exported to .ndjson & .json")

def generate_loader():
    loader_path = os.path.join(BASE_DIR, "load_hotel_api_db.js")
    escaped_out_dir = OUT_DIR.replace("\\", "/")

    script = f"""// High-performance loader for hotel-api database ('hotel')
// Usage: mongosh hotel load_hotel_api_db.js

const fs = require('fs');
const path = '{escaped_out_dir}';

console.log('\\n======================================================');
console.log('   MIGRATING HOTEL-API DATA INTO MONGODB ("hotel")');
console.log('======================================================\\n');

function revive(val) {{
  if (Array.isArray(val)) return val.map(revive);
  if (val && typeof val === 'object') {{
    if ('$date' in val) return new Date(val.$date);
    const obj = {{}};
    for (const [k, v] of Object.entries(val)) obj[k] = revive(v);
    return obj;
  }}
  return val;
}}

const collections = [
  'meta',
  'daily_kpis',
  'monthly_kpis',
  'department_revenue_monthly',
  'reservations'
];

for (const colName of collections) {{
  const filePath = path + '/' + colName + '.ndjson';
  if (!fs.existsSync(filePath)) {{
    console.warn('File not found:', filePath);
    continue;
  }}
  
  process.stdout.write('Loading ' + colName + '... ');
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\\n');
  const docs = lines.map(line => revive(JSON.parse(line)));
  
  const col = db.getCollection(colName);
  col.drop();
  
  const chunkSize = 2500;
  for (let i = 0; i < docs.length; i += chunkSize) {{
    const chunk = docs.slice(i, i + chunkSize);
    if (chunk.length > 0) {{
      col.insertMany(chunk, {{ ordered: false }});
    }}
  }}
  console.log('✓ ' + docs.length.toLocaleString() + ' docs');
}}

console.log('\\n[*] Building performance indexes...');
db.daily_kpis.createIndex({{ date: 1 }});
db.monthly_kpis.createIndex({{ year: 1, month: 1 }});
db.department_revenue_monthly.createIndex({{ yearMonth: 1, department: 1 }});
db.reservations.createIndex({{ checkIn: 1, checkOut: 1 }});
db.reservations.createIndex({{ status: 1 }});
db.reservations.createIndex({{ 'channel.name': 1 }});
db.reservations.createIndex({{ 'charges.date': 1 }});
db.reservations.createIndex({{ guestId: 1 }});
console.log('✓ Indexes built successfully!\\n');

console.log('======================================================');
console.log('   VERIFYING COLLECTION COUNTS IN "hotel"');
console.log('======================================================');
for (const colName of collections) {{
  const count = db.getCollection(colName).countDocuments();
  console.log('   • ' + colName.padEnd(30) + ': ' + count.toLocaleString() + ' documents');
}}
console.log('\\nReady! hotel-api can now connect to mongodb://localhost:27017/hotel');
"""

    with open(loader_path, "w", encoding="utf-8") as f:
        f.write(script)
    print(f"  -> Generated: {loader_path}")

if __name__ == "__main__":
    run()
