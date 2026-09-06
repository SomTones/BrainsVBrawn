const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "public");
const GAMES_PATH = path.join(__dirname, "games.json");
const STATE_PATH = path.join(__dirname, "state.json");

function readJson(p) {
    return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJson(p, obj) {
    fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}

function loadGames() {
    return readJson(GAMES_PATH);
}
function loadState() {
    try {
        return readJson(STATE_PATH);
    } catch {
        const init = { played: [], history: [] };
        writeJson(STATE_PATH, init);
        return init;
    }
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

app.use(express.static(PUBLIC_DIR));

app.get("/api/games", (req, res) => {
    res.json(loadGames());
});

app.get("/api/state", (req, res) => {
    res.json(loadState());
});

app.post("/api/pick", (req, res) => {
    const { category } = req.body;
    const games = loadGames();
    const state = loadState();

    if (!games[category]) {
        return res.status(400).json({ error: "Invalid category" });
    }

    const playedSet = new Set(state.played);
    const remaining = games[category].filter(g => !playedSet.has(g.id));

    if (remaining.length === 0) {
        return res.json({ exhausted: true, category });
    }

    const chosen = pickRandom(remaining);

    state.played.push(chosen.id);
    state.history.push({ ts: Date.now(), category, id: chosen.id });
    writeJson(STATE_PATH, state);

    res.json({ exhausted: false, category, game: chosen });
});

app.post("/api/nextRound", (req, res) => {
    // "Next round" is just a UI clear; state doesn't change
    res.json({ ok: true });
});

app.post("/api/undo", (req, res) => {
    const state = loadState();
    const last = state.history.pop();
    if (!last) {
        return res.json({ ok: false, message: "Nothing to undo" });
    }

    // Remove one instance of the last played id from played[]
    const idx = state.played.lastIndexOf(last.id);
    if (idx >= 0) state.played.splice(idx, 1);

    writeJson(STATE_PATH, state);
    res.json({ ok: true, undone: last });
});

app.post("/api/resetSession", (req, res) => {
    const fresh = { played: [], history: [] };
    writeJson(STATE_PATH, fresh);
    res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Running: http://localhost:${PORT}`);
});