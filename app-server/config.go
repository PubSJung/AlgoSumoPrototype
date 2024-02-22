package app_server

import (
	"crypto/sha256"
	"fmt"

	"github.com/BurntSushi/toml"
)

type ASConfig struct {
	Port        int    `toml:"port"`
	UUIDShaBase string `toml:"uuid-sha-base"`
}

func LoadConfig(path string) (ASConfig, error) {
	var config ASConfig
	_, err := toml.DecodeFile(path, &config)
	return config, err
}

func (cfg ASConfig) GenerateUUID(id int) string {
	sha := sha256.Sum256([]byte(cfg.UUIDShaBase + fmt.Sprint(id)))
	return fmt.Sprintf("%x", sha)
}
