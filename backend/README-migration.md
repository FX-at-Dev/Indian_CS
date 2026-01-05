Migration instructions — MySQL -> MongoDB

Safety first
- Backup your MySQL database (mysqldump or your DB admin tool) before running the migration.
- Run the migration in a staging environment first and verify documents in MongoDB.

Environment
- Ensure MongoDB is reachable. Set `MONGO_URI` in `backend/.env` if you don't use the default `mongodb://127.0.0.1:27017/civic_db`.
- Ensure `backend/.env` contains any MySQL connection vars used by `backend/db/pool.js`.

Install dependencies and run
```powershell
cd backend
npm install
# Dry run first to preview actions (safe):
npm run migrate -- --dry-run
# If the dry run looks good, run the actual migration:
npm run migrate
```

Notes
- The migration uses the `mysql` row id (looks for `id`, `mysql_id`, or `reportId`) and stores it in the `mysqlId` field in MongoDB. That field has a unique sparse index; repeated migrations will upsert by `mysqlId` so running the migration multiple times won't create duplicates.
- Rows without a detectable MySQL id are inserted normally.
-- After verifying the data in MongoDB, you can remove MySQL-specific code and packages (`backend/db/pool.js`, `mysql2`, `sequelize`).
	Note: a backup of the original MySQL pool was saved to `backend/mysql_backup/pool.js` before removal.

Optional improvements
- Add a `--dry-run` that also compares sample documents between MySQL and MongoDB.
- Add detailed logging to a file and progress reporting for very large tables.
- Implement per-row transforms or normalization before insert/upsert.

If you want, I can implement a dry-run that also samples and compares a subset of rows between the two databases.