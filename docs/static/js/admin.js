import { fetchCommunities, createCommunity } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // Инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        } catch (e) {
            console.error("WebApp init error:", e);
        }
    }

    const form = document.getElementById("create-community-form");
    const nameInput = document.getElementById("community-name");
    const codeInput = document.getElementById("invite-code");
    const messageDiv = document.getElementById("message");
    const listContainer = document.getElementById("communities-list");

    async function loadList() {
        if (!listContainer) return;

        listContainer.innerHTML = "<p><em>Loading from server...</em></p>";

        try {
            const communities = await fetchCommunities();
            listContainer.innerHTML = "";

            if (!Array.isArray(communities) || communities.length === 0) {
                listContainer.innerHTML = "<p>No communities created yet.</p>";
                return;
            }

            communities.forEach(c => {
                const item = document.createElement("div");
                item.className = "card";
                item.style.marginBottom = "8px";
                item.style.padding = "10px";
                item.style.border = "1px solid #ccc";
                item.style.borderRadius = "6px";
                item.innerHTML = `<strong>${c.name}</strong><br><small>Code: <code>${c.invite_code}</code></small>`;
                listContainer.appendChild(item);
            });
        } catch (error) {
            listContainer.innerHTML = `<p style="color: red; font-weight: bold;">Error loading list: ${error.message}</p>`;
        }
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            messageDiv.textContent = "";
            messageDiv.className = "";

            const name = nameInput.value.trim();
            const code = codeInput.value.trim();

            if (!name || !code) {
                messageDiv.textContent = "Please fill in all fields.";
                messageDiv.style.color = "red";
                return;
            }

            try {
                await createCommunity(name, code);
                messageDiv.textContent = "Community successfully created!";
                messageDiv.style.color = "green";
                nameInput.value = "";
                codeInput.value = "";
                await loadList();
            } catch (error) {
                messageDiv.textContent = error.message || "Failed to create community.";
                messageDiv.style.color = "red";
            }
        });
    }

    // Запускаем загрузку списка
    loadList();
});