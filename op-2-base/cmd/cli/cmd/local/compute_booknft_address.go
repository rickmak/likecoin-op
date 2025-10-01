package local

import (
	"encoding/hex"
	"fmt"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/spf13/cobra"
)

var computeBookNFTAddressCmd = &cobra.Command{
	Use:   "compute-booknft-address <salt> <name> <symbol>",
	Short: "Compute booknft address",
	Args:  cobra.ExactArgs(3),
	Run: func(cmd *cobra.Command, args []string) {
		salt := args[0]
		name := args[1]
		symbol := args[2]

		protocolAddress, err := cmd.Flags().GetString("protocol-address")
		if err != nil {
			cmd.PrintErrf("failed to get flag protocol-address: %v\n", err)
			return
		}
		if !common.IsHexAddress(protocolAddress) {
			cmd.PrintErrf("invalid protocol-address: '%s'\n", protocolAddress)
			return
		}
		_protocolAddress := common.HexToAddress(protocolAddress)

		bytecodeFile, err := cmd.Flags().GetString("bytecode-file")
		if err != nil {
			cmd.PrintErrf("failed to get flag bytecodeFile: %v\n", err)
			return
		}

		data, err := os.ReadFile(bytecodeFile)
		if err != nil {
			cmd.PrintErrf("failed to read bytecode file '%s': %v\n", bytecodeFile, err)
			return
		}
		// Bytecode file is expected to be a hex string like 0x.... ; decode to raw bytes
		hexStr := strings.TrimSpace(string(data))[2:]
		creationCode, err := hex.DecodeString(hexStr)
		if err != nil {
			cmd.PrintErrf("failed to hex-decode creation code: %v\n", err)
			return
		}

		// Build initData = abi.encodeWithSelector(IBookNFTInterface.initialize.selector, name, symbol)
		parsedAbi, _ := abi.JSON(strings.NewReader(`[
		{
      "inputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "symbol",
          "type": "string"
        }
      ],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }]`))
		initData, err := parsedAbi.Pack("initialize", name, symbol)
		if err != nil {
			cmd.PrintErrf("failed to pack initialize data: %v\n", err)
			return
		}

		// Encode constructor args (address beacon, bytes data)
		addressType, _ := abi.NewType("address", "address", nil)
		bytesType, _ := abi.NewType("bytes", "bytes", nil)
		constructorArgs := abi.Arguments{
			{Type: addressType},
			{Type: bytesType},
		}
		encodedArgs, err := constructorArgs.Pack(_protocolAddress, initData)
		if err != nil {
			cmd.PrintErrf("failed to pack constructor args: %v\n", err)
			return
		}

		// Concatenate creationCode ++ encodedArgs like abi.encodePacked(type(BeaconProxy).creationCode, abi.encode(address, bytes))
		proxyCreationCode := append(creationCode, encodedArgs...)
		initCodeHash := crypto.Keccak256(proxyCreationCode)

		fmt.Println("initCodeHash:", "0x"+common.Bytes2Hex(initCodeHash))

		// Generate the BookNFT address via create2
		saltBytes, err := hex.DecodeString(salt[2:])
		if err != nil {
			cmd.PrintErrf("failed to decode salt: %v\n", err)
			return
		}

		bookNFTAddress := crypto.CreateAddress2(_protocolAddress, [32]byte(saltBytes), initCodeHash)
		fmt.Println("bookNFTAddress:", bookNFTAddress)
	},
}

func init() {
	LocalCmd.AddCommand(computeBookNFTAddressCmd)
	computeBookNFTAddressCmd.Flags().String("bytecode-file", "BeaconProxy.creationCode", "Path to bytecode file (default: BeaconProxy.creationCode)")
	computeBookNFTAddressCmd.Flags().String("protocol-address", os.Getenv("CREATE_ADDRESS_2_DEPLOYER_ADDRESS"), "LikeProtocol address (default from CREATE_ADDRESS_2_DEPLOYER_ADDRESS)")
}
