require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// ✅ Import the real hardware service
const { getCurrentMetrics } = require("./Services/metricServices");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ PORT - Should match your .env (3000)
const PORT = process.env.PORT || 3000;

// =======================
// ✅ CONNECT MONGODB
// =======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected to Atlas"))
  .catch(err => {
    console.error("❌ DB Error:", err);
    process.exit(1);
  });

// =======================
// ✅ SCHEMA + MODEL (MODIFIED FOR NEW METRICS)
// =======================
const metricSchema = new mongoose.Schema({
  cpu: Number,
  memory: Number,
  disk: Number,
  // ✅ NEW FIELDS ADDED
  virtual_memory: Number,
  process_count: Number,
  disk_queue: Number,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true // Optimized for graph performance
  }
});

const Metric = mongoose.model("Metric", metricSchema);

// =======================
// ✅ ROOT ROUTE
// =======================
app.get("/", (req, res) => {
  res.send("Backend running with real-time hardware telemetry 🚀");
});

// =======================
// ✅ METRICS (MAIN API) - MODIFIED FOR FULL DATASET
// =======================
app.get("/api/metrics", async (req, res) => {
  try {
    // 1. ✅ Get ACTUAL hardware metrics from your system
    const stats = await getCurrentMetrics();

    // 2. ✅ Save ACTUAL data to MongoDB Atlas automatically
    const savedMetric = await Metric.create(stats);

    // 3. ✅ Return the real stats to your dashboard
    res.json({
      ...stats,
      status: "OK",
      id: savedMetric._id
    });

  } catch (err) {
    console.error("❌ METRICS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch hardware metrics" });
  }
});

// =======================
// ✅ GET HISTORY (For your UI Graphs)
// =======================
app.get("/api/history", async (req, res) => {
  try {
    const data = await Metric.find()
      .sort({ timestamp: -1 })
      .limit(50); // Shows last 50 points

    res.json(data);
  } catch (err) {
    console.error("❌ HISTORY ERROR:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// =======================
// ✅ DELETE OLD DATA (Prevent Atlas Storage limit)
// =======================
app.delete("/api/clean", async (req, res) => {
  try {
    // Deletes everything older than 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Metric.deleteMany({ timestamp: { $lt: yesterday } });
    res.json({ message: "Old logs cleaned successfully" });
  } catch (err) {
    res.status(500).json({ error: "Cleanup failed" });
  }
});

// =======================
// ✅ START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Point your dashboard to http://localhost:${PORT}/api/metrics`);
});