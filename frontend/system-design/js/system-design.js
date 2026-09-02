// Interactive System Design Calculator & Search Engine
document.addEventListener('DOMContentLoaded', () => {
    initSearchFilter();
    initCapacityCalculator();
});

// 🔍 1. Real-time Search Filter across all tables and cards
function initSearchFilter() {
    const searchInput = document.getElementById('sd-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        // Filter cards
        document.querySelectorAll('.sd-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = (query === '' || text.includes(query)) ? 'block' : 'none';
        });

        // Filter table rows
        document.querySelectorAll('.sd-table tbody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = (query === '' || text.includes(query)) ? '' : 'none';
        });
    });
}

// 🧮 2. Interactive System Design Capacity & Scale Estimator
function initCapacityCalculator() {
    const dauInput = document.getElementById('calc-dau');
    const readsInput = document.getElementById('calc-reads');
    const writesInput = document.getElementById('calc-writes');
    const sizeInput = document.getElementById('calc-size');

    function calculate() {
        const dau = parseFloat(dauInput.value) || 0; // In Millions (e.g. 10 = 10M)
        const readsPerUser = parseFloat(readsInput.value) || 0;
        const writesPerUser = parseFloat(writesInput.value) || 0;
        const payloadKB = parseFloat(sizeInput.value) || 0;

        const totalUsers = dau * 1_000_000;
        const SECONDS_PER_DAY = 86_400;

        // Daily operations
        const dailyReads = totalUsers * readsPerUser;
        const dailyWrites = totalUsers * writesPerUser;

        // QPS (Queries Per Second)
        const readQps = Math.round(dailyReads / SECONDS_PER_DAY);
        const peakReadQps = Math.round(readQps * 2.5); // Peak multiplier

        const writeQps = Math.round(dailyWrites / SECONDS_PER_DAY);
        const peakWriteQps = Math.round(writeQps * 2.5);

        // Storage Calculations
        const dailyStorageBytes = dailyWrites * (payloadKB * 1024);
        const dailyStorageGB = (dailyStorageBytes / (1024 ** 3)).toFixed(2);
        const yearlyStorageTB = ((dailyStorageBytes * 365) / (1024 ** 4)).toFixed(2);
        const fiveYearStorageTB = (parseFloat(yearlyStorageTB) * 5).toFixed(2);

        // 80/20 Caching (Cache 20% of daily reads in RAM)
        const cacheBytes = (dailyReads * 0.20) * (payloadKB * 1024);
        const cacheGB = (cacheBytes / (1024 ** 3)).toFixed(1);

        // Network Bandwidth (Ingress & Egress)
        const ingressBytesSec = writeQps * (payloadKB * 1024);
        const ingressMbps = ((ingressBytesSec * 8) / (1000 ** 2)).toFixed(2);

        const egressBytesSec = readQps * (payloadKB * 1024);
        const egressMbps = ((egressBytesSec * 8) / (1000 ** 2)).toFixed(2);
        const egressGbps = (parseFloat(egressMbps) / 1000).toFixed(2);

        // Recommended Node Estimations (based on modern 2026 specs)
        // App server: ~10,000 QPS per standard 16-vCPU instance
        const recommendedAppServers = Math.max(2, Math.ceil(peakReadQps / 8000));
        // Redis instances (50 GB per node)
        const recommendedRedisNodes = Math.max(1, Math.ceil(parseFloat(cacheGB) / 50));

        // Update DOM
        document.getElementById('res-read-qps').textContent = `${readQps.toLocaleString()} QPS`;
        document.getElementById('res-peak-read-qps').textContent = `Peak: ~${peakReadQps.toLocaleString()} QPS`;

        document.getElementById('res-write-qps').textContent = `${writeQps.toLocaleString()} QPS`;
        document.getElementById('res-peak-write-qps').textContent = `Peak: ~${peakWriteQps.toLocaleString()} QPS`;

        document.getElementById('res-storage-daily').textContent = `${dailyStorageGB} GB / day`;
        document.getElementById('res-storage-yearly').textContent = `${yearlyStorageTB} TB / yr (5-Yr: ${fiveYearStorageTB} TB)`;

        document.getElementById('res-cache-ram').textContent = `${cacheGB} GB RAM`;
        document.getElementById('res-cache-nodes').textContent = `~${recommendedRedisNodes} Redis Cluster Node(s)`;

        document.getElementById('res-bandwidth-egress').textContent = parseFloat(egressGbps) >= 1 ? `${egressGbps} Gbps` : `${egressMbps} Mbps`;
        document.getElementById('res-bandwidth-ingress').textContent = `Ingress: ${ingressMbps} Mbps`;

        document.getElementById('res-recommended-servers').textContent = `${recommendedAppServers} App Nodes (Auto-scaled)`;
    }

    [dauInput, readsInput, writesInput, sizeInput].forEach(inp => {
        if (inp) inp.addEventListener('input', calculate);
    });

    // Run initial calculation
    calculate();
}
