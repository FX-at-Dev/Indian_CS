// File: backend/models/reportModel.js

const { mongoose } = require('../db/mongo');
const { Schema } = mongoose;

const severityEnum = ['Low', 'Medium', 'High', 'Severe', 'Critical'];

const reportSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    
    // --- REPORTER DETAILS ---
    reporterName: { type: String, required: true, trim: true, index: true }, 
    
    // --- REPORT DETAILS ---
    severity: { type: String, required: true, enum: severityEnum, index: true },
    imageUrl: { type: String }, // Primary Image URL
    img: { type: String }, // Old field for backward compatibility
    
    // --- LOCATION ---
    city: { type: String, required: true, trim: true }, // Required for grouping
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    
    // --- STATUS ---
    status: { 
        type: String, 
        default: 'Active', 
        enum: ['Active', 'Closed'], 
        index: true 
    },
    
    // --- PROOF OF CLOSURE FIELDS (NEW) ---
    resolutionImageUrl: { type: String, required: false }, // Proof photo URL/Base64
    resolutionNotes: { type: String, required: false }, // Notes from the official
    
    // --- OTHER FIELDS ---
    votes: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

// Index common query fields
reportSchema.index({ createdAt: -1 });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

/**
 * Report create karta hai.
 */
async function createReport(data) {
    const doc = await Report.create(data); 
    return doc.toObject();
}

/**
 * Saari reports fetch karta hai. (SORT ORDER FIXED: Latest first)
 */
async function fetchAllReports() {
    // FIX: sort({ createdAt: -1 }) ensures latest (newest) documents come first.
    const docs = await Report.find().sort({ createdAt: -1 }).lean(); 

    // MAPPING: Old 'img' field ko naye 'imageUrl' field mein map karte hain
    const mappedDocs = docs.map(r => {
        if (!r.imageUrl && r.img) {
            r.imageUrl = r.img; 
        }
        if (!r.reporterName) {
            r.reporterName = 'Legacy Contributor';
        }
        return r;
    });
    
    return mappedDocs;
}

/**
 * KPIs (Key Performance Indicators) calculate karta hai.
 */
async function computeKPIs() {
    // Ab yeh function bhi latest data ke saath hi kaam karega
    const docs = await fetchAllReports(); 
    const total = docs.length;
    const open = docs.filter((r) => r.status === 'Active').length; 
    const severe = docs.filter((r) => r.severity === 'Severe' || r.severity === 'Critical').length;
    const users = new Set(docs.map((r) => r.reporterName)).size;
    return { total, open, severe, users };
}

/**
 * ID ke through report dhundta hai.
 */
async function findReportById(id) {
    return Report.findById(id);
}


module.exports = { 
    createReport, 
    fetchAllReports, 
    computeKPIs, 
    findReportById, 
    Report 
};