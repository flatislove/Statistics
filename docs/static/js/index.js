import { fetchCommunities, checkAdminStatus, createCommunity } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const isAdmin = await checkAdminStatus();
    if (isAdmin) {
        const adminSection = document.getElementById("admin-section");
        if (adminSection) {
            adminSection.style.display = "block";
        }
    }

    const listContainer = document.getElementById("communities-list");
    const communities = await fetchCommunities();
    
    listContainer.innerHTML = "";
    if (communities.length === 0) {
        listContainer.innerHTML = "<p>No communities available.</p>";
        return;
    }

    communities.forEach(c => {
        const item = document.createElement("div");
        item.className = "card";
        item.innerHTML = `<strong>${c.name}</strong><br><small>Code: ${c.invite_code}</small>`;
        listContainer.appendChild(item);
    });

    const createButton = document.getElementById("btn-create-community");
    if (createButton) {
        createButton.addEventListener("click", async () => {
            const name = prompt("Enter community name:");
            const inviteCode = prompt("Enter invite code:");
            
            if (!name || !inviteCode) return;

            try {
                await createCommunity(name, inviteCode);
                alert("Community created successfully!");
                location.reload();
            } catch (error) {
                alert("Error: " + error.message);
            }
        });
    }
});