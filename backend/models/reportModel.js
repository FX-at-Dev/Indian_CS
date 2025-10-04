const { mongoose } = require('../db/mongo');
const { Schema } = mongoose;

const severityEnum = ['Low', 'Medium', 'High', 'Severe', 'Critical'];

const emailRegex = /.+@.+\..+/;

const reportSchema = new Schema({
  // original relational primary key (optional)
  mysqlId: { type: Number, index: true, sparse: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  email: { type: String, required: true, match: emailRegex, index: true },
  severity: { type: String, required: true, enum: severityEnum, index: true },
  img: { type: String },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  status: { type: String, default: 'Open', index: true },
  votes: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

// Index common query fields
reportSchema.index({ createdAt: -1 });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

async function createReport(data) {
  const doc = await Report.create(data);
  return doc.toObject();
}

async function fetchAllReports() {
  const docs = await Report.find().sort({ createdAt: -1 }).lean();
  return docs;
}

async function computeKPIs() {
  const docs = await Report.find().lean();
  const total = docs.length;
  const open = docs.filter((r) => r.status === 'Open').length;
  const severe = docs.filter((r) => r.severity === 'Severe' || r.severity === 'Critical').length;
  const users = new Set(docs.map((r) => r.email)).size;
  return { total, open, severe, users };
}

module.exports = { createReport, fetchAllReports, computeKPIs, Report };
