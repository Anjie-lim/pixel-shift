// ==========================================================
// Pixel Shift
// js/detector.js
// Computer Vision Engine (FIXED VERSION)
// ==========================================================

import { DETECTION_COOLDOWN } from "./clips.js";

// ==========================================================
// PIXEL DETECTOR
// ==========================================================

export class PixelDetector {

    constructor(canvas) {

        this.canvas = canvas;

        this.ctx = canvas.getContext("2d", {
            willReadFrequently: true
        });

        // ------------------------------
        // Detection State
        // ------------------------------

        this.threshold = 25;
        this.cooldown = DETECTION_COOLDOWN;
        this.cooldownCounter = 0;

        this.systemFlags = [];

        this.frameHistory = [];
        this.maxHistory = 10000;

        this.currentFrame = 0;

        this.previousImageData = null;

        this.lastDifference = 0;

        // ------------------------------
        // Visualization
        // ------------------------------

        this.heatmapEnabled = false;
        this.canvasVisible = false;

        // ------------------------------
        // Performance
        // ------------------------------

        this.sampleStep = 12;
    }

    // ======================================================
    // SETTINGS
    // ======================================================

    setThreshold(value) {
        this.threshold = Number(value);
    }

    setCooldown(value) {
        this.cooldown = Number(value);
    }

    setSamplingRate(value) {
        this.sampleStep = Number(value);
    }

    toggleHeatmap() {
        this.heatmapEnabled = !this.heatmapEnabled;
        return this.heatmapEnabled;
    }

    toggleCanvas() {
        this.canvasVisible = !this.canvasVisible;
        return this.canvasVisible;
    }

    // ======================================================
    // RESET
    // ======================================================

    reset() {
        this.currentFrame = 0;
        this.cooldownCounter = 0;
        this.systemFlags = [];
        this.frameHistory = [];
        this.previousImageData = null;
        this.lastDifference = 0;
    }

    // ======================================================
    // FRAME PROCESSING
    // ======================================================

    processFrame(video, frameNumber) {

        if (!video.videoWidth || !video.videoHeight) {
            return { difference: 0, systemCut: false };
        }

        this.currentFrame = frameNumber;

        this.prepareCanvas(video);

        const imageData = this.captureFrame();

        if (!this.previousImageData) {
            this.previousImageData = imageData;

            return { difference: 0, systemCut: false };
        }

        const result = this.compareFrames(
            this.previousImageData,
            imageData
        );

        this.previousImageData = imageData;
        this.lastDifference = result.difference;

        const cutDetected = this.handleDetection(
            result.difference,
            frameNumber
        );

        this.storeHistory(
            frameNumber,
            result.difference,
            cutDetected
        );

        return {
            difference: result.difference,
            systemCut: cutDetected,
            changedPixels: result.changedPixels
        };
    }

    // ======================================================
    // CANVAS PREPARATION
    // ======================================================

