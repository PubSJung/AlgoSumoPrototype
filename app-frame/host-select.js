
const DEFAULT_HOST = "";
const FALLBACK_HOST = "";

var appFrame;
var appHost;
var appEndpointValidation;

async function validateAppEndpoint() {

    var response = await fetch(appHost + "/app-endpoint-validation.json", {
        "method": "GET"
    });
    if(response.status < 200 || response.status > 299)
    return false;

    var json = await response.json();
    return (json && json.key && json.key == appEndpointValidation.key);

}

async function selectAppHost(host) {

    appHost = host;
    var valid = await validateAppEndpoint();

    if(appFrame && valid) {

        if(!appFrame.classList.contains("app-host-loaded"))
        appFrame.classList.add("app-host-loaded");

        appFrame.src = host + "/lobby?create=true";

    } else {
        if(appFrame.classList.contains("app-host-loaded"))
        appFrame.classList.remove("app-host-loaded");
    }

}

window.addEventListener("load", () => {

    fetch("app-content/app-endpoint-validation.json", {
        "method": "GET"
    })
        .then((data) => data.json())
        .then((json) => {
            appEndpointValidation = json;
        });

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
