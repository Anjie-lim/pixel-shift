// ==========================================================
// Pixel Shift
// js/evaluator.js
// Evaluation Engine (TP / FP / FN + Metrics)
// ==========================================================

import {
FRAME_TOLERANCE
} from "./clips.js";

// ==========================================================
// CORE EVALUATION
// ==========================================================

export function evaluateDetection(
groundTruthFrames,
systemFrames,
tolerance = FRAME_TOLERANCE
) {

```
const truthMatched = new Set();
const systemMatched = new Set();

let tp = 0;
let fp = 0;
let fn = 0;

// ======================================================
// TRUE POSITIVES + FALSE POSITIVES
// ======================================================

systemFrames.forEach((sysFrame, sysIndex) => {

    let matched = false;

    for (
        let i = 0;
        i < groundTruthFrames.length;
        i++
    ) {

        const gtFrame =
            groundTruthFrames[i];

        if (
            Math.abs(sysFrame - gtFrame)
            <= tolerance
        ) {

            if (!truthMatched.has(i)) {

                tp++;
                truthMatched.add(i);
                systemMatched.add(sysIndex);

            }

            matched = true;
            break;
        }
    }

    if (!matched) {

        fp++;
    }
});

// ======================================================
// FALSE NEGATIVES
// ======================================================

groundTruthFrames.forEach(
    (_, index) => {

        if (!truthMatched.has(index)) {

            fn++;
        }

    }
);

return {
    tp,
    fp,
    fn
};
```

}

// ==========================================================
// PRECISION / RECALL / F1
// ==========================================================

export function computeMetrics(tp, fp, fn) {

```
const precision =
    tp + fp === 0
        ? 0
        : tp / (tp + fp);

const recall =
    tp + fn === 0
        ? 0
        : tp / (tp + fn);

const f1 =
    precision + recall === 0
        ? 0
        : (2 * precision * recall) /
          (precision + recall);

return {

    precision:
        +(precision * 100).toFixed(2),

    recall:
        +(recall * 100).toFixed(2),

    f1:
        +(f1 * 100).toFixed(2)
};
```

}

// ==========================================================
// SCORE NORMALIZATION
// ==========================================================

export function computeScore(metrics) {

```
// Weighted scoring favoring F1
return (
    metrics.f1 * 0.7 +
    metrics.precision * 0.15 +
    metrics.recall * 0.15
);
```

}

// ==========================================================
// FRAME ALIGNMENT HELPERS
// ==========================================================

export function findClosestMatch(
frame,
candidates,
tolerance = FRAME_TOLERANCE
) {

```
let bestIndex = -1;
let bestDistance = Infinity;

for (let i = 0; i < candidates.length; i++) {

    const distance =
        Math.abs(frame - candidates[i]);

    if (distance <= tolerance && distance < bestDistance) {

        bestDistance = distance;
        bestIndex = i;
    }
}

return bestIndex;
```

}

// ==========================================================
// CONFUSION MATRIX REPORT
// ==========================================================

export function buildConfusionReport(
groundTruth,
systemFlags
) {

```
const { tp, fp, fn } =
    evaluateDetection(
        groundTruth,
        systemFlags
    );

const metrics =
    computeMetrics(tp, fp, fn);

return {

    tp,
    fp,
    fn,

    precision: metrics.precision,
    recall: metrics.recall,
    f1: metrics.f1,

    score: computeScore(metrics)
};
```

}

// ==========================================================
// LEADERBOARD ENTRY BUILDER
// ==========================================================

export function buildLeaderboardEntry(
threshold,
report
) {

```
return {

    threshold,

    f1: report.f1,

    precision: report.precision,

    recall: report.recall,

    score: report.score,

    timestamp:
        new Date().toISOString()
};
```

}

// ==========================================================
// LOCAL STORAGE LEADERBOARD
// ==========================================================

const STORAGE_KEY =
"pixel_shift_leaderboard";

export function loadLeaderboard() {

```
try {

    const raw =
        localStorage.getItem(
            STORAGE_KEY
        );

    return raw
        ? JSON.parse(raw)
        : [];

} catch (e) {

    return [];
}
```

}

export function saveLeaderboard(entries) {

```
localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(entries)
);
```

}

export function updateLeaderboard(
newEntry,
maxEntries = 10
) {

```
const leaderboard =
    loadLeaderboard();

leaderboard.push(newEntry);

leaderboard.sort(
    (a, b) => b.score - a.score
);

const trimmed =
    leaderboard.slice(
        0,
        maxEntries
    );

saveLeaderboard(trimmed);

return trimmed;
```

}

// ==========================================================
// CSV EXPORT (EVALUATION)
// ==========================================================

export function exportEvaluationCSV(
groundTruth,
systemFlags
) {

```
let csv =
    "Frame,Type\n";

groundTruth.forEach(frame => {

    csv += `${frame},GROUND_TRUTH\n`;

});

systemFlags.forEach(frame => {

    csv += `${frame},SYSTEM\n`;

});

const blob =
    new Blob([csv], {

        type: "text/csv"

    });

const url =
    URL.createObjectURL(blob);

const link =
    document.createElement("a");

link.href = url;

link.download =
    "pixel-shift-evaluation.csv";

link.click();

URL.revokeObjectURL(url);
```

}

// ==========================================================
// END OF FILE
// ==========================================================
