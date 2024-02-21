package app_server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
)

type ASLobby struct {
	Players           []ASPlayer        `json:"players"`
	Name              string            `json:"name"`
	Password          string            `json:"password"`
	DependencyClasses map[string]string `json:"dependency_classes"`
	ULID              string            `json:"ulid"`
}

type ASLobbyList struct {
	Lobbies []*ASLobby `json:"lobbies"`
	Count   int        `json:"count"`
}

func NewLobbyList() *ASLobbyList {
	return &ASLobbyList{
		Lobbies: make([]*ASLobby, 0),
		Count:   0,
	}
}

func (l *ASLobbyList) AddLobby(name string, password string) string {

	count_str := strconv.Itoa(l.Count)
	ulid := ""
	for i := 0; i < 8-len(count_str); i++ {
		ulid += "0"
	}
	ulid += count_str

	l.Lobbies = append(l.Lobbies, &ASLobby{
		Players:  make([]ASPlayer, 0),
		Name:     name,
		Password: password,
		ULID:     ulid,
	})
	l.Count++

	return ulid

}

func (l *ASLobbyList) GetLobbyIndex(ulid string) int {
	index, err := strconv.Atoi(ulid)
	if err != nil {
		fmt.Println("ERROR: Wrong format for converting ulid.")
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

type RequestPacketIn struct {
	UUID      string `json:"uuid"`
	ULID      string `json:"ulid"`
	Username  string `json:"username"`
	Lobbyname string `json:"lobbyname"`
	Password  string `json:"password"`
}

func (l *ASLobbyList) RequestRouteHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		in_buffer, err := io.ReadAll(r.Body)
		if err != nil {
			fmt.Println(err)
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
			}
		}

		json_lobby, err := json.Marshal(l.Lobbies[index])
		if err != nil {
			fmt.Println("ERROR: ", err)
			w.WriteHeader(400)
			return
		}

		w.WriteHeader(200)
		w.Write(json_lobby)

	}
}
