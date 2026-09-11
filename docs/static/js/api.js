const API_BASE_URL = "https://your-backend-url.onrender.com/api";

export async function fetchCommunities() {
    try {
        const response = await fetch(`${API_BASE_URL}/communities`);
        if (!response.ok) {
            throw new Error("Failed to fetch communities");
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function createCommunity(name, inviteCode, telegramId) {
    try {
        const response = await fetch(`${API_BASE_URL}/communities?name=${encodeURIComponent(name)}&invite_code=${encodeURIComponent(inviteCode)}`, {
            method: "POST",
            headers: {
                "X-Telegram-Id": telegramId
            }
        });
        if (!response.ok) {
            throw new Error("Failed to create community");
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}