    prepareCanvas(video) {

        if (
            this.canvas.width !== video.videoWidth ||
            this.canvas.height !== video.videoHeight
        ) {
            this.canvas.width = video.videoWidth;
            this.canvas.height = video.videoHeight;
        }

        this.ctx.drawImage(
            video,
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    captureFrame() {
        return this.ctx.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    // ======================================================
    // FRAME COMPARISON
    // ======================================================

    compareFrames(previousFrame, currentFrame) {

        const prev = previousFrame.data;
        const curr = currentFrame.data;

        let diffSum = 0;
        let samples = 0;
        let changedPixels = 0;

        const step = this.sampleStep * 4;

        for (let i = 0; i < curr.length; i += step) {

            const r = Math.abs(curr[i] - prev[i]);
            const g = Math.abs(curr[i + 1] - prev[i + 1]);
            const b = Math.abs(curr[i + 2] - prev[i + 2]);

            const diff = r + g + b;

            diffSum += diff;
            samples++;

            if (diff > 80) changedPixels++;

            // SAFE heatmap (no frame corruption)
            if (
                this.heatmapEnabled &&
                diff > 150 &&
                i % 300 === 0
            ) {
                this.paintHeatPixel(i, diff);
            }
        }

        // Safer normalization (prevents artificial compression)
        const normalized =
            samples > 0
                ? (diffSum / samples) / 7.65
                : 0;

        return {
            difference: Number(normalized.toFixed(2)),
            changedPixels
        };
    }

    // ======================================================
    // HEATMAP (SAFE)
    // ======================================================

    paintHeatPixel(pixelIndex) {

        const pixel = Math.floor(pixelIndex / 4);

        const x = pixel % this.canvas.width;
        const y = Math.floor(pixel / this.canvas.width);

        this.ctx.fillStyle = "rgba(255,0,0,0.25)";
        this.ctx.fillRect(x, y, 2, 2);
    }

    // ======================================================
    // DETECTION (FIXED COOLDOWN LOGIC)
    // ======================================================

    handleDetection(difference, frameNumber) {

        let cut = false;

        if (difference >= this.threshold && this.cooldownCounter === 0) {

            this.systemFlags.push(frameNumber);
            this.cooldownCounter = this.cooldown;
            cut = true;
        }

        if (this.cooldownCounter > 0) {
            this.cooldownCounter--;
        }

        return cut;
    }

    // ======================================================
    // HISTORY (SAFE SHIFT)
    // ======================================================

    storeHistory(frame, difference, systemCut) {

        this.frameHistory.push({
            frame,
            difference,
            systemCut
        });

        if (this.frameHistory.length > this.maxHistory) {
            this.frameHistory.shift();
        }
    }

    // ======================================================
    // ACCESSORS
    // ======================================================

    getSystemFlags() {
        return this.systemFlags;
    }

    getLastDifference() {
        return this.lastDifference;
    }

    getFrameHistory() {
        return this.frameHistory;
    }

    getCurrentFrame() {
        return this.currentFrame;
    }

    getThreshold() {
        return this.threshold;
    }

    // ======================================================
    // STATISTICS
    // ======================================================

    getStatistics() {

        if (!this.frameHistory.length) return null;

        const values = this.frameHistory.map(i => i.difference);

        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg =
            values.reduce((a, b) => a + b, 0) / values.length;

        return {
            maxDifference: max.toFixed(2),
            minDifference: min.toFixed(2),
            averageDifference: avg.toFixed(2),
            systemFlags: this.systemFlags.length
        };
    }

    // ======================================================
    // CSV EXPORT (FIXED METHOD CALL)
    // ======================================================

    buildCSV() {

        let csv = "Frame,Difference,SystemCut\n";

        this.frameHistory.forEach(item => {
            csv += `${item.frame},${item.difference},${item.systemCut}\n`;
        });

        return csv;
    }

    downloadCSV() {

        const csv = this.buildCSV();

        const blob = new Blob([csv], {
            type: "text/csv"
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "pixel-shift-data.csv";
        link.click();

        URL.revokeObjectURL(url);
    }

    // ======================================================
    // FRAME LOOP SUPPORT (FIXED)
    // ======================================================

    startFrameLoop(video, callback) {

        const process = (now, metadata) => {

            if (video.paused || video.ended) return;

            const frame =
                metadata?.presentedFrames ??
                Math.round(video.currentTime * 30);

            const result = this.processFrame(video, frame);

            callback(result, frame);

            if (typeof video.requestVideoFrameCallback === "function") {
                video.requestVideoFrameCallback(process);
            } else {
                requestAnimationFrame(() =>
                    this.startFallbackLoop(video, callback)
                );
            }
        };

        video.requestVideoFrameCallback?.(process);
    }

    startFallbackLoop(video, callback) {

        let frame = 0;

        const loop = () => {

            if (video.paused || video.ended) return;

            frame++;

            const result = this.processFrame(video, frame);

            callback(result, frame);

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }
}

// ==========================================================
// FACTORY
// ==========================================================

export function createDetector(canvas) {
    return new PixelDetector(canvas);
}
