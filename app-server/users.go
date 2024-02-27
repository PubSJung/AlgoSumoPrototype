package app_server

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type ASUser struct {
	UUID              string `json:"uuid"`
	Passkey           string `json:"passkey"`
	LatestAuthEncrypt byte   `json:"-"`
}

func (u *ASUser) GenerateAuthKey() string {
	sha := sha256.Sum256([]byte(u.Passkey + fmt.Sprint(u.LatestAuthEncrypt)))
	return fmt.Sprintf("%x", sha)
}

type ASUserList struct {
	Users  map[string]ASUser `json:"users"`
	Count  int               `json:"count"`
	Server *ASServer         `json:"-"`
}

const DATA_POINTER = "app-data/userlist.json"

func LoadUserList(srv *ASServer) *ASUserList {
	ul := &ASUserList{}
	if _, err := os.Stat(DATA_POINTER); err == nil {
		obj, _ := os.ReadFile(DATA_POINTER)
		json.Unmarshal(obj, ul)
		for uuid, user := range ul.Users {
			user.LatestAuthEncrypt = 255
			fmt.Println("Loaded User: " + user.UUID + " with authbyte " + fmt.Sprint(user.LatestAuthEncrypt))
			ul.Users[uuid] = user
		}
	} else {
		ul = &ASUserList{
			Users: make(map[string]ASUser),
			Count: 0,
		}
	}
	ul.Server = srv
	return ul
}

func SaveUserList(ul *ASUserList) {
	json, _ := json.MarshalIndent(ul, "", "  ")
	os.WriteFile(DATA_POINTER, json, 0644)
}

func (ul *ASUserList) Authenticate(uuid string, authkey string) bool {
	if user, ok := ul.Users[uuid]; ok {
		fmt.Println("PRE Generating AuthKey for " + uuid + ": " + fmt.Sprint(user.LatestAuthEncrypt))
		if user.LatestAuthEncrypt <= 0 {
			user.LatestAuthEncrypt = 255 + user.LatestAuthEncrypt
		}
		user.LatestAuthEncrypt--
		fmt.Println("POST Generating AuthKey for " + uuid + ": " + fmt.Sprint(user.LatestAuthEncrypt))
		expected := user.GenerateAuthKey()
		ul.Users[uuid] = user
		if expected == authkey {
			return true
		} else {
			fmt.Println("Wrong Auth.: \"" + expected + "\" == \"" + authkey + "\"")
			return false
		}
	} else {
		return false
	}
}

func (ul *ASUserList) Push(passkey string) string {
	uuid := ul.Server.Config.GenerateUUID(ul.Count)
	ul.Users[uuid] = ASUser{
		UUID:              uuid,
		Passkey:           passkey,
		LatestAuthEncrypt: 255,
	}
	ul.Count++
	SaveUserList(ul)
	return uuid
}

type AuthPacketIn struct {
	Authkey string `json:"authkey"`
	UUID    string `json:"uuid"`
}

func (ul *ASUserList) AuthRouteHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		in_buffer, err := io.ReadAll(r.Body)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(400)
			return
		}
		in_packet := &AuthPacketIn{
			Authkey: "",
			UUID:    "",
		}
		err = json.Unmarshal(in_buffer, in_packet)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(400)
			return
		}

		if user, ok := ul.Users[in_packet.UUID]; ok {
			user.LatestAuthEncrypt = 255
			ul.Users[in_packet.UUID] = user
			if ul.Authenticate(in_packet.UUID, in_packet.Authkey) {
				w.WriteHeader(200)
			} else {
				w.WriteHeader(401)
			}
		} else {
			fmt.Println("ERROR: Requested User not found: \"" + in_packet.UUID + "\".")
			w.WriteHeader(400)
		}

	}
}

func (ul *ASUserList) PushRouteHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		body_buffer, err := io.ReadAll(r.Body)
		if err != nil {
			w.WriteHeader(400)
			return
		}

		uuid := ul.Push(string(body_buffer))
		w.WriteHeader(200)
		w.Write([]byte(fmt.Sprint(uuid)))

	}
}
