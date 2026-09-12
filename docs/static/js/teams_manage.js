import { fetchPlayers } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const communityId = localStorage.getItem("selected_community_id");
    if (!communityId) {
        window.location.href = "index.html";
        return;
    }

    const backBtn = document.getElementById("btn-back-to-settings");
    if (backBtn) {
        backBtn.style.padding = "10px";
        backBtn.style.width = "100%";
        backBtn.style.border = "none";
        backBtn.style.borderRadius = "6px";
        backBtn.style.cursor = "pointer";
        backBtn.style.fontSize = "14px";
        backBtn.style.marginBottom = "10px";
        backBtn.addEventListener("click", () => {
            window.location.href = "settings.html";
        });
    }

    await loadParticipantsSelection(Number(communityId));
});

async function loadParticipantsSelection(communityId) {
    const container = document.getElementById("teams-container");
    if (!container) return;

    container.innerHTML = "<p>Loading players...</p>";

    try {
        let players = await fetchPlayers(communityId);
        
        container.innerHTML = "";

        if (!players || players.length === 0) {
            container.innerHTML = "<p>No players found in this community. Add players first!</p>";
            return;
        }

        players.sort((a, b) => {
            const nameA = (a.name || a.first_name || "").trim();
            const nameB = (b.name || b.first_name || "").trim();
            return nameA.localeCompare(nameB, undefined, { sensitivity: 'accent' });
        });

        const listDiv = document.createElement("div");
        listDiv.style.display = "flex";
        listDiv.style.flexDirection = "column";
        listDiv.style.gap = "6px";
        listDiv.style.maxHeight = "350px";
        listDiv.style.overflowY = "auto";
        listDiv.style.marginBottom = "15px";
        listDiv.style.border = "1px solid #ddd";
        listDiv.style.padding = "8px";
        listDiv.style.borderRadius = "6px";

        const selectedPlayerIds = new Set();
        const rowElements = new Map();

        players.forEach(p => {
            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.alignItems = "center";
            row.style.padding = "8px 10px";
            row.style.borderRadius = "4px";
            row.style.cursor = "pointer";
            row.style.backgroundColor = "#f8f9fa";
            row.style.border = "1px solid #e9ecef";

            const infoDiv = document.createElement("div");
            infoDiv.style.display = "flex";
            infoDiv.style.flexDirection = "column";
            infoDiv.style.gap = "2px";

            const playerName = p.name || p.first_name || "Unnamed";
            const nameSpan = document.createElement("span");
            nameSpan.textContent = `${playerName} (${p.gender || 'M'})`;
            nameSpan.style.fontWeight = "500";
            nameSpan.style.fontSize = "14px";

            infoDiv.appendChild(nameSpan);

            if (p.username) {
                const usernameSpan = document.createElement("span");
                usernameSpan.textContent = `@${p.username}`;
                usernameSpan.style.fontSize = "12px";
                usernameSpan.style.color = "#666";
                infoDiv.appendChild(usernameSpan);
            }

            // Индикатор статуса (например, галочка или текст)
            const statusSpan = document.createElement("span");
            statusSpan.textContent = "+";
            statusSpan.style.fontSize = "16px";
            statusSpan.style.fontWeight = "bold";
            statusSpan.style.color = "#6c757d";

            row.appendChild(infoDiv);
            row.appendChild(statusSpan);

            // Обработка клика по строке
            row.addEventListener("click", () => {
                if (selectedPlayerIds.has(p.id)) {
                    selectedPlayerIds.delete(p.id);
                    row.style.backgroundColor = "#f8f9fa";
                    row.style.borderColor = "#e9ecef";
                    statusSpan.textContent = "+";
                    statusSpan.style.color = "#6c757d";
                } else {
                    selectedPlayerIds.add(p.id);
                    row.style.backgroundColor = "#d1e7dd"; 
                    row.style.borderColor = "#badbcc";
                    statusSpan.textContent = "✓";
                    statusSpan.style.color = "#0f5132";
                }
            });

            rowElements.set(p.id, row);
            listDiv.appendChild(row);
        });

        container.appendChild(listDiv);

        const actionsContainer = document.createElement("div");
        actionsContainer.style.display = "flex";
        actionsContainer.style.flexDirection = "column";
        actionsContainer.style.gap = "10px";

        const autoBtn = document.createElement("button");
        autoBtn.textContent = "Auto Balance Teams";
        autoBtn.style.cssText = "padding: 12px; background-color: #2481cc; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;";
        
        const manualBtn = document.createElement("button");
        manualBtn.textContent = "Manual Teams Setup";
        manualBtn.style.cssText = "padding: 12px; background-color: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;";

        autoBtn.addEventListener("click", () => {
            const selectedIdsArray = Array.from(selectedPlayerIds);
            if (selectedIdsArray.length === 0) {
                alert("Please select at least one player for the game!");
                return;
            }
            alert(`Auto-balancing for ${selectedIdsArray.length} players (Coming next!)`);
        });

        manualBtn.addEventListener("click", () => {
            const selectedIdsArray = Array.from(selectedPlayerIds);
            if (selectedIdsArray.length === 0) {
                alert("Please select at least one player for the game!");
                return;
            }
            alert(`Manual setup for ${selectedIdsArray.length} players (Coming next!)`);
        });

        actionsContainer.appendChild(autoBtn);
        actionsContainer.appendChild(manualBtn);
        container.appendChild(actionsContainer);

    } catch (error) {
        container.innerHTML = "<p>Error loading players.</p>";
    }
}