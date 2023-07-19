import {
  Form,
  useRouteLoaderData,
  useLoaderData,
  useNavigate,
} from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAlert } from "../../contexts/AlertContext";
import { useEth } from "../../contexts/EthContext";
import { CustomButton, AttackingBoard, DefendingBoard } from "./../customTheme";
import {
  getWeb3Instance,
  gameContractFromAddress,
  indexToCoordinate,
  ShotType,
  loadBoardTree,
  loadBoard,
} from "./../../utils";
import { Typography, Box, Container } from "@mui/material";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

export const loader = async ({ params }) => {
  try {
    const board = await loadBoard();
    const game = gameContractFromAddress(params.address);
    const playerOne = await game.methods.owner().call();
    const playerTwo = await game.methods.adversary().call();
    const playerOneShots = await game.methods.getShotsTaken(playerOne).call();
    const playerTwoShots = await game.methods.getShotsTaken(playerTwo).call();

    return { board, data: { playerOneShots, playerTwoShots} };
  } catch (err) {
    console.log(err);
  }
};

export const action = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const address = form.get("address");
  const contract = gameContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();
  const pos = parseInt(form.get("attackIndex"));

  try {
    switch (intent) {
      case "counterattack":
        console.log("check and attack");
        const tree = StandardMerkleTree.load(await loadBoardTree());
        const checkPos = parseInt(form.get("checkIndex"));
        const value = tree.values.find((v) => v.value[2] === checkPos).value;
        const proof = tree.getProof(checkPos);

        await contract.methods
          .counterattack(value[0], value[1], value[2], proof, pos)
          .send({ from: accounts[0] });
        break;

      case "attack":
        console.log("attack");

        await contract.methods.attack(pos).send({ from: accounts[0] });
        break;

      default:
        break;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};

export const Attacking = () => {
  const {
    state: { accounts },
  } = useEth();
  const {
    game,
    data: { fleetSize, boardSize, playerTurn, playerOne, playerTwo },
  } = useRouteLoaderData("game");

  const {
    board,
    data: { playerOneShots, playerTwoShots },
  } = useLoaderData();

  const opponent = playerOne === accounts[0] ? playerTwo : playerOne;

  const playerShots =
    playerOne === accounts[0] ? playerOneShots : playerTwoShots;

  const opponentShots =
  playerOne === accounts[0] ? playerTwoShots : playerOneShots

  const navigate = useNavigate();
  const { setAlert } = useAlert();
  const size = Math.sqrt(boardSize);
  const canAttack = accounts[0] === playerTurn ? 1 : 0;

  // Define a state to store the index to shot
  const [shotIndex, setShotIndex] = useState([]);

  // Define a state to store the board state
  const [myBoardState, setMyBoardState] = useState([]);

  // Define a state to store the board state
  const [opponentBoardState, setOpponentBoardState] = useState([]);

  const shotToCheck =
    opponentShots.length > 0
      ? opponentShots.filter((e) => e.state === ShotType.Taken)[0]?.index || []
      : [];

  // Callback function to handle board state changes
  const handleShotIndexStateChange = (newIndex) => {
    setShotIndex(newIndex);
  };

  // Callback function to handle board state changes
  const handleMyBoardStateChange = (newBoardState) => {
    setMyBoardState(newBoardState);
  };

  // Callback function to handle board state changes
  const handleOpponentBoardStateChange = (newBoardState) => {
    setOpponentBoardState(newBoardState);
  };

  const handleTileClick = (index, state) => {
    console.log(index, state);
    if (state !== 4) {
      setAlert("You already shot that cell!", "error");
    } else {
      handleShotIndexStateChange(index);
    }
  };

  useEffect(() => {
    const handleShotTaken = () => {
      setAlert("The opponent took a shot!", "warning");
      navigate(`/game/${game._address}/attacking`);
    };

    const handlePlayerMove = (e) => {
      e.returnValues.player !== accounts[0]
      ? setAlert("The opponent is not AFK!","warning")
      : setAlert("The opponent is accusing you of being AFK!","warning");
      navigate(`/game/${game._address}/attacking`);
    }
    const listener1 = game.events
      .ShotTaken({ filter: { player: opponent } })
      .on("data", handleShotTaken);

    const listener2 = game.events.PlayerAFK().on("data", (e) => {
      console.log("PlayerAFK event emitted");
      e.returnValues.player !== accounts[0]
        ? setAlert("Opponent has been reported as AFK.", "success")
        : setAlert("You have been reported as AFK.", "warning");
      navigate(`/game/${game._address}/attacking`);
    });

    const listener3 = game.events.PlayerMove().on("data",handlePlayerMove);

    // Clean up the event listener when the component unmounts
    return () => {
      listener1.unsubscribe();
      listener2.unsubscribe();
      listener3.unsubscribe();
    };
  }, [playerTurn, navigate]);

  return (
    <>
      <Container
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 15,
        }}
      >
        <Container
          sx={{
            width: "500px",
            minHeight: "700px",
            paddingBottom: "64px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
          }}
        >
          {" "}
          <Typography variant="body1" color="primary" fontWeight="bold">
            MY BOARD
          </Typography>
          <DefendingBoard
            size={size}
            fleetSize={fleetSize}
            board={board}
            shots={opponentShots}
            onBoardStateChange={handleMyBoardStateChange}
          ></DefendingBoard>
        </Container>
        <div
          style={{
            borderLeft: "1px solid #5E57AA",
            width: "3px",
            background: "#5E57AA",
            height: "500px",
            margin: "0 10px",
          }}
        />
        <Container
          sx={{
            width: "400px",
            display: "flex",
            minHeight: "700px",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Typography variant="body1" color="primary" fontWeight="bold">
            OPPONENT
          </Typography>
          <AttackingBoard
            size={size}
            fleetSize={fleetSize}
            shots={playerShots}
            canAttack={canAttack}
            onTileClick={handleTileClick}
            onBoardStateChange={handleOpponentBoardStateChange}
          ></AttackingBoard>
        </Container>
        {playerTurn === accounts[0] ? (
          <Container
            sx={{
              width: "30%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0,
            }}
          >
            <Typography variant="body1" color="primary" fontWeight="bold">
            {indexToCoordinate(size,shotIndex)}
            </Typography>
            {opponentShots.length === 0 ? (
              <Form method="post">
                <input type="hidden" name="address" value={game._address} />
                <input type="hidden" name="intent" value="attack" />
                <input type="hidden" name="attackIndex" value={shotIndex} />
                <CustomButton variant="contained" color="primary">
                  shot
                </CustomButton>
              </Form>
            ) : (
              <Form method="post">
                <input type="hidden" name="address" value={game._address} />
                <input type="hidden" name="intent" value="counterattack" />
                <input type="hidden" name="attackIndex" value={shotIndex} />
                <input type="hidden" name="checkIndex" value={shotToCheck} />
                <CustomButton variant="contained" color="primary">
                  shot
                </CustomButton>
              </Form>
            )}
          </Container>
        ) : (
          <></>
        )}
      </Container>
    </>
  );
};
