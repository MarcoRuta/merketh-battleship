// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Game {

    using SafeMath for uint8;
    using SafeMath for uint256;

    // Field size, the game owner can choose to generate a normal or a  small (faster) match.
    uint8 public constant BOARD_Small = 4 * 4;
    uint8 public constant BOARD_Normal = 8 * 8;

    // Fleet size, it is proportional to the game size.
    uint8 public constant FLEET_Small = 5;
    uint8 public constant FLEET_Normal = 10;

    // Is the block number after which the player can be considered AFK.
    uint public afk_timeout;

    // Actual size of the game.
    uint8 public boardSize;
    uint8 public fleetSize;

    /*
     * Different shot state:
     * Taken represent a shot which result is still not checked.
     * Hit represent a shot that has hit a ship.
     * Miss represent a shot that missed.
     */
    enum ShotState {
        Taken,
        Hit,
        Miss
    }

    /*
     * Shot structure:
     * index represent the position on the board.
     * state is the ShotState.
     */
    struct Shot {
        uint8 index;
        ShotState state;
    }

    /*
     * afk is a boolean value that represent if the player is reported as afk.
     * Player structure:
     * hasPaid represent if the player has funded.
     * board is the merkle tree root of the merkle tree representing the board.
     * hits is the number of ship the player has hit.
     * shots is a list of the shots the player taken so far.
     * shotsMap is a mapping index boolean that represent the shots taken.
     */
    struct Player {
        bool afk;
        uint256 bet;
        bool hasPaid;
        bytes32 board;
        uint8 hits;
        Shot[] shots;
        mapping(uint8 => bool) shotsMap;
    }

    /*Different phases of the game
     * Waiting: game  successfully created and waiting for a second player to join.
     * Betting: waiting for the two players to reach an agreement on the bet.
     * Placement: waiting for the two players to commit their board.
     * Attack: the players shot a torpedo per turn.
     * Winner: one of the player has hit all the opponent ships and is declared as winner.
     * End: the game is terminated and the winner can withdraw the amount he has won.
     */
    enum Phase {
        Waiting,
        Betting,
        Placement,
        Attack,
        Winner,
        End
    }

    // Addresses of the two Players.
    address public owner;
    address public adversary;

    // Mapping used to store all the information about the Players.
    mapping(address => Player) public players;

    // Final agreement on the bet amount.
    uint256 public bet;

    // Current turn.
    address public turn;

    // Current game phase
    Phase public gamePhase;

    // Winner of the game.
    address public winner;

    ////////////
    ///EVENTS///
    ////////////

    // Emitted when a player propos an amount as bet.
    event BetProposal(address indexed player, uint256 amount);

    // Emitted when players have agreed on the bet.
    event BetAgreed(uint256 amount);

    // Emitted when both players have deposited the agreed amount.
    event FundsDeposited();

    // Emitted when both players have committed their boards.
    event BoardsCommitted();

    // Informs the opponent that cell indexed by `cell` has been shot.
    event ShotTaken(address indexed player, uint8 cell);

    // Informs that the game has a winner.
    event Winner(address player);

    // Winner board has been correctly verified.
    event WinnerVerified(address player);

    // A player is reported as AFK.
    event PlayerAFK(address player);

    // A player made a move -> no more AFK.
    event PlayerMove(address player);

    ///////////////
    ///MODIFIERS///
    ///////////////

    // Modifiers used to check if a function is called by a legit actor.

    modifier onlyPlayer() {
        require(msg.sender == owner || msg.sender == adversary);
        _;
    }

    modifier onlyWinner() {
        require(msg.sender == winner);
        _;
    }

    modifier isPlayerTurn() {
        require(msg.sender == turn);
        _;
    }

    modifier noFund() {
        require(players[msg.sender].hasPaid != true);
        _;
    }

    // Modifiers used to check if a function is called in a legit game phase.
    modifier phaseWaiting() {
        require(gamePhase == Phase.Waiting);
        _;
    }

    modifier phaseBetting() {
        require(gamePhase == Phase.Betting);
        _;
    }

    modifier phasePlacement() {
        require(gamePhase == Phase.Placement);
        _;
    }

    modifier phaseAttack() {
        require(gamePhase == Phase.Attack);
        _;
    }

    modifier phaseWinner() {
        require(gamePhase == Phase.Winner);
        _;
    }

    modifier phaseEnd() {
        require(gamePhase == Phase.End);
        _;
    }

    // A player can be reported as AFK:
    // -> in betting phase if he has not funded yet
    // -> in placement phase if he has not committed his board yet
    // -> in attack phase if is his turn
    // -> in winner phase if he is the winner
    // -> In this way the AFK report are allowed only when the opponent can take a move
    // -> and the report is legit.
    // -> In waiting and End phase the players have no interest in reporting AFK because
    // -> the contract has no balance.
    modifier afkAllowed() {
        address opponent = msg.sender == owner ? adversary : owner;
        require(
            (gamePhase == Phase.Betting &&
                players[opponent].hasPaid == false) ||
                (gamePhase == Phase.Placement &&
                    players[opponent].board == 0) ||
                (gamePhase == Phase.Attack && turn == opponent) ||
                (gamePhase == Phase.Winner && winner == opponent)
        );
        _;
    }

    // This modifier is applied on all the method that can be performed by a player reported
    // as AFK. If the action is performed before the timeout the AFK status is removed, otherwise
    // the AFK status is verified and the opponent wins.
    modifier stillAFK(){
            if (players[msg.sender].afk) {
            // The player has done an action before the timeout -> No more AFK
            if (block.number < afk_timeout) {
                players[msg.sender].afk = false;
            } else if (block.number >= afk_timeout) {
                // The action made a move after the timeout -> AFK verified
                _declareWinner(msg.sender == owner ? adversary : owner);
                return;
            }
        }
        _;
    }

    ///////////////
    ////PUBLIC/////
    ///FUNCTIONS///
    ///////////////

    /*Constructor, used to initialize a game*/
    constructor(address _owner, bool _small) {
        owner = _owner;
        // Initialize the board and fleet size
        _small ? boardSize = BOARD_Small : boardSize = BOARD_Normal;
        _small ? fleetSize = FLEET_Small : fleetSize = FLEET_Normal;
        gamePhase = Phase.Waiting;
    }

    /*Function used to register a player as adversary.*/
    function matchJoin(address _adversary) external phaseWaiting {
        require(adversary == address(0));
        adversary = _adversary;
        gamePhase = Phase.Betting;
    }

    /*Function used to propose a new bet*/
    function proposeBet (
        uint256 _amount
    ) external onlyPlayer noFund stillAFK phaseBetting {
        players[msg.sender].bet = _amount;
        emit BetProposal(msg.sender, players[msg.sender].bet);
    }

    /*Function used to accept the opponent bet propose.*/
    function acceptBet() external onlyPlayer noFund stillAFK phaseBetting {
        address opponent = msg.sender == owner ? adversary : owner;

        require(
            (players[opponent].bet != 0));

        // Set the game bet and emit BetAgreed event.
        bet = players[opponent].bet;
        players[opponent].bet = bet;
        emit BetAgreed(bet);
    }

    /*Function callable in Funding phase by a player that has not fund yet
    to deposit the bet amount.*/
    function betFunds() external payable onlyPlayer noFund stillAFK phaseBetting {
        require(msg.value == bet);
        players[msg.sender].hasPaid = true;

        // If both have paid, move on to the next phase and emit FundDeposited event.
        if (players[owner].hasPaid && players[adversary].hasPaid) {
            emit FundsDeposited();
            gamePhase = Phase.Placement;
        }
    }

    /*Function that can be used to forfeit, the adversary automatically wins*/
    function forfeit() external onlyPlayer{
        _declareWinner(msg.sender == owner ? adversary : owner);
    }

    /*Function callable in Placement phase by a player to commit his board.*/
    function commitBoard(bytes32 _board) external onlyPlayer stillAFK phasePlacement {
        require(players[msg.sender].board == 0);
        players[msg.sender].board = _board;

        // If both have committed their board move on and emit BoardsCommitted event.
        if (players[owner].board != 0 && players[adversary].board != 0) {
            players[owner].hits = 0;
            gamePhase = Phase.Attack;
            emit BoardsCommitted();
            //The first shot is for the adversary.
            turn = adversary;
        }
    }

    /*Function callable to retrieve the shot of a target player*/
    function getShotsTaken(
        address _player
    ) external view returns (Shot[] memory) {
        return players[_player].shots;
    }

    // Function used only for the first attack (it has not check phase).
    function attack(uint8 _index) external phaseAttack stillAFK isPlayerTurn {
        _attack(_index);
    }

    /*Function that checks the result of the previous taken shot and perform an attack.
    this function allows to perform the check and the shot of two attacks in a single 
    transaction, the player first confirms the last shot taken by providing proof 
    of the target node and then fires a shot
    */
    function counterattack(
        bool _isShip,
        uint256 _salt,
        uint8 _index,
        bytes32[] memory _proof,
        uint8 _attackIndex
    ) external phaseAttack stillAFK isPlayerTurn {
        // Retrieving the last unconfirmed shot of the opponent.
        address opponent = msg.sender == owner ? adversary : owner;

        assert(
            players[opponent].shots[players[opponent].shots.length - 1].state ==
                ShotState.Taken
        );
        require(
            players[opponent].shots[players[opponent].shots.length - 1].index ==
                _index
        );

        // check the proof for the node
        if (
            !_checkProof(
                _isShip,
                _salt,
                _index,
                _proof,
                players[msg.sender].board
            )
        ) {
            //If the player tried to cheat the result the opponent wins.
            _declareWinner(opponent);
            return;
        }

        //If the player hit a ship
        if (_isShip) {
            //Update the shot state and the opponent hits.
            players[opponent]
                .shots[players[opponent].shots.length - 1]
                .state = ShotState.Hit;
            players[msg.sender].hits++;

            // If the opponent has hit all of our ships he wins.
            if (players[msg.sender].hits == fleetSize) {
                // Move on to the next phase and emit Winner event.
                winner = opponent;
                gamePhase = Phase.Winner;
                emit Winner(opponent);
                return;
            }
        } else {
            players[opponent]
                .shots[players[opponent].shots.length - 1]
                .state = ShotState.Miss;
        }

        //Perform the attack on the board.
        _attack(_attackIndex);
    }

    /*Function that checks the validity of the winner board.*/
    function checkWinnerBoard(
        bytes32[] memory _proof,
        bool[] memory _proofFlags,
        bool[] memory _cells,
        uint256[] memory _salts,
        uint8[] memory _indexes
    ) external phaseWinner stillAFK onlyWinner {
        //Check if the number of values for the leaves are consistent
        require(_cells.length == _salts.length);
        require(_cells.length == _indexes.length);

        address opponent = msg.sender == owner ? adversary : owner;

        // Int used to store the remaining ships number on the board
        uint8 ships = 0;

        // Array used to verify if the player tries to re-use an index
        bool[] memory usedIndexes = new bool[](boardSize);

        // Initialized to false
        for (uint256 i = 0; i < boardSize; i++) {
            usedIndexes[i] = false;
        }

        // As first we verify the multiproof for each leaf
        if (
            !_checkMultiProof(
                _proof,
                _proofFlags,
                _cells,
                _salts,
                _indexes,
                players[msg.sender].board
            )
        ) {
            _declareWinner(opponent);
            return;
        }

        // Iterate over the provided cells
        for (uint i = 0; i < _cells.length; i++) {
            // Check if the index falls in the board dimension
            if (_indexes[i] >= boardSize) {
                _declareWinner(opponent);
                return;
            }

            // Check if the player tried to re-use an index
            if (usedIndexes[_indexes[i]]) {
                _declareWinner(opponent);
            }

            // Set the index as used
            usedIndexes[_indexes[i]] = true;

            if (_cells[i]) {
                ships++;
            }
        }

        // Check that the player has placed the correct number and types of ships.
        // If we want to implement custom ship sizes (e.g. carrier = 3x1), we can add
        // a _checkFunction that verifies certain rules are respected for the cells confirmed
        // by the multiProof. One approach could be to store not only the isShip value in
        // the leaf, but also an integer identifier for each ship type (e.g., carrier = 1)
        // and its orientation (H, L). This would allow us to validate whether the
        // ships are correctly placed on the board. However, implementing this would increase
        // the complexity of the Merkle proof. My choice is to use 1x1 ships that can be placed
        // with flexibility on the board, in this way only a boolean value is needed for each leaf.
        if (ships == fleetSize) {
            _declareWinner(msg.sender);
        } else {
            // If he placed an invalid amount of ships he cheated.
            _declareWinner(opponent);
        }
    }

    // Function used to withdraw all the the balance of the contract.
    function withdraw() external phaseEnd onlyWinner {
        gamePhase = Phase.End;
        payable(msg.sender).transfer(address(this).balance);
    }

    /* Function used to report a player as AFK. 
    // The AfkAllowed modifier force the method to be used only when the opponent can take 
    // on of this move: (Fund ETH, Commit Board, Attack, Verify Board)
    */

    function reportAFK() external onlyPlayer afkAllowed {
        address opponent = msg.sender == owner ? adversary : owner;

        // Verify that the opponent has not been reported before.
        require(!players[opponent].afk);

        emit PlayerAFK(opponent);

        // Player is set as AFK and the timeout is set to 5 blocks.
        players[opponent].afk = true;
        afk_timeout = block.number + 5;
    }

    /* Function used to verify if a player (previously reported as AFK) is still AFK.
    // If the player made no move in the 5 block timeout the opponent wins the game.
    // If the player took a move before the 5 block timeout he is set as not AFK to avoid
    // spam of the verifyAFK method by the opponent.
    */
    function verifyAFK() external onlyPlayer afkAllowed {
        address opponent = msg.sender == owner ? adversary : owner;

        if (players[opponent].afk && block.number >= afk_timeout) {
            _declareWinner(msg.sender);
        } else {
            players[opponent].afk = false;
            emit PlayerMove(opponent);
        }
    }

    ///////////////
    ////HELPERS////
    ///////////////

    function _attack(uint8 _index) internal {
        // Check if the cell is in range and was not shot before.
        require(
            players[msg.sender].shotsMap[_index] == false);
        require(_index < boardSize);

        // Set the shot as taken.
        players[msg.sender].shotsMap[_index] = true;
        players[msg.sender].shots.push(Shot(_index, ShotState.Taken));

        // Change the turn.
        turn = turn == owner ? adversary : owner;

        // Emit a ShotTaken event.
        emit ShotTaken(msg.sender, _index);
    }

    /* Returns true if the leaf can be proved to be a part of the Merkle tree
     defined by root. 
     */
    function _checkProof(
        bool _isShip,
        uint256 _salt,
        uint8 _index,
        bytes32[] memory _proof,
        bytes32 _root
    ) internal pure returns (bool) {
        // Encode the leaf.
        bytes32 leaf = _encodeLeaf(_isShip, _salt, _index);
        // Verify the MerkleProof.
        return MerkleProof.verify(_proof, _root, leaf);
    }

    /* Returns true if the leaves can be simultaneously proven to be a part of a merkle tree defined by
     root. To perform multiproof the tree is traversed up from the leaves and this function should help in
     saving some gas w.r.t. using MerkleProof.verify() for each single node.
     */
    function _checkMultiProof(
        bytes32[] memory _proof,
        bool[] memory _proofFlags,
        bool[] memory _cells,
        uint256[] memory _salts,
        uint8[] memory _indexes,
        bytes32 _root
    ) internal pure returns (bool) {
        // Encode each leaf
        bytes32[] memory leaves = new bytes32[](_cells.length);
        for (uint i = 0; i < _cells.length; i++) {
            leaves[i] = _encodeLeaf(_cells[i], _salts[i], _indexes[i]);
        }
        // Verify the multiProof on all the leaves.
        return MerkleProof.multiProofVerify(_proof, _proofFlags, _root, leaves);
    }

    /*Hashes and encodes the leaf parameters into a 32-byte value.*/
    function _encodeLeaf(
        bool _isShip,
        uint256 _salt,
        uint8 _index
    ) internal pure returns (bytes32) {
        return
            keccak256(
                bytes.concat(keccak256(abi.encode(_isShip, _salt, _index)))
            );
    }

    /*Set the game winner, set the gamePhase and emit WinnerVerified event*/
    function _declareWinner(address player) internal {
        emit WinnerVerified(player);
        winner = player;
        gamePhase = Phase.End;
    }
}
