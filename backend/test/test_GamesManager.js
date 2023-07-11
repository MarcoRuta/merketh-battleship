const GamesManager = artifacts.require("GamesManager");
const truffleAssert = require("truffle-assertions");


// Create a normal size and a small size games.
contract("Test game creation", (accounts) => {
  before(async () => {
    gamesManager = await GamesManager.deployed();
  });

  describe("Create a new normal size game and get its identifier", () => {
    it("Create a game", async () => {
      const playerOne = accounts[0];
      const tx = await gamesManager.createGame(false, {
        from: playerOne,
      });
      truffleAssert.eventEmitted(tx, "NewGame", (ev) => {
        return ev.creator == playerOne && ev.small == false;
      });
    });
  });

  describe("Create a new small size game and get its identifier", () => {
    it("Create a game", async () => {
      const playerOne = accounts[0];
      const tx = await gamesManager.createGame(true, {
        from: playerOne,
      });
      truffleAssert.eventEmitted(tx, "NewGame", (ev) => {
        return ev.creator == playerOne && ev.small == true;
      });
    });
  });
  
});


// Join a pre-existing game.
contract("Test the join by ID functionality", (accounts) => {
  describe("Create a new game and join it by ID", () => {
    const playerOne = accounts[0];
    const playerTwo = accounts[1];
    var game;
    it("Create a normal game", async () => {
      const tx = await gamesManager.createGame(false, {
        from: playerOne,
      });
      truffleAssert.eventEmitted(tx, "NewGame", (ev) => {
        game = ev.game;
        return ev.creator == playerOne && ev.small == false;
      });
    });

    it("Trying to double join", async () => {
      const tx = await gamesManager.joinGameByID(game, { from: playerOne });
      truffleAssert.eventEmitted(tx, "GameNotValid");
    });

    it("Join the game", async () => {
      const tx = await gamesManager.joinGameByID(game, { from: playerTwo });
      truffleAssert.eventEmitted(tx, "JoinGame", (ev) => {
        return ev.game == game;
      });
    });

    it("Game is full", async () => {
      const tx = await gamesManager.joinGameByID(game, { from: accounts[2] });
      truffleAssert.eventEmitted(tx, "GameNotValid");
    });
  });
});

contract("Test the random join functionality", (accounts) => {
  describe("Create a new game and join it given its ID", () => {
    const playerOne = accounts[0];
    const playerTwo = accounts[1];
    const playerThree = accounts[2];
    const playerFour = accounts[3];
    const playerFive = accounts[4];
    var game;

    // creating 3 small random games, 2 by playerOne and 1 by playerTwo.
    it("Create some random small games", async () => {
      await gamesManager.createGame(true,{ from: playerOne });
      await gamesManager.createGame(true,{ from: playerOne });
      await gamesManager.createGame(true,{ from: playerOne });
    });

    // check if the owner can double join a match.
    it("playerOne cannot join", async () => {
      const tx = await gamesManager.joinRandomGame({ from: playerOne });
      truffleAssert.eventEmitted(tx, "NoGame");
    });

    // playerTwo should be able to join.
    it("playerTwo joins a random game", async () => {
      const tx = await gamesManager.joinRandomGame({ from: playerTwo });
      truffleAssert.eventEmitted(tx, "JoinGame");
    });

    // playerThree should be able to join.
    it("playerThree joins a random game", async () => {
      const tx = await gamesManager.joinRandomGame({ from: playerThree });
      truffleAssert.eventEmitted(tx, "JoinGame");
    });

    // playerFour should be able to join.
    it("playerFour joins a random game", async () => {
      const tx = await gamesManager.joinRandomGame({ from: playerFour });
      truffleAssert.eventEmitted(tx, "JoinGame");
    });

    // playerFive should find no available match.
    it("playerFive find no available match", async () => {
      const tx = await gamesManager.joinRandomGame({ from: playerFive });
      truffleAssert.eventEmitted(tx, "NoGame");
    });


  });
});
