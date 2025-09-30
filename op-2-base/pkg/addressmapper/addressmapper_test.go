package addressmapper_test

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"os"
	"path"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	evmmodel "github.com/likecoin/like-migration-backend/pkg/likenft/evm/model"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/addressmapper"

	. "github.com/smartystreets/goconvey/convey"
	goyaml "gopkg.in/yaml.v2"
)

type testAddressMapperContext struct {
	msgSender common.Address
	initHash  []byte
	metadata  *evmmodel.ContractLevelMetadata
}

func MakeTestAddressMapperContext(
	msgSender common.Address,
	initHash []byte,
	metadata *evmmodel.ContractLevelMetadata,
) addressmapper.AddressMapperContext {
	return &testAddressMapperContext{
		msgSender,
		initHash,
		metadata,
	}
}

func (c *testAddressMapperContext) GetMetadata(evmClassID common.Address) (*evmmodel.ContractLevelMetadata, error) {
	return c.metadata, nil
}

func (c *testAddressMapperContext) GetMsgSender() common.Address {
	return c.msgSender
}

func (c *testAddressMapperContext) GetNonce() [2]byte {
	return [2]byte{0, 0}
}

func (c *testAddressMapperContext) GetInitHash() []byte {
	return c.initHash
}

func MakeContractLevelMetadata(name string, potentialActionTargetUrl string) *evmmodel.ContractLevelMetadata {
	var potentialAction *evmmodel.MetadataISCNPotentialAction
	if potentialActionTargetUrl != "" {
		potentialAction = &evmmodel.MetadataISCNPotentialAction{
			Target: []evmmodel.MetadataISCNPotentialActionTarget{
				{
					Url: potentialActionTargetUrl,
				},
			},
		}
	}
	return &evmmodel.ContractLevelMetadata{
		ContractLevelMetadataOpenSea: evmmodel.ContractLevelMetadataOpenSea{
			Name: name,
		},
		MetadataISCN: evmmodel.MetadataISCN{
			PotentialAction: potentialAction,
		},
	}
}

type TestCase struct {
	InitHash       string `yaml:"initHash"`
	MsgSender      string `yaml:"msgSender"`
	OpEvmClassId   string `yaml:"opEvmClassId"`
	MetadataStr    string `yaml:"metadata"`
	BaseEvmClassId string `yaml:"baseEvmClassId"`
}

func TestAddressMapper(t *testing.T) {
	Convey("AddressMapper", t, func() {
		rootDir := "testdata"
		files, err := os.ReadDir(rootDir)
		if err != nil {
			t.Fatal(err)
		}
		for _, file := range files {
			fullPath := path.Join(rootDir, file.Name())
			f, err := os.Open(fullPath)
			if err != nil {
				t.Fatal(err)
			}
			defer f.Close()

			Convey(file.Name(), func() {
				decoder := goyaml.NewDecoder(f)
				for {
					var testCase TestCase
					err := decoder.Decode(&testCase)
					if errors.Is(err, io.EOF) {
						break
					}
					if err != nil {
						t.Fatal(err)
					}

					Convey(testCase.OpEvmClassId, func() {
						var metadata *evmmodel.ContractLevelMetadata
						err := json.Unmarshal([]byte(testCase.MetadataStr), &metadata)
						if err != nil {
							t.Fatal(err)
						}

						getBaseAddressFromOpAddress := addressmapper.NewAddressMapper(
							slog.New(slog.Default().Handler()),
							MakeTestAddressMapperContext(
								common.HexToAddress(testCase.MsgSender),
								hexutil.MustDecode(testCase.InitHash),
								metadata,
							),
							addressmapper.NewMemoryCache(),
						)

						baseEvmClassId, err := getBaseAddressFromOpAddress(
							common.HexToAddress(testCase.OpEvmClassId),
						)
						So(err, ShouldBeNil)
						So(baseEvmClassId.String(), ShouldEqual, testCase.BaseEvmClassId)
					})
				}
			})
		}
	})
}
