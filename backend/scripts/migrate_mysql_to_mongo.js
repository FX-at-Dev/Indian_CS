const pool = require('../db/pool');
const mongo = require('../db/mongo');
const { Report } = require('../models/reportModel');

async function migrate() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  // --sample-compare or --sample-compare=NUM (works only in dry-run)
  const sampleCompareArg = args.find((a) => a.startsWith('--sample-compare'));
  const sampleCompare = !!sampleCompareArg;
  let sampleSize = 5;
  if (sampleCompareArg && sampleCompareArg.includes('=')) {
    const v = parseInt(sampleCompareArg.split('=')[1], 10);
    if (!Number.isNaN(v) && v > 0) sampleSize = v;
  }

  // Connect to Mongo only when not doing a dry-run (we don't need writes for dry-run)
  // Connect to Mongo if we're actually running (to perform writes),
  // or when we requested a sample-compare during a dry-run (read-only checks).
  if (!dryRun || sampleCompare) {
    await mongo.connect();
    console.log('Connected to MongoDB for migration' + (dryRun ? ' (sample-compare mode)' : ''));
  } else {
    console.log('Dry run: skipping MongoDB connection');
  }

  // Read from MySQL (ensure pool exists)
  let rows = [];
  try {
    if (!pool || !pool.execute) throw new Error('MySQL pool missing');
    const res = await pool.execute('SELECT * FROM reports');
    rows = res[0] || [];
  } catch (err) {
    console.error('MySQL pool not available. It looks like MySQL artifacts were removed.');
    console.error('If you intentionally removed MySQL, the migration is complete and this script can be retired.');
    console.error('A backup of the original pool was saved to `backend/mysql_backup/pool.js`.');
    process.exit(0);
  }

  if (!rows || rows.length === 0) {
    console.log('No rows found in MySQL `reports` table.');
    process.exit(0);
  }

  // Transform into bulk upsert operations keyed by MySQL id
  const ops = rows.map((r) => {
    const doc = {
      mysqlId: r.id || r.mysql_id || r.reportId || null,
      title: r.title,
      description: r.description,
      email: r.email,
      severity: r.severity,
      img: r.img,
      lat: Number(r.lat),
      lng: Number(r.lng),
      status: r.status || 'Open',
      votes: Number(r.votes) || 0,
      createdAt: r.createdAt || new Date(),
      updatedAt: r.updatedAt || new Date(),
    };

    // ensure we have a mysqlId to upsert by
    const key = doc.mysqlId;
    if (!key) {
      // fallback: insert as-is (no upsert key)
      return { insertOne: { document: doc } };
    }

    return {
      updateOne: {
        filter: { mysqlId: key },
        update: { $set: doc },
        upsert: true,
      },
    };
  });

  try {
    if (dryRun) {
      console.log('Dry run enabled. The following operations would be performed:');
      console.log(`Total rows: ${rows.length}`);
      const upserts = ops.filter((o) => o.updateOne).length;
      const inserts = ops.filter((o) => o.insertOne).length;
      console.log(`Upserts: ${upserts}, Inserts: ${inserts}`);

      if (sampleCompare) {
        // perform sample comparisons between MySQL rows and Mongo documents
        console.log(`Running sample-compare on ${sampleSize} rows...`);

        // helper: pick random sample without replacement
        function pickSample(array, n) {
          const copy = array.slice();
          for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
          }
          return copy.slice(0, Math.min(n, copy.length));
        }

        const sampleRows = pickSample(rows, sampleSize);
        let foundCount = 0;
        let diffCount = 0;

        for (const r of sampleRows) {
          const key = r.id || r.mysql_id || r.reportId || null;
          const mysqlDoc = {
            mysqlId: key,
            title: r.title,
            description: r.description,
            email: r.email,
            severity: r.severity,
            img: r.img,
            lat: Number(r.lat),
            lng: Number(r.lng),
            status: r.status || 'Active',
            votes: Number(r.votes) || 0,
          };

          let mongoDoc = null;
          if (key) {
            mongoDoc = await Report.findOne({ mysqlId: key }).lean();
          } else {
            // fallback: try match by title and createdAt (best-effort)
            mongoDoc = await Report.findOne({ title: mysqlDoc.title }).lean();
          }

          console.log('\n--- Sample compare for MySQL id:', key || '(no id)', 'title:', mysqlDoc.title, '---');
          if (!mongoDoc) {
            console.log('  -> No matching document found in MongoDB.');
            continue;
          }

          foundCount++;

          // fields to compare
          const fields = ['title', 'description', 'email', 'severity', 'img', 'lat', 'lng', 'status', 'votes'];
          const diffs = [];
          for (const f of fields) {
            const a = mysqlDoc[f];
            const b = mongoDoc[f];
            // normalize numbers to Number for comparison
            const na = typeof a === 'number' ? a : (a === undefined || a === null ? a : (isNaN(Number(a)) ? a : Number(a)));
            const nb = typeof b === 'number' ? b : (b === undefined || b === null ? b : (isNaN(Number(b)) ? b : Number(b)));
            if (na !== nb) {
              diffs.push({ field: f, mysql: a, mongo: b });
            }
          }

          if (diffs.length === 0) {
            console.log('  -> OK: documents match for compared fields');
          } else {
            diffCount += diffs.length;
            console.log('  -> Differences found:');
            for (const d of diffs) {
              console.log(`     - ${d.field}: mysql=${JSON.stringify(d.mysql)} mongo=${JSON.stringify(d.mongo)}`);
            }
          }
        }

        console.log(`\nSample-compare summary: samples checked=${sampleRows.length}, found in Mongo=${foundCount}, differing field-count=${diffCount}`);
      } else {
        // show a small sample of operations
        console.log('Sample operation:', JSON.stringify(ops.slice(0, 3), null, 2));
      }
    } else {
      // Interactive pre-check: compare counts
      const [mongoCount, mysqlCount] = await Promise.all([
        Report.countDocuments().catch(() => 0),
        Promise.resolve(rows.length),
      ]);

      console.log('MySQL rows to migrate:', mysqlCount);
      console.log('Existing Mongo documents in reports collection:', mongoCount);
  console.log('This operation will upsert by `mysqlId` where available.');

      // prompt for confirmation
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

      const answer = await new Promise((resolve) => {
        rl.question('Type YES to proceed with migration: ', (ans) => {
          rl.close();
          resolve(ans || '');
        });
      });

      if (answer.trim() !== 'YES') {
        console.log('Migration aborted by user.');
      } else {
        const res = await Report.bulkWrite(ops, { ordered: false });
        console.log('BulkWrite result:', res);
      }
    }
  } catch (err) {
    console.error('bulkWrite error:', err.message || err);
  } finally {
    process.exit(0);
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
