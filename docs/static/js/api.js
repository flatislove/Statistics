const API_BASE_URL = "https://statistics-x1d4.onrender.com/api";

function getTelegramId() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
        const userId = window.Telegram.WebApp.initDataUnsafe.user?.id || 0;
        console.log("Telegram ID detected:", userId);
        return userId;
    }
    console.warn("Telegram WebApp not found or user data missing, returning ID 0");
    return 0;
}

export async function fetchCommunities() {
    try {
        const response = await fetch(`${API_BASE_URL}/communities`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error in fetchCommunities:", error);
        return [];
    }
}

export async function checkAdminStatus() {
    const telegramId = getTelegramId();
    if (!telegramId) {
        console.log("Admin check skipped: Telegram ID is 0");
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/check-admin`, {
            headers: {
                "X-Telegram-Id": telegramId.toString()
            }
        });
        
        console.log("Check-admin response status:", response.status);
        if (!response.ok) return false;
        
        const data = await response.json();
        console.log("Admin check result data:", data);
        return data.is_admin;
    } catch (error) {
        console.error("Error in checkAdminStatus:", error);
        return false;
    }
}

export async function createCommunity(name, inviteCode) {
    const telegramId = getTelegramId();
    console.log("Attempting to create community with Telegram ID:", telegramId);
    
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
        const errorMsg = typeof data.detail === "object" ? JSON.stringify(data.detail) : (data.detail || `Server error: ${response.status}`);
        throw new Error(errorMsg);
    }
    return data;
}

export async function fetchPlayers(communityId) {
    try {
        const response = await fetch(`${API_BASE_URL}/communities/${communityId}/players`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error in fetchPlayers:", error);
        return [];
    }
}

export async function createPlayer(communityId, playerPayload) {
    const telegramId = getTelegramId();
    
    const response = await fetch(`${API_BASE_URL}/communities/${communityId}/players`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Id": telegramId.toString()
        },
        body: JSON.stringify(playerPayload)
    });

    const data = await response.json();
    if (!response.ok) {
        const errorMsg = typeof data.detail === "object" ? JSON.stringify(data.detail) : (data.detail || `Server error: ${response.status}`);
        throw new Error(errorMsg);
    }
    return data;
}

export async function updatePlayer(playerId, playerPayload) {
    const telegramId = getTelegramId();
    
    const response = await fetch(`${API_BASE_URL}/players/${playerId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Id": telegramId.toString()
        },
        body: JSON.stringify(playerPayload)
    });

    const data = await response.json();
    if (!response.ok) {
        const errorMsg = typeof data.detail === "object" ? JSON.stringify(data.detail) : (data.detail || `Server error: ${response.status}`);
        throw new Error(errorMsg);
    }
    return data;
}

export async function deletePlayer(playerId) {
    const telegramId = getTelegramId();
    
    const response = await fetch(`${API_BASE_URL}/players/${playerId}`, {
        method: "DELETE",
        headers: {
            "X-Telegram-Id": telegramId.toString()
        }
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMsg = typeof data.detail === "object" ? JSON.stringify(data.detail) : (data.detail || `Server error: ${response.status}`);
        throw new Error(errorMsg);
    }
    return true;
}