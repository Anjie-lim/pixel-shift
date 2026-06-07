import {
    CHART_CONFIG,
    CHART_MAX_POINTS
} from "./clips.js";

let chartInstance = null;
let dirty = false;

// ==========================================================
// CREATE CHART
// ==========================================================

export function createDifferenceChart(canvasId) {

    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");

    chartInstance = new Chart(ctx, {
        type: "line",

        data: {
            labels: [],
            datasets: [

                // PIXEL DIFFERENCE
                {
                    label: "Pixel Difference %",
                    data: [],
                    borderColor: CHART_CONFIG.pixelDifferenceColor,
                    backgroundColor: CHART_CONFIG.fillColor,
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 0,
                    tension: 0.15
                },

                // THRESHOLD
                {
                    label: "Threshold",
                    data: [],
                    borderColor: CHART_CONFIG.thresholdColor,
                    borderWidth: 2,
                    borderDash: [8, 4],
                    pointRadius: 0,
                    fill: false
                },

                // HUMAN CUTS (SCATTER)
                {
                    label: "Human Cuts",
                    type: "scatter",
                    data: [],
                    parsing: false,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    backgroundColor: CHART_CONFIG.humanMarkerColor,
                    borderColor: CHART_CONFIG.humanMarkerColor
                },

                // SYSTEM CUTS (SCATTER)
                {
                    label: "System Cuts",
                    type: "scatter",
                    data: [],
                    parsing: false,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    backgroundColor: CHART_CONFIG.systemMarkerColor,
                    borderColor: CHART_CONFIG.systemMarkerColor
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,

            interaction: {
                mode: "nearest",
                intersect: false
            },

            plugins: {
                legend: {
                    labels: {
                        color: "#ffffff"
                    }
                }
            },

            scales: {
                x: {
                    ticks: { color: "#9ca8c7" },
                    grid: { color: "rgba(255,255,255,.05)" }
                },

                y: {
                    min: 0,
                    max: 100,
                    ticks: { color: "#9ca8c7" },
                    grid: { color: "rgba(255,255,255,.05)" }
                }
            }
        }
    });

    return chartInstance;
}

// ==========================================================
// FRAME DATA
// ==========================================================

export function addFrameData(frameNumber, difference, threshold) {

    if (!chartInstance) return;

    chartInstance.data.labels.push(frameNumber);
    chartInstance.data.datasets[0].data.push(difference);
    chartInstance.data.datasets[1].data.push(threshold);

    trimChartData();
    scheduleUpdate();
}

// ==========================================================
// MARKERS
// ==========================================================

export function addHumanMarker(frameNumber) {
    if (!chartInstance) return;

    chartInstance.data.datasets[2].data.push({
        x: frameNumber,
        y: 95
    });

    scheduleUpdate();
}

export function addSystemMarker(frameNumber) {
    if (!chartInstance) return;

    chartInstance.data.datasets[3].data.push({
        x: frameNumber,
        y: 90
    });

    scheduleUpdate();
}

// ==========================================================
// THRESHOLD (NO FULL REBUILD)
// ==========================================================

export function updateThreshold(threshold) {
    if (!chartInstance) return;

    chartInstance.data.datasets[1].data.forEach((_, i, arr) => {
        arr[i] = threshold;
    });

    scheduleUpdate();
}

// ==========================================================
// PERFORMANCE TRIM
// ==========================================================

function trimChartData() {

    if (!chartInstance) return;

    while (chartInstance.data.labels.length > CHART_MAX_POINTS) {

        chartInstance.data.labels.shift();

        chartInstance.data.datasets.forEach(ds => {
            ds.data.shift();
        });
    }
}

// ==========================================================
// BATCHED UPDATE (IMPORTANT OPTIMIZATION)
// ==========================================================

function scheduleUpdate() {

    if (dirty) return;

    dirty = true;

    requestAnimationFrame(() => {
        chartInstance.update("none");
        dirty = false;
    });
}

// ==========================================================
// RESET
// ==========================================================

export function resetChart() {

    if (!chartInstance) return;

    chartInstance.data.labels = [];

    chartInstance.data.datasets.forEach(ds => {
        ds.data = [];
    });

    chartInstance.update();
}

// ==========================================================
// EXPORT
// ==========================================================

export function exportChartPNG() {
    if (!chartInstance) return null;
    return chartInstance.toBase64Image();
}

export function downloadChartImage() {

    const img = exportChartPNG();
    if (!img) return;

    const link = document.createElement("a");
    link.href = img;
    link.download = "pixel-shift-chart.png";
    link.click();
}

// ==========================================================
// SUMMARY
// ==========================================================

export function getChartSummary() {

    if (!chartInstance) return null;

    const d = chartInstance.data.datasets[0].data;
    if (!d.length) return null;

    const max = Math.max(...d);
    const min = Math.min(...d);
    const avg = d.reduce((a, b) => a + b, 0) / d.length;

    return {
        maxDifference: max.toFixed(2),
        minDifference: min.toFixed(2),
        averageDifference: avg.toFixed(2)
    };
}

// ==========================================================
// DESTROY
// ==========================================================

export function destroyChart() {
    if (!chartInstance) return;
    chartInstance.destroy();
    chartInstance = null;
}
