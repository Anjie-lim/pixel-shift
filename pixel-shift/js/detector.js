// ==========================================================
// Pixel Shift
// js/detector.js
// Computer Vision Engine
// ==========================================================

import {
DETECTION_COOLDOWN
} from "./clips.js";

// ==========================================================
// PIXEL DETECTOR
// ==========================================================

export class PixelDetector {

```
constructor(canvas) {

    this.canvas = canvas;

    this.ctx =
        canvas.getContext(
            "2d",
            {
                willReadFrequently: true
            }
        );

    // ------------------------------------
    // Detection State
    // ------------------------------------

    this.threshold = 25;

    this.cooldown =
        DETECTION_COOLDOWN;

    this.cooldownCounter = 0;

    this.systemFlags = [];

    this.frameHistory = [];

    this.currentFrame = 0;

    this.previousImageData = null;

    // ------------------------------------
    // Visualization
    // ------------------------------------

    this.heatmapEnabled = false;

    this.canvasVisible = false;

    // ------------------------------------
    // Performance
    // ------------------------------------

    this.sampleStep = 12;

    this.maxHistory = 10000;

    this.lastDifference = 0;

    this.lastProcessedTimestamp = 0;
}

// ======================================================
// SETTINGS
// ======================================================

setThreshold(value) {

    this.threshold =
        Number(value);
}

setCooldown(value) {

    this.cooldown =
        Number(value);
}

setSamplingRate(value) {

    this.sampleStep =
        Number(value);
}

toggleHeatmap() {

    this.heatmapEnabled =
        !this.heatmapEnabled;

    return this.heatmapEnabled;
}

toggleCanvas() {

    this.canvasVisible =
        !this.canvasVisible;

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

    this.lastProcessedTimestamp = 0;
}

// ======================================================
// PROCESS FRAME
// ======================================================

processFrame(
    video,
    frameNumber
) {

    if (
        !video.videoWidth ||
        !video.videoHeight
    ) {

        return {
            difference: 0,
            systemCut: false
        };
    }

    this.currentFrame =
        frameNumber;

    this.prepareCanvas(video);

    const imageData =
        this.captureFrame();

    if (
        !this.previousImageData
    ) {

        this.previousImageData =
            imageData;

        return {
            difference: 0,
            systemCut: false
        };
    }

    const result =
        this.compareFrames(
            this.previousImageData,
            imageData
        );

    this.previousImageData =
        imageData;

    this.lastDifference =
        result.difference;

    const cutDetected =
        this.handleDetection(
            result.difference,
            frameNumber
        );

    this.storeHistory(
        frameNumber,
        result.difference,
        cutDetected
    );

    return {

        difference:
            result.difference,

        systemCut:
            cutDetected,

        changedPixels:
            result.changedPixels
    };
}

// ======================================================
// CANVAS PREPARATION
// ======================================================

prepareCanvas(video) {

    if (
        this.canvas.width !==
        video.videoWidth
    ) {

        this.canvas.width =
            video.videoWidth;

        this.canvas.height =
            video.videoHeight;
    }

    this.ctx.drawImage(
        video,
        0,
        0,
        this.canvas.width,
        this.canvas.height
    );
}

// ======================================================
// FRAME CAPTURE
// ======================================================

captureFrame() {

    return this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
    );
}

// ======================================================
// FRAME DIFFERENCE
// ======================================================

compareFrames(
    previousFrame,
    currentFrame
) {

    const previous =
        previousFrame.data;

    const current =
        currentFrame.data;

    let differenceSum = 0;

    let samples = 0;

    let changedPixels = 0;

    const step =
        this.sampleStep * 4;

    for (
        let i = 0;
        i < current.length;
        i += step
    ) {

        const r =
            Math.abs(
                current[i] -
                previous[i]
            );

        const g =
            Math.abs(
                current[i + 1] -
                previous[i + 1]
            );

        const b =
            Math.abs(
                current[i + 2] -
                previous[i + 2]
            );

        const diff =
            r + g + b;

        differenceSum += diff;

        samples++;

        if (diff > 80) {

            changedPixels++;

        }

        if (
            this.heatmapEnabled
        ) {

            this.paintHeatPixel(
                i,
                diff
            );

        }
    }

    const maxDifference =
        samples * 765;

    const normalized =
        (
            differenceSum /
            maxDifference
        ) * 100;

    return {

        difference:
            Number(
                normalized.toFixed(2)
            ),

        changedPixels
    };
}

// ======================================================
// HEATMAP
// ======================================================

paintHeatPixel(
    pixelIndex,
    diff
) {

    if (diff < 100) {

        return;
    }

    const pixel =
        Math.floor(
            pixelIndex / 4
        );

    const x =
        pixel %
        this.canvas.width;

    const y =
        Math.floor(
            pixel /
            this.canvas.width
        );

    this.ctx.fillStyle =
        "rgba(255,0,0,0.3)";

    this.ctx.fillRect(
        x,
        y,
        2,
        2
    );
}

// ======================================================
// CUT DETECTION
// ======================================================

handleDetection(
    difference,
    frameNumber
) {

    if (
        this.cooldownCounter > 0
    ) {

        this.cooldownCounter--;

        return false;
    }

    if (
        difference >=
        this.threshold
    ) {

        this.systemFlags.push(
            frameNumber
        );

        this.cooldownCounter =
            this.cooldown;

        return true;
    }

    return false;
}

// ======================================================
// HISTORY
// ======================================================

storeHistory(
    frame,
    difference,
    systemCut
) {

    this.frameHistory.push({

        frame,

        difference,

        systemCut
    });

    if (
        this.frameHistory.length >
        this.maxHistory
    ) {

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

    if (
        this.frameHistory.length === 0
    ) {

        return null;
    }

    const values =
        this.frameHistory.map(
            item =>
                item.difference
        );

    const max =
        Math.max(...values);

    const min =
        Math.min(...values);

    const average =
        values.reduce(
            (a, b) => a + b,
            0
        ) / values.length;

    return {

        maxDifference:
            max.toFixed(2),

        minDifference:
            min.toFixed(2),

        averageDifference:
            average.toFixed(2),

        systemFlags:
            this.systemFlags.length
    };
}

// ======================================================
// EXPORT FRAME DATA
// ======================================================

exportFrameData() {

    return this.frameHistory.map(
        item => ({
            frame:
                item.frame,

            difference:
                item.difference,

            systemCut:
                item.systemCut
        })
    );
}

// ======================================================
// VIDEO FRAME CALLBACK
// ======================================================

startFrameLoop(
    video,
    callback
) {

    const process =
        (now, metadata) => {

            if (
                video.paused ||
                video.ended
            ) {

                return;
            }

            const frame =
                Math.round(
                    metadata
                        .presentedFrames
                );

            const result =
                this.processFrame(
                    video,
                    frame
                );

            callback(
                result,
                frame
            );

            video
                .requestVideoFrameCallback(
                    process
                );
        };

    if (
        "requestVideoFrameCallback"
        in HTMLVideoElement
            .prototype
    ) {

        video
            .requestVideoFrameCallback(
                process
            );

    } else {

        this.startFallbackLoop(
            video,
            callback
        );
    }
}

// ======================================================
// FALLBACK LOOP
// ======================================================

startFallbackLoop(
    video,
    callback
) {

    let frame = 0;

    const loop = () => {

        if (
            video.paused ||
            video.ended
        ) {

            return;
        }

        frame++;

        const result =
            this.processFrame(
                video,
                frame
            );

        callback(
            result,
            frame
        );

        requestAnimationFrame(
            loop
        );
    };

    requestAnimationFrame(
        loop
    );
}

// ======================================================
// CSV EXPORT
// ======================================================

buildCSV() {

    let csv =
        "Frame,Difference,SystemCut\n";

    this.frameHistory.forEach(
        item => {

            csv +=
                `${item.frame},` +
                `${item.difference},` +
                `${item.systemCut}\n`;
        }
    );

    return csv;
}

downloadCSV() {

    const csv =
        this.buildCSV();

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href = url;

    link.download =
        "pixel-shift-data.csv";

    link.click();

    URL.revokeObjectURL(
        url
    );
}
```

}

// ==========================================================
// FACTORY
// ==========================================================

export function createDetector(
canvas
) {

```
return new PixelDetector(
    canvas
);
```

}

// ==========================================================
// END FILE
// ==========================================================
