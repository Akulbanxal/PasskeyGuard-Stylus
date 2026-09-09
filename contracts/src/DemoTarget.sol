// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DemoTarget {
    uint256 public valueReceived;
    bytes public lastData;

    event Received(uint256 amount, bytes data);

    receive() external payable {
        valueReceived += msg.value;
        emit Received(msg.value, "");
    }

    function doSomething(bytes calldata data) external payable {
        valueReceived += msg.value;
        lastData = data;
        emit Received(msg.value, data);
    }
}
