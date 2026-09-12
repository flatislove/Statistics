import { fetchPlayers } from "./api.js";

let selectedPlayersData = [];
let teams = [];

document.addEventListener("DOMContentLoaded", async () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const communityId = localStorage.getItem("selected_community_id");
    const rawSelectedIds = localStorage.getItem("manual_selected_player_ids");

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

    document.getElementById("btn-save-match").addEventListener("click", () => {
        const assignedCount = teams.reduce((acc, t) => acc + t.playerIds.length, 0);
        if (assignedCount === 0) {
            alert("Please assign at least some players to teams!");
            return;
        }
        
        localStorage.setItem("saved_match_teams", JSON.stringify(teams));
        alert("Teams saved successfully!");
    });
});

function renderUI() {
    const assignedIds = new Set(teams.flatMap(t => t.playerIds));
    const unassignedPlayers = selectedPlayersData.filter(p => !assignedIds.has(p.id));

    document.getElementById("unassigned-count").textContent = unassignedPlayers.length;

    const poolContainer = document.getElementById("unassigned-pool");
    poolContainer.innerHTML = "";

    if (unassignedPlayers.length === 0) {
        poolContainer.innerHTML = `<span style="font-size: 12px; color: var(--tg-theme-hint-color, #888); padding: 4px;">All players assigned!</span>`;
    } else {
        unassignedPlayers.forEach(p => {
            const chip = document.createElement("div");
            chip.style.cssText = "background: var(--tg-theme-bg-color, #181818); border: 1px solid var(--tg-theme-hint-color, #444); padding: 6px 12px; border-radius: 16px; font-size: 13px; cursor: grab; color: var(--tg-theme-text-color, #fff); touch-action: none; user-select: none; display: flex; align-items: center; justify-content: center;";
            
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
        teamCard.className = "team-drop-zone";
        teamCard.dataset.teamId = team.id;
        teamCard.style.cssText = "background: var(--tg-theme-secondary-bg-color, #2c2c2c); border: 2px dashed var(--tg-theme-hint-color, #444); border-radius: 6px; padding: 10px; transition: background 0.2s;";

        const teamHeader = document.createElement("div");
        teamHeader.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid var(--tg-theme-hint-color, #444); padding-bottom: 6px;";
        
        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.value = team.name;
        titleInput.style.cssText = "background: transparent; border: none; color: var(--tg-theme-text-color, #fff); font-weight: bold; font-size: 14px; width: 120px;";
        titleInput.addEventListener("input", (e) => {
            team.name = e.target.value;
        });

        const teamInfo = document.createElement("span");
        teamInfo.style.cssText = "font-size: 12px; color: var(--tg-theme-hint-color, #aaa);";
        teamInfo.textContent = `${team.playerIds.length} players`;

        teamHeader.appendChild(titleInput);
        teamHeader.appendChild(teamInfo);
        teamCard.appendChild(teamHeader);

        const teamPlayersList = document.createElement("div");
        teamPlayersList.style.cssText = "display: flex; flex-direction: column; gap: 4px; min-height: 35px;";

        if (team.playerIds.length === 0) {
            teamPlayersList.innerHTML = `<span style="font-size: 11px; color: var(--tg-theme-hint-color, #777); font-style: italic; padding: 2px;">Drop players here</span>`;
        } else {
            team.playerIds.forEach(playerId => {
                const pObj = selectedPlayersData.find(x => x.id === playerId);
                if (!pObj) return;

                const pRow = document.createElement("div");
                pRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--tg-theme-bg-color, #181818); padding: 3px 6px; border-radius: 4px; font-size: 12px; color: var(--tg-theme-text-color, #fff); height: 26px;";
                
                const pNameSpan = document.createElement("span");
                pNameSpan.textContent = `${pObj.name || pObj.first_name} (${pObj.gender || 'M'})`;

                const removeBtn = document.createElement("button");
                removeBtn.textContent = "✕";
                removeBtn.style.cssText = "background: none; border: none; color: #dc3545; cursor: pointer; font-size: 13px; font-weight: bold; padding: 0 4px; margin-left: auto;";
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
        clone.style.backgroundColor = "var(--tg-theme-button-color, #2481cc)";
        clone.style.color = "var(--tg-theme-button-text-color, #fff)";

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
                zone.style.borderColor = "#28a745";
                zone.style.background = "var(--tg-theme-button-color, #1c3b2b)";
            } else {
                zone.style.borderColor = "var(--tg-theme-hint-color, #444)";
                zone.style.background = "var(--tg-theme-secondary-bg-color, #2c2c2c)";
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
            zone.style.borderColor = "var(--tg-theme-hint-color, #444)";
            zone.style.background = "var(--tg-theme-secondary-bg-color, #2c2c2c)";

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