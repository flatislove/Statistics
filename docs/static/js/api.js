const API_BASE_URL = "https://statistics-x1d4.onrender.com/api";

function getTelegramId() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        const userId = window.Telegram.WebApp.initDataUnsafe.user.id;
        console.log("Telegram ID detected:", userId);
        return userId;
    }
    console.warn("Telegram WebApp not found or user data missing, returning ID 0");
    return 0;
}

async function handleRequest(url, options = {}) {
    let response;
    try {
        response = await fetch(url, options);
    } catch (networkError) {
        console.error("Network error / Failed to fetch:", networkError);
        throw new Error("Failed to connect to the server. Check your internet connection.");
    }

    let data = {};
    try {
        data = await response.json();
    } catch (e) {
    }

    if (!response.ok) {
        let errorMsg = `Server error: ${response.status} ${response.statusText}`;
        if (data.detail) {
            errorMsg = typeof data.detail === "object" ? JSON.stringify(data.detail) : data.detail;
        }
        throw new Error(errorMsg);
    }

    return data;
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
        
        if (!response.ok) return false;
        const data = await response.json();
        return data.is_admin;
    } catch (error) {
        console.error("Error in checkAdminStatus:", error);
        return false;
    }
}

export async function createCommunity(name, inviteCode) {
    const telegramId = getTelegramId();
    return await handleRequest(`${API_BASE_URL}/communities`, {
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
    return await handleRequest(`${API_BASE_URL}/communities/${communityId}/players`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Id": telegramId.toString()
        },
        body: JSON.stringify(playerPayload)
    });
}

export async function updatePlayer(playerId, playerPayload) {
    const telegramId = getTelegramId();
    return await handleRequest(`${API_BASE_URL}/players/${playerId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Id": telegramId.toString()
        },
        body: JSON.stringify(playerPayload)
    });
}

export async function deletePlayer(playerId) {
    const telegramId = getTelegramId();
    await handleRequest(`${API_BASE_URL}/players/${playerId}`, {
        method: "DELETE",
        headers: {
            "X-Telegram-Id": telegramId.toString()
        }
    });
    return true;
}

export async function fetchMatchDays(communityId) {
    try {
        const response = await fetch(`${API_BASE_URL}/communities/${communityId}/match-days`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error in fetchMatchDays:", error);
        return [];
    }
}

export async function createMatchDay(communityId, payload) {
    const telegramId = getTelegramId();
    return await handleRequest(`${API_BASE_URL}/communities/${communityId}/match-days`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Id": telegramId.toString()
        },
        body: JSON.stringify(payload)
    });
}

export async function fetchMatchDayDetails(matchDayId) {
    try {
        const response = await fetch(`${API_BASE_URL}/match-days/${matchDayId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error in fetchMatchDayDetails:", error);
        return null;
    }
}

export async function createGame(matchDayId, payload) {
    const telegramId = getTelegramId();
    return await handleRequest(`${API_BASE_URL}/match-days/${matchDayId}/games`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Id": telegramId.toString()
        },
        body: JSON.stringify(payload)
    });
}

export async function updateGameStats(gameId, payload) {
    const telegramId = getTelegramId();
    return await handleRequest(`${API_BASE_URL}/games/${gameId}/stats`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Id": telegramId.toString()
        },
        body: JSON.stringify(payload)
    });
}