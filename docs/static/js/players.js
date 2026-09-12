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

    await loadPlayersList(Number(communityId));

    const addBtn = document.getElementById("btn-add-player");
    if (addBtn) {
        addBtn.addEventListener("click", async () => {
            const nameInput = document.getElementById("input-player-name");
            const nicknameInput = document.getElementById("input-player-nickname");
            const telegramIdInput = document.getElementById("input-player-telegram-id");
            const genderSelect = document.getElementById("select-player-gender");

            if (!nameInput) return;
            
            const playerName = nameInput.value.trim();
            if (!playerName) {
                alert("Player name is required");
                return;
            }

            const payload = {
                community_id: Number(communityId),
                name: playerName,
                nickname: nicknameInput ? nicknameInput.value.trim() || null : null,
                telegram_id: telegramIdInput && telegramIdInput.value.trim() ? Number(telegramIdInput.value.trim()) : null,
                gender: genderSelect ? genderSelect.value : "M"
            };

            try {
                await createPlayer(Number(communityId), payload);
                nameInput.value = "";
                if (nicknameInput) nicknameInput.value = "";
                if (telegramIdInput) telegramIdInput.value = "";
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
        let players = await fetchPlayers(communityId);
        listContainer.innerHTML = "";

        if (!players || players.length === 0) {
            listContainer.innerHTML = "<p>No players found.</p>";
            return;
        }

        players.sort((a, b) => a.name.localeCompare(b.name));

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
            li.style.padding = "10px";
            li.style.border = "1px solid #ddd";
            li.style.borderRadius = "6px";

            const infoDiv = document.createElement("div");
            infoDiv.style.display = "flex";
            infoDiv.style.flexDirection = "column";
            infoDiv.style.gap = "2px";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = p.name;
            nameSpan.style.fontWeight = "bold";

            const detailsSpan = document.createElement("span");
            let detailsText = `Gender: ${p.gender || 'M'}`;
            if (p.nickname) detailsText += ` | @${p.nickname}`;
            if (p.telegram_id) detailsText += ` | ID: ${p.telegram_id}`;
            detailsSpan.textContent = detailsText;
            detailsSpan.style.fontSize = "12px";
            detailsSpan.style.color = "#666";

            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(detailsSpan);

            const actionsDiv = document.createElement("div");
            actionsDiv.style.display = "flex";
            actionsDiv.style.gap = "5px";

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.style.padding = "6px 10px";
            editBtn.style.cursor = "pointer";
            editBtn.addEventListener("click", async () => {
                const newName = prompt("Edit player name:", p.name);
                if (!newName || !newName.trim()) return;

                try {
                    await updatePlayer(p.id, { name: newName.trim() });
                    await loadPlayersList(communityId);
                } catch (error) {
                    alert("Error: " + error.message);
                }
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.style.padding = "6px 10px";
            deleteBtn.style.backgroundColor = "#dc3545";
            deleteBtn.style.color = "white";
            deleteBtn.style.border = "none";
            deleteBtn.style.borderRadius = "4px";
            deleteBtn.style.cursor = "pointer";
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

            li.appendChild(infoDiv);
            li.appendChild(actionsDiv);
            ul.appendChild(li);
        });

        listContainer.appendChild(ul);
    } catch (error) {
        listContainer.innerHTML = "<p>No players found.</p>";
    }
}