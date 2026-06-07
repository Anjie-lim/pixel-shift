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

import { createDetector } from "./detector.js";

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
// DOM REFERENCES (CACHED)
// ==========================================================

const video = document.getElementById("video");
const canvas = document.getElementById("analysisCanvas");

const thresholdSlider = document.getElementById("thresholdSlider");
const speedSlider = document.getElementById("speedSlider");
const presetSelect = document.getElementById("presetSelect");

const liveDifferenceEl = document.getElementById("liveDifference");
const systemFlagsEl = document.getElementById("systemFlagsCount");
const humanFlagsEl = document.getElementById("humanFlagsCount");

const clip1Btn = document.getElementById("clip1Btn");
const clip2Btn = document.getElementById("clip2Btn");
const uploadInput = document.getElementById("videoUpload");

const evaluateBtn = document.getElementById("evaluateBtn");
const resetBtn = document.getElementById("resetSessionBtn");
const exportBtn = document.getElementById("exportCsvBtn");

// ==========================================================
// STATE
// ==========================================================

let state = {
    mode: "clip1",
    clip: CLIPS.clip1,
    frameNumber: 0,
    humanCuts: [],
    detector: null,
    chart: null,
    isPlaying: false,
    initialized: false
};

// ==========================================================
// INIT
// ==========================================================

function init() {
    if (state.initialized) return;
    state.initialized = true;

    state.detector = createDetector(canvas);

    state.chart = createDifferenceChart("differenceChart");

    loadClip("clip1");

    bindEvents();

    loadLeaderboardUI();
}

init();

// ==========================================================
// LOAD CLIP
// ==========================================================

function loadClip(clipId) {
    const clip = CLIPS[clipId];

    state.clip = clip;
    state.frameNumber = 0;
    state.humanCuts = [];

    video.pause();

    resetChart();
    state.detector.reset();

    video.src = clip.file;
    video.load();

    updateStatus(`Loaded: ${clip.title}`);
}

// ==========================================================
// EVENTS
// ==========================================================

function bindEvents() {

    // ------------------------------
    // VIDEO LOOP
    // ------------------------------

    const raf =
        video.requestVideoFrameCallback?.bind(video) ||
        ((cb) => requestAnimationFrame(cb));

    const loop = () => {

        if (video.paused || video.ended) return;

        if (!state.detector) return;

        const fps = state.clip?.fps || 30;
        state.frameNumber = Math.floor(video.currentTime * fps);

        const result =
            state.detector.processFrame(video, state.frameNumber);

        addFrameData(
            state.frameNumber,
            result.difference,
            state.detector.getThreshold()
        );

        if (result.systemCut) {
            addSystemMarker(state.frameNumber);
        }

        // UI updates (cached DOM)
        liveDifferenceEl.textContent =
            `${result.difference}%`;

        systemFlagsEl.textContent =
            state.detector.getSystemFlags().length;

        humanFlagsEl.textContent =
            state.humanCuts.length;

        raf(loop);
    };

    video.addEventListener("play", () => {
        raf(loop);
    });

    // ------------------------------
    // THRESHOLD
    // ------------------------------

    thresholdSlider.addEventListener("input", e => {
        const value = Number(e.target.value);

        state.detector.setThreshold(value);
        updateThreshold(value);
    });

    // ------------------------------
    // SPEED
    // ------------------------------

    speedSlider.addEventListener("input", e => {
        video.playbackRate = Number(e.target.value);
    });

    // ------------------------------
    // PRESET
    // ------------------------------

    presetSelect.addEventListener("change", e => {
        const preset = DETECTION_PRESETS[e.target.value];

        state.detector.setThreshold(preset.threshold);
        state.detector.setCooldown(preset.cooldown);

        thresholdSlider.value = preset.threshold;
        updateThreshold(preset.threshold);
    });

    // ------------------------------
    // HUMAN GROUND TRUTH
    // ------------------------------

    document.addEventListener("keydown", e => {
        if (e.code === "Space") {

            const frame = state.frameNumber;

            if (!state.humanCuts.includes(frame)) {
                state.humanCuts.push(frame);
                addHumanMarker(frame);
            }
        }
    });

    // ------------------------------
    // CLIP SWITCHING
    // ------------------------------

    clip1Btn.addEventListener("click", () => loadClip("clip1"));
    clip2Btn.addEventListener("click", () => loadClip("clip2"));

    // ------------------------------
    // UPLOAD VIDEO
    // ------------------------------

    uploadInput.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;

        video.pause();

        video.src = URL.createObjectURL(file);

        state.clip = null;
        state.humanCuts = [];
        state.frameNumber = 0;

        resetChart();
        state.detector.reset();
    });

    // ------------------------------
    // EVALUATE
    // ------------------------------

    evaluateBtn.addEventListener("click", evaluateSession);

    // ------------------------------
    // RESET
    // ------------------------------

    resetBtn.addEventListener("click", resetSession);

    // ------------------------------
    // EXPORT
    // ------------------------------

    exportBtn.addEventListener("click", () => {
        state.detector.downloadCSV();
    });
}

// ==========================================================
// EVALUATION
// ==========================================================

function evaluateSession() {

    const groundTruth =
        state.clip?.groundTruthCuts?.length
            ? state.clip.groundTruthCuts
            : state.humanCuts;

    const systemFlags =
        state.detector.getSystemFlags();

    const report =
        buildConfusionReport(
            groundTruth,
            systemFlags
        );

    document.getElementById("tp").textContent = report.tp;
    document.getElementById("fp").textContent = report.fp;
    document.getElementById("fn").textContent = report.fn;

    document.getElementById("precision").textContent =
        `${report.precision}%`;

    document.getElementById("recall").textContent =
        `${report.recall}%`;

    document.getElementById("f1score").textContent =
        `${report.f1}%`;

    if (state.clip) {
        const entry =
            buildLeaderboardEntry(
                state.detector.getThreshold(),
                report
            );

        updateLeaderboard(entry);
        loadLeaderboardUI();
    }
}

// ==========================================================
// LEADERBOARD
// ==========================================================

function loadLeaderboardUI() {
    const data = loadLeaderboard();

    const tbody =
        document.querySelector("#leaderboardTable tbody");

    tbody.innerHTML = "";

    data.forEach((entry, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.threshold}</td>
            <td>${entry.f1.toFixed(2)}</td>
            <td>${new Date(entry.timestamp).toLocaleDateString()}</td>
        `;

        tbody.appendChild(row);
    });
}

// ==========================================================
// RESET
// ==========================================================

function resetSession() {
    state.frameNumber = 0;
    state.humanCuts = [];

    state.detector.reset();
    resetChart();

    updateStatus("Session reset");
}

// ==========================================================
// STATUS
// ==========================================================

function updateStatus(msg) {
    const el = document.getElementById("spacebarIndicator");

    if (el) {
        el.textContent = msg;
    }
}
