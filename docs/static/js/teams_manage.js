document.addEventListener("DOMContentLoaded", () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const communityId = localStorage.getItem("selected_community_id");
    if (!communityId) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("btn-back-to-settings").addEventListener("click", () => {
        window.location.href = "settings.html";
    });
});