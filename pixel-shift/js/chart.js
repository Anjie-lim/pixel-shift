// ==========================================================
// Pixel Shift
// js/chart.js
// Chart.js Visualization Layer
// ==========================================================

import {
CHART_CONFIG,
CHART_MAX_POINTS
} from "./clips.js";

let chartInstance = null;

// ==========================================================
// CREATE CHART
// ==========================================================

export function createDifferenceChart(canvasId) {

```
const canvas =
    document.getElementById(canvasId);

const ctx =
    canvas.getContext("2d");

chartInstance = new Chart(ctx, {

    type: "line",

    data: {

        labels: [],

        datasets: [

            // ======================================
            // PIXEL DIFFERENCE
            // ======================================

            {
                label: "Pixel Difference %",

                data: [],

                borderColor:
                    CHART_CONFIG.pixelDifferenceColor,

                backgroundColor:
                    CHART_CONFIG.fillColor,

                borderWidth: 2,

                fill: true,

                pointRadius: 0,

                tension: 0.15
            },

            // ======================================
            // THRESHOLD
            // ======================================

            {
                label: "Threshold",

                data: [],

                borderColor:
                    CHART_CONFIG.thresholdColor,

                borderWidth: 2,

                borderDash: [8, 4],

                pointRadius: 0,

                fill: false
            },

            // ======================================
            // HUMAN CUT MARKERS
            // ======================================

            {
                label: "Human Cuts",

                data: [],

                showLine: false,

                pointRadius: 6,

                pointHoverRadius: 8,

                pointBackgroundColor:
                    CHART_CONFIG.humanMarkerColor,

                pointBorderColor:
                    CHART_CONFIG.humanMarkerColor
            },

            // ======================================
            // SYSTEM CUT MARKERS
            // ======================================

            {
                label: "System Cuts",

                data: [],

                showLine: false,

                pointRadius: 6,

                pointHoverRadius: 8,

                pointBackgroundColor:
                    CHART_CONFIG.systemMarkerColor,

                pointBorderColor:
                    CHART_CONFIG.systemMarkerColor
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
            },

            tooltip: {

                enabled: true
            }
        },

        scales: {

            x: {

                title: {

                    display: true,

                    text: "Frame Number",

                    color: "#ffffff"
                },

                ticks: {

                    color: "#9ca8c7"
                },

                grid: {

                    color:
                        "rgba(255,255,255,.05)"
                }
            },

            y: {

                min: 0,

                max: 100,

                title: {

                    display: true,

                    text: "Pixel Difference %",

                    color: "#ffffff"
                },

                ticks: {

                    color: "#9ca8c7"
                },

                grid: {

                    color:
                        "rgba(255,255,255,.05)"
                }
            }
        }
    }
});

return chartInstance;
```

}

// ==========================================================
// GET CHART
// ==========================================================

export function getChart() {

```
return chartInstance;
```

}

// ==========================================================
// UPDATE LIVE DATA
// ==========================================================

export function addFrameData(
frameNumber,
difference,
threshold
) {

```
if (!chartInstance) return;

chartInstance.data.labels.push(
    frameNumber
);

chartInstance.data.datasets[0]
    .data.push(difference);

chartInstance.data.datasets[1]
    .data.push(threshold);

trimChartData();

chartInstance.update("none");
```

}

// ==========================================================
// HUMAN CUT MARKER
// ==========================================================

export function addHumanMarker(
frameNumber,
value = 95
) {

```
if (!chartInstance) return;

chartInstance.data.datasets[2]
    .data.push({

        x: frameNumber,
        y: value
    });

chartInstance.update("none");
```

}

// ==========================================================
// SYSTEM CUT MARKER
// ==========================================================

export function addSystemMarker(
frameNumber,
value = 90
) {

```
if (!chartInstance) return;

chartInstance.data.datasets[3]
    .data.push({

        x: frameNumber,
        y: value
    });

chartInstance.update("none");
```

}

// ==========================================================
// UPDATE THRESHOLD LINE
// ==========================================================

export function updateThreshold(
threshold
) {

```
if (!chartInstance) return;

const length =
    chartInstance.data.labels.length;

chartInstance.data.datasets[1]
    .data = new Array(length)
    .fill(threshold);

chartInstance.update("none");
```

}

// ==========================================================
// PERFORMANCE TRIMMING
// ==========================================================

function trimChartData() {

```
const labels =
    chartInstance.data.labels;

if (
    labels.length <=
    CHART_MAX_POINTS
) {
    return;
}

labels.shift();

chartInstance
    .data
    .datasets
    .forEach(dataset => {

        if (
            Array.isArray(dataset.data)
        ) {

            dataset.data.shift();

        }

    });
```

}

// ==========================================================
// CLEAR CHART
// ==========================================================

export function resetChart() {

```
if (!chartInstance) return;

chartInstance.data.labels = [];

chartInstance.data.datasets.forEach(
    dataset => {

        dataset.data = [];

    }
);

chartInstance.update();
```

}

// ==========================================================
// LOAD SESSION DATA
// ==========================================================

export function loadHistoricalData(
frameLabels,
differences,
thresholds
) {

```
if (!chartInstance) return;

chartInstance.data.labels =
    frameLabels;

chartInstance.data.datasets[0]
    .data = differences;

chartInstance.data.datasets[1]
    .data = thresholds;

chartInstance.update();
```

}

// ==========================================================
// ZOOM TO FRAME RANGE
// ==========================================================

export function zoomToRange(
startFrame,
endFrame
) {

```
if (!chartInstance) return;

chartInstance.options.scales.x.min =
    startFrame;

chartInstance.options.scales.x.max =
    endFrame;

chartInstance.update();
```

}

// ==========================================================
// RESET ZOOM
// ==========================================================

export function resetZoom() {

```
if (!chartInstance) return;

chartInstance.options.scales.x.min =
    undefined;

chartInstance.options.scales.x.max =
    undefined;

chartInstance.update();
```

}

// ==========================================================
// EXPORT CHART IMAGE
// ==========================================================

export function exportChartPNG() {

```
if (!chartInstance) return null;

return chartInstance
    .toBase64Image();
```

}

// ==========================================================
// SAVE IMAGE
// ==========================================================

export function downloadChartImage() {

```
const image =
    exportChartPNG();

if (!image) return;

const link =
    document.createElement("a");

link.href = image;

link.download =
    "pixel-shift-chart.png";

link.click();
```

}

// ==========================================================
// LIVE ANNOTATION
// ==========================================================

export function annotateCut(
frameNumber,
type
) {

```
if (type === "human") {

    addHumanMarker(frameNumber);

}

if (type === "system") {

    addSystemMarker(frameNumber);

}
```

}

// ==========================================================
// SUMMARY DATA
// ==========================================================

export function getChartSummary() {

```
if (!chartInstance) {

    return null;
}

const differences =
    chartInstance.data
        .datasets[0]
        .data;

if (
    differences.length === 0
) {

    return null;
}

const max =
    Math.max(...differences);

const min =
    Math.min(...differences);

const avg =
    differences.reduce(
        (a, b) => a + b,
        0
    ) / differences.length;

return {

    maxDifference:
        max.toFixed(2),

    minDifference:
        min.toFixed(2),

    averageDifference:
        avg.toFixed(2)
};
```

}

// ==========================================================
// DESTROY CHART
// ==========================================================

export function destroyChart() {

```
if (!chartInstance) return;

chartInstance.destroy();

chartInstance = null;
```

}

// ==========================================================
// END OF FILE
// ==========================================================
