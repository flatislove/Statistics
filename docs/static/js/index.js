import { fetchCommunities } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Кнопка перехода на логин / админку
    const loginBtn = document.getElementById("btn-go-login");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }

    const listContainer = document.getElementById("communities-list");
    if (!listContainer) return;

    // 2. Загрузка списка сообществ
    try {
        listContainer.innerHTML = "<p><em>Loading communities...</em></p>";
        const communities = await fetchCommunities();
        listContainer.innerHTML = "";

        if (!Array.isArray(communities) || communities.length === 0) {
            listContainer.innerHTML = "<p>No communities found.</p>";
            return;
        }

        // 3. Рендеринг карточек и навешивание клика внутри цикла
        communities.forEach(c => {
            const item = document.createElement("div");
            item.className = "card";
            item.style.cursor = "pointer";
            item.style.marginBottom = "10px";
            item.style.padding = "12px";
            item.style.border = "1px solid #ccc";
            item.style.borderRadius = "8px";

            item.innerHTML = `<strong>${c.name}</strong>`;

            // Навешиваем событие на конкретную карточку `item` для сообщества `c`
            item.addEventListener("click", () => {
                localStorage.setItem("selected_community_id", c.id);
                localStorage.setItem("selected_community_name", c.name);
                window.location.href = "dashboard.html";
            });

            listContainer.appendChild(item);
        });

    } catch (error) {
        console.error("Index load error:", error);
        listContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
});