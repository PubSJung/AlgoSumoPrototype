package app_server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
)

type ASLobby struct {
	Players  []ASPlayer        `json:"players"`
	Name     string            `json:"name"`
	Entities map[string]string `json:"entities"`
	ULID     string            `json:"ulid"`
	Password string            `json:"-"`
}

type ASLobbyList struct {
	Lobbies []*ASLobby
	Count   int
	Server  *ASServer
}

func CreateLobbyList(srv *ASServer) *ASLobbyList {
	return &ASLobbyList{
		Lobbies: make([]*ASLobby, 0),
		Count:   0,
		Server:  srv,
	}
}

func FormatULID(index int) string {
	count_str := strconv.Itoa(index)
	ulid := ""
	for i := 0; i < 8-len(count_str); i++ {
		ulid += "0"
	}
	ulid += count_str
	return ulid
}

func (l *ASLobbyList) AddLobby(name string, password string) string {

	ulid := FormatULID(l.Count)
	l.Lobbies = append(l.Lobbies, &ASLobby{
		Players:  make([]ASPlayer, 0),
		Name:     name,
		Password: password,
		ULID:     ulid,
		Entities: make(map[string]string),
	})
	l.Count++

	return ulid

}

func (l *ASLobbyList) GetLobbyIndex(ulid string) int {
	if len(ulid) != 8 {
		return -1
	}
	index, err := strconv.Atoi(ulid)
	if err != nil {
		fmt.Println("ERROR: Wrong format for converting ulid.", err)
		return -1
	}
	if l.Count <= index {
		return -1
	}
	if l.Lobbies[index] == nil {
		fmt.Println("ERROR: Lobby was disposed.")
		return -1
	}
	return index
}

func (l *ASLobbyList) DisposeLobby(ulid string) {
	index := l.GetLobbyIndex(ulid)
	l.Lobbies[index] = nil
}

func (l *ASLobbyList) AddPlayer(ulid string, uuid string, name string, session string, admin bool) {

	index := l.GetLobbyIndex(ulid)
	if 8 <= len(l.Lobbies[index].Players) {
		return
	}

	pi := len(l.Lobbies[index].Players)
	s := float32(0.05)
	y := s * 2
	if pi%2 == 0 {
		y = 1 - y
	}
	x := s*2 + (1-s*4)/8*float32(pi)

	l.Lobbies[index].Players = append(l.Lobbies[index].Players, ASPlayer{
		Admin:   admin,
		Name:    name,
		UUID:    uuid,
		ULID:    ulid,
		Session: session,
		NetObj: ASNetObject{
			PosX:        x,
			PosY:        y,
			Scale:       s,
			VelX:        0,
			VelY:        0,
			VelModifier: 0,
		},
		NetSource: ASNetSource{
			ClientClass:      "class LocalPlayer extends NetPlayer {\n\n\tconstructor() {\n/* Your Players code...*/ \n}\n\n}",
			ClientStylesheet: ".local-player {\n\t/* Your Player style... */\n}",
		},
	})

}

type RequestPacketIn struct {
	UUID      string `json:"uuid"`
	ULID      string `json:"ulid"`
	Authkey   string `json:"authkey"`
	Username  string `json:"username"`
	Lobbyname string `json:"lobbyname"`
	Password  string `json:"password"`
}

type RequestPacketOut struct {
	Lobby       *ASLobby `json:"lobby"`
	PlayerIndex int      `json:"player_index"`
	Session     string   `json:"session"`
}

func (l *ASLobbyList) RequestRouteHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		in_buffer, err := io.ReadAll(r.Body)
		if err != nil {
			fmt.Println("ERROR: ", err)
			w.WriteHeader(400)
			return
		}

		var in_packet RequestPacketIn
		if err := json.Unmarshal(in_buffer, &in_packet); err != nil {
			fmt.Println("ERROR: ", err)
			w.WriteHeader(400)
			return
		}

		if len(in_packet.Lobbyname) < 4 || len(in_packet.Lobbyname) > 48 {
			fmt.Println("ERROR: Lobbyname length is not in range.")
			w.WriteHeader(400)
			return
		}

		session := l.Server.UserList.CreatePlayerSession(in_packet.UUID, in_packet.Authkey)
		if session == "" {
			fmt.Println("ERROR: Wrong authkey.")
			w.WriteHeader(400)
			return
		}

		admin_added := false
		index := l.GetLobbyIndex(in_packet.ULID)
		if index < 0 {
			lobby_found := false
			for li, lobby := range l.Lobbies {
				if lobby.Name == in_packet.Lobbyname {
					if lobby.Password != in_packet.Password {
						fmt.Println("ERROR: Wrong password.")
						w.WriteHeader(400)
						return
					}
					index = li
					lobby_found = true
				}
			}
			if !lobby_found {
				l.AddLobby(in_packet.Lobbyname, in_packet.Password)
				index = l.Count - 1
				l.AddPlayer(FormatULID(index), in_packet.UUID, in_packet.Username, session, true)
				admin_added = true
			}
		}

		if !admin_added {
			l.AddPlayer(FormatULID(index), in_packet.UUID, in_packet.Username, session, false)
		}

		out_packet := RequestPacketOut{
			Lobby:       l.Lobbies[index],
			PlayerIndex: len(l.Lobbies[index].Players) - 1,
			Session:     session,
		}

		json_out_packet, err := json.Marshal(out_packet)
		if err != nil {
			fmt.Println("ERROR: ", err)
			w.WriteHeader(400)
			return
		}

		w.WriteHeader(200)
		w.Write(json_out_packet)

	}
}

type EntityAddPacketIn struct {
	// TODO
}

type EntityDelPacketIn struct {
	// TODO
}

func (l *ASLobbyList) EntityAddRouteHandler() func(http.ResponseWriter, *http.Request) {
	return nil // TODO
}

func (l *ASLobbyList) EntityDelRouteHandler() func(http.ResponseWriter, *http.Request) {
	return nil // TODO
}
