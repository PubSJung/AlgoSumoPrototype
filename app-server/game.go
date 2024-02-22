package app_server

type ASNetMovable struct {
	PosX        float32 `json:"pos_x"`
	PosY        float32 `json:"pos_y"`
	VelX        float32 `json:"vel_x"`
	VelY        float32 `json:"vel_y"`
	ScaleX      float32 `json:"scale_x"`
	ScaleY      float32 `json:"scale_y"`
	VelModifier float32 `json:"vel_modifier"`
}

type ASPlayer struct {
	Admin                 bool         `json:"admin"`
	Name                  string       `json:"name"`
	LocalPlayerJSClass    string       `json:"local_player_class"`
	LocalPlayerStylesheet string       `json:"local_player_css"`
	UUID                  string       `json:"-"`
	ULID                  string       `json:"-"`
	NetPlayer             ASNetMovable `json:"net_player"`
}

type ASObstacle struct {
	ULID                    string       `json:"-"`
	UUID                    string       `json:"-"`
	LocalObstacleJSClass    string       `json:"local_obj_class"`
	LocalObstacleStylesheet string       `json:"local_obj_css"`
	NetObject               ASNetMovable `json:"net_obj"`
}
