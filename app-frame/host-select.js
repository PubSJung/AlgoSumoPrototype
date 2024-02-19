
const DEFAULT_HOST = "";
const FALLBACK_HOST = "";

var appFrame;
var appHost;

function selectAppHost(host) {
    appHost = host;
    if(appFrame) {
        appFrame.src = host + "/newgame"
    }
}

window.addEventListener("load", () => {

    appFrame = document.body.querySelector("iframe.app-content");

    const hostSelectElem = document.body.querySelector("#app-host-select");
    const hostInputElem = document.body.querySelector("#app-host-custom");

    hostSelectElem.addEventListener("change", (ev) => {
                
        if(hostInputElem.classList.contains("shown"))
        hostInputElem.classList.remove("shown");

        switch(ev.target.value) {

            case "custom":
                hostInputElem.classList.add("shown");
                break;

            case "fallback":
                selectAppHost(FALLBACK_HOST);
                break;

            default:
                selectAppHost(DEFAULT_HOST);
        

        }

    });

    hostInputElem.addEventListener(
        "change", 
        (ev) => selectAppHost(ev.target.value)
    );

    selectAppHost(DEFAULT_HOST);

});
