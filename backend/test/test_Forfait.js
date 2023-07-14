const GamesManager = artifacts.require("GamesManager");
const Game = artifacts.require("Game");
const truffleAssert = require("truffle-assertions");
const StandardMerkleTree = require("@openzeppelin/merkle-tree").StandardMerkleTree;

// Utility function that create and setup a new game.
const setupGame = async (playerOne, playerTwo) => {
  const gamesManager = await GamesManager.deployed();

  // Create  a small size game.
  const createGame = await gamesManager.createGame(true, {
    from: playerOne,
  });
  let game;
  truffleAssert.eventEmitted(createGame, "NewGame", (ev) => {
    game = ev.game;
    return ev.creator == playerOne;
  });

  // Register playerTwo.
  const joinGame = await gamesManager.joinGameByID(game, { from: playerTwo });
  truffleAssert.eventEmitted(joinGame, "JoinGame", (ev) => {
    return ev.game == game;
  });

  // Return setupped game.
  return Game.at(game);
};


contract("Test Game contract - forfeit", (accounts) => {
  let game;
  const playerOne = accounts[0];
  const playerTwo = accounts[1];

  // Normal game setup
  before(async () => {
    game = await setupGame(playerOne, playerTwo);
  });

  describe("Play a small size game", () => {
    const amount = 100000;
    
    // Player one propose his bet (100000).
    it("Propose a bet", async () => {
      const tx = await game.proposeBet(amount, { from: playerOne });
      truffleAssert.eventEmitted(tx, "BetProposal", (ev) => {
        return ev.player == playerOne && ev.amount == amount;
      });
      const proposedAmount = await game.betsQueue(playerOne);
      assert.equal(proposedAmount, amount);
    });


    // Player two agrees on the bet
    it("Other player agrees to the bet", async () => {
      const tx = await game.acceptBet({from: playerTwo});
      truffleAssert.eventEmitted(tx, "BetAgreed");
      const bet = await game.bet();
      assert.equal(bet, amount);
    });

    // Player one fund the right amount
    it("PlayerOne deposits funds", async () => {
      await game.betFunds({ from: playerOne, value: amount });

      const gameBalance = await web3.eth.getBalance(game.address);
      assert.equal(gameBalance, amount);
    });


    // Player two fund the right amount
    it("PlayerTwo deposits funds", async () => {
      const tx = await game.betFunds({ from: playerTwo, value: amount });

      const gameBalance = await web3.eth.getBalance(game.address);
      assert.equal(gameBalance, amount * 2);
      truffleAssert.eventEmitted(tx, "FundsDeposited");
    });

    // The two players commit their boards, we use the board index as low randomicity salts (only for testing)
    let p1_tree;
    let p2_tree;
    it("Players commit their board", async () => {
      const board = [];
      for (let i = 0; i < 4 * 4; i++) {
        board.push([i < 5, i, i]);
      }
      p1_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);

      await game.commitBoard(p1_tree.root, { from: playerOne });

      // same board, but different (weak) salts
      p2_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);
      const tx = await game.commitBoard(p2_tree.root, { from: playerTwo });
      truffleAssert.eventEmitted(tx, "BoardsCommitted");
    });

    // Player two forfaits
    it("PlayerTwo forfaits", async () => {
        const tx = await game.forfeit({from: playerTwo});
        truffleAssert.eventEmitted(tx, "Forfeit");
        });

    it("Winner (playerOne) withdraws its winnings", async () => {
        await game.withdraw({ from: playerOne });
        const balance = await web3.eth.getBalance(game.contract._address);
        assert.equal(balance, 0, "Balance should be zero");
    });
  });
});
