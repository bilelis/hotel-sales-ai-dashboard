// High-performance loader for hotel-api database ('hotel')
// Usage: mongosh hotel load_hotel_api_db.js

const fs = require('fs');
const path = 'C:/Users/LOQ/Desktop/project mullti/data base/hotel_mongo_data';

console.log('\n======================================================');
console.log('   MIGRATING HOTEL-API DATA INTO MONGODB ("hotel")');
console.log('======================================================\n');

function revive(val) {
  if (Array.isArray(val)) return val.map(revive);
  if (val && typeof val === 'object') {
    if ('$date' in val) return new Date(val.$date);
    const obj = {};
    for (const [k, v] of Object.entries(val)) obj[k] = revive(v);
    return obj;
  }
  return val;
}

const collections = [
  'meta',
  'daily_kpis',
  'monthly_kpis',
  'department_revenue_monthly',
  'reservations'
];

for (const colName of collections) {
  const filePath = path + '/' + colName + '.ndjson';
  if (!fs.existsSync(filePath)) {
    console.warn('File not found:', filePath);
    continue;
  }
  
  process.stdout.write('Loading ' + colName + '... ');
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
  const docs = lines.map(line => revive(JSON.parse(line)));
  
  const col = db.getCollection(colName);
  col.drop();
  
  const chunkSize = 2500;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    if (chunk.length > 0) {
      col.insertMany(chunk, { ordered: false });
    }
  }
  console.log('✓ ' + docs.length.toLocaleString() + ' docs');
}

console.log('\n[*] Building performance indexes...');
db.daily_kpis.createIndex({ date: 1 });
db.monthly_kpis.createIndex({ year: 1, month: 1 });
db.department_revenue_monthly.createIndex({ yearMonth: 1, department: 1 });
db.reservations.createIndex({ checkIn: 1, checkOut: 1 });
db.reservations.createIndex({ status: 1 });
db.reservations.createIndex({ 'channel.name': 1 });
db.reservations.createIndex({ 'charges.date': 1 });
db.reservations.createIndex({ guestId: 1 });
console.log('✓ Indexes built successfully!\n');

console.log('======================================================');
console.log('   VERIFYING COLLECTION COUNTS IN "hotel"');
console.log('======================================================');
for (const colName of collections) {
  const count = db.getCollection(colName).countDocuments();
  console.log('   • ' + colName.padEnd(30) + ': ' + count.toLocaleString() + ' documents');
}
console.log('\nReady! hotel-api can now connect to mongodb://localhost:27017/hotel');
