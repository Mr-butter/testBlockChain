document.querySelector("#sendMessage_form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inputport = e.target.querySelector("#inputport").value;
    const inputmessage = e.target.querySelector("#inputmessage").value;

    const ws = new WebSocket(`ws://localhost:${inputport}`);
    console.log(`ws://localhost:${inputport}`);
    ws.on("open", () => {
        console.log("open");
        initConnection(ws);
    });
    ws.send(inputmessage);
    ws.on("message", (message) => {
        console.log(`received:${message}`);
    });
    // ws.on("error", (errorType) => {
    //     console.log("connetion Failed!" + errorType);
    // });
});
