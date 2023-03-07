package logutils

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func NewLogger(conf Config) (*zap.Logger, error) {
	level, err := zap.ParseAtomicLevel(conf.Level)
	if err != nil {
		return nil, err
	}

	cfg := zap.Config{
		Level:            level,
		Encoding:         "json",
		OutputPaths:      []string{"stdout"},
		ErrorOutputPaths: []string{"stderr"},
		EncoderConfig: zapcore.EncoderConfig{
			MessageKey:  "message",
			LevelKey:    "level",
			EncodeLevel: zapcore.LowercaseLevelEncoder,
		},
	}

	return zap.Must(cfg.Build()), nil
}
