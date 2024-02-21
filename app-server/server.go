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

	srv.RegisterBackRoutes()
	srv.RegisterAppFrontend()

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
	fmt.Println("Registered route: \"" + route + "\", for path: \"" + path + "\" (\"" + mime_type + "\").")
}

func (srv *ASServer) HandlePacketFunc(route string, handler func(w http.ResponseWriter, r *http.Request)) *mux.Route {
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

func (srv *ASServer) RegisterBackRoutes() {

	srv.HandlePacketFunc("/user/push", srv.UserList.PushRouteHandler()).Methods("POST")
	srv.HandlePacketFunc("/user/auth", srv.UserList.AuthRouteHandler()).Methods("POST")

	srv.HandlePacketFunc("/lobby/request", srv.LobbyList.RequestRouteHandler()).Methods("POST")

}

func (srv *ASServer) RegisterAppFrontend() {

	filepath.Walk("app-frame/", srv.FrontendWalker())
	filepath.Walk("app-content/", srv.FrontendWalker())
	srv.HandleFileQuery("/", "index.html")

}
