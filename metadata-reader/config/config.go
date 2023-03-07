package config

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/spf13/viper"

	"metadata-reader/database"
	"metadata-reader/metadata"
	"metadata-reader/private/logutils"
	"metadata-reader/private/opensearch"
	"metadata-reader/queue"
	"metadata-reader/server"
)

type Config struct {
	Logger   logutils.Config
	Server   server.Config
	Database database.Config
	Queue    queue.Config
	Metadata metadata.Config
	Search   opensearch.Config
}

func LoadConfig(configPaths ...string) (Config, error) {
	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.SetEnvPrefix("MR")
	v.SetEnvKeyReplacer(strings.NewReplacer(`.`, `_`))
	v.AutomaticEnv()

	v2 := viper.New()
	v2.SetConfigName("config")
	v2.SetConfigType("yaml")
	var buff bytes.Buffer
	m := map[string]interface{}{}
	err := json.NewEncoder(&buff).Encode(Config{})
	if err != nil {
		return Config{}, fmt.Errorf("failed to encode config: %v", err)
	}
	err = json.NewDecoder(&buff).Decode(&m)
	if err != nil {
		return Config{}, fmt.Errorf("failed to decode config: %v", err)
	}
	for key, val := range m {
		v2.Set(key, val)
	}

	for _, path := range configPaths {
		v.AddConfigPath(path)
		v2.AddConfigPath(path)
	}

	if err = v2.SafeWriteConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileAlreadyExistsError); ok {
			log.Println("config.yaml file already exists: skip creating")
		} else {
			return Config{}, fmt.Errorf("failed to write the configuration file: %v", err)
		}
	}

	if err = v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Println("config.yaml ignored")
		} else {
			return Config{}, fmt.Errorf("failed to read the configuration file: %v", err)
		}
	}

	for _, k := range v.AllKeys() {
		value := v.GetString(k)
		v.Set(k, os.ExpandEnv(value))
	}

	var config Config
	err = v.Unmarshal(&config)
	return config, err
}
