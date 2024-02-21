package app_server

type ASPlayer struct {
	Admin              bool   `json:"admin"`
	Name               string `json:"name"`
	LocalPlayerJSClass string `json:"local_player_class"`
	UUID               string `json:"-"`
	ULID               string `json:"-"`
}
