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


contract("Test Game contract", (accounts) => {
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
      truffleAssert.eventEmitted(tx, "BetProposal", async (ev) => {
        return ev.player == playerOne && ev.amount == amount;
        const proposedAmount = await game.players[accounts[0]].bet;
        assert.equal(proposedAmount, amount);
      });
    });


    // Player two agrees on the bet
    it("Other player agrees to the bet", async () => {
      const tx = await game.acceptBet({ from: playerTwo });
      truffleAssert.eventEmitted(tx, "BetAgreed", (ev) => {
        return ev.amount == amount;
      });
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

    // Attack and check phase
    it("Players shoot each other's boards", async () => {
        // The adversary takes the first shot
        let tx = await game.attack(0, { from: playerTwo });
        truffleAssert.eventEmitted(tx, "ShotTaken");
        for (let i = 0; i < 5; i++) {
            // Generate proof
            value = p1_tree.values.find((v) => v.value[2] == i).value;
            proof = p1_tree.getProof(i);

            // Send proof and shoot in the same place as the other player
            tx = await game.counterattack(value[0], value[1], value[2], proof, i, {
            from: playerOne,
            });
            if (i == 4) break;

            // Generate proof
            value = p2_tree.values.find((v) => v.value[2] == i).value;
            proof = p2_tree.getProof(i);
            where = 1;
            tx = await game.counterattack(
            value[0],
            value[1],
            value[2],
            proof,
            i+1,
            {
                from: playerTwo,
            }
            );

            truffleAssert.eventEmitted(tx, "ShotTaken");
        }
    truffleAssert.eventNotEmitted(tx, "ShotTaken");
    truffleAssert.eventEmitted(tx, "Winner", (e) => e.player === playerTwo);
    });
    it("Winner (playerTwo) sends its board for verification", async () => {
        // For each index in board get value and proof
        const all = [...Array.from({ length: 4 * 4 }, (_, index) => index)];
        const { proof, proofFlags, leaves } = p2_tree.getMultiProof(all);
        const board = [];
        const salts = [];
        const indexes = [];
        leaves.forEach((e) => {
          board.push(e[0]);
          salts.push(e[1]);
          indexes.push(e[2]);
        });
  
        const tx = await game.checkWinnerBoard(
          proof,
          proofFlags,
          board,
          salts,
          indexes,
          {
            from: playerTwo,
          }
        );
        truffleAssert.eventEmitted(
          tx,
          "WinnerVerified",
          (ev) => ev.player === playerTwo
        );
      });
  
      it("Winner (playerTwo) withdraws its winnings", async () => {
        await game.withdraw({ from: playerTwo });
        const balance = await web3.eth.getBalance(game.contract._address);
        assert.equal(balance, 0, "Balance should be zero");
      });
    });
  });
  