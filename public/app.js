const elStatus = document.getElementById("status");
const elPill = document.getElementById("pill");
const elTitle = document.getElementById("title");
const elDesc = document.getElementById("desc");
const elExhausted = document.getElementById("exhausted");

const catButtons = Array.from(document.querySelectorAll(".cat"));

function setStatus(text) {
    elStatus.textContent = text;
}

function setPill(category) {
    if (!category) {
        elPill.textContent = "—";
        elPill.style.background = "rgba(255,255,255,0.08)";
        return;
    }

    const label = category.charAt(0).toUpperCase() + category.slice(1);
    elPill.textContent = label;

    const colorMap = {
        brains: getComputedStyle(document.documentElement).getPropertyValue("--brains").trim(),
        brawn: getComputedStyle(document.documentElement).getPropertyValue("--brawn").trim(),
        beers: getComputedStyle(document.documentElement).getPropertyValue("--beers").trim(),
    };

    elPill.style.background = `color-mix(in oklab, ${colorMap[category]} 30%, rgba(255,255,255,0.08))`;
}

function showGame(category, game) {
    elExhausted.hidden = true;
    setPill(category);
    elTitle.textContent = game.title;
    elDesc.textContent = game.description || "";
    setStatus(`Selected: ${category} • ${game.id}`);
}

function showExhausted(category) {
    setPill(category);
    elTitle.textContent = "No games left";
    elDesc.textContent = "That category has been exhausted.";
    elExhausted.hidden = false;
    setStatus(`Exhausted: ${category}`);
}

function clearRound() {
    setPill(null);
    elTitle.textContent = "Pick a category";
    elDesc.textContent = "Your selected game will appear here.";
    elExhausted.hidden = true;
    setStatus("Ready");
}

async function post(url, body = {}) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    return res.json();
}

catButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
        const category = btn.dataset.category;
        setStatus(`Picking from ${category}...`);
        const result = await post("/api/pick", { category });

        if (result.exhausted) showExhausted(category);
        else showGame(category, result.game);
    });
});

document.getElementById("nextRound").addEventListener("click", async () => {
    await post("/api/nextRound");
    clearRound();
});

document.getElementById("undo").addEventListener("click", async () => {
    const result = await post("/api/undo");
    if (!result.ok) {
        setStatus(result.message || "Nothing to undo");
        return;
    }
    setStatus(`Undid: ${result.undone.category} • ${result.undone.id}`);
    // Don’t auto-reveal another game; keep screen as-is
});

document.getElementById("resetSession").addEventListener("click", async () => {
    await post("/api/resetSession");
    clearRound();
    setStatus("Session reset (all games available again)");
});

// Nice-to-have: press F11 manually for fullscreen in browser
clearRound();