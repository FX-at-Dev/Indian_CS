// Script to update all reports with missing or null city field
// Usage: node backend/scripts/fix_missing_city.js

const { Report } = require('../models/reportModel');
const mongo = require('../db/mongo');

// Default city to assign if missing
const DEFAULT_CITY = 'Unknown City';

async function fixReports() {
  await mongo.connect();
  const result = await Report.updateMany(
    { $or: [ { city: { $exists: false } }, { city: null }, { city: '' } ] },
    { $set: { city: DEFAULT_CITY } }
  );
  console.log(`Updated ${result.modifiedCount || result.nModified} reports with missing city.`);
  process.exit(0);
}

fixReports().catch(err => {
  console.error('Error updating reports:', err);
  process.exit(1);
});
