// ==========================================================
// Pixel Shift
// js/app.js
// MAIN APPLICATION CONTROLLER (GLUE LAYER)
// ==========================================================

import {
CLIPS,
DETECTION_PRESETS,
DEFAULT_SESSION
} from "./clips.js";

import {
createDetector
} from "./detector.js";

import {
createDifferenceChart,
addFrameData,
addHumanMarker,
addSystemMarker,
updateThreshold,
resetChart
} from "./chart.js";

import {
evaluateDetection,
computeMetrics,
buildConfusionReport,
buildLeaderboardEntry,
loadLeaderboard,
updateLeaderboard,
exportEvaluationCSV
} from "./evaluator.js";

// ==========================================================
// DOM REFERENCES
// ==========================================================

const video =
document.getElementById("video");

const canvas =
document.getElementById("analysisCanvas");

const thresholdSlider =
document.getElementById("thresholdSlider");

const speedSlider =
document.getElementById("speedSlider");

const presetSelect =
document.getElementById("presetSelect");

// ==========================================================
// STATE
// ==========================================================

let state = {

```
mode: "clip1",

clip: CLIPS.clip1,

frameNumber: 0,

humanCuts: [],

detector: null,

chart: null,

isPlaying: false
```

};

// ==========================================================
// INIT
// ==========================================================

function init() {

```
state.detector =
    createDetector(canvas);

state.chart =
    createDifferenceChart(
        "differenceChart"
    );

loadClip("clip1");

bindEvents();

loadLeaderboardUI();
```

}

init();

// ==========================================================
// LOAD CLIP
// ==========================================================

function loadClip(clipId) {

```
const clip =
    CLIPS[clipId];

state.clip = clip;
state.frameNumber = 0;
state.humanCuts = [];

resetChart();
state.detector.reset();

video.src = clip.file;

video.load();

updateStatus(`Loaded: ${clip.title}`);
```

}

// ==========================================================
// EVENTS
// ==========================================================

function bindEvents() {

```
// ------------------------------------------
// VIDEO PLAY LOOP
// ------------------------------------------

video.addEventListener("play", () => {

    requestFrameLoop();

});

// ------------------------------------------
// THRESHOLD
// ------------------------------------------

thresholdSlider.addEventListener(
    "input",
    e => {

        const value =
            Number(e.target.value);

        state.detector.setThreshold(value);

        updateThreshold(value);

    }
);

// ------------------------------------------
// SPEED CONTROL
// ------------------------------------------

speedSlider.addEventListener(
    "input",
    e => {

        video.playbackRate =
            Number(e.target.value);

    }
);

// ------------------------------------------
// PRESET SELECTION
// ------------------------------------------

presetSelect.addEventListener(
    "change",
    e => {

        const preset =
            DETECTION_PRESETS[
                e.target.value
            ];

        state.detector.setThreshold(
            preset.threshold
        );

        state.detector.setCooldown(
            preset.cooldown
        );

        thresholdSlider.value =
            preset.threshold;

        updateThreshold(
            preset.threshold
        );

    }
);

// ------------------------------------------
// HUMAN GROUND TRUTH INPUT
// ------------------------------------------

document.addEventListener(
    "keydown",
    e => {

        if (
            e.code === "Space"
        ) {

            state.humanCuts.push(
                state.frameNumber
            );

            addHumanMarker(
                state.frameNumber
            );
        }
    }
);

// ------------------------------------------
// CLIP SWITCHING
// ------------------------------------------

document
    .getElementById("clip1Btn")
    .addEventListener(
        "click",
        () => loadClip("clip1")
    );

document
    .getElementById("clip2Btn")
    .addEventListener(
        "click",
        () => loadClip("clip2")
    );

// ------------------------------------------
// UPLOAD CUSTOM VIDEO
// ------------------------------------------

document
    .getElementById("videoUpload")
    .addEventListener(
        "change",
        e => {

            const file =
                e.target.files[0];

            if (!file) return;

            video.src =
                URL.createObjectURL(file);

            state.clip = null;

            state.humanCuts = [];

            resetChart();

            state.detector.reset();

        }
    );

// ------------------------------------------
// EVALUATE
// ------------------------------------------

document
    .getElementById("evaluateBtn")
    .addEventListener(
        "click",
        evaluateSession
    );

// ------------------------------------------
// RESET
// ------------------------------------------

document
    .getElementById("resetSessionBtn")
    .addEventListener(
        "click",
        resetSession
    );

// ------------------------------------------
// CSV EXPORT
// ------------------------------------------

document
    .getElementById("exportCsvBtn")
    .addEventListener(
        "click",
        () => {

            state.detector.downloadCSV();

        }
    );
```

}

