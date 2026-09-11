import { fetchCommunities, checkAdminStatus, createCommunity } from "./api.js";

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

        communities.forEach(c => {
            const item = document.createElement("div");
            item.className = "card";
            item.innerHTML = `<strong>${c.name}</strong><br><small>Code: ${c.invite_code}</small>`;
            listContainer.appendChild(item);
        });
    } catch (error) {
        listContainer.innerHTML = "<p>Failed to load communities.</p>";
    }
}