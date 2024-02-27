
const DEFAULT_HOST = "";
const FALLBACK_HOST = "";
const LOCAL_HOST = "http://localhost"

const USER_PASSKEY_LENGTH = 16;
function genUserPassKey() {

    var passkey = "";
    for(var i = 0; i < USER_PASSKEY_LENGTH; i++)
    passkey += String(Math.floor(Math.random() * 10));

    return passkey;

}

var appContentFrame = undefined;
var appEndpointObj = undefined;

const APP_VARS = {
    host: localStorage.getItem("app-host"),
    latestAuthEncrypt: 255,
    lobby: localStorage.getItem("app-lobby") || {
        ulid: "99999999"
    },
    _playerIndex: localStorage.getItem("player-index"),
    get playerIndex() {
        return this._playerIndex;
    },
    set playerIndex(value) {
        this._playerIndex = value;
        localStorage.setItem("player-index", value);
    },
    _session: localStorage.getItem("session"),
    get session() {
        return this._session;
    },
    set session(value) {
        this._session = value;
        localStorage.setItem("session", value);
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
    passkey: localStorage.getItem("passkey") || genUserPassKey(),
    get authkey() {

        if(this.latestAuthEncrypt <= 0)
        this.latestAuthEncrypt = 255;
        this.latestAuthEncrypt--;

        var sha = sha256.create();
        sha.update(this.passkey + String(this.latestAuthEncrypt));
        return sha.hex();

    },
};

// assure the host is actually a legit game-server instance
async function validateAppEndpoint() {

    const response = await fetch(APP_VARS.host + "/app-content/endpoint.json", {
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

// select the host of this application and load the content of this host into the app-content-frame
async function selectAppHost(host) {

    APP_VARS.host = host;
    const valid = await validateAppEndpoint();

    if(appContentFrame && valid) {

        if(!appContentFrame.classList.contains("app-host-loaded"))
        appContentFrame.classList.add("app-host-loaded");

        if(APP_VARS.uuid)  {
            // Authenticate saved user
            fetch(APP_VARS.host + "/app-packets/user/auth", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "authkey": APP_VARS.authkey,
                    "uuid": APP_VARS.uuid
                })
            })
                .then((data) => {
                    // when failed -> remove saved user -> reload -> push new
                    if(data.status != 200) {
                        localStorage.removeItem("uuid");
                        document.location.reload();
                    }
                })
        } else {
            // Push new user
            fetch(APP_VARS.host + "/app-packets/user/push", {
                "method": "POST",
                "headers": {
                    "Content-Type": "text/plain"
                },
                "body": APP_VARS.passkey
            })
                .then((data) => data.text())
                .then((text) => {
                    APP_VARS.uuid = text;
                    localStorage.setItem("passkey", APP_VARS.passkey);
                });
        } 

    } else if(appContentFrame.classList.contains("app-host-loaded")) 
    appContentFrame.classList.remove("app-host-loaded");

}

// HTML-Window-Resize-Listener
window.addEventListener("resize", () => {
    if(window.innerHeight > window.innerWidth) 
    alert("Please keep this application in portrait-mode, it is meant to be used on a Desktop-PC.");
});

// HTML-Window-Load-Listener
window.addEventListener("load", () => {
    
    // HTTP-Get latest endpoint of this frame
    fetch("app-content/endpoint.json", {
        "method": "GET"
    })
        .then((data) => data.json())
        .then((json) => {
            appEndpointObj = json;
        });

    appContentFrame = document.body.querySelector("iframe.app-content");

    const hostSelectElem = document.body.querySelector("#app-host-select");
    const hostInputElem = document.body.querySelector("#app-host-custom");

    // Host-Selection-Changed-Listener
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

    // Custom-Host-Changed-Listener
    hostInputElem.addEventListener(
        "change", 
        (ev) => selectAppHost(ev.target.value)
    );

    const userInputElem = document.body.querySelector("#app-user-name");
    const lobbyDefElem = document.body.querySelector("#app-lobby");
    const reqAccessElem = document.body.querySelector("#app-request-access");

    // Username-Changed-Listener
    userInputElem.addEventListener("change", (ev) => {

        if(!lobbyDefElem.classList.contains("hide"))
        lobbyDefElem.classList.add("hide");
        if(!reqAccessElem.classList.contains("hide"))
        reqAccessElem.classList.add("hide");

        APP_VARS.username = ev.target.value;

        if(APP_VARS.username.length > 4 && APP_VARS.username.length <= 16) {
            lobbyDefElem.classList.remove("hide");
            reqAccessElem.classList.remove("hide");
            lobbyDefElem.querySelector("#app-lobby-name").value = APP_VARS.username + "s Lobby";
        }

    });
    userInputElem.value = APP_VARS.username;
    userInputElem.dispatchEvent(new Event("change"));
    
    const appHeader = document.body.querySelector(".app-header");

    reqAccessElem.addEventListener("click", async () => {
        const response = await fetch(APP_VARS.host + "/app-packets/lobby/request", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "username": APP_VARS.username,
                "uuid": APP_VARS.uuid,
                "authkey": APP_VARS.authkey,
                "ulid": APP_VARS.lobby.ulid,
                "lobbyname": lobbyDefElem.querySelector("#app-lobby-name").value,
                "password": lobbyDefElem.querySelector("#app-lobby-password").value
            })
        });
        if(response.status == 200) {
            const json = await response.json();
            console.log(json);
            localStorage.setItem("app-lobby", json.lobby);
            APP_VARS.lobby = json.lobby;
            APP_VARS.session = json.session;
            APP_VARS.playerIndex = json.player_index;
            appHeader.classList.add("hide");
            appContentFrame.src = APP_VARS.host + "/app-content/lobby";
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

        if(appContentFrame.src) {
            appContentFrame.contentDocument.head.querySelector(".theme-linker").href 
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
            var varHead = APP_VARS;
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

    appContentFrame.addEventListener("load", async () => {

        appContentFrame.contentDocument.head.querySelector(".theme-linker").href 
        = themeLinkerElem.href.replace("../app-content/");

        appContentFrame.contentDocument.body.querySelectorAll("*").forEach((element) => {

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

        appContentFrame.contentDocument.head.querySelectorAll("script").forEach((scriptElem) => {
            
            if(scriptElem.src)
            return;

            var varScript = "";
            const scriptLines = scriptElem.textContent.split("\n");
            for(var i = 0; i < scriptLines.length; i++) {
                var scriptLine = scriptLines[i].trim();
                if(scriptLine.startsWith("//bind ")) {
                    scriptLine = scriptLine.substring(7);
                    const varPrefix = (scriptLine[0] == scriptLine[0].toUpperCase() ? "const " : "var ");
                    scriptLine = (varPrefix + serializeVarContent(scriptLine) + ";\n");
                } 
                varScript += (scriptLine + '\n');
            }

            const newScript = document.createElement("script");
            newScript.textContent = varScript;
            appContentFrame.contentDocument.head.insertBefore(newScript, scriptElem);
            appContentFrame.contentDocument.head.removeChild(scriptElem);

        });

    });

});
