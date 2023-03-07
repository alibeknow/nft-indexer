package queue

import "fmt"

type Config struct {
	Protocol string
	Username string
	Password string
	Host     string
	Port     int
	Name     string
	Workers  int
}

func (config *Config) URL() string {
	url := fmt.Sprintf(
		"%s://%s:%s@%s:%d",
		config.Protocol,
		config.Username,
		config.Password,
		config.Host,
		config.Port,
	)

	return url
}
