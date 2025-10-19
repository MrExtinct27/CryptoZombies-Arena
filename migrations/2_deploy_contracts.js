// Only need to deploy the top-level contract (ZombieMarketplace)
// since it inherits all the others
var zombiemarketplace = artifacts.require("./zombiemarketplace.sol");

module.exports = function(deployer) {
    // Deploy only the top-level contract
    // This includes all functionality from the inheritance chain:
    // ZombieFactory -> ZombieFeeding -> ZombieHelper -> ZombieAttack -> 
    // ZombieOwnership -> ZombieBreeding -> ZombieMarketplace
    deployer.deploy(zombiemarketplace);
}