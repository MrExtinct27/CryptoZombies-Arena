// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./ownable.sol";

contract ZombieFactory is Ownable {
    event NewZombie(uint zombieId, string name, uint dna);

    uint dnaDigits = 16;
    uint dnaModulus = 10 ** dnaDigits;
    uint cooldownTime = 30 seconds; // Changed from 1 days for easier testing
    uint public createFee = 0.001 ether;

    struct Zombie {
        string name;
        uint dna;
        uint32 level;
        uint32 readyTime;
        uint16 winCount;
        uint16 lossCount;
    }

    Zombie[] public zombies;
    mapping (uint => address) public zombieToOwner;
    mapping (address => uint) public ownerZombieCount;

    function createRandomZombie(string memory _name) public payable virtual {
        // Only check for valid payment and name
        require(msg.value >= createFee, "Insufficient payment for zombie creation");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_name).length <= 25, "Name too long");
        
        uint randDna = _generateRandomDna(_name);
        _createZombie(_name, randDna);

        // Return excess payment
        if (msg.value > createFee) {
            payable(msg.sender).transfer(msg.value - createFee);
        }
    }

    function _createZombie(string memory _name, uint _dna) internal {
        // Remove all restrictions, just create the zombie
        // Set readyTime to current timestamp (no cooldown) for testing
        zombies.push(Zombie(_name, _dna, 1, uint32(block.timestamp), 0, 0));
        uint id = zombies.length - 1;
        zombieToOwner[id] = msg.sender;
        ownerZombieCount[msg.sender]++;
        emit NewZombie(id, _name, _dna);
    }

    function _generateRandomDna(string memory _str) private view returns (uint) {
        uint rand = uint(keccak256(abi.encodePacked(_str, block.timestamp, msg.sender)));
        return rand % dnaModulus;
    }

    function getZombiesByOwner(address _owner) external view virtual returns(uint[] memory) {
        uint[] memory result = new uint[](ownerZombieCount[_owner]);
        uint counter = 0;
        for (uint i = 0; i < zombies.length; i++) {
            if (zombieToOwner[i] == _owner) {
                result[counter] = i;
                counter++;
            }
        }
        return result;
    }
}
