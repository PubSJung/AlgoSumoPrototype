
const DEFAULT_HOST = "";
const FALLBACK_HOST = "";
const LOCAL_HOST = "http://localhost"

const PASSKEY_LENGTH = 16;
function generatePassKey() {

    var passkey = "";
    for(var i = 0; i < PASSKEY_LENGTH; i++)
    passkey += String(Math.floor(Math.random() * 10));

    return passkey;

}

var appFrame = undefined;
var appEndpointObj = undefined;

const APP = {
    host: localStorage.getItem("app-host"),
    latestAuthEncrypt: 255,
    lobby: localStorage.getItem("app-lobby") || {
        ulid: "99999999"
    },
    _username: localStorage.getItem("username"),
    get username() {
        return this._username;
    },
    set username(value) {
        this._username = value;
        localStorage.setItem("username", value);
    },
    _uuid: localStorage.getItem("uuid"),
    get uuid() {
        return this._uuid;
    },
    set uuid(value) {
        this._uuid = value;
        localStorage.setItem("uuid", value);
    },
    passkey: localStorage.getItem("passkey") || generatePassKey(),
    get authkey() {

        this.latestAuthEncrypt--;
        if(this.latestAuthEncrypt <= 0)
        this.latestAuthEncrypt = 255;

        var sha = sha256.create();
        sha.update(this.passkey + String(this.latestAuthEncrypt));
        return sha.hex();

    },
};

// assure the host is actually a legit game-server instance
async function validateAppEndpoint() {

    const response = await fetch(APP.host + "/app-content/endpoint.json", {
        "method": "GET"
    });
    if(response.status < 200 || response.status > 299)
    return false;

    const json = await response.json();
    return (
        json && json.validation 
        && json.validation == appEndpointObj.validation
    );

}

async function selectAppHost(host) {

    APP.host = host;
    const valid = await validateAppEndpoint();

    if(appFrame && valid) {

        if(!appFrame.classList.contains("app-host-loaded"))
        appFrame.classList.add("app-host-loaded");

        if(APP.uuid)  {
            fetch(APP.host + "/app-packets/user/auth", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "authkey": APP.authkey,
                    "uuid": APP.uuid
                })
            })
                .then((data) => {
                    if(data.status != 200) {
                        localStorage.removeItem("uuid");
                        window.open(document.URL, "_self");
                    }
                })
        } else {
            fetch(APP.host + "/app-packets/user/push", {
                "method": "POST",
                "headers": {
                    "Content-Type": "text/plain"
                },
                "body": APP.passkey
            })
                .then((data) => data.text())
                .then((text) => {
                    APP.uuid = text;
                    localStorage.setItem("passkey", APP.passkey);
                });
        } 

    } else if(appFrame.classList.contains("app-host-loaded")) 
    appFrame.classList.remove("app-host-loaded");

}

window.addEventListener("resize", () => {
    if(window.innerHeight > window.innerWidth) 
    alert("Please keep this application in portrait-mode!");
});

