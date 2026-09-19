import { fetchCommunities, createCommunity } from "./api.js";

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
    const form = document.getElementById("create-community-form");
    const nameInput = document.getElementById("community-name");
    const codeInput = document.getElementById("invite-code");
    const messageDiv = document.getElementById("message");
    const listContainer = document.getElementById("communities-list");

    // ЛОГИРОВАНИЕ НАЛИЧИЯ ЭЛЕМЕНТОВ
    console.log("DOM Elements Check:", {
        "form (#create-community-form)": form,
        "nameInput (#community-name)": nameInput,
        "codeInput (#invite-code)": codeInput,
        "messageDiv (#message)": messageDiv,
        "listContainer (#communities-list)": listContainer
    });

    if (!form) {
        console.error("❌ CRITICAL ERROR: Form '#create-community-form' was not found in HTML!");
    } else {
        console.log("✅ Form found. Checking form visibility and computed style...");
        const style = window.getComputedStyle(form);
        console.log("Form CSS display status:", style.display, "| visibility:", style.visibility);
    }

    async function loadList() {
        if (!listContainer) {
            console.warn("listContainer not found, skipping loadList()");
            return;
        }

        console.log("Fetching communities list...");
        listContainer.innerHTML = "<p><em>Loading from server...</em></p>";

        try {
            const communities = await fetchCommunities();
            console.log("Communities received from server:", communities);
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

    if (form) {
        console.log("Attaching 'submit' event listener to #create-community-form...");
        
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("Form submit event triggered!");

            if (messageDiv) {
                messageDiv.textContent = "";
                messageDiv.className = "";
            }

            const name = nameInput ? nameInput.value.trim() : "";
            const code = codeInput ? codeInput.value.trim() : "";

            console.log("Submitting form with payload:", { name, code });

            if (!name || !code) {
                console.warn("Validation failed: empty fields");
                if (messageDiv) {
                    messageDiv.textContent = "Please fill in all fields.";
                    messageDiv.style.color = "red";
                }
                return;
            }

            try {
                console.log("Calling createCommunity API...");
                const result = await createCommunity(name, code);
                console.log("Community created successfully:", result);

                if (messageDiv) {
                    messageDiv.textContent = "Community successfully created!";
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

    // Запускаем загрузку списка
    loadList();
});