package metadata_test

import (
	"encoding/json"
	"reflect"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"

	"metadata-reader/metadata"
)

func TestMapToMetadataDocument(t *testing.T) {
	contractAddress := "0xd3BF218F0F396CD8b0429D2ff9Cc2A964d4C36D1"

	rawMetadata := `{"name":"The Simples - 1111 - #172","description":"The Simples - 1111 Collection","image":"https://gateway.pinata.cloud/ipfs/QmPD7jppJiygyveBEhcDNzJv9TL3cjnGPA8VPxHUPyrhwQ/simple_seven_two.png","external_url":"https://thesimples.art","attributes":[{"value":"Butcher","trait_type":"body"},{"value":"Simple Cyclops","trait_type":"head"},{"value":"Simple Light","trait_type":"hands"}]}`
	rawMetadata1 := `{"image":"https://nftstorage.link/ipfs/bafybeifwegrkompni3xqlq5wbc5pcb7yx6h7cwdqtzqgai7lfjhvqywexm/348.png","name":"Pawn #348","description":"Kyoko Pawn is a collection of 1000 unique NFTs exclusively for Kyoko. You can get exclusive benefits of kyoko, and it is also a passport to the kyoko metaverse. Please visit https://pawn.kyoko.finance for more details."}`
	rawMetadata2 := `{"name":"RŌHKI Genesis Key 1/100","properties":{"base": "starfish","rich_property":{"name": "eyes","value": "big","display_value": "Big"}},"attributes":[{"trait_type":"Serial","value":1}],"description":"Your portal into the RŌHKI world, coming soon...","animation_url":"https://images.mirror-media.xyz/videos/uRW1LyuVlZgNbOXyKJrz_","image":"https://images.mirror-media.xyz/publication-images/ld7GHdQ7yIZezuHTgkroy.jpg?height=720&width=1280"}`
	rawMetadata3 := `{"name":"RŌHKI Genesis Key 1/100","properties":3,"attributes":[{"trait_type":"Serial","value":1}],"description":"Your portal into the RŌHKI world, coming soon...","animation_url":"https://images.mirror-media.xyz/videos/uRW1LyuVlZgNbOXyKJrz_","image":"https://images.mirror-media.xyz/publication-images/ld7GHdQ7yIZezuHTgkroy.jpg?height=720&width=1280"}`

	metadataDocument := metadata.MetadataDocument{
		Name:            "The Simples - 1111 - #172",
		Description:     "The Simples - 1111 Collection",
		ContractAddress: contractAddress,
		Attributes:      []map[string]string{{"key": "body", "value": "Butcher"}, {"key": "head", "value": "Simple Cyclops"}, {"key": "hands", "value": "Simple Light"}},
		Chain:           metadata.ETH,
		Metadata: map[string]interface{}{
			"name":         "The Simples - 1111 - #172",
			"description":  "The Simples - 1111 Collection",
			"external_url": "https://thesimples.art",
			"image":        "https://gateway.pinata.cloud/ipfs/QmPD7jppJiygyveBEhcDNzJv9TL3cjnGPA8VPxHUPyrhwQ/simple_seven_two.png",
			"attributes": []map[string]interface{}{
				{
					"value":      "Butcher",
					"trait_type": "body",
				},
				{
					"value":      "Simple Cyclops",
					"trait_type": "head",
				},
				{
					"value":      "Simple Light",
					"trait_type": "hands",
				},
			},
		},
	}

	metadataDocument1 := metadata.MetadataDocument{
		Name:            "Pawn #348",
		Description:     "Kyoko Pawn is a collection of 1000 unique NFTs exclusively for Kyoko. You can get exclusive benefits of kyoko, and it is also a passport to the kyoko metaverse. Please visit https://pawn.kyoko.finance for more details.",
		ContractAddress: contractAddress,
		Attributes:      []map[string]string{},
		Chain:           metadata.ETH,
	}

	metadataDocument2 := metadata.MetadataDocument{
		Name:            "RŌHKI Genesis Key 1/100",
		Description:     "Your portal into the RŌHKI world, coming soon...",
		ContractAddress: contractAddress,
		Attributes:      []map[string]string{{"key": "Serial", "value": "1"}, {"key": "base", "value": "\"starfish\""}, {"key": "rich_property", "value": `{"display_value":"Big","name":"eyes","value":"big"}`}},
		Chain:           metadata.ETH,
	}

	metadataDocument3 := metadata.MetadataDocument{
		Name:            "RŌHKI Genesis Key 1/100",
		Description:     "Your portal into the RŌHKI world, coming soon...",
		ContractAddress: contractAddress,
		Attributes:      []map[string]string{{"key": "Serial", "value": "1"}},
		Chain:           metadata.ETH,
	}

	t.Run("should return valid metadata document", func(t *testing.T) {
		result, err := metadata.MapToMetadataDocument(contractAddress, metadata.ETH, rawMetadata)
		if err != nil {
			t.Fatalf("cannot map raw metadata to metadata document: %v", err)
		}

		jsonResult, _ := json.Marshal(result)
		jsonMetadataDocument, _ := json.Marshal(metadataDocument)

		if string(jsonResult) != string(jsonMetadataDocument) {
			t.Fatalf("map is not correct: obj1: %v (%s), obj2: %v (%s)", result.Metadata, reflect.TypeOf(result.Metadata["attributes"]), metadataDocument.Metadata, reflect.TypeOf(result.Metadata["attributes"]))
		}

		result1, err := metadata.MapToMetadataDocument(contractAddress, metadata.ETH, rawMetadata1)
		if err != nil {
			t.Fatalf("cannot map raw metadata to metadata document: %v", err)
		}
		if !cmp.Equal(result1, metadataDocument1, cmpopts.IgnoreFields(metadata.MetadataDocument{}, "Metadata")) {
			t.Fatalf("map is not correct: obj1: %v, obj2: %v", result1, metadataDocument1)
		}

		result2, err := metadata.MapToMetadataDocument(contractAddress, metadata.ETH, rawMetadata2)
		if err != nil {
			t.Fatalf("cannot map raw metadata to metadata document: %v", err)
		}
		if !cmp.Equal(result2, metadataDocument2, cmpopts.IgnoreFields(metadata.MetadataDocument{}, "Metadata")) {
			t.Fatalf("map is not correct: obj1: %v, obj2: %v", result2, metadataDocument2)
		}

		result3, err := metadata.MapToMetadataDocument(contractAddress, metadata.ETH, rawMetadata3)
		if err != nil {
			t.Fatalf("cannot map raw metadata to metadata document: %v", err)
		}
		if !cmp.Equal(result3, metadataDocument3, cmpopts.IgnoreFields(metadata.MetadataDocument{}, "Metadata")) {
			t.Fatalf("map is not correct: obj1: %v, obj2: %v", result3, metadataDocument3)
		}
	})
}
