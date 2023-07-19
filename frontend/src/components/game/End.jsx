import React, { useEffect } from "react";
import {
  gameContractFromAddress,
  getWeb3Instance,
  loadBoardTree,
} from "../../utils";
import { Box, Typography, Container } from "@mui/material";
import { useAlert } from "../../contexts/AlertContext";
import { useEth } from "../../contexts/EthContext";
import { Form, useNavigate, useRouteLoaderData } from "react-router-dom";
import { CustomButton } from "./../customTheme";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

export const action = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const address = form.get("address");
  const contract = gameContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();
  const tree = StandardMerkleTree.load(await loadBoardTree(), [
    "bool",
    "uint256",
    "uint8",
  ]);

  try {
    switch (intent) {
      case "validate":
        // Retrieve the board size
        const size = Math.sqrt(await contract.methods.boardSize().call());

        // Get value and proof for each leaf
        const all = [...Array.from({ length: size * size }, (_, index) => index)];
        const { proof, proofFlags, leaves } = tree.getMultiProof(all);
        const board = [];
        const salts = [];
        const indexes = [];
        leaves.forEach((e) => {
          board.push(e[0]);
          salts.push(e[1]);
          indexes.push(e[2]);
        });

        // Validate the board
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
    data: { winner, currentPhase },
  } = useRouteLoaderData("game");
  const {setAlert} = useAlert();
  const navigate = useNavigate();


  useEffect(() => {
    const handleWinnerVerified = () => {
      navigate(`/game/${game._address}/withdraw`);
    };

    const handlePlayerMove = (e) => {
      e.returnValues.player != accounts[0]
      ? setAlert("The opponent is not AFK!","warning")
      : setAlert("The opponent is accusing you of being AFK!","warning");
      navigate(`/game/${game._address}/end`);
    }

    // Setup listener for BetProposal event with opponent filter
    const listener1 = game.events
      .WinnerVerified()
      .on("data", handleWinnerVerified);

    const listener2 = game.events.PlayerAFK().on("data", (e) => {
      e.returnValues.player !== accounts[0]
        ? setAlert("Opponent has been reported as AFK.", "success")
        : setAlert("You have been reported as AFK.", "warning");
      navigate(`/game/${game._address}/end`);
    });

    const listener3 = game.events.PlayerMove().on("data",handlePlayerMove);



    // Clean up the event listener when the component unmounts
    return () => {
      listener1.unsubscribe();
      listener2.unsubscribe();
      listener3.unsubscribe();
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
            <input type="hidden" name="intent" value="validate" />
            <CustomButton type="submit" className="btn btn-primary">
              Validate your board!
            </CustomButton>
          </Form>
        )}
      </Container>
    </>
  );

  return verifyView();
};
