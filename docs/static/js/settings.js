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

    document.getElementById("btn-back-to-dashboard").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    document.getElementById("btn-settings-players").addEventListener("click", () => {
        window.location.href = "players.html";
    });

    document.getElementById("btn-settings-teams").addEventListener("click", () => {
        window.location.href = "teams_manage.html";
    });

    document.getElementById("btn-settings-history").addEventListener("click", () => {
        window.location.href = "history.html";
    });
});