require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const { getCurrentMetrics, getAiSuggestion } = require("./Services/metricServices");

const app = express();

// ✅ CORS (only once)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
  })
);

app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ CONNECT MONGODB (only once)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected to Atlas"))
  .catch((err) => {
    console.error("❌ DB Error:", err);
    process.exit(1);
  });

// ✅ SCHEMA (fixed)
const metricSchema = new mongoose.Schema({
  cpu: Number,
  memory: Number,
  disk: Number,
  virtual_memory: Number,
  process_count: Number,
  disk_queue: Number,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const Metric = mongoose.model("Metric", metricSchema);

// =======================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// =======================
// ✅ METRICS (FIXED)
// =======================
app.get("/api/metrics", async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      const latest = await Metric.findOne().sort({ timestamp: -1 });
      return res.json(latest);
    } else {
      const stats = await getCurrentMetrics();
      await Metric.create(stats);
      return res.json(stats);
    }
  } catch (err) {
    console.error("❌ METRICS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// =======================
// ✅ HISTORY (FIXED)
// =======================
app.get("/api/history", async (req, res) => {
  try {
    const data = await Metric.find()
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// =======================
// ✅ CLEAN OLD DATA
// =======================
app.delete("/api/clean", async (req, res) => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Metric.deleteMany({ timestamp: { $lt: yesterday } });

    res.json({ message: "Old logs cleaned" });
  } catch (err) {
    res.status(500).json({ error: "Cleanup failed" });
  }
});

// =======================
// ✅ AI SUGGESTION
// =======================
app.post("/api/ai-suggestion", async (req, res) => {
  try {
    const { cpu, mem, proc, risk } = req.body;

    const suggestion = await getAiSuggestion(cpu, mem, proc, risk);

    res.json({ suggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

// =======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});