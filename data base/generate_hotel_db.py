#!/usr/bin/env python3
"""Generates hotel.db (SQLite) + hotel_dump.sql for a fictional 5-star hotel (60 rooms).
Run:  python generate_hotel_db.py     (deterministic: same data every run)
All guests are fictional; emails use example.com. Currency: EUR."""
import os, random, re, sqlite3, unicodedata
from datetime import date, timedelta

random.seed(42)
OUT = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(OUT, "hotel.db")
DUMP = os.path.join(OUT, "hotel_dump.sql")
TODAY = date(2026, 10, 17)            # "data as of" date
START, END = date(2025, 1, 1), date(2026, 12, 31)

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE room_types (
  room_type_id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT,
  base_rate REAL NOT NULL, max_occupancy INTEGER NOT NULL, size_sqm INTEGER);
CREATE TABLE rooms (
  room_id INTEGER PRIMARY KEY, room_number TEXT NOT NULL UNIQUE,
  room_type_id INTEGER NOT NULL REFERENCES room_types(room_type_id),
  floor INTEGER NOT NULL, view TEXT, is_active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE channels (
  channel_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, channel_type TEXT NOT NULL,
  commission_pct REAL NOT NULL DEFAULT 0);
CREATE TABLE departments (department_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE guests (
  guest_id INTEGER PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
  nationality TEXT NOT NULL, language TEXT, email TEXT UNIQUE, phone TEXT,
  vip_level TEXT NOT NULL DEFAULT 'Standard', created_at TEXT NOT NULL);
CREATE TABLE reservations (
  reservation_id INTEGER PRIMARY KEY, confirmation_code TEXT NOT NULL UNIQUE,
  guest_id INTEGER NOT NULL REFERENCES guests(guest_id),
  room_id INTEGER NOT NULL REFERENCES rooms(room_id),
  channel_id INTEGER NOT NULL REFERENCES channels(channel_id),
  booking_date TEXT NOT NULL, check_in TEXT NOT NULL, check_out TEXT NOT NULL,
  nights INTEGER NOT NULL, adults INTEGER NOT NULL, children INTEGER NOT NULL DEFAULT 0,
  meal_plan TEXT NOT NULL, purpose TEXT NOT NULL, rate_per_night REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Confirmed','In-house','Checked-out','Cancelled','No-show')),
  cancellation_date TEXT);
CREATE TABLE folio_charges (
  charge_id INTEGER PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(reservation_id),
  department_id INTEGER NOT NULL REFERENCES departments(department_id),
  charge_date TEXT NOT NULL, description TEXT NOT NULL, amount REAL NOT NULL);
CREATE TABLE payments (
  payment_id INTEGER PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(reservation_id),
  payment_date TEXT NOT NULL, payment_type TEXT NOT NULL, method TEXT NOT NULL, amount REAL NOT NULL);
CREATE TABLE calendar (
  cal_date TEXT PRIMARY KEY, year INTEGER, month INTEGER, month_name TEXT,
  day_of_week TEXT, is_weekend INTEGER, season TEXT);
CREATE INDEX ix_res_dates ON reservations(check_in, check_out);
CREATE INDEX ix_res_guest ON reservations(guest_id);
CREATE INDEX ix_res_room ON reservations(room_id);
CREATE INDEX ix_res_channel ON reservations(channel_id);
CREATE INDEX ix_res_status ON reservations(status);
CREATE INDEX ix_fc_res ON folio_charges(reservation_id);
CREATE INDEX ix_fc_date ON folio_charges(charge_date);
CREATE INDEX ix_fc_dept ON folio_charges(department_id);
CREATE INDEX ix_pay_res ON payments(reservation_id);
"""

VIEWS = """
-- One row per occupied (or booked) night. Filter on status for realized vs forecast.
CREATE VIEW v_room_nights AS
WITH RECURSIVE n(reservation_id, room_id, channel_id, status, rate_per_night, night_date, last_night) AS (
  SELECT reservation_id, room_id, channel_id, status, rate_per_night, check_in, date(check_out,'-1 day')
  FROM reservations WHERE status IN ('Checked-out','In-house','Confirmed')
  UNION ALL
  SELECT reservation_id, room_id, channel_id, status, rate_per_night, date(night_date,'+1 day'), last_night
  FROM n WHERE night_date < last_night)
SELECT reservation_id, room_id, channel_id, status, rate_per_night, night_date FROM n;

-- Daily occupancy, ADR, RevPAR (room revenue only)
CREATE VIEW v_daily_kpis AS
SELECT c.cal_date AS stay_date, c.year, c.month,
  COUNT(rn.reservation_id) AS rooms_sold,
  (SELECT COUNT(*) FROM rooms WHERE is_active=1) AS rooms_available,
  ROUND(100.0*COUNT(rn.reservation_id)/(SELECT COUNT(*) FROM rooms WHERE is_active=1),1) AS occupancy_pct,
  ROUND(COALESCE(SUM(rn.rate_per_night),0),2) AS room_revenue,
  ROUND(COALESCE(SUM(rn.rate_per_night),0)*1.0/NULLIF(COUNT(rn.reservation_id),0),2) AS adr,
  ROUND(COALESCE(SUM(rn.rate_per_night),0)*1.0/(SELECT COUNT(*) FROM rooms WHERE is_active=1),2) AS revpar
FROM calendar c LEFT JOIN v_room_nights rn ON rn.night_date = c.cal_date
GROUP BY c.cal_date;

CREATE VIEW v_monthly_kpis AS
SELECT year, month, printf('%04d-%02d', year, month) AS year_month,
  SUM(rooms_sold) AS rooms_sold, SUM(rooms_available) AS rooms_available,
  ROUND(100.0*SUM(rooms_sold)/SUM(rooms_available),1) AS occupancy_pct,
  ROUND(SUM(room_revenue),2) AS room_revenue,
  ROUND(SUM(room_revenue)*1.0/NULLIF(SUM(rooms_sold),0),2) AS adr,
  ROUND(SUM(room_revenue)*1.0/SUM(rooms_available),2) AS revpar
FROM v_daily_kpis GROUP BY year, month;

CREATE VIEW v_revenue_by_department AS
SELECT strftime('%Y-%m', f.charge_date) AS year_month, d.name AS department,
  ROUND(SUM(f.amount),2) AS revenue, COUNT(*) AS charge_lines
FROM folio_charges f JOIN departments d ON d.department_id = f.department_id
GROUP BY year_month, d.name;

CREATE VIEW v_channel_performance AS
WITH base AS (
  SELECT ch.name AS channel, ch.channel_type, ch.commission_pct,
    COUNT(*) AS bookings,
    SUM(r.status='Cancelled') AS cancelled,
    SUM(CASE WHEN r.status IN ('Checked-out','In-house') THEN r.nights ELSE 0 END) AS room_nights,
    SUM(CASE WHEN r.status IN ('Checked-out','In-house') THEN r.nights*r.rate_per_night ELSE 0 END) AS room_revenue
  FROM reservations r JOIN channels ch ON ch.channel_id = r.channel_id GROUP BY ch.channel_id)
SELECT channel, channel_type, bookings, cancelled,
  ROUND(100.0*cancelled/bookings,1) AS cancellation_rate_pct,
  room_nights, ROUND(room_revenue,2) AS room_revenue,
  ROUND(room_revenue*1.0/NULLIF(room_nights,0),2) AS adr,
  ROUND(room_revenue*commission_pct/100.0,2) AS commission_cost
FROM base;

CREATE VIEW v_reservation_summary AS
SELECT r.reservation_id, r.confirmation_code, g.first_name||' '||g.last_name AS guest_name,
  g.nationality, g.vip_level, rm.room_number, rt.name AS room_type, ch.name AS channel,
  r.booking_date, r.check_in, r.check_out, r.nights, r.adults, r.children, r.meal_plan,
  r.purpose, r.rate_per_night, r.status,
  ROUND(COALESCE((SELECT SUM(amount) FROM folio_charges f WHERE f.reservation_id=r.reservation_id),0),2) AS total_charges
FROM reservations r JOIN guests g ON g.guest_id=r.guest_id
JOIN rooms rm ON rm.room_id=r.room_id JOIN room_types rt ON rt.room_type_id=rm.room_type_id
JOIN channels ch ON ch.channel_id=r.channel_id;

CREATE VIEW v_guest_value AS
SELECT g.guest_id, g.first_name||' '||g.last_name AS guest_name, g.nationality, g.vip_level,
  COUNT(DISTINCT CASE WHEN r.status IN ('Checked-out','In-house') THEN r.reservation_id END) AS stays,
  ROUND(COALESCE(SUM(f.amount),0),2) AS total_spend,
  MAX(CASE WHEN r.status IN ('Checked-out','In-house') THEN r.check_in END) AS last_stay
FROM guests g LEFT JOIN reservations r ON r.guest_id=g.guest_id
LEFT JOIN folio_charges f ON f.reservation_id=r.reservation_id
GROUP BY g.guest_id;
"""

# ---------------------------------------------------------------- reference data
ROOM_TYPES = [  # name, description, base_rate, max_occ, sqm, count, first floor, rooms/floor, view, occ factor
    ("Classic Deluxe", "Elegant room with garden view", 210, 3, 38, 24, 1, 12, "Garden", 0.95),
    ("Deluxe Sea View", "Spacious room with balcony and sea view", 270, 3, 44, 18, 3, 9, "Sea", 1.05),
    ("Junior Suite", "Suite with separate lounge area", 380, 4, 62, 10, 5, 10, "Sea", 0.95),
    ("Executive Suite", "Large suite, butler service, panoramic terrace", 520, 4, 85, 6, 6, 6, "Panoramic Sea", 0.80),
    ("Presidential Suite", "Signature suite, two bedrooms, private terrace", 1400, 6, 180, 2, 7, 2, "Panoramic Sea", 0.55),
]
CHANNELS = [  # name, type, commission, weight, rate factor, cancel prob, mean lead days
    ("Direct Website", "Direct", 0, 0.22, 1.00, 0.08, 40),
    ("Phone / Email", "Direct", 0, 0.08, 1.02, 0.05, 30),
    ("Booking.com", "OTA", 15, 0.20, 0.97, 0.20, 35),
    ("Expedia", "OTA", 18, 0.10, 0.96, 0.18, 40),
    ("Travel Agency", "Travel Agency", 10, 0.12, 0.88, 0.08, 60),
    ("Tour Operator", "Tour Operator", 20, 0.10, 0.80, 0.05, 90),
    ("Corporate", "Corporate", 0, 0.10, 0.85, 0.06, 14),
    ("Walk-in", "Direct", 0, 0.03, 1.08, 0.00, 0),
    ("Meetings & Events", "Corporate", 0, 0.05, 0.90, 0.04, 45),
]
DEPARTMENTS = ["Rooms", "Food & Beverage", "Spa & Wellness", "Events & Meetings", "Minibar & Extras", "Transport"]
SEASON_MULT = {1: .72, 2: .72, 3: .85, 4: 1.0, 5: 1.1, 6: 1.3, 7: 1.5, 8: 1.6, 9: 1.2, 10: 1.0, 11: .8, 12: .95}
OCC_TARGET = {1: .45, 2: .50, 3: .58, 4: .68, 5: .74, 6: .82, 7: .90, 8: .93, 9: .80, 10: .70, 11: .55, 12: .65}
SEASON_NAME = {12: "Winter", 1: "Winter", 2: "Winter", 3: "Spring", 4: "Spring", 5: "Spring",
               6: "Summer", 7: "Summer", 8: "Summer", 9: "Autumn", 10: "Autumn", 11: "Autumn"}
NIGHTS = [1, 2, 3, 4, 5, 6, 7, 10, 14]
W_NORMAL = [8, 18, 22, 16, 12, 8, 8, 5, 3]
W_SUMMER = [4, 10, 16, 16, 14, 12, 12, 10, 6]
MEAN = lambda w: sum(n * x for n, x in zip(NIGHTS, w)) / sum(w)
L_NORMAL, L_SUMMER = MEAN(W_NORMAL), MEAN(W_SUMMER)

NATIONS = {  # nationality: (weight, language, dial code, first names, last names)
    "France": (.22, "French", 33, ["Pierre", "Julien", "Camille", "Sophie", "Nicolas", "Claire", "Antoine", "Marie", "Thomas", "Léa", "Hugo", "Emma"],
               ["Martin", "Bernard", "Dubois", "Moreau", "Laurent", "Lefèvre", "Roux", "Fontaine", "Girard", "Mercier"]),
    "Germany": (.12, "German", 49, ["Hans", "Lukas", "Anna", "Katharina", "Felix", "Julia", "Stefan", "Lena"],
                ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Wagner", "Becker", "Hoffmann"]),
    "United Kingdom": (.10, "English", 44, ["James", "Oliver", "Emily", "Charlotte", "George", "Harry", "Sophie", "William"],
                       ["Smith", "Taylor", "Brown", "Wilson", "Davies", "Evans", "Thomas", "Roberts"]),
    "Tunisia": (.14, "Arabic", 216, ["Mohamed", "Ahmed", "Sami", "Yassine", "Amine", "Ines", "Sarra", "Mariem", "Nour", "Rania", "Khaled", "Hela"],
                ["Ben Salah", "Trabelsi", "Gharbi", "Jlassi", "Mejri", "Bouzid", "Khemiri", "Hammami", "Cherif", "Ayari"]),
    "Algeria": (.07, "Arabic", 213, ["Karim", "Samir", "Nadia", "Yasmine", "Mehdi", "Amel", "Rachid", "Lina"],
                ["Benali", "Boudiaf", "Mansouri", "Haddad", "Saidi", "Belkacem"]),
    "Libya": (.05, "Arabic", 218, ["Omar", "Ali", "Fatima", "Salma", "Mahmoud", "Hana"],
              ["Al-Mahdi", "Belhaj", "Elgadi", "Al-Sharif", "Ben Amer"]),
    "Italy": (.06, "Italian", 39, ["Marco", "Giulia", "Luca", "Francesca", "Matteo", "Chiara"],
              ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano"]),
    "United States": (.04, "English", 1, ["Michael", "Jennifer", "David", "Jessica", "Robert", "Ashley"],
                      ["Johnson", "Miller", "Davis", "Anderson", "Clark", "Lewis"]),
    "Saudi Arabia": (.04, "Arabic", 966, ["Abdullah", "Faisal", "Noura", "Sara", "Khalid", "Reem"],
                     ["Al-Harbi", "Al-Qahtani", "Al-Otaibi", "Al-Ghamdi"]),
    "Switzerland": (.03, "German", 41, ["Lukas", "Nina", "Daniel", "Laura"], ["Keller", "Meier", "Huber", "Brunner"]),
    "Netherlands": (.03, "Dutch", 31, ["Jan", "Sanne", "Pieter", "Lotte"], ["de Vries", "Jansen", "van Dijk", "Bakker"]),
    "Belgium": (.03, "French", 32, ["Luc", "Charlotte", "Maxime", "Eline"], ["Peeters", "Janssens", "Maes", "Willems"]),
    "Canada": (.02, "English", 1, ["Liam", "Chloé", "Noah", "Olivia"], ["Tremblay", "Roy", "Gagnon", "Wilson"]),
    "United Arab Emirates": (.02, "Arabic", 971, ["Hamad", "Mariam", "Rashid", "Latifa"],
                             ["Al-Mazrouei", "Al-Suwaidi", "Al-Ketbi", "Al-Marri"]),
    "Spain": (.03, "Spanish", 34, ["Carlos", "Lucía", "Javier", "Marta"], ["García", "Fernández", "López", "Martínez"]),
}
NAT_LIST = list(NATIONS)
NAT_W = [NATIONS[n][0] for n in NAT_LIST]

FB_OUTLETS = [("Le Jasmin Restaurant - dinner", 55, 120), ("Sunset Bar", 15, 55), ("Room service", 30, 110),
              ("Lobby Lounge - afternoon tea", 18, 42), ("Gourmet Restaurant - tasting menu", 120, 220),
              ("Pool Bar & Grill - lunch", 28, 70)]
SPA = [("Massage 60 min", 110), ("Hammam & scrub", 75), ("Signature facial", 130), ("Thalasso session", 160),
       ("Couples ritual", 320), ("Day spa pass", 90)]
EXTRAS = [("Minibar", 25, 70), ("Laundry & pressing", 20, 90), ("Late check-out", 60, 120),
          ("Boutique purchase", 30, 250), ("Flowers & champagne in room", 80, 220)]
MEALS = {"Bed & Breakfast": (0, 0), "Half Board": (55, 25), "Full Board": (95, 40), "All Inclusive": (140, 60)}


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def occ(d, factor):
    f = OCC_TARGET[d.month] * factor
    if d > TODAY:
        ahead = (d - TODAY).days
        f *= 0.75 if ahead <= 30 else 0.55 if ahead <= 90 else 0.35 if ahead <= 180 else 0.2
    return min(f, 0.95)


def pick_channel(check_in):
    while True:
        ch = random.choices(range(len(CHANNELS)), weights=[c[3] for c in CHANNELS])[0]
        if CHANNELS[ch][0] == "Walk-in" and check_in > TODAY:
            continue
        return ch


# ---------------------------------------------------------------- build
if os.path.exists(DB):
    os.remove(DB)
con = sqlite3.connect(DB)
cur = con.cursor()
cur.executescript(SCHEMA)

cur.executemany("INSERT INTO meta VALUES (?,?)", [
    ("hotel_name", "Grand Azur Palace (fictional 5-star hotel)"), ("currency", "EUR"),
    ("data_as_of", TODAY.isoformat()), ("total_rooms", "60"),
    ("note", "Dates before/at data_as_of are realized; later stays are future 'Confirmed' bookings (on the books).")])

rooms = []  # (room_id, number, type_idx)
rid = 0
for ti, rt in enumerate(ROOM_TYPES, start=1):
    cur.execute("INSERT INTO room_types VALUES (?,?,?,?,?,?)", (ti, rt[0], rt[1], rt[2], rt[3], rt[4]))
    per_floor, floor, k = rt[7], rt[6], 0
    for i in range(rt[5]):
        if i and i % per_floor == 0:
            floor += 1
        k = (i % per_floor) + 1
        rid += 1
        number = f"{floor}{k:02d}"
        cur.execute("INSERT INTO rooms VALUES (?,?,?,?,?,1)", (rid, number, ti, floor, rt[8]))
        rooms.append((rid, number, ti))

for i, c in enumerate(CHANNELS, start=1):
    cur.execute("INSERT INTO channels VALUES (?,?,?,?)", (i, c[0], c[1], c[2]))
DEPT = {}
for i, name in enumerate(DEPARTMENTS, start=1):
    cur.execute("INSERT INTO departments VALUES (?,?)", (i, name))
    DEPT[name] = i

d = START
while d <= END:
    cur.execute("INSERT INTO calendar VALUES (?,?,?,?,?,?,?)", (
        d.isoformat(), d.year, d.month, d.strftime("%B"), d.strftime("%A"),
        1 if d.weekday() >= 5 else 0, SEASON_NAME[d.month]))
    d += timedelta(days=1)

# ---- reservations skeleton: walk each room through time
raw = []
for room_id, number, ti in rooms:
    rt = ROOM_TYPES[ti - 1]
    d = START
    while d <= END:
        summer = d.month in (6, 7, 8)
        L = L_SUMMER if summer else L_NORMAL
        f = occ(d, rt[9])
        p = f / (f + L * (1 - f))
        if random.random() >= p:
            d += timedelta(days=1)
            continue
        ch = pick_channel(d)
        cname, _, _, _, rfac, cancel_p, lead_mean = CHANNELS[ch]
        nights = random.choices(NIGHTS, weights=W_SUMMER if summer else W_NORMAL)[0]
        nights = min(nights, (END - d).days + 1)
        check_in, check_out = d, d + timedelta(days=nights)
        cancelled = random.random() < cancel_p
        # rate
        rate = rt[2] * SEASON_MULT[d.month] * rfac * random.uniform(0.95, 1.05)
        if d.weekday() in (4, 5):
            rate *= 1.08
        if (d.month == 12 and d.day >= 24) or (d.month == 1 and d.day <= 2):
            rate *= 1.25
        rate = round(rate)
        # booking date
        lead = 0 if lead_mean == 0 else min(int(random.expovariate(1 / lead_mean)), 300)
        bd = check_in - timedelta(days=lead)
        if bd > TODAY:
            bd = TODAY - timedelta(days=random.randint(0, 20))
        # status
        cancel_date = None
        if cancelled:
            status = "Cancelled"
            latest = min(check_in - timedelta(days=1), TODAY)
            span = max((latest - bd).days, 0)
            cancel_date = (bd + timedelta(days=random.randint(0, span))).isoformat()
        elif check_out <= TODAY:
            status = "No-show" if random.random() < 0.012 else "Checked-out"
        elif check_in <= TODAY:
            status = "In-house"
        else:
            status = "Confirmed"
        # party / purpose / meal plan
        adults = random.choices([1, 2, 3, 4], weights=[18, 64, 12, 6])[0]
        adults = min(adults, rt[3])
        children = 0
        if adults >= 2 and random.random() < 0.2:
            children = min(random.randint(1, 2), rt[3] - adults)
        if cname == "Corporate":
            purpose = random.choices(["Business", "Event"], weights=[85, 15])[0]
        elif cname == "Meetings & Events":
            purpose = "Event"
        else:
            purpose = random.choices(["Leisure", "Honeymoon", "Business", "Event"], weights=[78, 7, 12, 3])[0]
        meal = random.choices(list(MEALS), weights=[55, 25, 8, 12])[0]
        raw.append(dict(room_id=room_id, channel_id=ch + 1, booking_date=bd, check_in=check_in, check_out=check_out,
                        nights=nights, adults=adults, children=children, meal_plan=meal, purpose=purpose,
                        rate=rate, status=status, cancel_date=cancel_date))
        d += timedelta(days=1) if status in ("Cancelled", "No-show") else timedelta(days=nights)

# ---- guests
raw.sort(key=lambda r: (r["check_in"], r["room_id"]))
guests, pool = [], []
for r in raw:
    g = None
    if pool and random.random() < 0.20:
        for _ in range(10):
            cand = random.choice(pool)
            if cand["last_out"] <= r["check_in"]:
                g = cand
                break
    if g is None:
        nat = random.choices(NAT_LIST, weights=NAT_W)[0]
        _, lang, dial, firsts, lasts = NATIONS[nat]
        gid = len(guests) + 1
        first, last = random.choice(firsts), random.choice(lasts)
        g = dict(id=gid, first=first, last=last, nat=nat, lang=lang,
                 email=f"{slug(first)}.{slug(last)}{gid}@example.com",
                 phone=f"+{dial} {random.randint(20000000, 99999999)}",
                 last_out=date(2000, 1, 1), first_booking=r["booking_date"])
        guests.append(g)
    r["guest"] = g
    g["first_booking"] = min(g["first_booking"], r["booking_date"])
    if r["status"] not in ("Cancelled", "No-show"):
        g["last_out"] = r["check_out"]
        pool.append(g)

# ---- reservation ids in booking order
raw.sort(key=lambda r: (r["booking_date"], r["check_in"], r["room_id"]))
charges, payments = [], []


def add_charge(res_id, dept, dt, desc, amt):
    if dt <= TODAY:
        charges.append((res_id, DEPT[dept], dt.isoformat(), desc, round(amt, 2)))


for i, r in enumerate(raw, start=1):
    r["id"] = i
    r["code"] = f"GAP{r['check_in'].year}-{i:05d}"
    if r["status"] not in ("Checked-out", "In-house", "No-show"):
        continue
    if r["status"] == "No-show":
        add_charge(i, "Rooms", r["check_in"], "No-show fee (first night)", r["rate"])
        continue
    nights = [r["check_in"] + timedelta(days=k) for k in range(r["nights"])]
    persons = r["adults"] + 0.5 * r["children"]
    sup_a, sup_c = MEALS[r["meal_plan"]]
    for nd in nights:
        add_charge(i, "Rooms", nd, "Room night", r["rate"])
        if sup_a:
            add_charge(i, "Food & Beverage", nd, f"{r['meal_plan']} supplement", sup_a * r["adults"] + sup_c * r["children"])
        weights = [.6, .3, .1] if r["meal_plan"] == "All Inclusive" else [.5, .35, .15] if sup_a else [.35, .4, .25]
        for _ in range(random.choices([0, 1, 2], weights=weights)[0]):
            name, lo, hi = random.choice(FB_OUTLETS)
            add_charge(i, "Food & Beverage", nd, name, random.uniform(lo, hi) * persons)
    spa_p = {"Honeymoon": .7, "Leisure": .5, "Business": .15, "Event": .15}[r["purpose"]]
    if random.random() < spa_p:
        for _ in range(random.randint(1, 3)):
            name, price = random.choice(SPA)
            mult = 2 if (r["adults"] >= 2 and random.random() < .4) else 1
            add_charge(i, "Spa & Wellness", random.choice(nights), name, price * mult)
    if r["purpose"] == "Event":
        for _ in range(random.randint(1, 2)):
            kind = random.choice(["room", "coffee", "banquet"])
            att = random.randint(15, 60)
            if kind == "room":
                add_charge(i, "Events & Meetings", random.choice(nights), "Meeting room rental - full day", 1200)
            elif kind == "coffee":
                add_charge(i, "Events & Meetings", random.choice(nights), f"Conference breaks & lunch ({att} pax)", random.uniform(25, 45) * att)
            else:
                att = random.randint(20, 120)
                add_charge(i, "Events & Meetings", random.choice(nights), f"Banquet / gala dinner ({att} pax)", random.uniform(70, 110) * att)
    elif r["purpose"] == "Business" and random.random() < .12:
        add_charge(i, "Events & Meetings", random.choice(nights), "Meeting room rental - half day", 600)
    if random.random() < .45:
        for _ in range(random.randint(1, 2)):
            name, lo, hi = random.choice(EXTRAS)
            add_charge(i, "Minibar & Extras", random.choice(nights), name, random.uniform(lo, hi))
    if r["children"] and random.random() < .2:
        add_charge(i, "Minibar & Extras", random.choice(nights), "Babysitting", random.uniform(40, 120))
    if random.random() < .35:
        add_charge(i, "Transport", r["check_in"], "Airport transfer (arrival)", 55)
        add_charge(i, "Transport", r["check_out"], "Airport transfer (departure)", 55)
    if random.random() < .12:
        add_charge(i, "Transport", random.choice(nights), "Excursion (half day)", random.uniform(90, 160) * persons)

# ---- insert guests, reservations, charges
cur.executemany("INSERT INTO guests VALUES (?,?,?,?,?,?,?,?,?)", [
    (g["id"], g["first"], g["last"], g["nat"], g["lang"], g["email"], g["phone"], "Standard", g["first_booking"].isoformat())
    for g in guests])
cur.executemany("INSERT INTO reservations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
    (r["id"], r["code"], r["guest"]["id"], r["room_id"], r["channel_id"], r["booking_date"].isoformat(),
     r["check_in"].isoformat(), r["check_out"].isoformat(), r["nights"], r["adults"], r["children"],
     r["meal_plan"], r["purpose"], r["rate"], r["status"], r["cancel_date"]) for r in raw])
charges.sort(key=lambda c: (c[2], c[0]))
cur.executemany("INSERT INTO folio_charges (reservation_id, department_id, charge_date, description, amount) VALUES (?,?,?,?,?)", charges)

# ---- payments
tot = {}
for c in charges:
    tot[c[0]] = tot.get(c[0], 0) + c[4]
ch_by_id = {i + 1: c for i, c in enumerate(CHANNELS)}


def method_for(ch_name):
    if ch_name == "Corporate" or ch_name == "Meetings & Events":
        return random.choice(["Corporate Invoice", "Bank Transfer"])
    if ch_name in ("Travel Agency", "Tour Operator"):
        return random.choice(["Agency Voucher", "Bank Transfer"])
    if ch_name == "Walk-in":
        return random.choice(["Credit Card", "Cash"])
    return random.choices(["Credit Card", "Cash", "Mobile Payment", "Bank Transfer"], weights=[75, 10, 8, 7])[0]


for r in raw:
    i, ch_name = r["id"], ch_by_id[r["channel_id"]][0]
    m = method_for(ch_name)
    if r["status"] in ("Checked-out", "No-show"):
        total = round(tot.get(i, 0), 2)
        if r["status"] == "Checked-out" and random.random() < .25:
            dep = round(total * .3, 2)
            payments.append((i, r["booking_date"].isoformat(), "Deposit", m, dep))
            total = round(total - dep, 2)
        payments.append((i, r["check_out"].isoformat(), "Final settlement", m, total))
    elif r["status"] == "In-house" and random.random() < .4:
        payments.append((i, r["booking_date"].isoformat(), "Deposit", m, round(r["rate"] * min(r["nights"], 2), 2)))
    elif r["status"] == "Confirmed" and random.random() < .4:
        payments.append((i, r["booking_date"].isoformat(), "Deposit", m, round(r["rate"] * min(r["nights"], 2), 2)))
cur.executemany("INSERT INTO payments (reservation_id, payment_date, payment_type, method, amount) VALUES (?,?,?,?,?)", payments)

# ---- VIP level from realized stays + spend
cur.execute("""
UPDATE guests SET vip_level = (
  SELECT CASE WHEN s.spend >= 15000 OR s.stays >= 6 THEN 'Platinum'
              WHEN s.spend >= 7000 OR s.stays >= 4 THEN 'Gold'
              WHEN s.spend >= 3000 OR s.stays >= 2 THEN 'Silver' ELSE 'Standard' END
  FROM (SELECT g.guest_id gid,
          COUNT(DISTINCT CASE WHEN r.status IN ('Checked-out','In-house') THEN r.reservation_id END) stays,
          COALESCE((SELECT SUM(f.amount) FROM folio_charges f JOIN reservations r2 ON r2.reservation_id=f.reservation_id
                    WHERE r2.guest_id=g.guest_id),0) spend
        FROM guests g LEFT JOIN reservations r ON r.guest_id=g.guest_id GROUP BY g.guest_id) s
  WHERE s.gid = guests.guest_id)""")

cur.executescript(VIEWS)
con.commit()

# ---- dump
with open(DUMP, "w", encoding="utf-8") as fh:
    for line in con.iterdump():
        fh.write(line + "\n")

# ---- report
for t in ["room_types", "rooms", "channels", "departments", "guests", "reservations", "folio_charges", "payments", "calendar"]:
    print(f"{t:15s}{cur.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]:>8}")
con.close()
print("OK ->", DB, "|", DUMP)
