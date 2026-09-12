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
        backBtn.style.padding = "12px";
        backBtn.style.width = "100%";
        backBtn.style.border = "none";
        backBtn.style.borderRadius = "6px";
        backBtn.style.cursor = "pointer";
        backBtn.style.fontSize = "16px";
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
            const nameA = a.name || a.first_name || "";
            const nameB = b.name || b.first_name || "";
            return nameA.localeCompare(nameB);
        });

        const controlsDiv = document.createElement("div");
        controlsDiv.style.display = "flex";
        controlsDiv.style.gap = "10px";
        controlsDiv.style.marginBottom = "15px";

        const selectAllBtn = document.createElement("button");
        selectAllBtn.textContent = "Select All";
        selectAllBtn.style.cssText = "flex: 1; padding: 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;";
        
        const deselectAllBtn = document.createElement("button");
        deselectAllBtn.textContent = "Deselect All";
        deselectAllBtn.style.cssText = "flex: 1; padding: 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;";

        controlsDiv.appendChild(selectAllBtn);
        controlsDiv.appendChild(deselectAllBtn);
        container.appendChild(controlsDiv);

        // Список игроков с чекбоксами
        const listDiv = document.createElement("div");
        listDiv.style.display = "flex";
        listDiv.style.flexDirection = "column";
        listDiv.style.gap = "8px";
        listDiv.style.maxHeight = "300px";
        listDiv.style.overflowY = "auto";
        listDiv.style.marginBottom = "15px";
        listDiv.style.border = "1px solid #ddd";
        listDiv.style.padding = "10px";
        listDiv.style.borderRadius = "6px";

        const checkboxes = [];

        players.forEach(p => {
            const label = document.createElement("label");
            label.style.display = "flex";
            label.style.alignItems = "center";
            label.style.gap = "10px";
            label.style.cursor = "pointer";
            label.style.padding = "4px 0";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = p.id;
            checkbox.checked = true; 
            checkbox.style.width = "18px";
            checkbox.style.height = "18px";

            checkboxes.push(checkbox);

            const playerName = p.name || p.first_name || "Unnamed";
            const span = document.createElement("span");
            span.textContent = `${playerName} (${p.gender || 'M'})`;

            label.appendChild(checkbox);
            label.appendChild(span);
            listDiv.appendChild(label);
        });

        selectAllBtn.addEventListener("click", () => checkboxes.forEach(cb => cb.checked = true));
        deselectAllBtn.addEventListener("click", () => checkboxes.forEach(cb => cb.checked = false));

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
            const selectedIds = checkboxes.filter(cb => cb.checked).map(cb => Number(cb.value));
            if (selectedIds.length === 0) {
                alert("Please select at least one player!");
                return;
            }
            alert(`Auto-balancing for ${selectedIds.length} players (Coming next!)`);
        });

        manualBtn.addEventListener("click", () => {
            const selectedIds = checkboxes.filter(cb => cb.checked).map(cb => Number(cb.value));
            if (selectedIds.length === 0) {
                alert("Please select at least one player!");
                return;
            }
            alert(`Manual setup for ${selectedIds.length} players (Coming next!)`);
        });

        actionsContainer.appendChild(autoBtn);
        actionsContainer.appendChild(manualBtn);
        container.appendChild(actionsContainer);

    } catch (error) {
        container.innerHTML = "<p>Error loading players.</p>";
    }
}