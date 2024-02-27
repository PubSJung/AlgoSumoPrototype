
class NetPlayer {

  constructor(netPlayerIndex, domElement) {
    this._x = 0;
    this._y = 0;
    this._s = 0.05;
    this.netPlayerIndex = netPlayerIndex;
    this.domElement = domElement;
    this.domElement.style.position = "absolute";
    this.domElement.style.width = Math.floor(this._s * 100).toString() + "vh";
    this.domElement.style.height = Math.floor(this._s * 100).toString() + "vh";
    if(this.onCreate)
    this.onCreate();
  }

  _update() {
    if(this.onUpdate)
    this.onUpdate();
  }

  move(x, y) {
    this._x += x;
    this._y += y;
    this.domElement.style.top = Math.floor(this._y * 100).toString() + "%";
    this.domElement.style.left = Math.floor(this._x * 100).toString() + "%";
  }

}

const NET_PLAYERS = [];

window.addEventListener("load", async () => {

  setTimeout(async () => {

    const response = await fetch(document.location.origin + "/app-packets/lobby/player/list", {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": JSON.stringify({
        "session": SESSION,
        "uuid": UUID,
        "ulid": LOBBY.ulid
      })
    });
    const lobbyPlayers = await response.json();
    lobbyPlayers.forEach((player, index) => {

      const stylesheet = player.net_src.client_stylesheet;
      const script = player.net_src.client_class;

      const styleElem = document.createElement("style");
      styleElem.innerHTML = stylesheet.replace(".local-player {", ".player-" + index + " {");
      document.head.appendChild(styleElem);

      const scriptElem = document.createElement("script");
      scriptElem.innerHTML = script.replace("class LocalPlayer extends NetPlayer", "class Player" + index + " extends NetPlayer");
      document.head.appendChild(scriptElem);
      
      const controlElem = document.createElement("div");
      controlElem.className = "player-" + index + "-control";
      document.body.appendChild(controlElem);

      const netPlayer = eval("new Player" + index + "(" + index + ", controlElem)");
      netPlayer.move(index % 2 == 0 ? 0.1 : 0.85, 0.1 + 0.1 * index);
      NET_PLAYERS.push(netPlayer);

      console.log("Player-" + index + " created.");

    });

    setInterval(() => {
      NET_PLAYERS.forEach((p) => p._update());
    }, 32);

  }, 5000);

});

