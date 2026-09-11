const API_BASE_URL = "https://statistics-x1d4.onrender.com/api";

function getTelegramId() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
        return window.Telegram.WebApp.initDataUnsafe.user?.id || 0;
    }
    return 0;
}

export async function fetchCommunities() {
    try {
        const response = await fetch(`${API_BASE_URL}/communities`);
        if (!response.ok) throw new Error("Failed to load communities");
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function createCommunity(name, inviteCode) {
    const telegramId = getTelegramId();
    
    const response = await fetch(`${API_BASE_URL}/communities`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Id": telegramId.toString()
        },
        body: JSON.stringify({
            name: name,
            invite_code: inviteCode
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to create community");
    }
    return data;
}