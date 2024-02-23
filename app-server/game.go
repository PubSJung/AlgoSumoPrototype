package app_server

import "net/http"

type ASNetObject struct {
	PosX        float32 `json:"pos_x"`
	PosY        float32 `json:"pos_y"`
	VelX        float32 `json:"vel_x"`
	VelY        float32 `json:"vel_y"`
	VelModifier float32 `json:"vel_mod"`
	Scale       float32 `json:"scale"`
}

type ASNetSource struct {
	ClientClass      string `json:"client_class"`
	ClientStylesheet string `json:"client_stylesheet"`
}

type ASEntity struct {
	ULID      string      `json:"-"`
	UUID      string      `json:"-"`
	NetSource ASNetSource `json:"net_src"`
	NetObj    ASNetObject `json:"net_obj"`
}

type ASPlayer struct {
	Admin     bool        `json:"admin"`
	Name      string      `json:"name"`
	ULID      string      `json:"-"`
	UUID      string      `json:"-"`
	Session   string      `json:"-"`
	NetSource ASNetSource `json:"net_src"`
	NetObj    ASNetObject `json:"net_obj"`
}

type GameSourceInPacket struct {
	Session string      `json:"session"`
	UUID    string      `json:"uuid"`
	ULID    string      `json:"ulid"`
	Source  ASNetSource `json:"net_src"`
}

type GameObjInPacket struct {
	Session string      `json:"session"`
	UUID    string      `json:"uuid"`
	ULID    string      `json:"ulid"`
	Obj     ASNetObject `json:"net_obj"`
}

func (l *ASLobbyList) GameRequestRouteHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}

func (l *ASLobbyList) GameSourceRouteHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}

func (l *ASLobbyList) GameObjRouteHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}
