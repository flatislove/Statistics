import { checkAdminStatus } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const statusEl = document.getElementById("login-status");
    
    try {
        const isAdmin = await checkAdminStatus();
        
        if (isAdmin) {
            statusEl.innerText = "Authorization successful! Redirecting...";
            setTimeout(() => {
                const savedId = localStorage.getItem("selected_community_id");
                if (savedId) {
                    window.location.href = "dashboard.html";
                } else {
                    window.location.href = "index.html";
                }
            }, 1000);
        } else {
            statusEl.innerText = "Access denied. You are not an administrator.";
            document.getElementById("btn-retry-login").style.display = "inline-block";
        }
    } catch (error) {
        console.error(error);
        statusEl.innerText = "Server connection error.";
        document.getElementById("btn-retry-login").style.display = "inline-block";
    }

    document.getElementById("btn-retry-login").addEventListener("click", () => {
        location.reload();
    });
});