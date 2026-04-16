const mongoose = require("mongoose");

const metricSchema = new mongoose.Schema({
  cpu: Number,
  memory: Number,
  disk: Number,
  // ✅ NEW FIELDS TO MATCH DATACOLLECT.JS
  virtual_memory: Number,
  process_count: Number,
  disk_queue: Number,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true // Helps with faster graph loading
  }
});

module.exports = mongoose.model("Metric", metricSchema);