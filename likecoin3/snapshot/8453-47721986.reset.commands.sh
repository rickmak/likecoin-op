#!/usr/bin/env bash
#
# Drift-reset adminResetPool calls for base (chainId 8453)
# Generated from 8453-47721986.json @ block 47721986.
# Pools to reset: 56  |  positions: 432.
#
# This script runs ONLY the adminResetPool calls. Per the runbook:
#   * LikeCollective MUST already be paused before you run this.
#   * LikeStakePosition MUST stay UNPAUSED throughout.
#   * After this completes, sweep 47961.751782 LIKE (adminSweep)
#     then unpause() — both are runbook steps, not in this script.
#   * Each adminResetPool reverts (ErrIncompletePositionSet) if on-chain
#     Σ stakedAmount of its tokenIds != expectedTotalStaked — re-snapshot at
#     the paused block and regenerate if anything moved since block 47721986.
#
# Usage:
#   export RPC_URL="https://<chain>.g.alchemy.com/v2/<KEY>"
#   export OWNER_ACCOUNT="likecoin-deployer.eth"   # override if needed
#   bash 8453-47721986.reset.commands.sh
set -euo pipefail

COLLECTIVE=0x4506Ac2dD1e9A470d92a3D1656E1a99C676E1c8E
RPC_URL=${RPC_URL:?set RPC_URL to the chain RPC endpoint}
OWNER_ACCOUNT=${OWNER_ACCOUNT:-likecoin-deployer.eth}

