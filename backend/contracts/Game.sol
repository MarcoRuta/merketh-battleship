// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Game {
    // Field size, the game owner can choose to generate a normal or small (faster) match.
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
     * shotsTaken and shotsTakenMap maps the shots taken so far by the player.
     */
    struct Player {
        bool afk;
        bool hasPaid;
        bytes32 board;
        uint8 hits;
        Shot[] shotsTaken;
        mapping(uint8 => bool) shotsTakenMap;
    }

    // Addresses of the two Players.
    address public owner;
    address public adversary;

    // Mapping used to store all the information about the Players.
    mapping(address => Player) public players;

    // Queue of all the proposed bets.
    mapping(address => uint256) public betsQueue;

    // Final agreement on the bet amount.
    uint256 public bet;

    // Current turn.
    address public turn;

    // Winner of the game.
    address public winner;

    /*Different phases of the game
     * Waiting: game  successfully created and waiting for a second player to join.
     * Betting: waiting for the two players to reach an agreement on the bet.
     * Funding: waiting for the two player to deposit the bet amount.
     * Placement: waiting for the two players to commit their board.
     * Attack: the players shot a torpedo per turn .
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

    // Current game phase
    Phase public gamePhase;

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

    // A player is reported as AFK
    event PlayerAFK(address player);

    ///////////////
    ///MODIFIERS///
    ///////////////

    // Modifiers used to check if a function is called by a legit actor.
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

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

    modifier Fund() {
        require(players[msg.sender].hasPaid == true);
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

    // A player can be reported as AFK only during Placement and Attack phases.
    modifier afkAllowed() {
        require(
            gamePhase == Phase.Placement ||
                gamePhase == Phase.Attack ||
                gamePhase == Phase.Placement
        );
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
        require(adversary == address(0), "This game is not available!");
        adversary = _adversary;
        gamePhase = Phase.Betting;
    }

    /*Function used to propose a new bet*/
    function proposeBet(uint256 _amount) external onlyPlayer phaseBetting {
        betsQueue[msg.sender] = _amount;
        emit BetProposal(msg.sender, _amount);
    }

    /*Function used to accept the opponent bet propose.*/
    function acceptBet() external onlyPlayer phaseBetting {
        require(
            ((msg.sender == owner && betsQueue[adversary] != 0) ||
                (msg.sender == adversary && betsQueue[owner] != 0)),
            "The amount proposed is not valid!"
        );

        address opponent = msg.sender == owner ? adversary : owner;

        // Set the game bet and emit BetAgreed event.
        bet = betsQueue[opponent];
        emit BetAgreed(bet);
    }

    /*Function callable in Funding phase by a player that has not fund yet
    to deposit the bet amount.*/
    function betFunds() external payable onlyPlayer noFund phaseBetting {
        require(msg.value == bet);
        players[msg.sender].hasPaid = true;

        // If both have paid, move on to the next phase and emit FundDeposited event.
        if (players[owner].hasPaid && players[adversary].hasPaid) {
            emit FundsDeposited();
            gamePhase = Phase.Placement;
        }
    }

    /*Function that can be used to forfeit, the adversary automatically wins.
     * Can be called only if the player has fund his bet (after Funding phase)*/
    function forfeit() external onlyPlayer Fund {
        address opponent = msg.sender == owner ? adversary : owner;
        _declareWinner(opponent);
    }

    /*Function callable in Placement phase by a player to commit his board.*/
    function commitBoard(bytes32 _board) external onlyPlayer phasePlacement {
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

    /*Function callable to retrieve the shot of a target player.*/
    function getShotsTaken(
        address _player
    ) external view returns (Shot[] memory) {
        return players[_player].shotsTaken;
    }

    // Function used only for the first attack (it has not check phase).
    function attack(uint8 _index) external phaseAttack isPlayerTurn {
        _attack(_index);
    }

    /*Function that checks the result of the previous taken shot and perform an attack.
    this function allows to perform the check and the shot of two attacks in a single 
    transaction, the player first confirms the last shot taken by providing proof 
    of the target node and then fires a shot
    */
    function checkAndAttack(
        bool _isShip,
        uint256 _salt,
        uint8 _index,
        bytes32[] memory _proof,
        uint8 _attackIndex
    ) external phaseAttack isPlayerTurn {
        // Retrieving the last unconfirmed shot of the opponent.
        address opponent = msg.sender == owner ? adversary : owner;

        assert(
            players[opponent]
                .shotsTaken[players[opponent].shotsTaken.length - 1]
                .state == ShotState.Taken
        );
        require(
            players[opponent]
                .shotsTaken[players[opponent].shotsTaken.length - 1]
                .index == _index
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
                .shotsTaken[players[opponent].shotsTaken.length - 1]
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
                .shotsTaken[players[opponent].shotsTaken.length - 1]
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
    ) external phaseWinner onlyWinner {
        require(_cells.length == _salts.length);
        require(_cells.length == _indexes.length);
        address opponent = msg.sender == owner ? adversary : owner;
        uint8 ships = 0;

        // As first we verify the multiproof of all the leaves of the board.
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

        // Check that the required number of ships was placed.
        if (ships + players[opponent].hits == fleetSize) {
            _declareWinner(msg.sender);
        } else {
            // placement is invalid, player cheated!
            _declareWinner(opponent);
        }
    }

    // Function used to withdraw all the the balance of the contract.
    function withdraw() external phaseEnd onlyWinner {
        gamePhase = Phase.End;
        payable(msg.sender).transfer(address(this).balance);
    }

    /* Function used to report a player as AFK. Can be used only in placing,
    attacking e winner phase because in the other phases (Betting, End).
    If we are in betting there is no reward yet and if we are in the end
    phase we have no interest on the amount of time a player takes to withdraw.*/

    function reportAFK() external onlyPlayer afkAllowed {
        address opponent = msg.sender == owner ? adversary : owner;

        // Verify that the opponent has not been reported before.
        require(!players[opponent].afk);

        if (gamePhase == Phase.Placement) {
            // Check that the opponent has not committed the board yet.
            require(
                players[opponent].board == 0,
                "The game is waiting for your board! You can't report now."
            );
        }

        if (gamePhase == Phase.Attack) {
            // Check that is the opponent turn.
            require(turn == opponent, "It is your turn! You can't report now.");
        }

        emit PlayerAFK(opponent);
        players[opponent].afk = true;
        afk_timeout = block.number + 5;
    }

    /* Function used to verify if the opponent (previously reported as AFK) met the 
    condition to be declared as AFK.
    */
    function verifyAFK() external onlyPlayer afkAllowed {
        address opponent = msg.sender == owner ? adversary : owner;
        require(players[opponent].afk && block.number >= afk_timeout);
        _declareWinner(msg.sender);
    }

    ///////////////
    ////HELPERS////
    ///////////////

    function _attack(uint8 _index) internal {
        // Check if the cell is in range and was not shot before.
        require(
            players[msg.sender].shotsTakenMap[_index] == false,
            "You have already shot that cell"
        );
        require(
            _index < boardSize,
            "The shot is invalid for the current map size!"
        );

        // Set the shot as taken.
        players[msg.sender].shotsTakenMap[_index] = true;
        players[msg.sender].shotsTaken.push(Shot(_index, ShotState.Taken));

        // Emit a ShotTaken event.
        emit ShotTaken(msg.sender, _index);

        // Change the turn.
        turn = turn == owner ? adversary : owner;
    }

    /* Returns true if a leaf can be proved to be a part of a Merkle tree
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
