
window.addEventListener("load", () => {

    const depAddElem = document.querySelector(".class-lobby-dep-add");
    const depDelElem = document.querySelector(".class-lobby-dep-del");

    depAddElem.addEventListener("click", () => {
        fetch(window.location.origin + "/app-packets/lobby/dep/add", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({

            })
        })
    });

    depDelElem.addEventListener("click", () => {
        // TODO
    });

});