echo "== adminResetPool x56 =="
# pool 1/56  0x0526Eb0EDF7707683f1bA4DCf8Ad35b853490762  2pos  recorded 0.000001 -> true 3.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x0526Eb0EDF7707683f1bA4DCf8Ad35b853490762 "[805,1506]" 3000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 2/56  0x0d9daD7d5BA162c98260398B5494cC133292b5Ad  7pos  recorded 0.000001 -> true 22304.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x0d9daD7d5BA162c98260398B5494cC133292b5Ad "[49,296,1048,715,851,1044,1515]" 22304000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 3/56  0x17A8B5B45Df12bE61EE5c057C463634C7B64b00c  2pos  recorded 52003.0 -> true 52963.173386 LIKE
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x17A8B5B45Df12bE61EE5c057C463634C7B64b00c "[1110,1130]" 52963173386 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 4/56  0x183464E20743D52C3cAAEdEc40b52C164F42E9Ef  39pos  recorded 360214.648 -> true 397454.508166 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x183464E20743D52C3cAAEdEc40b52C164F42E9Ef "[599,598,535,539,540,541,554,568,571,574,576,577,582,1055,604,605,611,615,1073,810,1011,814,815,817,863,888,895,921,918,919,920,922,932,937,956,1008,1051,1135,1136]" 397454508166 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 5/56  0x19B884c94b9E27f14e997db63dFa8F1F5EF40E2c  7pos  recorded 55803.0 -> true 56078.644803 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x19B884c94b9E27f14e997db63dFa8F1F5EF40E2c "[25,30,131,148,192,286,784]" 56078644803 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 6/56  0x21E66DBd47d6376242956DaA7348682EBAd79D3B  5pos  recorded 0.000001 -> true 613.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x21E66DBd47d6376242956DaA7348682EBAd79D3B "[261,281,415,720,1512]" 613000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 7/56  0x22263b9c327817dF2B11d64dfeC2b4A754fE4457  12pos  recorded 0.000001 -> true 23128.240002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x22263b9c327817dF2B11d64dfeC2b4A754fE4457 "[185,207,353,364,550,1090,789,858,939,969,1103,1516]" 23128240002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 8/56  0x2fa5F63792Ea0f3501C842417eF8E61F41c5E60f  4pos  recorded 0.000001 -> true 113.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x2fa5F63792Ea0f3501C842417eF8E61F41c5E60f "[244,495,685,1529]" 113000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 9/56  0x334C13ABf78D5d29DDd32fca627179a5059B5814  24pos  recorded 10310.0 -> true 10343.392471 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x334C13ABf78D5d29DDd32fca627179a5059B5814 "[1,15,34,50,73,85,98,164,173,283,324,342,348,359,373,377,390,404,417,525,583,796,818,878]" 10343392471 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 10/56  0x34091a775D8aC20C402f352BAEBa2CD7E268856d  4pos  recorded 0.000001 -> true 1103.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x34091a775D8aC20C402f352BAEBa2CD7E268856d "[1191,1236,1269,1514]" 1103000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 11/56  0x3928C8E06f5f814811f6d70ae91da85B4E133b89  12pos  recorded 0.000001 -> true 7069.528436 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x3928C8E06f5f814811f6d70ae91da85B4E133b89 "[42,155,158,213,331,347,380,400,514,781,960,1504]" 7069528436 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 12/56  0x3bf42DA7f5781d3940B2318484c907Ee33e81d8D  10pos  recorded 14400.21 -> true 14462.001248 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x3bf42DA7f5781d3940B2318484c907Ee33e81d8D "[6,134,180,206,363,369,399,480,892,968]" 14462001248 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 13/56  0x3ccD28dfa50a169435002b0BC3A363a0A7E23aa0  4pos  recorded 0.000001 -> true 10003.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x3ccD28dfa50a169435002b0BC3A363a0A7E23aa0 "[1078,1125,1416,1526]" 10003000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 14/56  0x3ed61aeeC1DA28A93eE9963f2D21FdD802CBc063  6pos  recorded 0.000001 -> true 4003.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x3ed61aeeC1DA28A93eE9963f2D21FdD802CBc063 "[39,116,123,591,776,1520]" 4003000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 15/56  0x4D69ecb8Da3B16D5828eC0DCd17B1310Cb96D3A0  4pos  recorded 110300.0 -> true 110486.337084 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x4D69ecb8Da3B16D5828eC0DCd17B1310Cb96D3A0 "[1470,1433,1441,1539]" 110486337084 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 16/56  0x51D9A55CeeA0fc14BD8DbA60af5284F0e17fC936  5pos  recorded 0.000001 -> true 3013.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x51D9A55CeeA0fc14BD8DbA60af5284F0e17fC936 "[179,289,742,1260,1503]" 3013000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 17/56  0x5668ae4acDdE1E4143ae8229AF951CEa386a94c9  4pos  recorded 0.000001 -> true 1103.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x5668ae4acDdE1E4143ae8229AF951CEa386a94c9 "[305,356,747,1507]" 1103000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 18/56  0x595FA2345b754c5F957099E2D8a976617C40710c  9pos  recorded 7035.0 -> true 7096.61261 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x595FA2345b754c5F957099E2D8a976617C40710c "[9,16,21,28,79,83,255,513,790]" 7096612610 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 19/56  0x5Bd162A3F47B40f57d41f0667e51B37D2b790cE8  6pos  recorded 1413.0 -> true 1743.184943 LIKE
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x5Bd162A3F47B40f57d41f0667e51B37D2b790cE8 "[149,290,365,379,701,1369]" 1743184943 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 20/56  0x5a84A921113340E8edD133931b55EB6e855259Ce  6pos  recorded 21303.0 -> true 21845.972282 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x5a84A921113340E8edD133931b55EB6e855259Ce "[53,87,361,478,625,801]" 21845972282 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 21/56  0x5aDCb8a737e4AaABf7Ff6b656Acd5dc60E983757  11pos  recorded 0.000001 -> true 10350.971626 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x5aDCb8a737e4AaABf7Ff6b656Acd5dc60E983757 "[5,18,23,80,82,518,146,420,797,974,1522]" 10350971626 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 22/56  0x6B9184df38427a61814e638900fd9BE999E0bD02  7pos  recorded 23551.93 -> true 23777.179547 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x6B9184df38427a61814e638900fd9BE999E0bD02 "[1074,1077,1076,1089,1067,1086,1123]" 23777179547 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 23/56  0x6DC830BCe79D7d6F6db60d0bFAE8389192Bbf630  5pos  recorded 0.000001 -> true 10103.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x6DC830BCe79D7d6F6db60d0bFAE8389192Bbf630 "[834,848,877,1213,1519]" 10103000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 24/56  0x6EEf0D7C24c6b872e480154dEb8b7430f54603E3  8pos  recorded 40826.0 -> true 41367.830007 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x6EEf0D7C24c6b872e480154dEb8b7430f54603E3 "[374,375,1082,758,963,1178,1109,1261]" 41367830007 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 25/56  0x6d4f3EB092a8312a52104B8786Cf5D6305261D07  5pos  recorded 0.000001 -> true 1213.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x6d4f3EB092a8312a52104B8786Cf5D6305261D07 "[247,728,1002,1203,1509]" 1213000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 26/56  0x6f7D621827d817B80C07a644a0A75579444BE530  4pos  recorded 0.000001 -> true 1103.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x6f7D621827d817B80C07a644a0A75579444BE530 "[866,899,1360,1505]" 1103000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 27/56  0x78b29A83c1Ef7a7ef0faA0eC11Cb3809E5B78402  2pos  recorded 0.000001 -> true 10.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x78b29A83c1Ef7a7ef0faA0eC11Cb3809E5B78402 "[981,1527]" 10000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 28/56  0x7d05a166589a26A892BE616579a05432a2401314  3pos  recorded 0.000001 -> true 13.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x7d05a166589a26A892BE616579a05432a2401314 "[304,643,1530]" 13000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 29/56  0x87140Bef332E48D1F2341db740E388460609152E  3pos  recorded 40103.0 -> true 40694.818312 LIKE
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x87140Bef332E48D1F2341db740E388460609152E "[311,663,964]" 40694818312 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 30/56  0x8Abc20B4506988B555117e43A701D8658A9D370f  2pos  recorded 11003.0 -> true 11186.251384 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x8Abc20B4506988B555117e43A701D8658A9D370f "[210,735]" 11186251384 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 31/56  0x8EcBaA55E85429D968129207fad35f0d049424CA  19pos  recorded 0.000001 -> true 9801.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x8EcBaA55E85429D968129207fad35f0d049424CA "[0,52,57,145,162,259,284,338,345,376,387,388,389,545,773,820,859,879,1517]" 9801000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 32/56  0x91A7e8b5a3331cAf708ad3F90C71Cec10f37B125  16pos  recorded 133879.04 -> true 133879.728559 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x91A7e8b5a3331cAf708ad3F90C71Cec10f37B125 "[157,181,197,204,226,293,330,354,397,412,479,551,589,794,893,1282]" 133879728559 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 33/56  0x93bec61F64227EeBBD0bB14E1AeCE56D63B9e0F7  5pos  recorded 0.000001 -> true 5603.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x93bec61F64227EeBBD0bB14E1AeCE56D63B9e0F7 "[251,709,1064,1168,1501]" 5603000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 34/56  0x9483913D6207c0Dd3c54D7856C23145F1279cA52  15pos  recorded 96401.75 -> true 96422.483515 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x9483913D6207c0Dd3c54D7856C23145F1279cA52 "[129,133,175,201,358,989,612,617,803,850,912,971,1016,1343,1352]" 96422483515 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 35/56  0x955b8520D9026D6247690E0dC8c5E1b1434C4078  14pos  recorded 0.000001 -> true 24415.050002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x955b8520D9026D6247690E0dC8c5E1b1434C4078 "[867,869,872,875,894,900,903,907,931,950,957,972,1223,1518]" 24415050002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 36/56  0x97770A1E0023046D387aC987BbCC100f35a14844  6pos  recorded 82613.0 -> true 82613.313454 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x97770A1E0023046D387aC987BbCC100f35a14844 "[280,297,413,719,853,1050]" 82613313454 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 37/56  0x97FA87D601701ea51164CfC4e0e00dde004A9CA0  10pos  recorded 0.000001 -> true 8856.008844 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x97FA87D601701ea51164CfC4e0e00dde004A9CA0 "[32,117,156,326,402,804,847,911,1338,1521]" 8856008844 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 38/56  0x991739959726cb96f1caFF52c968f4f2912795Ff  5pos  recorded 0.000001 -> true 10842.721378 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x991739959726cb96f1caFF52c968f4f2912795Ff "[1177,1144,1304,1314,1508]" 10842721378 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 39/56  0x9cA7f7FAF79544FEEF185b50749D3f814E3748ce  8pos  recorded 0.000001 -> true 3503.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0x9cA7f7FAF79544FEEF185b50749D3f814E3748ce "[45,74,88,593,618,770,884,1525]" 3503000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 40/56  0xA20Cc05e12F456b2b97aE2fDAbE0952598831f1C  4pos  recorded 135003.0 -> true 135028.598369 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xA20Cc05e12F456b2b97aE2fDAbE0952598831f1C "[1340,1188,1253,1439]" 135028598369 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 41/56  0xAB976072B6Be23De212437d8f42375D5131daFb9  5pos  recorded 0.000001 -> true 2267.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xAB976072B6Be23De212437d8f42375D5131daFb9 "[40,111,487,557,1511]" 2267000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 42/56  0xB790e3B54f17eBC1534F5096438b227AEc613C4e  2pos  recorded 0.000001 -> true 3.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xB790e3B54f17eBC1534F5096438b227AEc613C4e "[1119,1502]" 3000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 43/56  0xD08EB66DAe9Bad58626ac4ED6A4a102b134b7457  13pos  recorded 109803.0 -> true 110034.487762 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xD08EB66DAe9Bad58626ac4ED6A4a102b134b7457 "[909,1088,908,915,916,929,934,938,951,1081,1543,1397,1351]" 110034487762 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 44/56  0xDd624795D4670f029CcFB90926d2aFfDf084C3aB  7pos  recorded 5233.0 -> true 5305.557239 LIKE
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xDd624795D4670f029CcFB90926d2aFfDf084C3aB "[22,27,78,81,256,512,783]" 5305557239 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 45/56  0xF9e993C8a9fBc63a910DCd1B02b3359cCC373919  2pos  recorded 0.000001 -> true 3.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xF9e993C8a9fBc63a910DCd1B02b3359cCC373919 "[986,1528]" 3000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 46/56  0xa004d4a92B2C139aE5B6a2485458B60b484Aa3db  4pos  recorded 2113.0 -> true 2374.378671 LIKE
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xa004d4a92B2C139aE5B6a2485458B60b484Aa3db "[332,355,682,1299]" 2374378671 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 47/56  0xa1D7F3e0a45206CFf39110aF4a7542407289e829  13pos  recorded 65593.0 -> true 65806.473929 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xa1D7F3e0a45206CFf39110aF4a7542407289e829 "[72,97,108,113,370,392,416,484,552,880,1084,1162,1344]" 65806473929 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 48/56  0xa2223E10aE8Db458FB5c599DA3BBF95BB6665e23  4pos  recorded 5204.0 -> true 5207.696699 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xa2223E10aE8Db458FB5c599DA3BBF95BB6665e23 "[46,58,693,1420]" 5207696699 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 49/56  0xa750Ef555fC0368987974b34e058200a81BEd78d  13pos  recorded 0.000001 -> true 18314.118227 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xa750Ef555fC0368987974b34e058200a81BEd78d "[11,14,104,125,202,236,239,279,532,788,967,1262,1524]" 18314118227 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 50/56  0xb73f103207aB7A1e7c0c1f3218f52dF5bb812C32  2pos  recorded 0.000001 -> true 3.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xb73f103207aB7A1e7c0c1f3218f52dF5bb812C32 "[806,1523]" 3000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 51/56  0xb8Ae0a0C0380F81F4b14120A948228BACC327415  13pos  recorded 34638.0 -> true 34638.787593 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xb8Ae0a0C0380F81F4b14120A948228BACC327415 "[37,70,77,101,176,391,393,546,609,1063,624,802,1096]" 34638787593 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 52/56  0xd984aBfe4F9dcdbee653bF9d1247EDD0e2102C51  15pos  recorded 24284.53 -> true 24322.48935 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xd984aBfe4F9dcdbee653bF9d1247EDD0e2102C51 "[4,35,65,107,166,274,282,341,378,403,418,543,756,819,1072]" 24322489350 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 53/56  0xd9Cd6de785C3b8F1939a8DD509019177B7D41a0E  4pos  recorded 0.000001 -> true 3003.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xd9Cd6de785C3b8F1939a8DD509019177B7D41a0E "[215,731,1266,1510]" 3003000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 54/56  0xdDBa03e8e8459d4afD9ac6eA226209b7E56d5AF1  4pos  recorded 0.000001 -> true 2013.000002 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xdDBa03e8e8459d4afD9ac6eA226209b7E56d5AF1 "[138,421,765,1513]" 2013000002 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 55/56  0xeC56635DC9a3dC8bF453a1A960917F3A5eF265ec  5pos  recorded 10041.738042 -> true 10042.42 LIKE  [index was INFLATED]
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xeC56635DC9a3dC8bF453a1A960917F3A5eF265ec "[144,411,808,995,1431]" 10042420000 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

# pool 56/56  0xf54e4B28493b4Ec8f2Cf97E0f8209f71FBaC1254  2pos  recorded 51100.0 -> true 51105.723062 LIKE
cast send "$COLLECTIVE" "adminResetPool(address,uint256[],uint256)" 0xf54e4B28493b4Ec8f2Cf97E0f8209f71FBaC1254 "[1363,1367]" 51105723062 \
    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"

echo "adminResetPool complete. Runbook next: adminSweep 47961.751782 LIKE, then unpause()."
