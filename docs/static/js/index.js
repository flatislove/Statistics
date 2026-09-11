const loginBtn = document.getElementById("btn-go-login");
if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        window.location.href = "login.html";
    });
}

item.addEventListener("click", () => {
    localStorage.setItem("selected_community_id", c.id);
    localStorage.setItem("selected_community_name", c.name);
    
    window.location.href = "dashboard.html";
});