package app_server

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/mux"
)

type ASServer struct {
	*mux.Router
	Config          ASConfig
	FileQueryRoutes []string
	UserList        ASUserList
	LobbyList       ASLobbyList
	TLS             bool
}

func NewServer(cfg ASConfig) *ASServer {

	// checks if a directory named "tls" exists for HTTPS
	tls := false
	if io, err := os.Stat("tls"); err == nil && io.IsDir() {
		tls = true
	}

	srv := &ASServer{
		Router:          mux.NewRouter(),
		Config:          cfg,
		TLS:             tls,
		FileQueryRoutes: make([]string, 0),
	}

	srv.UserList = *LoadUserList(srv)
	srv.LobbyList = *CreateLobbyList(srv)

	srv.RegisterAppPackets()
	srv.RegisterAppInterface()

	return srv

}

var mimeTypeMapping = map[string]string{
	".css":         "text/css",
	".js":          "text/javascript",
	".png":         "image/png",
	".ico":         "image/x-icon",
	".html":        "text/html",
	".json":        "application/json",
	".ttf":         "font/ttf",
	".webmanifest": "application/manifest+json",
}

func (srv *ASServer) PeekMimeType(path string) string {
	mimeType, specific := mimeTypeMapping[filepath.Ext(path)]
	if specific {
		return mimeType
	} else {
		return "application/octet-stream"
	}
}

func (srv *ASServer) HandleFileQuery(route string, path string) {
	mime_type := srv.PeekMimeType(path)
	srv.HandleFunc(route, func(w http.ResponseWriter, r *http.Request) {
		data, _ := os.ReadFile(path)
		w.Header().Add("Content-Type", mime_type)
		w.Write(data)
	}).Methods("GET")
	fmt.Println("Registered file-route: \"" + route + "\", for path: \"" + path + "\" (\"" + mime_type + "\").")
}

func (srv *ASServer) HandlePacketFunc(route string, handler func(w http.ResponseWriter, r *http.Request)) *mux.Route {
	fmt.Println("Registered packet-route: \"/app-packets" + route + "\".")
	return srv.HandleFunc("/app-packets"+route, handler)
}

func (srv *ASServer) FrontendWalker() func(path string, info os.FileInfo, err error) error {
	return func(path string, info os.FileInfo, err error) error {

		if info.IsDir() {
			return nil
		}

		path = strings.ReplaceAll(path, "\\", "/")

		route := "/" + path
		route, _ = strings.CutSuffix(route, ".html")

		alr_exists := false
		for _, _route := range srv.FileQueryRoutes {
			if _route == route {
				alr_exists = true
				break
			}
		}
		if !alr_exists {
			srv.FileQueryRoutes = append(srv.FileQueryRoutes, route)
			srv.HandleFileQuery(route, path)
		}

		return nil

	}
}

func (srv *ASServer) Run() {
	portAttr := ":" + fmt.Sprint(srv.Config.Port)
	fmt.Println("Hosting on \"127.0.0.1" + portAttr + "\".")
	if srv.TLS {
		http.ListenAndServeTLS(portAttr, "tls/certificate.pem", "tls/key.pem", srv)
	} else {
		http.ListenAndServe(portAttr, srv)
	}
}

func (srv *ASServer) RegisterAppPackets() {

	// USER-PACKETS:
	srv.HandlePacketFunc("/user/push", srv.UserList.PushRouteHandler()).Methods("POST")
	srv.HandlePacketFunc("/user/auth", srv.UserList.AuthRouteHandler()).Methods("POST")

	// LOBBY-PACKETS:
	srv.HandlePacketFunc("/lobby/request", srv.LobbyList.RequestRouteHandler()).Methods("POST")
	srv.HandlePacketFunc("/lobby/player/source", srv.LobbyList.PlayerSourceRouteHandler()).Methods("POST")
	srv.HandlePacketFunc("/lobby/player/list", srv.LobbyList.PlayerListRouteHandler()).Methods("POST")

}

func (srv *ASServer) RegisterAppInterface() {

	// CONTENT-HOST:
	filepath.Walk("app-content/", srv.FrontendWalker())

	// FRAME-HOST:
	filepath.Walk("app-frame/", srv.FrontendWalker())
	srv.HandleFileQuery("/favicon.ico", "favicon.ico")
	srv.HandleFileQuery("/", "index.html")

}
