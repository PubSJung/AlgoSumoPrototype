
if(document.location.href.endsWith("/lobby"))
window.addEventListener("load", () => {

    const localPlayerClassElem = document.querySelector(".class-local-player");
    const localPlayerStyleElem = document.querySelector(".style-local-player");
    const lobbyDependencies = document.querySelector(".class-lobby-dependencies");

    function resetSelection() {
        lobbyDependencies.querySelectorAll("li")
            .forEach((e) => e.classList.remove("selected"));
        localPlayerClassElem.classList.remove("selected");
        localPlayerStyleElem.classList.remove("selected");
    }

    lobbyDependencies.querySelectorAll("li").addEventListener("click", (ev) => {
        resetSelection();
        ev.target.classList.add("selected");
    });

    localPlayerClassElem.addEventListener("click", () => {
        resetSelection();
        localPlayerClassElem.classList.add("selected");
    });

    localPlayerStyleElem.addEventListener("click", () => {
        resetSelection();
        localPlayerStyleElem.classList.add("selected");
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

});
