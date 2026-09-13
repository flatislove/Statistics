import { fetchPlayers } from "./api.js";

let selectedPlayersData = [];
let teams = [];

document.addEventListener("DOMContentLoaded", async () => {
    const webApp = window.Telegram.WebApp;
    if (webApp) {
        webApp.ready();
        webApp.expand();
    }

    const communityId = localStorage.getItem("selected_community_id") || localStorage.getItem("current_community_id");
    const rawSelectedIds = localStorage.getItem("manual_selected_player_ids");
    const matchDayId = localStorage.getItem("current_match_day_id");
    const telegramId = webApp.initDataUnsafe?.user?.id;

    if (!communityId || !rawSelectedIds) {
        window.location.href = "teams_manage.html";
        return;
    }

    const selectedIds = JSON.parse(rawSelectedIds);

    document.getElementById("btn-back-to-teams").addEventListener("click", () => {
        window.location.href = "teams_manage.html";
    });

    teams = [
        { id: 1, name: "K1", playerIds: [] },
        { id: 2, name: "K2", playerIds: [] }
    ];

    document.getElementById("btn-add-team").addEventListener("click", () => {
        const newTeamId = teams.length > 0 ? Math.max(...teams.map(t => t.id)) + 1 : 1;
        teams.push({ id: newTeamId, name: `K${teams.length + 1}`, playerIds: [] });
        renderUI();
    });

    try {
        const allPlayers = await fetchPlayers(communityId);
        selectedPlayersData = allPlayers.filter(p => selectedIds.includes(p.id));
        renderUI();
    } catch (error) {
        console.error("Error loading players for manual setup:", error);
        alert("Failed to load players data.");
    }

    document.getElementById("btn-save-match").addEventListener("click", async () => {
        const assignedCount = teams.reduce((acc, t) => acc + t.playerIds.length, 0);
        if (assignedCount === 0) {
            alert("Please assign at least some players to teams!");
            return;
        }

        localStorage.setItem("saved_match_teams", JSON.stringify(teams));

        if (!matchDayId) {
            alert("Teams saved locally, but Match Day ID is missing for server sync.");
            return;
        }

        const payload = {
            teams: teams.map(t => ({
                name: t.name,
                player_ids: t.playerIds
            }))
        };

        try {
            const response = await fetch(`/api/match-days/${matchDayId}/lineup`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Telegram-Id": telegramId ? String(telegramId) : ""
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Teams successfully saved to database!");
            } else {
                const errData = await response.json();
                alert(`Error: ${errData.detail || "Failed to save lineup on server."}`);
            }
        } catch (error) {
            console.error("Server sync error:", error);
            alert("Server connection error while saving lineup.");
        }
    });
});