// ==========================================================
// FRAME LOOP
// ==========================================================

function requestFrameLoop() {

```
const loop = () => {

    if (
        video.paused ||
        video.ended
    ) {
        return;
    }

    state.frameNumber++;

    const result =
        state.detector.processFrame(
            video,
            state.frameNumber
        );

    // --------------------------------------
    // UPDATE CHART
    // --------------------------------------

    addFrameData(
        state.frameNumber,
        result.difference,
        state.detector.getThreshold()
    );

    if (result.systemCut) {

        addSystemMarker(
            state.frameNumber
        );
    }

    // --------------------------------------
    // LIVE UI
    // --------------------------------------

    document.getElementById(
        "liveDifference"
    ).textContent =
        `${result.difference}%`;

    document.getElementById(
        "systemFlagsCount"
    ).textContent =
        state.detector.getSystemFlags().length;

    document.getElementById(
        "humanFlagsCount"
    ).textContent =
        state.humanCuts.length;

    // --------------------------------------

    requestVideoFrameCallback(loop);
};

requestVideoFrameCallback(loop);
```

}

// ==========================================================
// EVALUATION
// ==========================================================

function evaluateSession() {

```
let groundTruth =
    state.clip
        ? state.clip.groundTruthCuts
        : state.humanCuts;

const systemFlags =
    state.detector.getSystemFlags();

const report =
    buildConfusionReport(
        groundTruth,
        systemFlags
    );

// UPDATE UI
document.getElementById("tp").textContent =
    report.tp;

document.getElementById("fp").textContent =
    report.fp;

document.getElementById("fn").textContent =
    report.fn;

document.getElementById("precision").textContent =
    `${report.precision}%`;

document.getElementById("recall").textContent =
    `${report.recall}%`;

document.getElementById("f1score").textContent =
    `${report.f1}%`;

// LEADERBOARD
if (state.clip) {

    const entry =
        buildLeaderboardEntry(
            state.detector.getThreshold(),
            report
        );

    updateLeaderboard(entry);

    loadLeaderboardUI();
}
```

}

// ==========================================================
// LEADERBOARD UI
// ==========================================================

function loadLeaderboardUI() {

```
const data =
    loadLeaderboard();

const tbody =
    document.querySelector(
        "#leaderboardTable tbody"
    );

tbody.innerHTML = "";

data.forEach((entry, index) => {

    const row =
        document.createElement("tr");

    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.threshold}</td>
        <td>${entry.f1.toFixed(2)}</td>
        <td>${new Date(entry.timestamp).toLocaleDateString()}</td>
    `;

    tbody.appendChild(row);

});
```

}

// ==========================================================
// RESET SESSION
// ==========================================================

function resetSession() {

```
state.frameNumber = 0;

state.humanCuts = [];

state.detector.reset();

resetChart();

updateStatus("Session reset");
```

}

// ==========================================================
// STATUS
// ==========================================================

function updateStatus(msg) {

```
const el =
    document.getElementById(
        "spacebarIndicator"
    );

if (el) {

    el.textContent = msg;

}
```

}

// ==========================================================
// END OF FILE
// ==========================================================
