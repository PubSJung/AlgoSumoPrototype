
if(document.location.href.endsWith("/lobby"))
window.addEventListener("load", () => {

    const localPlayerClassElem = document.querySelector(".class-local-player");
    const localPlayerStyleElem = document.querySelector(".style-local-player");
    const lobbyEntityListElem = document.querySelector(".class-lobby-entities");
    const lobbyEntityListItemElems = lobbyEntityListElem.querySelectorAll("li");

    function pushPlayerSource() {
        fetch(window.location.origin + "/app-packets/lobby/player/source", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "session": SESSION,
                "uuid": UUID,
                "ulid": LOBBY.ulid,
                "net_src": LOBBY.players[PLAYER_INDEX].net_src,
            })
        });
    }

    function resetSelection() {
        if(lobbyEntityListItemElems)
            lobbyEntityListItemElems.forEach((e) => e.classList.remove("selected"));
        localPlayerClassElem.classList.remove("selected");
        localPlayerStyleElem.classList.remove("selected");
        pushPlayerSource();
    }
    
    if(lobbyEntityListItemElems)
    lobbyEntityListItemElems.forEach(e => e.addEventListener("click", (ev) => {
        resetSelection();
        ev.target.classList.toggle("selected");
    }));

    localPlayerClassElem.addEventListener("click", () => {

        if(localPlayerStyleElem.classList.contains("selected"))
            LOBBY.players[PLAYER_INDEX].net_src.client_stylesheet = aceEditor.getValue();
        const preSelected = (localPlayerClassElem.classList.contains("selected"));
        if(preSelected) 
            LOBBY.players[PLAYER_INDEX].net_src.client_class = aceEditor.getValue();
        resetSelection();
        if(!preSelected) {
            localPlayerClassElem.classList.add("selected");
            aceEditor.setValue(LOBBY.players[PLAYER_INDEX].net_src.client_class);
            aceEditor.session.setMode("ace/mode/javascript");
        } else aceEditor.setValue("");

    })

    localPlayerStyleElem.addEventListener("click", () => {

        if(localPlayerClassElem.classList.contains("selected"))
            LOBBY.players[PLAYER_INDEX].net_src.client_class = aceEditor.getValue();
        const preSelected = (localPlayerStyleElem.classList.contains("selected"));
        if(preSelected) 
            LOBBY.players[PLAYER_INDEX].net_src.client_stylesheet = aceEditor.getValue();
        resetSelection();
        if(!preSelected) {
            localPlayerStyleElem.classList.add("selected");
            aceEditor.setValue(LOBBY.players[PLAYER_INDEX].net_src.client_stylesheet);
            aceEditor.session.setMode("ace/mode/css");
        } else aceEditor.setValue("");

    });

    const entityAddElem = document.querySelector(".class-lobby-entity-add");
    const entityDelElem = document.querySelector(".class-lobby-entity-del");

    entityAddElem.addEventListener("click", () => {
        fetch(window.location.origin + "/app-packets/lobby/entity/add", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({

            })
        })
    });

    entityDelElem.addEventListener("click", () => {
        fetch(window.location.origin + "/app-packets/lobby/entity/del", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                
            })
        })
    });

    const lobbyLaunchElem = document.querySelector(".lobby-launch");
    lobbyLaunchElem.addEventListener("click", () => { 
        if(lobbyLaunchElem.classList.contains("p0"))
            window.open("/app-content/ingame", "_self");
    });

});
