// ==========================================================
// Pixel Shift
// Evaluation Engine (FIXED VERSION)
// ==========================================================

import { FRAME_TOLERANCE } from "./clips.js";

// ==========================================================
// CORE EVALUATION (STABLE MATCHING)
// ==========================================================

export function evaluateDetection(
    groundTruthFrames,
    systemFrames,
    tolerance = FRAME_TOLERANCE
) {

    const gt = [...groundTruthFrames].sort((a, b) => a - b);
    const sys = [...systemFrames].sort((a, b) => a - b);

    const matchedGT = new Set();

    let tp = 0;
    let fp = 0;

    // SYSTEM → GT matching
    for (let i = 0; i < sys.length; i++) {

        const sysFrame = sys[i];
        let matched = false;

        for (let j = 0; j < gt.length; j++) {

            if (matchedGT.has(j)) continue;

            const distance = Math.abs(sysFrame - gt[j]);

            if (distance <= tolerance) {
                tp++;
                matchedGT.add(j);
                matched = true;
                break;
            }
        }

        if (!matched) fp++;
    }

    // FALSE NEGATIVES
    const fn = gt.length - matchedGT.size;

    return { tp, fp, fn };
}

// ==========================================================
// METRICS (RAW VALUES ONLY)
// ==========================================================

export function computeMetrics(tp, fp, fn) {

    const precision =
        tp + fp === 0 ? 0 : tp / (tp + fp);

    const recall =
        tp + fn === 0 ? 0 : tp / (tp + fn);

    const f1 =
        precision + recall === 0
            ? 0
            : (2 * precision * recall) /
              (precision + recall);

    return {
        precision,
        recall,
        f1
    };
}

// ==========================================================
// SCORE (CLEAN WEIGHTED MODEL)
// ==========================================================

export function computeScore(m) {

    const safe = v => isNaN(v) ? 0 : v;

    return (
        safe(m.f1) * 0.5 +
        safe(m.precision) * 0.25 +
        safe(m.recall) * 0.25
    );
}

// ==========================================================
// CONFUSION REPORT
// ==========================================================

export function buildConfusionReport(groundTruth, systemFlags) {

    const { tp, fp, fn } =
        evaluateDetection(groundTruth, systemFlags);

    const metrics =
        computeMetrics(tp, fp, fn);

    return {
        tp,
        fp,
        fn,
        precision: +(metrics.precision * 100).toFixed(2),
        recall: +(metrics.recall * 100).toFixed(2),
        f1: +(metrics.f1 * 100).toFixed(2),
        score: computeScore(metrics)
    };
}

// ==========================================================
// LEADERBOARD ENTRY
// ==========================================================

export function buildLeaderboardEntry(threshold, report) {

    return {
        threshold,
        f1: report.f1,
        precision: report.precision,
        recall: report.recall,
        score: report.score,
        timestamp: new Date().toISOString()
    };
}
