const GamesManager = artifacts.require("GamesManager");

module.exports = (deployer) => {
  deployer.deploy(GamesManager);
};
