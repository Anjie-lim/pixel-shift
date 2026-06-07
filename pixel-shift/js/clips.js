export const FRAME_TOLERANCE = 3;
export const CHART_MAX_POINTS = 1000;

export const DETECTION_PRESETS = {
    dialogue: {
        name: "Dialogue Scenes",
        threshold: 18,
        cooldown: 5,
        description: "Optimized for conversations and slower edits."
    },
    action: {
        name: "Action Sequences",
        threshold: 42,
        cooldown: 8,
        description: "Reduces false positives caused by rapid motion."
    },
    fade: {
        name: "Fade Transitions",
        threshold: 10,
        cooldown: 5,
        description: "More sensitive to gradual scene transitions."
    },
    flash: {
        name: "Flash Cuts",
        threshold: 60,
        cooldown: 10,
        description: "Handles music videos and fast-cut editing."
    },
    custom: {
        name: "Custom",
        threshold: 25,
        cooldown: 5,
        description: "User-controlled settings."
    }
};

export const CLIPS = {
    clip1: {
        id: "clip1",
        title: "Action Sequence",
        file: "videos/clip1-action.mp4",
        description: "Fast motion scene with multiple hard cuts.",
        groundTruthCuts: [240, 360, 537]
    },

    clip2: {
        id: "clip2",
        title: "Fade Transitions",
        file: "videos/clip2-fade.mp4",
        description: "More sensitive to gradual scene transitions.",
        groundTruthCuts: [145, 476, 891, 1047, 1232, 1387, 1612]
    }
};

export const CHART_CONFIG = {
    pixelDifferenceColor: "rgba(78,161,255,1)",
    thresholdColor: "rgba(255,95,109,1)",
    humanMarkerColor: "rgba(46,204,113,1)",
    systemMarkerColor: "rgba(241,196,15,1)",
    fillColor: "rgba(78,161,255,0.15)"
};

export const STORAGE_KEYS = {
    leaderboard: "pixelShiftLeaderboard",
    settings: "pixelShiftSettings"
};

export const DEFAULT_SESSION = {
    mode: "clip1",
    threshold: 25,
    playbackRate: 1,
    heatmapEnabled: false,
    canvasVisible: false
};

export const CSV_HEADERS = [
    "Frame",
    "PixelDifference",
    "Threshold",
    "HumanFlag",
    "SystemFlag"
];

// helpers
export function getClip(id) {
    return CLIPS[id];
}

export function getPreset(name) {
    return DETECTION_PRESETS[name] || DETECTION_PRESETS.custom;
}

export function frameMatches(a, b, tol = FRAME_TOLERANCE) {
    return Math.abs(a - b) <= tol;
}
