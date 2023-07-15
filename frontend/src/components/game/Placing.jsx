import { Form, useRouteLoaderData, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAlert } from "../../contexts/AlertContext";
import { useEth } from "../../contexts/EthContext";
import { CustomButton, PlacingBoard } from "./../customTheme";
import {
  getWeb3Instance,
  gameContractFromAddress,
  rndNonce,
  saveBoard,
  saveBoardTree,
} from "./../../utils";
import { Typography, Container } from "@mui/material";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

export const action = async ({ request }) => {
  const form = await request.formData();
  const address = form.get("address");
  const boardState = form.get("boardState");
  const contract = gameContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();

  const filteredBoardState = boardState
    .split(",")
    .filter((value) => value !== "");

  // Retrieve the board values and prepare the tree leaves
  const leafValues = [];
  for (let i = 0; i < filteredBoardState.length; i++) {
    const tileValue = filteredBoardState[i];
    leafValues.push([parseInt(tileValue), rndNonce(), i]);
  }

  // Merkle tree of the board
  const tree = StandardMerkleTree.of(leafValues, ["bool", "uint256", "uint8"]);
  const root = tree.root;

  // Store the tree and the root in the local storage
  await saveBoard(leafValues);
  await saveBoardTree(tree.dump());

  try {
    await contract.methods.commitBoard(root).send({ from: accounts[0] });
  } catch (err) {
    console.log(err);
  }

  return null;
};

export const Placing = () => {
  const {
    state: { accounts },
  } = useEth();
  const {
    game,
    data: {
      fleetSize,
      boardSize,
      playerOne,
      playerTwo,
      playerOneBoard,
      playerTwoBoard,
    },
  } = useRouteLoaderData("game");

  const myBoard = accounts[0] === playerOne ? playerOneBoard : playerTwoBoard;
  const navigate = useNavigate();
  const { setAlert } = useAlert();
  const size = Math.sqrt(boardSize);

  useEffect(() => {
    const handleBoardCommitted = () => {
      navigate(`/game/${game._address}/attacking`);
      setAlert("Boards committed!", "success");
    };

    // Setup listener for BetProposal event with opponent filter
    const listener1 = game.events
      .BoardsCommitted()
      .on("data", handleBoardCommitted);

    const listener2 = game.events.PlayerAFK().on("data", (e) => {
      console.log("PlayerAFK event emitted");
      e.returnValues.player !== accounts[0]
        ? setAlert("Opponent has been reported as AFK.", "success")
        : setAlert("You have been reported as AFK.", "warning");
        navigate(`/game/${game._address}/placing`);
    });
    // Clean up the event listener when the component unmounts
    return () => {
      listener1.unsubscribe();
      listener2.unsubscribe();
    };
  }, [game, navigate]);

  // Define a state to store the board state
  const [boardState, setBoardState] = useState([]);

  // Callback function to handle board state changes
  const handleBoardStateChange = (newBoardState) => {
    setBoardState(newBoardState);
  };

  return (
    <>
      <Container
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
      >
        <PlacingBoard
          size={size}
          fleetSize={fleetSize}
          onBoardStateChange={handleBoardStateChange}
        ></PlacingBoard>
        <Container
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
          }}
        >
          {myBoard !==
          "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
            <Typography variant="h7" color="primary" fontWeight="bold">
              Waiting for the opponent
            </Typography>
          ) : boardState.flat().filter((value) => value === 1).length ===
            parseInt(fleetSize) ? (
            <Form method="post">
              <input type="hidden" name="address" value={game._address} />
              <input type="hidden" name="boardState" value={boardState} />
              <CustomButton type="submit" className="btn btn-primary">
                Commit board
              </CustomButton>
            </Form>
          ) : (
            <Typography variant="h7" color="white" fontWeight="bold">
              You must place your entire fleet on the board!
            </Typography>
          )}
        </Container>
      </Container>
    </>
  );
};
