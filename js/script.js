
const clock = document.getElementById("clock");

function updateClock() {
    if (!clock) return;

    const now = new Date();

    clock.textContent =
        now.toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).replace(/,/g, "") +
        " UTC " +
        now.getFullYear();
}

updateClock();
setInterval(updateClock, 1000);

const terminalLine = document.getElementById("terminal-line");
const terminalOutput = document.getElementById("terminal-output");
const terminalInput = document.getElementById("terminal-input");
const terminalBody = document.querySelector(".terminal-body");

let isTyping = false;
let focusTerminalAfterSubmit = true;

const isRussianHomepage = window.location.pathname
    .toLowerCase()
    .endsWith("/pages/ru/index.html");

const pages = isRussianHomepage
    ? {
        home: "index.html",
        skills: "skills.html",
        projects: "projects.html",
        education: "education.html",
        experience: "experience.html",
        certificates: "certificates.html",
        contactme: "contactme.html"
    }
    : {
        home: "index.html",
        skills: "pages/en/skills.html",
        projects: "pages/en/projects.html",
        education: "pages/en/Education.html",
        experience: "pages/en/Experience.html",
        certificates: "pages/en/Certificates.html",
        contactme: "pages/en/contactme.html"
    };

function addHistory(command) {
    const commandLine = document.createElement("div");
    commandLine.classList.add("terminal-history-line");

    const prompt = document.createElement("span");
    prompt.classList.add("terminal-prompt");
    prompt.textContent = "alexander@localhost:~$ ";

    const commandText = document.createElement("span");
    commandText.textContent = command;

    commandLine.append(prompt, commandText);
    terminalOutput.append(commandLine);

    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function addHistoryOutput(message) {
    const result = document.createElement("div");
    result.classList.add("terminal-result");
    result.textContent = message;

    terminalOutput.append(result);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function typeCommand(command, index = 0, focusInput = true) {
    if (!terminalInput || !terminalLine) return;

    if (index === 0) {
        if (isTyping) return;

        isTyping = true;
        focusTerminalAfterSubmit = focusInput;
        terminalInput.value = "";
        if (focusInput) {
            terminalInput.focus();
        }
    }

    if (index >= command.length) {
        isTyping = false;
        terminalLine.requestSubmit();
        return;
    }

    terminalInput.value += command[index];

    setTimeout(function () {
        typeCommand(command, index + 1, focusInput);
    }, 45);
}

if (terminalLine && terminalOutput && terminalInput && terminalBody) {
    terminalBody.addEventListener("click", function () {
        terminalInput.focus();
    });

    terminalLine.addEventListener("submit", function (event) {
        event.preventDefault();

        if (isTyping) return;

        const command = terminalInput.value.trim();

        if (command === "") return;

        addHistory(command);

        const parts = command.split(/\s+/);
        const commandName = parts[0].toLowerCase();
        const argument = parts[1];

        terminalInput.value = "";

        switch (commandName) {
            case "help":
                addHistoryOutput(
                    "Available commands: help, about, clear, cd"
                );
                break;

            case "about":
                addHistoryOutput(
                    "I'm Alexander, an information security student."
                );
                break;

            case "clear":
                terminalOutput.replaceChildren();
                break;

            case "cd": {
                if (!argument) {
                    addHistoryOutput(
                        `Usage: cd portfolio/${isRussianHomepage ? "ru" : "en"}/<page>`
                    );
                    break;
                }

                const pageName = argument
                    .replace(/^portfolio\/(?:en|ru)\//i, "")
                    .replace(/\.html$/i, "")
                    .toLowerCase();

                const destination = pages[pageName];

                if (destination) {
                    addHistoryOutput(`Opening ${destination}...`);

                    setTimeout(function () {
                        window.location.href = destination;
                    }, 300);
                } else {
                    addHistoryOutput(
                        `Page not found: ${argument}`
                    );
                }

                break;
            }

            default:
                addHistoryOutput(
                    `Command not found: ${command}. Type "help" for available commands.`
                );
        }

        if (focusTerminalAfterSubmit) {
            terminalInput.focus();
        }
        focusTerminalAfterSubmit = true;
    });
}

const terminalLinks = document.querySelectorAll(
    "[data-terminal-command]"
);

terminalLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
        if (!terminalLine || !terminalOutput || !terminalInput) {
            return;
        }

        event.preventDefault();

        if (isTyping) return;

        const command = link.dataset.terminalCommand;

        if (!command) return;

        typeCommand(command, 0, false);
    });
});
