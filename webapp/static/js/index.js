import { fetchCommunities } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
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
});