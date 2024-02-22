package main

import app_server "github.com/PubSJung/AlgoSumoPrototype/app-server"

func main() {

	cfg, err := app_server.LoadConfig("config.toml")
	if err != nil {
		panic(err)
	}

	srv := app_server.NewServer(cfg)
	srv.Run()

}
