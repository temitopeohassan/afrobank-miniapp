// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PaymentProcessor.sol";

contract DeployPaymentProcessor is Script {
    function run() external {
        // Load deployer private key from environment (use: export PRIVATE_KEY=...)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Configure deployment params
        address paymentReceiver = vm.envAddress("PAYMENT_RECEIVER"); 
        address owner = vm.envAddress("OWNER"); 

        // Example stablecoin addresses (adjust for your network)
        address ;
        initialTokens[0] = vm.envAddress("USDC_ADDRESS");
        initialTokens[1] = vm.envAddress("USDT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        PaymentProcessor processor = new PaymentProcessor(
            paymentReceiver,
            initialTokens,
            owner
        );

        vm.stopBroadcast();

        console.log("✅ PaymentProcessor deployed at:", address(processor));
        console.log("Receiver:", paymentReceiver);
        console.log("Owner:", owner);
    }
}
