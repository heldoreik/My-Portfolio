// clocks
const clock = document.getElementById("clock");

function updateclock () {
    const now = new Date();
    clock.textContent = now.toLocaleString("en-EN", {
    day: "numeric",
    month: "short",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",    
    hour12: false,
    }).replace(/,/g, '') + " UTC " + now.getFullYear();
}

updateclock();
setInterval(updateclock, 1000);
