document.addEventListener("DOMContentLoaded", async () => {
    const webApp = window.Telegram.WebApp;
    webApp.ready();

    const telegramId = webApp.initDataUnsafe?.user?.id;
    const communityId = localStorage.getItem("current_community_id");

    if (!telegramId) {
        webApp.showAlert("Could not retrieve Telegram user data.");
        return;
    }

    if (!communityId) {
        webApp.showAlert("Community ID not found. Please select a community first.");
        window.location.href = "./communities.html";
        return;
    }

    const formatSelect = document.getElementById("format-select");
    const targetWinsSelect = document.getElementById("target-wins-select");
    const saveButton = document.getElementById("btn-save-settings");
    const backButton = document.getElementById("btn-back-to-settings");

    backButton.onclick = () => {
        window.location.href = "./settings.html";
    };

    try {
        const response = await fetch(`/api/communities/${communityId}/settings`, {
            headers: {
                "X-Telegram-Id": telegramId
            }
        });

        if (response.ok) {
            const data = await response.json();
            formatSelect.value = data.format_type;
            targetWinsSelect.value = data.target_wins.toString();
        } else {
            console.error("Failed to load community settings.");
        }
    } catch (error) {
        console.error("Error fetching settings:", error);
    }

    saveButton.onclick = async () => {
        const payload = {
            format_type: formatSelect.value,
            target_wins: parseInt(targetWinsSelect.value, 10)
        };

        try {
            const response = await fetch(`/api/communities/${communityId}/settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Telegram-Id": telegramId
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                webApp.showAlert("Settings saved successfully!");
            } else {
                const errData = await response.json();
                webApp.showAlert(`Error: ${errData.detail || "Failed to save settings."}`);
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            webApp.showAlert("Server connection error.");
        }
    };
});