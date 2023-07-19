const GamesManager = artifacts.require("GamesManager");
const Game = artifacts.require("Game");
const truffleAssert = require("truffle-assertions");
const StandardMerkleTree = require("@openzeppelin/merkle-tree").StandardMerkleTree;
const fs = require("fs");
const file = "gas_analysis.json";
const data = {};

// Empty file in which we will save the gas amount.
fs.writeFileSync(file, JSON.stringify({}));

// Utility function that create and setup a new game.
const setupGame = async (playerOne, playerTwo) => {
  const gamesManager = await GamesManager.deployed();

  // Create  a normal size game.
  const tx_create = await gamesManager.createGame(false, {
    from: playerOne,
  });
  data.createGame = tx_create.receipt.gasUsed;
  let game;
  truffleAssert.eventEmitted(tx_create, "NewGame", (ev) => {
    game = ev.game;
    return ev.creator == playerOne;
  });

  // Register playerTwo.
  const tx_join = await gamesManager.joinGameByID(game, { from: playerTwo });
  truffleAssert.eventEmitted(tx_join, "JoinGame", (ev) => {
    return ev.game == game;
  });
  data.joinGamebyID = tx_join.receipt.gasUsed;

  // Return setupped game.
  return Game.at(game);
};

contract("Test GamesManager contract - joinRandomGame gas cost", (accounts) => {
  describe("Create a new game and join it given its ID", () => {
    const playerOne = accounts[0];
    const playerTwo = accounts[1];
    const playerThree = accounts[2];
    const playerFour = accounts[3];
    const playerFive = accounts[4];
    var game;

    // creating 3 small random games, 2 by playerOne and 1 by playerTwo.
    it("Create a random small games", async () => {
      await gamesManager.createGame(true,{ from: playerOne });
    });

    // playerTwo should be able to join.
    it("playerTwo joins a random game", async () => {
      const tx = await gamesManager.joinRandomGame({ from: playerTwo });
      truffleAssert.eventEmitted(tx, "JoinGame");
      data.joinRandomGame = tx.receipt.gasUsed;
    });

})
});

contract("Test Game contract - forfeit", (accounts) => {
  let game;
  const playerOne = accounts[0];
  const playerTwo = accounts[1];


  // Normal game setup
  before(async () => {
    game = await setupGame(playerOne, playerTwo);
  });


  describe("Play a normal size game", () => {
    const amount = 100000;
    
    // Player one propose his bet (100000).
    it("Propose a bet", async () => {
      const tx = await game.proposeBet(amount, { from: playerOne });
      truffleAssert.eventEmitted(tx, "BetProposal", async (ev) => {
        return ev.player == playerOne && ev.amount == amount;
        data.proposeBet = tx.receipt.gasUsed;
        const proposedAmount = await game.players[playerOne].bet;
        assert.equal(proposedAmount, amount);
      });
    });

    // Player two agrees on the bet
    it("Other player agrees to the bet", async () => {
      const tx = await game.acceptBet({ from: playerTwo });
      truffleAssert.eventEmitted(tx, "BetAgreed", (ev) => {
        return ev.amount == amount;
      });
      data.acceptBet = tx.receipt.gasUsed;
      const bet = await game.bet();
      assert.equal(bet, amount);
    });

    // Player one fund the right amount
    it("PlayerOne deposits funds", async () => {
      const tx = await game.betFunds({ from: playerOne, value: amount });
      const gameBalance = await web3.eth.getBalance(game.address);
      assert.equal(gameBalance, amount);
      data.depositFund = tx.receipt.gasUsed;
    });
    
    it("PlayerOne reports PlayerTwo as AFK", async () => {
      const tx = await game.reportAFK({ from: playerOne });
      truffleAssert.eventEmitted(tx, "PlayerAFK");
      data.reportAFK = tx.receipt.gasUsed;
    });

    it("Wait for three blocks", async () => {
      for (let i = 0; i < 3; i++)
        await gamesManager.createGame(false,{
          from: playerOne,
        });
    });

    it("Verify if PlayerTwo is actually AFK", async function () {  
      const tx = await game.verifyAFK();
      truffleAssert.eventNotEmitted(tx, "WinnerVerified");
      data.verifyAFK = tx.receipt.gasUsed;
    });

    // Player two fund the right amount
    it("PlayerTwo deposits funds", async () => {
      const tx = await game.betFunds({ from: playerTwo, value: amount });
      const gameBalance = await web3.eth.getBalance(game.address);
      assert.equal(gameBalance, amount * 2);
      data.depositFund = tx.receipt.gasUsed;
      truffleAssert.eventEmitted(tx, "FundsDeposited");
    });

    // The two players commit their boards, we use the board index as low randomicity salts (only for testing)
    let p1_tree;
    let p2_tree;
    it("Players commit their board", async () => {
      const board = [];
      // ships are placed in the last 10 cells
      for (let i = 0; i < 8 * 8; i++) {
        board.push([i > 53, i, i]);
      }
      p1_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);

      const tx1 = await game.commitBoard(p1_tree.root, { from: playerOne });
      data.commitBoard = tx1.receipt.gasUsed;

      // same board, but different (weak) salts
      p2_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);
      const tx2 = await game.commitBoard(p2_tree.root, { from: playerTwo });
      data.commitBoard2 = tx2.receipt.gasUsed;
      truffleAssert.eventEmitted(tx2, "BoardsCommitted");
    });

      // playerTwo forfeit.
      it("playerTwo forfeit", async () => {
        const tx = await game.forfeit({ from: playerTwo });
        truffleAssert.eventEmitted(tx, "WinnerVerified");
        data.forfeit = tx.receipt.gasUsed;
      });

    });
  });

