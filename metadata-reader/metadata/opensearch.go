package metadata

import (
	"encoding/json"
	"fmt"
)

type MetadataDocument struct {
	Name            string                 `json:"name"`
	Description     string                 `json:"description"`
	ContractAddress string                 `json:"contractAddress"`
	Attributes      []map[string]string    `json:"attributes"`
	Chain           Chain                  `json:"chain"`
	Metadata        map[string]interface{} `json:"metadata"`
}

func MapToMetadataDocument(contractAddress string, chain Chain, rawMetadata string) (MetadataDocument, error) {
	var metadata map[string]interface{}
	var props struct {
		Attributes []map[string]interface{} `json:"attributes"`
		Properties map[string]interface{}   `json:"properties"`
	}

	err := json.Unmarshal([]byte(rawMetadata), &metadata)
	if err != nil {
		return MetadataDocument{}, err
	}

	_ = json.Unmarshal([]byte(rawMetadata), &props)

	attributes := []map[string]string{}
	for _, attribute := range props.Attributes {
		var key interface{}
		if value, found := attribute["trait_type"]; found {
			key = value
		}

		attributes = append(attributes, map[string]string{
			"key":   fmt.Sprint(key),
			"value": fmt.Sprint(attribute["value"]),
		})
	}

	for key, value := range props.Properties {
		b, err := json.Marshal(value)
		if err != nil {
			return MetadataDocument{}, err
		}

		attributes = append(attributes, map[string]string{
			"key":   key,
			"value": string(b),
		})
	}

	name, _ := metadata["name"].(string)
	description, _ := metadata["description"].(string)

	return MetadataDocument{
		Name:            name,
		Description:     description,
		ContractAddress: contractAddress,
		Attributes:      attributes,
		Chain:           chain,
		Metadata:        metadata,
	}, nil
}
