import { fetchCommunities, checkAdminStatus, createCommunity, fetchPlayers, createPlayer } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    try {
        const isAdmin = await checkAdminStatus();
        if (isAdmin) {
            const adminSection = document.getElementById("admin-section");
            if (adminSection) {
                adminSection.style.display = "block";
            }
        }
    } catch (error) {
        console.error(error);
    }

    // Проверяем, было ли сообщество выбрано ранее
    restoreSelectedCommunity();

    await loadCommunities();

    const createButton = document.getElementById("btn-create-community");
    if (createButton) {
        createButton.addEventListener("click", async () => {
            const name = prompt("Enter community name:");
            if (!name || !name.trim()) return;

            const inviteCode = prompt("Enter invite code:");
            if (!inviteCode || !inviteCode.trim()) return;

            try {
                await createCommunity(name.trim(), inviteCode.trim());
                alert("Community created successfully!");
                location.reload();
            } catch (error) {
                alert("Error: " + error.message);
            }
        });
    }

    // Обработчик кнопки управления игроками
    const managePlayersBtn = document.getElementById("btn-manage-players");
    if (managePlayersBtn) {
        managePlayersBtn.addEventListener("click", async () => {
            const playersSection = document.getElementById("players-section");
            if (playersSection) {
                const isHidden = playersSection.style.display === "none";
                playersSection.style.display = isHidden ? "block" : "none";
                if (isHidden) {
                    await loadPlayers();
                }
            }
        });
    }

    // Обработчик кнопки добавления игрока
    const addPlayerBtn = document.getElementById("btn-add-player");
    if (addPlayerBtn) {
        addPlayerBtn.addEventListener("click", async () => {
            const communityId = localStorage.getItem("selected_community_id");
            if (!communityId) {
                alert("Please select a community first.");
                return;
            }

            const playerName = prompt("Enter player name:");
            if (!playerName || !playerName.trim()) return;

            try {
                await createPlayer(Number(communityId), playerName.trim());
                alert("Player added successfully!");
                await loadPlayers();
            } catch (error) {
                alert("Error: " + error.message);
            }
        });
    }
});

async function loadCommunities() {
    const listContainer = document.getElementById("communities-list");
    if (!listContainer) return;

    listContainer.innerHTML = "Loading communities...";
    
    try {
        const communities = await fetchCommunities();
        
        listContainer.innerHTML = "";
        if (!communities || communities.length === 0) {
            listContainer.innerHTML = "<p>No communities available.</p>";
            return;
        }

        const currentSelectedId = localStorage.getItem("selected_community_id");

        communities.forEach(c => {
            const item = document.createElement("div");
            item.className = "card";
            item.style.cursor = "pointer";
            
            if (currentSelectedId && Number(currentSelectedId) === c.id) {
                item.style.border = "2px solid #2481cc";
            }

            item.innerHTML = `<strong>${c.name}</strong><br><small>Code: ${c.invite_code}</small>`;
            
            item.addEventListener("click", async () => {
                localStorage.setItem("selected_community_id", c.id);
                localStorage.setItem("selected_community_name", c.name);
                
                document.querySelectorAll("#communities-list .card").forEach(card => {
                    card.style.border = "none";
                });
                item.style.border = "2px solid #2481cc";

                showDashboard(c.name);

                // Скрываем секцию игроков при смене сообщества и очищаем список
                const playersSection = document.getElementById("players-section");
                if (playersSection) playersSection.style.display = "none";
            });

            listContainer.appendChild(item);
        });
    } catch (error) {
        listContainer.innerHTML = "<p>Failed to load communities.</p>";
    }
}

async function loadPlayers() {
    const playersListContainer = document.getElementById("players-list");
    if (!playersListContainer) return;

    const communityId = localStorage.getItem("selected_community_id");
    if (!communityId) return;

    playersListContainer.innerHTML = "Loading players...";

    try {
        const players = await fetchPlayers(Number(communityId));
        playersListContainer.innerHTML = "";

        if (!players || players.length === 0) {
            playersListContainer.innerHTML = "<p>No players in this community yet.</p>";
            return;
        }

        const ul = document.createElement("ul");
        ul.style.paddingLeft = "20px";
        
        players.forEach(p => {
            const li = document.createElement("li");
            li.textContent = p.name;
            ul.appendChild(li);
        });

        playersListContainer.appendChild(ul);
    } catch (error) {
        playersListContainer.innerHTML = "<p>Failed to load players.</p>";
    }
}

function restoreSelectedCommunity() {
    const savedName = localStorage.getItem("selected_community_name");
    const savedId = localStorage.getItem("selected_community_id");
    
    if (savedId && savedName) {
        showDashboard(savedName);
    }
}

function showDashboard(communityName) {
    const dashboard = document.getElementById("community-dashboard");
    const title = document.getElementById("selected-community-title");
    
    if (dashboard && title) {
        title.innerText = `Community: ${communityName}`;
        dashboard.style.display = "block";
    }
}