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

// --- COMMUNITIES ---

export async function fetchCommunities() {
    return await handleRequest(`${API_BASE_URL}/communities`);
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

export async function checkAdminStatus() {
    const telegramId = getTelegramId();
    if (!telegramId) {
        console.log("Admin check skipped: Telegram ID is 0");
        return false;
    }

    try {
        const data = await handleRequest(`${API_BASE_URL}/check-admin`, {
            headers: {
                "X-Telegram-Id": telegramId.toString()
            }
        });
        return data.is_admin;
    } catch (error) {
        console.error("Error in checkAdminStatus:", error);
        return false;
    }
}

// --- SETTINGS ---

export async function fetchCommunitySettings(communityId) {
    return await handleRequest(`${API_BASE_URL}/communities/${communityId}/settings`);
}

export async function updateCommunitySettings(communityId, payload) {
    const telegramId = getTelegramId();
    return await handleRequest(`${API_BASE_URL}/communities/${communityId}/settings`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Id": telegramId.toString()
        },
        body: JSON.stringify(payload)
    });
}

// --- PLAYERS ---

export async function fetchPlayers(communityId) {
    return await handleRequest(`${API_BASE_URL}/communities/${communityId}/players`);
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

// --- MATCH DAYS & GAMES ---

export async function fetchMatchDays(communityId) {
    return await handleRequest(`${API_BASE_URL}/communities/${communityId}/match-days`);
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
    return await handleRequest(`${API_BASE_URL}/match-days/${matchDayId}`);
}

export async function fetchMatchDayLineup(matchDayId) {
    return await handleRequest(`${API_BASE_URL}/match-days/${matchDayId}/lineup`);
}

export async function updateMatchDayLineup(matchDayId, payload) {
    const telegramId = getTelegramId();
    return await handleRequest(`${API_BASE_URL}/match-days/${matchDayId}/lineup`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Id": telegramId.toString()
        },
        body: JSON.stringify(payload)
    });
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