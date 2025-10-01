import os
import subprocess
import json
import hashlib

PROTOCOL_ADDRESS = "0xbc59962f45948BAbCB6B1eE4eEf45E490BBc74C3"
MINTER_ADDRESS = "0x46cf1324bD03Dd241d88747757d16E2C9062ff23" # likecoin-signer.eth

def main():
    with open("indexer.json", "r") as f:
        indexer = json.load(f)
    insert_fp = open("insert.sql", "w")
    for item in indexer:
        _salt = item["salt"]
        if not _salt:
            _salt = item["salt2"]
        _salt = hashlib.sha256(_salt.encode()).digest()[:10]
        salt = f"0x{MINTER_ADDRESS[2:]}0000{_salt.hex()}"
        new_address = subprocess.check_output(["./cli", "local", "compute-booknft-address",
            salt, item["name"], item["symbol"],
            "--protocol-address", PROTOCOL_ADDRESS])
        new_address = new_address[:-1].decode("utf-8")
        address = item["address"]
        print(item["id"], salt, item["name"], item["symbol"], address, new_address)
        insert_sql = f"UPDATE book_nft SET new_address = '{new_address}' WHERE address = '{address}';"
        insert_fp.write(insert_sql + "\n")
    insert_fp.close()

if __name__ == "__main__":
    main()