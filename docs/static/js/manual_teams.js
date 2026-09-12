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
        { id: 1, name: "Team A", playerIds: [] },
        { id: 2, name: "Team B", playerIds: [] }
    ];

    document.getElementById("btn-add-team").addEventListener("click", () => {
        const newTeamId = teams.length > 0 ? Math.max(...teams.map(t => t.id)) + 1 : 1;
        teams.push({ id: newTeamId, name: `Team ${String.fromCharCode(65 + teams.length)}`, playerIds: [] });
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
        alert("Teams saved successfully! (Match tracker coming next)");
    });
});

function renderUI() {
    const assignedIds = new Set(teams.flatMap(t => t.playerIds));
    const unassignedPlayers = selectedPlayersData.filter(p => !assignedIds.has(p.id));

    document.getElementById("unassigned-count").textContent = unassignedPlayers.length;

    const poolContainer = document.getElementById("unassigned-pool");
    poolContainer.innerHTML = "";

    if (unassignedPlayers.length === 0) {
        poolContainer.innerHTML = `<span style="font-size: 12px; color: var(--tg-theme-hint-color, #888); padding: 4px;">All players are assigned to teams! 🎉</span>`;
    } else {
        unassignedPlayers.forEach(p => {
            const chip = document.createElement("div");
            chip.style.cssText = "background: var(--tg-theme-bg-color, #181818); border: 1px solid var(--tg-theme-hint-color, #444); padding: 5px 10px; border-radius: 15px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; color: var(--tg-theme-text-color, #fff);";
            const playerName = p.name || p.first_name || "Player";
            chip.innerHTML = `<span>${playerName} (${p.gender || 'M'})</span> <span style="color: #2481cc; font-weight: bold;">+</span>`;
            
            chip.addEventListener("click", () => {
                showAssignMenu(p.id, playerName);
            });

            poolContainer.appendChild(chip);
        });
    }

    const teamsContainer = document.getElementById("teams-list-container");
    teamsContainer.innerHTML = "";

    teams.forEach((team, index) => {
        const teamCard = document.createElement("div");
        teamCard.style.cssText = "background: var(--tg-theme-secondary-bg-color, #2c2c2c); border: 1px solid var(--tg-theme-hint-color, #444); border-radius: 6px; padding: 10px;";

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
        teamPlayersList.style.cssText = "display: flex; flex-direction: column; gap: 4px; min-height: 30px;";

        if (team.playerIds.length === 0) {
            teamPlayersList.innerHTML = `<span style="font-size: 11px; color: var(--tg-theme-hint-color, #777); font-style: italic; padding: 2px;">Tap unassigned players above to add here</span>`;
        } else {
            team.playerIds.forEach(playerId => {
                const pObj = selectedPlayersData.find(x => x.id === playerId);
                if (!pObj) return;

                const pRow = document.createElement("div");
                pRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--tg-theme-bg-color, #181818); padding: 5px 8px; border-radius: 4px; font-size: 12px; color: var(--tg-theme-text-color, #fff);";
                
                const pNameSpan = document.createElement("span");
                pNameSpan.textContent = `${pObj.name || pObj.first_name} (${pObj.gender || 'M'})`;

                const removeBtn = document.createElement("button");
                removeBtn.textContent = "✕";
                removeBtn.style.cssText = "background: none; border: none; color: #dc3545; cursor: pointer; font-size: 14px; font-weight: bold;";
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

function showAssignMenu(playerId, playerName) {
    if (teams.length === 0) {
        alert("Please create at least one team first!");
        return;
    }

    let teamNamesPrompt = teams.map((t, idx) => `${idx + 1}: ${t.name}`).join("\n");
    let choice = prompt(`Assign ${playerName} to team:\n${teamNamesPrompt}\nEnter team number:`, "1");
    
    if (choice === null) return;
    const teamIndex = parseInt(choice) - 1;

    if (teams[teamIndex]) {
        teams[teamIndex].playerIds.push(playerId);
        renderUI();
    } else {
        alert("Invalid team selection.");
    }
}