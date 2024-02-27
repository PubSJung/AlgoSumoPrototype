package app_server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type ASNetObject struct {
	PosX        float32 `json:"pos_x"`
	PosY        float32 `json:"pos_y"`
	Scale       float32 `json:"scale"`
	VelModifier float32 `json:"vel_mod"`
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
	Session   string      `json:"-"`
	ULID      string      `json:"-"`
	UUID      string      `json:"-"`
	NetSource ASNetSource `json:"net_src"`
	NetObj    ASNetObject `json:"net_obj"`
}

type PlayerSourceInPacket struct {
	Session string      `json:"session"`
	UUID    string      `json:"uuid"`
	ULID    string      `json:"ulid"`
	Source  ASNetSource `json:"net_src"`
}

func (l *ASLobbyList) PlayerSourceRouteHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		in_buffer, err := io.ReadAll(r.Body)
		if err != nil {
			fmt.Println("ERROR: ", err)
			w.WriteHeader(400)
			return
		}

		var in_packet PlayerSourceInPacket
		if err := json.Unmarshal(in_buffer, &in_packet); err != nil {
			fmt.Println("ERROR: ", err)
			w.WriteHeader(400)
			return
		}

		index := l.GetLobbyIndex(in_packet.ULID)
		if index < 0 {
			w.WriteHeader(404)
			return
		}

		for pi, p := range l.Lobbies[index].Players {
			if p.UUID == in_packet.UUID && p.Session == in_packet.Session {
				l.Lobbies[index].Players[pi].NetSource = in_packet.Source
				break
			}
		}

		w.WriteHeader(200)

	}
}

type PlayerListInPacket struct {
	Session string `json:"session"`
	UUID    string `json:"uuid"`
	ULID    string `json:"ulid"`
}

func (l *ASLobbyList) PlayerListRouteHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		in_buffer, err := io.ReadAll(r.Body)
		if err != nil {
			fmt.Println("ERROR: ", err)
			w.WriteHeader(400)
			return
		}

		var in_packet PlayerListInPacket
		if err := json.Unmarshal(in_buffer, &in_packet); err != nil {
			fmt.Println("ERROR: ", err)
			w.WriteHeader(400)
			return
		}

		index := l.GetLobbyIndex(in_packet.ULID)
		if index < 0 {
			fmt.Println("ERROR: Lobby not found")
			w.WriteHeader(404)
			return
		}

		if l.Lobbies[index].Players[0].UUID != in_packet.UUID || l.Lobbies[index].Players[0].Session != in_packet.Session {
			w.WriteHeader(401)
			return
		}

		json_players, err := json.Marshal(l.Lobbies[index].Players)
		if err != nil {
			fmt.Println("ERROR: ", err)
			w.WriteHeader(500)
			return
		}

		w.WriteHeader(200)
		w.Write(json_players)

	}
}
