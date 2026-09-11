document.addEventListener("DOMContentLoaded", () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const communityName = localStorage.getItem("selected_community_name");
    const communityId = localStorage.getItem("selected_community_id");

    if (!communityId) {
        alert("Community not selected!");
        window.location.href = "index.html";
        return;
    }

    const titleEl = document.getElementById("community-title");
    if (titleEl) {
        titleEl.innerText = `Community: ${communityName}`;
    }

    document.getElementById("btn-back-to-communities").addEventListener("click", () => {
        window.location.href = "index.html";
    });

    document.getElementById("btn-match").addEventListener("click", () => {
        window.location.href = "match.html";
    });

    document.getElementById("btn-settings").addEventListener("click", () => {
        window.location.href = "settings.html";
    });

    document.getElementById("btn-reports").addEventListener("click", () => {
        window.location.href = "reports.html";
    });
});