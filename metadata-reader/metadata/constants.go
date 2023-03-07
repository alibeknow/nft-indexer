package metadata

type Chain string

const (
	ETH     Chain = "eth"
	POLYGON Chain = "polygon"
)

func GetMappings() map[string]interface{} {
	properties := make(map[string]interface{})

	properties["name"] = map[string]interface{}{
		"type":  "text",
		"index": true,
	}

	properties["description"] = map[string]interface{}{
		"type":  "text",
		"index": true,
	}

	properties["attributes"] = map[string]interface{}{
		"type":    "object",
		"enabled": true,
		"dynamic": true,
		"properties": map[string]interface{}{
			"key": map[string]interface{}{
				"type": "text",
			},
			"value": map[string]interface{}{
				"type": "text",
			},
		},
	}

	properties["chain"] = map[string]interface{}{
		"type":  "keyword",
		"index": true,
	}

	properties["contractAddress"] = map[string]interface{}{
		"type":  "text",
		"index": true,
	}

	properties["metadata"] = map[string]interface{}{
		"type":    "object",
		"enabled": false,
		"dynamic": true,
	}

	return map[string]interface{}{
		"properties": properties,
	}
}
