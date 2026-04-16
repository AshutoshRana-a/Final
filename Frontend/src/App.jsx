import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from "recharts";

export default function App() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);

  // ✅ Connects to your Backend on Port 3000
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // 🔥 UPDATED: Advanced Risk Calculation (Includes new metrics)
  const calculateRisk = (cpu, memory, disk, vMem) => {
    const maxVal = Math.max(cpu, memory, disk, vMem);
    if (maxVal > 87) return "HIGH";
    if (maxVal > 60) return "MEDIUM";
    return "LOW";
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/metrics`);
      const data = res.data;

      const cpu = Number(data.cpu) || 0;
      const memory = Number(data.memory) || 0;
      const disk = Number(data.disk) || 0;
      const vMem = Number(data.virtual_memory) || 0; // ✅ New
      const pCount = Number(data.process_count) || 0; // ✅ New
      const dQueue = Number(data.disk_queue) || 0; // ✅ New

      const currentRisk = calculateRisk(cpu, memory, disk, vMem);

      const safeData = {
        cpu, memory, disk, vMem, pCount, dQueue,
        risk: currentRisk,
        message: currentRisk === "HIGH" 
          ? "⚠️ High system load: Consider closing heavy applications." 
          : currentRisk === "MEDIUM" 
          ? "🔔 Moderate load: Performance may be impacted."
          : "✅ System stable: Optimal performance.",
        processes: [
          { name: "CPU", value: cpu },
          { name: "RAM", value: memory },
          { name: "Disk", value: disk },
          { name: "V-Mem", value: vMem }
        ],
      };

      setMetrics(safeData);

      setHistory((prev) => [
        ...prev.slice(-29),
        {
          time: new Date().toLocaleTimeString(),
          cpu, memory, disk, vMem
        },
      ]);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/history`);
      const formatted = res.data.map((item) => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
        cpu: item.cpu,
        memory: item.memory,
        disk: item.disk,
        vMem: item.virtual_memory
      }));
      setHistory(formatted.reverse().slice(-30));
    } catch (err) {
      console.error("Database history error:", err);
    }
  };

  useEffect(() => {
    fetchHistory(); 
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="h-screen flex items-center justify-center text-xl animate-pulse">
        Connecting to Hardware Telemetry...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* HEADER */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Load Dashboard 🚀</h1>
          <p className="text-gray-500 text-sm">Monitoring: Dell G15 Ryzen Edition</p>
        </div>

        <div className={`px-6 py-2 rounded-full font-bold border-2 ${
            metrics.risk === "HIGH" ? "bg-red-50 border-red-200 text-red-600" : 
            metrics.risk === "MEDIUM" ? "bg-yellow-50 border-yellow-200 text-yellow-600" : 
            "bg-green-50 border-green-200 text-green-600"
          }`}>
          {metrics.risk}
        </div>
      </div>

      {/* METRIC CARDS (Expanded Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
        <Metric label="CPU" value={metrics.cpu} color="blue" />
        <Metric label="Memory" value={metrics.memory} color="purple" />
        <Metric label="Disk" value={metrics.disk} color="emerald" />
        <Metric label="Virtual Mem" value={metrics.vMem} color="orange" />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <p className="text-gray-500 font-medium mb-1 text-sm">Active Processes</p>
          <p className="text-3xl font-bold text-gray-800">{metrics.pCount}</p>
          <p className="text-xs text-gray-400 mt-2">Queue Length: {metrics.dQueue}</p>
        </div>
      </div>

      {/* AI RECOMMENDATION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <h2 className="font-bold text-gray-700 mb-3 text-lg">Intelligent Decision Support</h2>
        <p className={`p-4 rounded-xl font-medium ${
            metrics.risk === "HIGH" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
        }`}>
          {metrics.message}
        </p>
      </div>

      {/* VISUALIZATIONS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-700 mb-4">Live Performance Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={3} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="vMem" stroke="#f97316" strokeWidth={3} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-700 mb-4">Resource Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.processes}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  const colorMap = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    orange: "bg-orange-500"
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-end mb-4">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="text-2xl font-bold">{value}%</span>
      </div>
      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${colorMap[color] || "bg-blue-500"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}