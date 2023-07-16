import React, { useEffect, useState } from "react";
import {
  gameContractFromAddress,
  getWeb3Instance,
  loadBoardTree,
} from "../../utils";
import { Box, Typography, Container } from "@mui/material";
import { useAlert } from "../../contexts/AlertContext";
import { useEth } from "../../contexts/EthContext";
import { Form, useRouteLoaderData, useActionData } from "react-router-dom";
import { CustomButton } from "./../customTheme";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

export const action = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const address = form.get("address");
  const contract = gameContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();

  try {
    switch (intent) {
      case "withdraw":
        await contract.methods.withdraw().send({
          from: accounts[0],
        });
        return 1;
        break;
      default:
        return 0;
        break;
    }
  } catch (err) {
    console.log(err);
    return 0;
  }
  return null;
};

export const Withdraw = () => {
  const {
    state: { accounts },
  } = useEth();
  const {
    game,
    data: { playerOne, playerTwo, winner, currentPhase },
  } = useRouteLoaderData("game");
  const setAlert = useAlert();
  const withdrawSuccess = useActionData();

  const withdrawView = () => (
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
            Winner verified! The game ended and you lost!
          </Typography>
        ) : (
          <>
            {" "}
            <Typography variant="h3" color="primary" fontWeight="bold">
              Congrats!
            </Typography>
            <Form method="post">
              <input type="hidden" name="address" value={game._address} />
              <input type="hidden" name="intent" value="withdraw" />
              <CustomButton type="submit" className="btn btn-primary">
                Withdraw
              </CustomButton>
            </Form>
          </>
        )}
      </Container>
    </>
  );

  const end = () => (
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
            Winner verified! The game ended and you lost!
          </Typography>
        ) : (
          <>
            {" "}
            <Typography variant="h3" color="primary" fontWeight="bold">
              Congrats!
            </Typography>
          </>
        )}
      </Container>
    </>
  );

  return !withdrawSuccess ? withdrawView() : end();
};
