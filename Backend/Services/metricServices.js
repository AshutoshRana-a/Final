const si = require("systeminformation");

async function getCurrentMetrics() {
    try {
        // Parallel fetching of all hardware data for maximum efficiency
        const [cpu, mem, disk, processes] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize(),
            si.processes()
        ]);

        return {
            // ✅ CPU: Smoother calculation for Task Manager alignment
            cpu: parseFloat(cpu.currentLoad.toFixed(1)),

            // ✅ RAM: Percentage of physical memory in use
            memory: parseFloat(((mem.active / mem.total) * 100).toFixed(1)),

            // ✅ Virtual Memory: Percentage of swap space in use
            virtual_memory: parseFloat(((mem.swapused / mem.swaptotal) * 100 || 0).toFixed(1)),

            // ✅ Disk: Primary partition usage percentage
            disk: parseFloat((disk[0]?.use || 0).toFixed(1)),

            // ✅ Processes: Total count of active system processes
            process_count: processes.all,

            // ✅ Timestamp: ISO string for accurate time-series tracking
            timestamp: new Date()
        };

    } catch (e) {
        console.error("❌ Hardware Metrics Error:", e);
        return { 
            cpu: 0, 
            memory: 0, 
            disk: 0, 
            virtual_memory: 0, 
            process_count: 0, 
            timestamp: new Date() 
        };
    }
}

module.exports = { getCurrentMetrics };