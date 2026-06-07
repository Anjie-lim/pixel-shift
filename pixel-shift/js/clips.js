// ==========================================================
// Pixel Shift
// js/clips.js
// ==========================================================

/*
PRELOADED CLIP CONFIGURATION

```
IMPORTANT:
Replace the placeholder cut frame values
with the real frame numbers after you
finalize your video assets.

Example:

Open video
Step frame-by-frame
Record exact cut locations

Then update the arrays below.
```

*/

// ==========================================================
// GLOBAL CONSTANTS
// ==========================================================

export const FRAME_TOLERANCE = 3;

export const DETECTION_COOLDOWN = 5;

export const MAX_LEADERBOARD_ENTRIES = 10;

export const CHART_MAX_POINTS = 5000;

// ==========================================================
// PRESET CONFIGURATIONS
// ==========================================================

export const DETECTION_PRESETS = {

```
dialogue: {

    name: "Dialogue Scenes",

    threshold: 18,

    cooldown: 5,

    description:
        "Optimized for conversations and slower edits."
},

action: {

    name: "Action Sequences",

    threshold: 42,

    cooldown: 8,

    description:
        "Reduces false positives caused by rapid motion."
},

fade: {

    name: "Fade Transitions",

    threshold: 10,

    cooldown: 5,

    description:
        "More sensitive to gradual scene transitions."
},

flash: {

    name: "Flash Cuts",

    threshold: 60,

    cooldown: 10,

    description:
        "Handles music videos and fast-cut editing."
},

custom: {

    name: "Custom",

    threshold: 25,

    cooldown: 5,

    description:
        "User-controlled settings."
}
```

};

// ==========================================================
// CLIP 1
// ACTION SEQUENCE
// ==========================================================

export const CLIP_1 = {

```
id: "clip1",

title: "Action Sequence",

file: "videos/clip1-action.mp4",

description:
    "Fast motion scene with multiple hard cuts.",

groundTruthCuts: [

    240,
    360,
    537

]
```

};

// ==========================================================
// CLIP 2
// FADE TRANSITIONS
// ==========================================================

export const CLIP_2 = {

```
id: "clip2",

title: "Fade Transitions",

file: "videos/clip2-fade.mp4",

description:
    "More sensitive to gradual scene transitions.",

groundTruthCuts: [

    145,
    476,
    891,
    1047,
    1232,
    1387,
    1612

]
```

};

// ==========================================================
// MASTER CLIP REGISTRY
// ==========================================================

export const CLIPS = {

```
clip1: CLIP_1,

clip2: CLIP_2
```

};

// ==========================================================
// LOCAL STORAGE KEYS
// ==========================================================

export const STORAGE_KEYS = {

```
leaderboard:
    "pixelShiftLeaderboard",

settings:
    "pixelShiftSettings"
```

};

// ==========================================================
// CHART COLORS
// ==========================================================

export const CHART_CONFIG = {

```
pixelDifferenceColor:
    "rgba(78,161,255,1)",

thresholdColor:
    "rgba(255,95,109,1)",

humanMarkerColor:
    "rgba(46,204,113,1)",

systemMarkerColor:
    "rgba(241,196,15,1)",

fillColor:
    "rgba(78,161,255,0.15)"
```

};

// ==========================================================
// DEFAULT SESSION STATE
// ==========================================================

export const DEFAULT_SESSION = {

```
mode: "clip1",

threshold: 25,

playbackRate: 1,

heatmapEnabled: false,

canvasVisible: false
```

};

// ==========================================================
// SAMPLE LEADERBOARD
// REMOVED AUTOMATICALLY ON FIRST SAVE
// ==========================================================

export const SAMPLE_LEADERBOARD = [

```
{
    threshold: 24,
    f1: 94.1,
    date: "Sample"
},

{
    threshold: 22,
    f1: 91.8,
    date: "Sample"
},

{
    threshold: 28,
    f1: 89.7,
    date: "Sample"
}
```

];

// ==========================================================
// HELPER FUNCTIONS
// ==========================================================

export function getClip(id) {

```
return CLIPS[id] || CLIP_1;
```

}

export function getPreset(name) {

```
return (
    DETECTION_PRESETS[name]
    ||
    DETECTION_PRESETS.custom
);
```

}

export function isPreloadedMode(mode) {

```
return (
    mode === "clip1"
    ||
    mode === "clip2"
);
```

}

export function isCustomMode(mode) {

```
return mode === "custom";
```

}

// ==========================================================
// EVALUATION UTILITIES
// ==========================================================

export function frameMatches(
frameA,
frameB,
tolerance = FRAME_TOLERANCE
) {

```
return (
    Math.abs(frameA - frameB)
    <= tolerance
);
```

}

export function formatDate(date) {

```
return new Date(date)
    .toLocaleDateString();
```

}

// ==========================================================
// CSV HEADERS
// ==========================================================

export const CSV_HEADERS = [

```
"Frame",
"PixelDifference",
"Threshold",
"HumanFlag",
"SystemFlag"
```

];

// ==========================================================
// FUTURE EXPANSION
// ==========================================================

/*
Future clip structure:

```
{
    id: "clip3",
    title: "Music Video",
    file: "videos/clip3.mp4",
    groundTruthCuts: [...]
}

Then simply add:

export const CLIP_3 = {...}

and register inside CLIPS.
```

*/
