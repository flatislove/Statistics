import { fetchPlayers, createPlayer, updatePlayer, deletePlayer } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Players DOM loaded successfully");

    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const communityId = localStorage.getItem("selected_community_id");
    console.log("Selected Community ID from storage:", communityId);

    if (!communityId) {
        window.location.href = "index.html";
        return;
    }

    await loadPlayersList(Number(communityId));

    const addBtn = document.getElementById("btn-add-player");
    if (!addBtn) {
        console.error("Button element 'btn-add-player' not found!");
        return;
    }

    addBtn.addEventListener("click", async () => {
        console.log("Add player button clicked!");

        const firstNameInput = document.getElementById("input-player-first-name");
        const usernameInput = document.getElementById("input-player-username");
        const telegramIdInput = document.getElementById("input-player-telegram-id");
        const genderSelect = document.getElementById("select-player-gender");

        if (!firstNameInput) {
            console.error("First name input element not found!");
            return;
        }
        
        const firstName = firstNameInput.value.trim();
        console.log("Player first name entered:", firstName);

        if (!firstName) {
            alert("Player first name is required");
            return;
        }

        const payload = {
            first_name: firstName,
            username: usernameInput ? usernameInput.value.trim().replace(/^@/, '') || null : null,
            telegram_id: telegramIdInput && telegramIdInput.value.trim() ? Number(telegramIdInput.value.trim()) : null,
            gender: genderSelect ? genderSelect.value : "M"
        };

        console.log("Sending payload to createPlayer:", payload);

        try {
            const result = await createPlayer(Number(communityId), payload);
            console.log("Player successfully created:", result);

            firstNameInput.value = "";
            if (usernameInput) usernameInput.value = "";
            if (telegramIdInput) telegramIdInput.value = "";
            
            await loadPlayersList(Number(communityId));
        } catch (error) {
            console.error("Failed to create player:", error);
            alert("Error: " + error.message);
        }
    });
});

async function loadPlayersList(communityId) {
    const listContainer = document.getElementById("players-list");
    if (!listContainer) return;

    listContainer.innerHTML = "Loading players...";

    try {
        let players = await fetchPlayers(communityId);
        console.log("Fetched players list:", players);
        
        listContainer.innerHTML = "";

        if (!players || players.length === 0) {
            listContainer.innerHTML = "<p>No players found.</p>";
            return;
        }

        players.sort((a, b) => a.first_name.localeCompare(b.first_name));

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
            nameSpan.textContent = p.first_name;
            nameSpan.style.fontWeight = "bold";

            const detailsSpan = document.createElement("span");
            let detailsText = `Gender: ${p.gender || 'M'}`;
            if (p.username) detailsText += ` | @${p.username}`;
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
                const newFirstName = prompt("Edit player first name:", p.first_name);
                if (!newFirstName || !newFirstName.trim()) return;

                try {
                    await updatePlayer(p.id, { first_name: newFirstName.trim() });
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
                if (!confirm(`Are you sure you want to delete ${p.first_name}?`)) return;

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
        console.error("Error loading players list:", error);
        listContainer.innerHTML = "<p>No players found.</p>";
    }
}