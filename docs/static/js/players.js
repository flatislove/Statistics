import { fetchPlayers, createPlayer, updatePlayer, deletePlayer } from "./api.js";

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
        backBtn.addEventListener("click", () => {
            window.location.href = "settings.html";
        });
    }

    await loadPlayersList(Number(communityId));

    const addBtn = document.getElementById("btn-add-player");
    if (addBtn) {
        addBtn.addEventListener("click", async () => {
            const input = document.getElementById("input-player-name");
            if (!input) return;
            
            const playerName = input.value.trim();
            if (!playerName) return;

            try {
                await createPlayer(Number(communityId), playerName);
                input.value = "";
                await loadPlayersList(Number(communityId));
            } catch (error) {
                alert("Error: " + error.message);
            }
        });
    }
});

async function loadPlayersList(communityId) {
    const listContainer = document.getElementById("players-list");
    if (!listContainer) return;

    listContainer.innerHTML = "Loading players...";

    try {
        const players = await fetchPlayers(communityId);
        listContainer.innerHTML = "";

        if (!players || players.length === 0) {
            listContainer.innerHTML = "<p>No players found.</p>";
            return;
        }

        const ul = document.createElement("ul");
        ul.style.listStyle = "none";
        ul.style.padding = "0";
        ul.style.display = "flex";
        ul.style.flexDirection = "column";
        ul.style.gap = "10px";

        players.forEach(p => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.padding = "8px";
            li.style.border = "1px solid #ddd";
            li.style.borderRadius = "4px";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = p.name;

            const actionsDiv = document.createElement("div");
            actionsDiv.style.display = "flex";
            actionsDiv.style.gap = "5px";

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.style.padding = "4px 8px";
            editBtn.addEventListener("click", async () => {
                const newName = prompt("Edit player name:", p.name);
                if (!newName || !newName.trim()) return;

                try {
                    await updatePlayer(p.id, newName.trim());
                    await loadPlayersList(communityId);
                } catch (error) {
                    alert("Error: " + error.message);
                }
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.style.padding = "4px 8px";
            deleteBtn.style.backgroundColor = "#dc3545";
            deleteBtn.style.color = "white";
            deleteBtn.style.border = "none";
            deleteBtn.addEventListener("click", async () => {
                if (!confirm(`Are you sure you want to delete ${p.name}?`)) return;

                try {
                    await deletePlayer(p.id);
                    await loadPlayersList(communityId);
                } catch (error) {
                    alert("Error: " + error.message);
                }
            });

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            li.appendChild(nameSpan);
            li.appendChild(actionsDiv);
            ul.appendChild(li);
        });

        listContainer.appendChild(ul);
    } catch (error) {
        listContainer.innerHTML = "<p>Failed to load players.</p>";
    }
}