function renderUI() {
    const assignedIds = new Set(teams.flatMap(t => t.playerIds));
    const unassignedPlayers = selectedPlayersData.filter(p => !assignedIds.has(p.id));

    document.getElementById("unassigned-count").textContent = unassignedPlayers.length;

    const poolContainer = document.getElementById("unassigned-pool");
    poolContainer.innerHTML = "";

    if (unassignedPlayers.length === 0) {
        poolContainer.innerHTML = `<span style="font-size: 12px; color: var(--hint-color, #888); padding: 4px;">All players assigned!</span>`;
    } else {
        unassignedPlayers.forEach(p => {
            const chip = document.createElement("div");
            chip.className = "player-chip";
            
            const playerName = p.name || p.first_name || "Player";
            chip.textContent = `${playerName} (${p.gender || 'M'})`;

            initTouchDrag(chip, p.id);
            poolContainer.appendChild(chip);
        });
    }

    const teamsContainer = document.getElementById("teams-list-container");
    teamsContainer.innerHTML = "";

    teams.forEach((team) => {
        const teamCard = document.createElement("div");
        teamCard.className = "team-drop-zone card";
        teamCard.dataset.teamId = team.id;
        teamCard.style.cssText = "border: 2px dashed var(--hint-color, #444); padding: 12px; transition: background 0.2s; margin-bottom: 12px;";

        const teamHeader = document.createElement("div");
        teamHeader.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid var(--hint-color, #444); padding-bottom: 6px;";
        
        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.value = team.name;
        titleInput.style.cssText = "background: transparent; border: none; color: var(--text-color, #fff); font-weight: bold; font-size: 14px; width: 100px; margin: 0; padding: 4px;";
        titleInput.addEventListener("input", (e) => {
            team.name = e.target.value;
        });

        const rightHeaderWrapper = document.createElement("div");
        rightHeaderWrapper.style.cssText = "display: flex; align-items: center; gap: 8px;";

        const teamInfo = document.createElement("span");
        teamInfo.style.cssText = "font-size: 12px; color: var(--hint-color, #aaa);";
        teamInfo.textContent = `${team.playerIds.length} players`;

        const removeTeamBtn = document.createElement("button");
        removeTeamBtn.textContent = "✕";
        removeTeamBtn.style.cssText = "background: none; border: none; color: #ff3b30; cursor: pointer; font-size: 14px; font-weight: bold; width: auto; margin: 0; padding: 0 4px;";
        removeTeamBtn.addEventListener("click", () => {
            teams = teams.filter(t => t.id !== team.id);
            renderUI();
        });

        rightHeaderWrapper.appendChild(teamInfo);
        rightHeaderWrapper.appendChild(removeTeamBtn);

        teamHeader.appendChild(titleInput);
        teamHeader.appendChild(rightHeaderWrapper);
        teamCard.appendChild(teamHeader);

        const teamPlayersList = document.createElement("div");
        teamPlayersList.style.cssText = "display: flex; flex-direction: column; gap: 6px; min-height: 35px;";

        if (team.playerIds.length === 0) {
            teamPlayersList.innerHTML = `<span style="font-size: 11px; color: var(--hint-color, #777); font-style: italic; padding: 2px;">Drop players here</span>`;
        } else {
            team.playerIds.forEach(playerId => {
                const pObj = selectedPlayersData.find(x => x.id === playerId);
                if (!pObj) return;

                const pRow = document.createElement("div");
                pRow.className = "player-chip";
                pRow.style.width = "100%";
                
                const playerName = pObj.name || pObj.first_name || "Player";
                const pNameSpan = document.createElement("span");
                pNameSpan.textContent = `${playerName} (${pObj.gender || 'M'})`;

                const removeBtn = document.createElement("button");
                removeBtn.className = "remove-player";
                removeBtn.textContent = "✕";
                removeBtn.addEventListener("click", () => {
                    team.playerIds = team.playerIds.filter(id => id !== playerId);
                    renderUI();
                });

                pRow.appendChild(pNameSpan);
                pRow.appendChild(removeBtn);
                teamPlayersList.appendChild(pRow);
            });
        }

        teamCard.appendChild(teamPlayersList);
        teamsContainer.appendChild(teamCard);
    });
}

function initTouchDrag(element, playerId) {
    let clone = null;
    let startX = 0;
    let startY = 0;

    element.addEventListener("touchstart", (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;

        const rect = element.getBoundingClientRect();

        clone = element.cloneNode(true);
        clone.style.position = "fixed";
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.zIndex = "1000";
        clone.style.opacity = "0.85";
        clone.style.pointerEvents = "none";
        clone.style.boxShadow = "0 8px 16px rgba(0,0,0,0.4)";
        clone.style.backgroundColor = "var(--button-color)";
        clone.style.color = "var(--button-text-color)";

        document.body.appendChild(clone);
        element.style.opacity = "0.4";
    }, { passive: true });

    element.addEventListener("touchmove", (e) => {
        if (!clone) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;

        const rect = element.getBoundingClientRect();
        clone.style.left = `${rect.left + deltaX}px`;
        clone.style.top = `${rect.top + deltaY}px`;

        const dropZones = document.querySelectorAll(".team-drop-zone");
        dropZones.forEach(zone => {
            const zRect = zone.getBoundingClientRect();
            if (
                touch.clientX >= zRect.left &&
                touch.clientX <= zRect.right &&
                touch.clientY >= zRect.top &&
                touch.clientY <= zRect.bottom
            ) {
                zone.style.borderColor = "#34c759";
                zone.style.background = "var(--secondary-bg-color)";
            } else {
                zone.style.borderColor = "var(--hint-color)";
                zone.style.background = "var(--secondary-bg-color)";
            }
        });
    }, { passive: true });

    element.addEventListener("touchend", (e) => {
        if (!clone) return;
        clone.remove();
        clone = null;
        element.style.opacity = "1";

        const touch = e.changedTouches[0];
        const dropZones = document.querySelectorAll(".team-drop-zone");
        let targetTeamId = null;

        dropZones.forEach(zone => {
            zone.style.borderColor = "var(--hint-color)";
            zone.style.background = "var(--secondary-bg-color)";

            const zRect = zone.getBoundingClientRect();
            if (
                touch.clientX >= zRect.left &&
                touch.clientX <= zRect.right &&
                touch.clientY >= zRect.top &&
                touch.clientY <= zRect.bottom
            ) {
                targetTeamId = Number(zone.dataset.teamId);
            }
        });

        if (targetTeamId !== null) {
            const team = teams.find(t => t.id === targetTeamId);
            if (team && !team.playerIds.includes(playerId)) {
                team.playerIds.push(playerId);
                renderUI();
            }
        }
    });
}