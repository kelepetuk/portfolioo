
document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       YOUR ORIGINAL FEATURES
    ========================= */

    const title = document.querySelector("header h1");
    if (title) {
        const text = "Hi, I'm Pogi 👋";
        let i = 0;
        title.innerHTML = "";

        function typeEffect() {
            if (i < text.length) {
                title.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeEffect, 80);
            }
        }
        typeEffect();
    }

    document.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    const sections = document.querySelectorAll("section");

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, { threshold: 0.15 });

    sections.forEach(section => {
        observer.observe(section);
    });

    /* =========================
       🔥 SOC SIMULATION SYSTEM
    ========================= */

    // ENABLE SOC MODE
    document.body.classList.add("soc-mode");

    // CREATE ALERT BOX
    const alertBox = document.createElement("div");
    alertBox.id = "alertBox";
    document.body.appendChild(alertBox);

    const alerts = [
        "⚠ Intrusion Attempt Detected",
        "⚠ Suspicious Login Blocked",
        "⚠ Malware Signature Found",
        "⚠ Port Scan Detected",
        "⚠ Firewall Blocked Attack"
    ];

    function createAlert() {
        const div = document.createElement("div");
        div.classList.add("alert");
        div.innerText = alerts[Math.floor(Math.random() * alerts.length)];
        alertBox.appendChild(div);

        setTimeout(() => div.remove(), 4000);
    }

    setInterval(createAlert, 5000);

    // TERMINAL SIMULATION
    const terminal = document.createElement("div");
    terminal.id = "terminal";
    document.body.appendChild(terminal);

    const logs = [
        "[BOOT] SOC SYSTEM ONLINE",
        "[SCAN] Monitoring network traffic...",
        "[FIREWALL] Active",
        "[SIEM] Analyzing logs",
        "[STATUS] System Stable"
    ];

    let i = 0;

    function runLogs() {
        if (!terminal) return;

        if (i < logs.length) {
            terminal.innerHTML += logs[i] + "<br>";
            i++;
            setTimeout(runLogs, 1200);
        } else {
            terminal.innerHTML += "_ SYSTEM MONITORING ACTIVE";
        }
    }

    runLogs();

});