window.addEventListener("load", () => {
    
    fetch("app-content/endpoint.json", {
        "method": "GET"
    })
        .then((data) => data.json())
        .then((json) => {
            appEndpointObj = json;
        });

    appFrame = document.body.querySelector("iframe.app-content");

    const hostSelectElem = document.body.querySelector("#app-host-select");
    const hostInputElem = document.body.querySelector("#app-host-custom");

    hostSelectElem.addEventListener("change", (ev) => {
                
        if(!hostInputElem.classList.contains("hide"))
        hostInputElem.classList.add("hide");

        switch(ev.target.value) {

            case "custom":
                hostInputElem.classList.remove("hide");
                break;

            case "fallback":
                selectAppHost(FALLBACK_HOST);
                break;

            case "local":
                selectAppHost(LOCAL_HOST);
                break;

            default:
                selectAppHost(DEFAULT_HOST);

        }

        localStorage.setItem("app-host", ev.target.value);

    });
    hostSelectElem.value = localStorage.getItem("app-host") || "default";
    hostSelectElem.dispatchEvent(new Event("change"));

    hostInputElem.addEventListener(
        "change", 
        (ev) => selectAppHost(ev.target.value)
    );

    const userInputElem = document.body.querySelector("#app-user-name");
    const lobbyDefElem = document.body.querySelector("#app-lobby");
    const reqAccessElem = document.body.querySelector("#app-request-access");

    userInputElem.addEventListener("change", (ev) => {

        if(!lobbyDefElem.classList.contains("hide"))
        lobbyDefElem.classList.add("hide");
        if(!reqAccessElem.classList.contains("hide"))
        reqAccessElem.classList.add("hide");

        APP.username = ev.target.value;

        if(APP.username.length > 4 && APP.username.length <= 16) {
            lobbyDefElem.classList.remove("hide");
            reqAccessElem.classList.remove("hide");
            lobbyDefElem.querySelector("#app-lobby-name").value = APP.username + "s Lobby";
        }

    });
    userInputElem.value = APP.username;
    userInputElem.dispatchEvent(new Event("change"));
    
    const appHeader = document.body.querySelector(".app-header");

    reqAccessElem.addEventListener("click", async () => {
        const response = await fetch(APP.host + "/app-packets/lobby/request", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "username": APP.username,
                "uuid": APP.uuid,
                "authkey": APP.authkey,
                "ulid": APP.lobby.ulid,
                "lobbyname": lobbyDefElem.querySelector("#app-lobby-name").value,
                "password": lobbyDefElem.querySelector("#app-lobby-password").value
            })
        });
        if(response.status == 200) {
            const json = await response.json();
            console.log(json);
            localStorage.setItem("app-lobby", json);
            APP.lobby = json;
            appHeader.classList.add("hide");
            appFrame.src = APP.host + "/app-content/lobby";
        } else alert("An error occured while requesting access to the lobby!");
    });

    const themeLinkerElem = document.head.querySelector(".app-theme-linker");
    const brightToggleElem = document.body.querySelector("#app-bright-mode");
    brightToggleElem.addEventListener("click", (ev) => {
        
        ev.target.classList.toggle("app-bright-mode");
        localStorage.setItem("app-bright-mode", ev.target.classList.contains("app-bright-mode"));
        
        if(ev.target.classList.contains("app-bright-mode")) 
            themeLinkerElem.href = "../app-content/css/theme/bright-theme.css";
        else themeLinkerElem.href = "";

        if(appFrame.src) {
            appFrame.contentDocument.head.querySelector(".theme-linker").href 
            = themeLinkerElem.href.replace("../app-content/");
        }

    });
    if(localStorage.getItem("app-bright-mode") == "true")
    brightToggleElem.click();

    function serializeVarContent(content) {
        const varTokens = content.split("%");
        var varContent = "";
        for(var i = 0; i < varTokens.length; i++)
        if(i % 2 == 1 && i + 1 < varTokens.length) {
            const varPath = varTokens[i].split(".");
            var varHead = APP;
            varPath.forEach(path => varHead = varHead[path]);
            varContent += JSON.stringify(varHead);
        } else varContent += varTokens[i];
        return varContent;
    }

    function recursiveTextElements(element, caller) {
        for(var i = 0; i < element.childNodes.length; i++) {
            if(element.childNodes[i].nodeType == Node.TEXT_NODE)
            caller(element.childNodes[i]);   
            recursiveTextElements(element.childNodes[i], caller);
        }
    }

    appFrame.addEventListener("load", async () => {

        appFrame.contentDocument.head.querySelector(".theme-linker").href 
        = themeLinkerElem.href.replace("../app-content/");

        appFrame.contentDocument.body.querySelectorAll("*").forEach((element) => {

            recursiveTextElements(element, (textNode) => {
                if(textNode.textContent.indexOf("%") != textNode.textContent.lastIndexOf("%")) 
                textNode.textContent = serializeVarContent(textNode.textContent);
            });

            element.classList.forEach((className) => {
                if(className.indexOf("%") != className.lastIndexOf("%"))
                element.classList.remove(className);
                element.classList.add(serializeVarContent(className));
            });

        });

    });

});
