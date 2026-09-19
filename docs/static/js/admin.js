import { fetchCommunities, createCommunity, checkAdminStatus } from "./api.js";

// Глобальный перехватчик ошибок для отображения прямо на экране
window.addEventListener("error", (event) => {
    const msgDiv = document.getElementById("message");
    if (msgDiv) {
        msgDiv.textContent = `JS Error: ${event.message}`;
        msgDiv.style.color = "red";
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    console.log("=== Admin JS Loaded & DOM Ready ===");

    // Инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            console.log("Telegram WebApp successfully initialized");
        } catch (e) {
            console.error("WebApp init error:", e);
        }
    } else {
        console.warn("Telegram WebApp SDK not found on page");
    }

    // Получаем DOM-элементы
    const adminStatusDiv = document.getElementById("admin-status");
    const adminCard = document.getElementById("admin-card");
    const form = document.getElementById("create-community-form");
    const nameInput = document.getElementById("community-name");
    const codeInput = document.getElementById("invite-code");
    const messageDiv = document.getElementById("message");
    const listContainer = document.getElementById("communities-list");

    console.log("DOM Elements Check:", {
        adminStatusDiv: !!adminStatusDiv,
        adminCard: !!adminCard,
        form: !!form,
        nameInput: !!nameInput,
        codeInput: !!codeInput,
        messageDiv: !!messageDiv,
        listContainer: !!listContainer
    });

    // 1. Проверка прав администратора
    try {
        const isAdmin = await checkAdminStatus();
        console.log("Check Admin Result:", isAdmin);

        if (isAdmin) {
            if (adminStatusDiv) {
                adminStatusDiv.textContent = "✓ Access Granted (Admin)";
                adminStatusDiv.style.color = "green";
            }
            if (adminCard) {
                adminCard.style.display = "block"; // Показываем форму создания
            }
        } else {
            if (adminStatusDiv) {
                adminStatusDiv.textContent = "✗ Access Denied: You are not authorized as admin.";
                adminStatusDiv.style.color = "red";
            }
            if (adminCard) {
                adminCard.style.display = "none";
            }
        }
    } catch (e) {
        console.error("Failed to check admin status:", e);
        if (adminStatusDiv) {
            adminStatusDiv.textContent = "Error checking access: " + e.message;
            adminStatusDiv.style.color = "red";
        }
    }

    // 2. Функция загрузки списка сообществ
    async function loadList() {
        if (!listContainer) return;

        console.log("Fetching communities list...");
        listContainer.innerHTML = "<p><em>Loading communities from server...</em></p>";

        try {
            const communities = await fetchCommunities();
            console.log("Communities received:", communities);
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
            console.error("Error loading communities list:", error);
            listContainer.innerHTML = `<p style="color: red; font-weight: bold;">Error loading list: ${error.message}</p>`;
        }
    }

    // 3. Обработка формы создания сообщества
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("Form submit event triggered!");

            if (messageDiv) {
                messageDiv.textContent = "Sending request to server...";
                messageDiv.style.color = "blue";
            }

            const name = nameInput ? nameInput.value.trim() : "";
            const code = codeInput ? codeInput.value.trim() : "";

            if (!name || !code) {
                if (messageDiv) {
                    messageDiv.textContent = "Please fill in all fields.";
                    messageDiv.style.color = "red";
                }
                return;
            }

            try {
                const result = await createCommunity(name, code);
                console.log("Community created successfully:", result);

                if (messageDiv) {
                    messageDiv.textContent = `Community "${result.name || name}" created successfully!`;
                    messageDiv.style.color = "green";
                }

                if (nameInput) nameInput.value = "";
                if (codeInput) codeInput.value = "";

                await loadList();
            } catch (error) {
                console.error("Error during createCommunity API call:", error);
                if (messageDiv) {
                    messageDiv.textContent = error.message || "Failed to create community.";
                    messageDiv.style.color = "red";
                }
            }
        });
    }

    // Запускаем первичное получение списка
    await loadList();
});