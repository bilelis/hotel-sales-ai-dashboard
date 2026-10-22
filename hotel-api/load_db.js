import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

function revive(val) {
  if (Array.isArray(val)) return val.map(revive);
  if (val && typeof val === 'object') {
    if ('$date' in val) {
      return new Date(val['$date']);
    }
    const obj = {};
    for (const [k, v] of Object.entries(val)) {
      obj[k] = revive(v);
    }
    return obj;
  }
  return val;
}

async function load() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('hotel_db');

  const collections = [
    'meta',
    'daily_kpis',
    'monthly_kpis',
    'department_revenue_monthly',
    'reservations'
  ];

  const dataDir = path.resolve('../data base/hotel_mongo_data');
  console.log('Reading from:', dataDir);

  for (const colName of collections) {
    const filePath = path.join(dataDir, `${colName}.ndjson`);
    if (!fs.existsSync(filePath)) {
      console.warn('File not found:', filePath);
      continue;
    }
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) continue;
    const lines = raw.split('\n');
    const docs = lines.map(line => revive(JSON.parse(line)));
    const col = db.collection(colName);
    await col.drop().catch(() => {});

    const chunkSize = 2000;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      if (chunk.length > 0) {
        await col.insertMany(chunk, { ordered: false });
      }
    }
    console.log(`Loaded ${colName}: ${docs.length} docs`);
  }

  console.log('Building indexes...');
  await db.collection('daily_kpis').createIndex({ date: 1 });
  await db.collection('monthly_kpis').createIndex({ year: 1, month: 1 });
  await db.collection('department_revenue_monthly').createIndex({ yearMonth: 1, department: 1 });
  await db.collection('reservations').createIndex({ checkIn: 1, checkOut: 1 });
  await db.collection('reservations').createIndex({ status: 1 });
  await db.collection('reservations').createIndex({ 'channel.name': 1 });
  await db.collection('reservations').createIndex({ 'charges.date': 1 });
  await db.collection('reservations').createIndex({ guestId: 1 });
  console.log('Indexes built successfully!');

  // Verify sample types
  const sampleDaily = await db.collection('daily_kpis').findOne();
  console.log('sample daily.date is Date?', sampleDaily.date instanceof Date, sampleDaily.date);

  const sampleRes = await db.collection('reservations').findOne();
  console.log('sample res.checkIn is Date?', sampleRes.checkIn instanceof Date, sampleRes.checkIn);
  console.log('sample res.charges[0].date is Date?', sampleRes.charges[0]?.date instanceof Date, sampleRes.charges[0]?.date);

  await client.close();
}

load().catch(console.error);
