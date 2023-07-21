// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./Game.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract GamesManager {

    using SafeMath for uint8;
    using SafeMath for uint256;

    // Maps Games that are joinable.
    mapping(Game => bool) private joinableGamesMap;

    // List of the joinable games.
    Game[] private joinableGames;

    // Mapping that keeps the index of the joinable games.
    mapping(Game => uint256) private joinableGamesIndexes;

    // Nonce used for gameID pseudo-random number generation.
    uint256 private nonce;

    ////////////
    ///EVENTS///
    ////////////

    // Event emitted when a new game is created.
    event NewGame(address indexed creator, Game game, bool small);

    // Event emitted when a player joins a game.
    event JoinGame(address indexed player, Game indexed game);

    // Event emitted when player fails to join a random game.
    event NoGame(address indexed player);

    // Event emittend when player tries to join a not valid game. 
    event GameNotValid(address indexed player);

    ///////////////
    ////PUBLIC/////
    ///FUNCTIONS///
    ///////////////

    // Function used to create a new game and select the size.
    function createGame(bool _small) external {
        // Create a new game
        Game newGame = new Game(msg.sender, _small);

        // Add the game to the joinable list.
        _addGame(newGame);

        // Emit event to inform client about the new game address.
        emit NewGame(msg.sender, newGame, _small);
    }

    // Function used to join a pre-existing game knowing the ID.
    function joinGameByID(Game _game) external {

        // If the game is not in the joinableGame list or the owner tries to double access.
        if (!joinableGamesMap[_game] || msg.sender == _game.owner()) {
            emit GameNotValid(msg.sender);
            return;
        }

        // Register the the second player.
        _game.matchJoin(msg.sender);

        // Delete the game from the joinable game list.
        _removeGame(_game);

        // Emit event to inform that the second player has joined the game.
        emit JoinGame(msg.sender, _game);
    }

    function joinRandomGame() external {

        if (joinableGames.length < 1) {
            emit NoGame(msg.sender);
            return;
        }

        // Generate a random index to access the joinable game list using the
        // blockhash of the previous block, the msg.sender address and the local nonce
        // that is incremented at each iteraction.
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(blockhash(block.number - 1), msg.sender, nonce)
            )
        ) % joinableGames.length;

        // Increment nonce.
        nonce++;

        // Iterating the list we select the first suitable game
        bool found = false;
        for (uint256 i = random; i < joinableGames.length; i++) {
            Game game = joinableGames[(i % joinableGames.length)];

            // Check if the condition is respected.
            if (game.owner() != msg.sender) {
                found = true;

                // Register the second player.
                game.matchJoin(msg.sender);

                // Remove game from the joinable game list.
                _removeGame(game);

                // Emit event to inform the sender about the game address.
                emit JoinGame(msg.sender, game);
                break;
            }
        }
        // If no game is found emit NoGame
        if (!found) emit NoGame(msg.sender);
    }

    /////////////
    ///HELPERS///
    /////////////

    // Removal of a game from the joinable game list.
    function _removeGame(Game _game) internal {
        assert(joinableGamesMap[_game] == true);
        delete joinableGamesMap[_game];

        // Get the game index.
        uint256 index = joinableGamesIndexes[_game];

        // Update the joinable games index list.
        if (joinableGames.length == 1 || index == joinableGames.length - 1) {
            joinableGames.pop();
        } else {
            // Put the index in the head and pop 
            joinableGames[index] = joinableGames[joinableGames.length - 1];
            joinableGames.pop();
            // Assign the index
            joinableGamesIndexes[joinableGames[index]] = index;
        }

        delete joinableGamesIndexes[_game];
    }

    // Add a game to the joinable game list.
    function _addGame(Game _game) internal {
        joinableGamesMap[_game] = true;
        joinableGames.push(_game);
        joinableGamesIndexes[_game] = joinableGames.length - 1;
    }
}
