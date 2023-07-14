import React, { useEffect, useState } from "react";
import {
  gameContractFromAddress,
  getWeb3Instance,
  loadBoardTree,
} from "../../utils";
import {
  Box,
  Typography,
  Container,
} from "@mui/material";
import { useAlert } from "../../contexts/AlertContext";
import { useEth } from "../../contexts/EthContext";
import {
  Form,
  useNavigate,
  useRouteLoaderData,
} from "react-router-dom";
import {
  CustomButton,
} from "./../customTheme";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

export const action = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const address = form.get("address");
  const contract = gameContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();
  const opponent = form.get("opponent");
  const tree = StandardMerkleTree.load(await loadBoardTree(), [
    "bool",
    "uint256",
    "uint8",
  ]);

  try {
    switch (intent) {
      case "validate":
        const shotsTaken = await contract.methods
          .getShotsTaken(opponent)
          .call();

        const size = Math.sqrt(await contract.methods.boardSize().call());
        console.log(size);

        const all = [
          ...Array.from({ length: size * size }, (_, index) => index),
        ];
        const { proof, proofFlags, leaves } = tree.getMultiProof(
          all.filter((i) => !shotsTaken.find((e) => parseInt(e.index) === i))
        );
        const board = [];
        const salts = [];
        const indexes = [];
        leaves.forEach((e) => {
          board.push(e[0]);
          salts.push(e[1]);
          indexes.push(e[2]);
        });

        await contract.methods
          .checkWinnerBoard(proof, proofFlags, board, salts, indexes)
          .send({
            from: accounts[0],
          });
        break;
        
      default:
        break;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};

export const End = () => {
  const {
    state: { accounts },
  } = useEth();
  const {
    game,
    data: { playerOne, playerTwo, winner, currentPhase },
  } = useRouteLoaderData("game");
  const setAlert = useAlert();
  const navigate = useNavigate();

  const opponent = playerOne === accounts[0] ? playerTwo : playerOne;


  useEffect(() => {
    const handleWinnerVerified = () => {
      navigate(`/game/${game._address}/withdraw`);
    };

    // Setup listener for BetProposal event with opponent filter
    const listener = game.events
      .WinnerVerified()
      .on("data", handleWinnerVerified);

    // Clean up the event listener when the component unmounts
    return () => {
      listener.unsubscribe();
    };
  }, [game]);


  const verifyView = () => (
    <>
      <Container
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="body1" color="primary" fontWeight="bold">
          The winner is: {winner}
        </Typography>
        <Box mt={5} />
        {accounts[0] !== winner ? (
          <Typography variant="body1" color="white" fontWeight="bold">
            Waiting for the opponent to validate his victory!
          </Typography>
        ) : (
          <Form method="post">
            <input type="hidden" name="address" value={game._address} />
            <input type="hidden" name="opponent" value={opponent} />
            <input type="hidden" name="intent" value="validate" />
            <CustomButton type="submit" className="btn btn-primary">
              Validate your board!
            </CustomButton>
          </Form>
        )}
      </Container>
    </>
  );

  return verifyView()

};
