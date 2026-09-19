import { checkAdminStatus } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const statusText = document.getElementById("login-status");
    const retryBtn = document.getElementById("btn-retry-login");

    async function performLogin() {
        if (statusText) {
            statusText.textContent = "Checking Telegram account...";
            statusText.style.color = "inherit";
        }
        if (retryBtn) retryBtn.style.display = "none";

        try {
            // Проверяем админские права на бэкенде
            const isAdmin = await checkAdminStatus();

            if (isAdmin) {
                if (statusText) {
                    statusText.textContent = "Access granted! Redirecting to Admin Panel...";
                    statusText.style.color = "green";
                }
                // Успешно — переходим в админку для создания комьюнити
                setTimeout(() => {
                    window.location.href = "admin.html";
                }, 800);
            } else {
                if (statusText) {
                    statusText.textContent = "Access denied. You are not authorized as administrator.";
                    statusText.style.color = "red";
                }
                if (retryBtn) retryBtn.style.display = "inline-block";
            }
        } catch (error) {
            console.error("Login error:", error);
            if (statusText) {
                statusText.textContent = "Connection error. Make sure backend is awake.";
                statusText.style.color = "red";
            }
            if (retryBtn) retryBtn.style.display = "inline-block";
        }
    }

    if (retryBtn) {
        retryBtn.addEventListener("click", performLogin);
    }

    // Запускаем проверку при загрузке страницы
    performLogin();
});