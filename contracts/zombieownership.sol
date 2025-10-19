// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./zombieattack.sol";
import "./erc721.sol";
import "./safemath.sol";

contract ZombieOwnership is ZombieAttack, ERC721 {

  using SafeMath for uint256;

  mapping (uint => address) zombieApprovals;

  function balanceOf(address _owner) external view override returns (uint256) {
    return ownerZombieCount[_owner];
  }

  function ownerOf(uint256 _tokenId) external view override returns (address) {
    return zombieToOwner[_tokenId];
  }

  function _transfer(address _from, address _to, uint256 _tokenId) private {
    ownerZombieCount[_to]++;
    ownerZombieCount[_from]--;
    zombieToOwner[_tokenId] = _to;
    emit Transfer(_from, _to, _tokenId);
  }

  function transferFrom(address _from, address _to, uint256 _tokenId) external payable override {
    require(zombieToOwner[_tokenId] == msg.sender || zombieApprovals[_tokenId] == msg.sender);
    _transfer(_from, _to, _tokenId);
  }

  function approve(address _approved, uint256 _tokenId) external payable override {
    require(msg.sender == zombieToOwner[_tokenId]);
    zombieApprovals[_tokenId] = _approved;
    emit Approval(msg.sender, _approved, _tokenId);
  }

  function isApprovedForAll(address, address) external pure returns (bool) {
    return false; // Base implementation
  }

  function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable override {
    this.transferFrom(_from, _to, _tokenId);
  }

  function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes calldata) external payable override {
    this.transferFrom(_from, _to, _tokenId);
  }

  function createRandomZombie(string memory _name) public payable virtual override(ZombieAttack, ERC721) {
    require(msg.value >= createFee, "Insufficient payment");
    super.createRandomZombie(_name);
  }
}
