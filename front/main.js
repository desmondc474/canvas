// Subject of constant debate
const COLORS = ["#a31717","#fc0000","#fda500","#fed700","#c8f081","#29f222","#1aae00","#40e0d0","#1e90ff","#0800ff","#86019a","#ee46ee","#efc0cb","#000","#555","#ccc","#fff","#6a3d18","#fbdcbc","#1ebe72","#4466a1","#00408d","#7289da","#fd9aff"];

const canvas = responsiveCanvas(128, 128, document.getElementById("canvas-container"));
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const buttons = document.getElementById("buttons");
const timer = document.getElementById("timer");

// Don't worry, ws is initialized later
var ws;

let lastClick = 0;
let drawColor = 'black';

let recievedData;
// Dynamic button generation go brr
for (let color of COLORS) {
    const button = document.createElement("button");
    button.classList.add('color-button')
    button.title = color;
    button.style.backgroundColor = color;
    button.addEventListener("click", () => {
        drawColor = color;
        for(let button of buttons.childNodes) {
            button.classList.remove('active');
        }
        button.classList.add('active');
    });
    buttons.appendChild(button);
}
buttons.childNodes[14].click();

let startCountdown = () => {
    let time = Date.now() - lastClick;
    timer.hidden = false;
    if (time > 2500) {
        timer.textContent = "";
        timer.hidden = true;
        for(let button of buttons.childNodes) {
            button.disabled = false;
        }
        canvas.disabled = false;
        return;
    }
    timer.textContent = ((2500 - time) / 1000).toFixed(2);
    setTimeout(startCountdown, 20);
}

let showModal = (elem, bool) => {
    (typeof elem == 'string' ? document.getElementById(elem) : elem).style.display = bool ? "block" : "none";
}

canvas.addEventListener('pointerdown', () => {
    // Comment first two for serverless testing
    if (
        navigator.onLine && ws.readyState == 1 
        && Date.now() - lastClick > 2500 
        && canvas.x < 256 && canvas.y > 0 && canvas.y < 256 && canvas.x > 0
    ) {
        lastClick = Date.now();
        var x = Math.floor(canvas.x), y = Math.floor(canvas.y);
        startCountdown();
        for(let button of buttons.childNodes) {
            button.disabled = true;
            canvas.disabled = true;
        }
        drawRect(x, y, drawColor);
        ws.send(JSON.stringify({
            d: formatMessage(x, y, COLORS.indexOf(drawColor)).toString()
        }));
    }
})

function drawRect(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1)
}

function render(data) {
    for (let y in data) {
        for(let x in data[y]) {
            drawRect(x, y, COLORS[data[y][x]]);
        }
    }
}

var start_ws = () => {
    ws = new WebSocket("ws://canvas.rto.run/ws");
    //ws = new WebSocket("ws://localhost:8080"); // For local testing

    ws.onopen = () => {
        recievedData = false;
    }

    ws.onmessage = message => {
        if(!recievedData) {
            recievedData = true;
            render(decodeData(message.data));
            return;
        }
        message.data.text().then(JSON.parse).then((data) => {
            if ('d' in data) {
                var {x, y, color} = decodeMessage(parseInt(data.d))
                drawRect(x, y, COLORS[color]);
            }
        })
    }

    ws.onclose = () => {
        setTimeout(start_ws, 2000);
    }
}

start_ws()

/* Uncomment for serverless testing
ws = {
    send(){}
}*/
