
class NetPlayer {

  constructor(netPlayerIndex, domElement) {

    this.netPlayerIndex = netPlayerIndex;
    this.domElement = domElement;

  }

  _pushNetPlayerObj() {
    LOBBY.players[this.netPlayerIndex] = this.netPlayer;
    fetch(document.location.origin + "/app-packets/game/obj-push", {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      }, 
      "body": JSON.stringify({
        "net_player": this.netPlayerObj,
        "net_player_index": this.netPlayerIndex,
        "ulid": LOBBY.ulid,
        "uuid": UUID,
        "session": SESSION
      })
    })
  }

  _popNetPlayerSource() {

  }

  _pushNetPlayerSource() {

  }

  _update() {
    this._popNetPlayerObj();
    this._pushNetPlayerObj();
  }

  moveForward(amount) {

  }

  moveBackward(amount) {

  }

  moveLeft(amount) {

  }

  moveRight(amount) {

  }

  turnDegrees(amount) {
    
  }

}


