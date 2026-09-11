import { fetchCommunities, createCommunity } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const form = document.getElementById("create-community-form");
    const nameInput = document.getElementById("community-name");
    const codeInput = document.getElementById("invite-code");
    const messageDiv = document.getElementById("message");
    const listContainer = document.getElementById("communities-list");

    async function loadList() {
        const communities = await fetchCommunities();
        listContainer.innerHTML = "";
        if (communities.length === 0) {
            listContainer.innerHTML = "<p>Пока нет созданных комьюнити.</p>";
            return;
        }
        communities.forEach(c => {
            const item = document.createElement("div");
            item.className = "card";
            item.innerHTML = `<strong>${c.name}</strong><br><small>Код: ${c.invite_code}</small>`;
            listContainer.appendChild(item);
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        messageDiv.textContent = "";
        messageDiv.className = "";

        try {
            await createCommunity(nameInput.value.trim(), codeInput.value.trim());
            messageDiv.textContent = "Комьюнити успешно создано!";
            messageDiv.className = "success";
            nameInput.value = "";
            codeInput.value = "";
            loadList();
        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.className = "error";
        }
    });

    loadList();
});