contract("Test Game contract - max amount of gas (8x8 - 54 miss)", (accounts) => {
  let game;
  const playerOne = accounts[0];
  const playerTwo = accounts[1];


  // Normal game setup
  before(async () => {
    game = await setupGame(playerOne, playerTwo);
  });


  describe("Play a normal size game", () => {
    const amount = 100000;
    
    // Player one propose his bet (100000).
    it("Propose a bet", async () => {
      const tx = await game.proposeBet(amount, { from: playerOne });
      truffleAssert.eventEmitted(tx, "BetProposal", async (ev) => {
        return ev.player == playerOne && ev.amount == amount;
      });
      data.proposeBet = tx.receipt.gasUsed;
    });

    // Player two agrees on the bet
    it("Other player agrees to the bet", async () => {
      const tx = await game.acceptBet({ from: playerTwo });
      truffleAssert.eventEmitted(tx, "BetAgreed", (ev) => {
        return ev.amount == amount;
      });
      data.acceptBet = tx.receipt.gasUsed;
      const bet = await game.bet();
      assert.equal(bet, amount);
    });

    // Player one fund the right amount
    it("PlayerOne deposits funds", async () => {
      const tx = await game.betFunds({ from: playerOne, value: amount });
      const gameBalance = await web3.eth.getBalance(game.address);
      assert.equal(gameBalance, amount);
      data.depositFund = tx.receipt.gasUsed;
    });
    
    it("PlayerOne reports PlayerTwo as AFK", async () => {
      const tx = await game.reportAFK({ from: playerOne });
      truffleAssert.eventEmitted(tx, "PlayerAFK");
      data.reportAFK = tx.receipt.gasUsed;
    });

    it("Wait for three blocks", async () => {
      for (let i = 0; i < 3; i++)
        await gamesManager.createGame(false,{
          from: playerOne,
        });
    });

    it("Verify if PlayerTwo is actually AFK", async function () {  
      const tx = await game.verifyAFK();
      truffleAssert.eventNotEmitted(tx, "WinnerVerified");
      data.verifyAFK = tx.receipt.gasUsed;
    });

    // Player two fund the right amount
    it("PlayerTwo deposits funds", async () => {
      const tx = await game.betFunds({ from: playerTwo, value: amount });
      const gameBalance = await web3.eth.getBalance(game.address);
      assert.equal(gameBalance, amount * 2);
      data.depositFund = tx.receipt.gasUsed;
      truffleAssert.eventEmitted(tx, "FundsDeposited");
    });

    // The two players commit their boards, we use the board index as low randomicity salts (only for testing)
    let p1_tree;
    let p2_tree;
    it("Players commit their board", async () => {
      const board = [];
      // ships are placed in the last 10 cells
      for (let i = 0; i < 8 * 8; i++) {
        board.push([i > 53, i, i]);
      }
      p1_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);

      const tx1 = await game.commitBoard(p1_tree.root, { from: playerOne });
      data.commitBoard1 = tx1.receipt.gasUsed;

      // same board, but different (weak) salts
      p2_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);
      const tx2 = await game.commitBoard(p2_tree.root, { from: playerTwo });
      truffleAssert.eventEmitted(tx2, "BoardsCommitted");
    });

    // Attack and check phase
    it("Players shoot each other's boards", async () => {
        // The adversary takes the first shot
        let tx = await game.attack(0, { from: playerTwo });
        data.firstAttack = tx.receipt.gasUsed;
        truffleAssert.eventEmitted(tx, "ShotTaken");
        for (let i = 0; i < 64; i++) {
            // Generate proof
            value = p1_tree.values.find((v) => v.value[2] == i).value;
            proof = p1_tree.getProof(i);

            // Send proof and shoot in the same place as the other player
            tx = await game.counterattack(value[0], value[1], value[2], proof, i, {
            from: playerOne,
            });
            data.counterattack = tx.receipt.gasUsed;
            if (i == 63) break;

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
        const all = [...Array.from({ length: 8 * 8 }, (_, index) => index)];
        const { proof, proofFlags, leaves } = p2_tree.getMultiProof(all);
        const board = [];
        const salts = [];
        const indexes = [];
        leaves.forEach((e) => {
          board.push(e[0]);
          salts.push(e[1]);
          indexes.push(e[2]);
        });
  
        const tx2 = await game.checkWinnerBoard(
          proof,
          proofFlags,
          board,
          salts,
          indexes,
          {
            from: playerTwo,
          }
        );
        data.checkWinnerBoard = tx2.receipt.gasUsed;
        truffleAssert.eventEmitted(
            tx2,
          "WinnerVerified",
          (ev) => ev.player === playerTwo
        );
      });
  

      it("Winner (playerTwo) withdraws its winnings", async () => {
        const tx = await game.withdraw({ from: playerTwo });
        data.withdraw = tx.receipt.gasUsed;
        const balance = await web3.eth.getBalance(game.contract._address);
        assert.equal(balance, 0, "Balance should be zero");
      });

      it("Save data to file", () => {
        const prev = JSON.parse(fs.readFileSync(file));
        fs.writeFileSync(file, JSON.stringify({ ...data, ...prev }));
      });
    });
  });