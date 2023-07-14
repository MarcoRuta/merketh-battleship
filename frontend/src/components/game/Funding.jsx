import { Form, useRouteLoaderData, useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import { gameContractFromAddress, getWeb3Instance } from "../../utils/utils";
import { useAlert } from "../../contexts/AlertContext";
import { useEth } from "../../contexts/EthContext";
import {
  CustomButton,
} from "./../../utils/CustomTheme.jsx";
import {
  Typography,
  Container,
} from "@mui/material";

export const action = async ({ request }) => {
  const form = await request.formData();
  const address = form.get("address");
  const agreedBetAmount = form.get("agreedBetAmount");
  const contract = gameContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();
  try {
    await contract.methods
      .betFunds()
      .send({ from: accounts[0], value: agreedBetAmount });
  } catch (err) {
    console.log(err);
  }
  return null;
};

export const Funding = () => {
  const {
    state: { accounts },
  } = useEth();
  const {
    game,
    data: { playerOne, playerTwo, hasPlayerOneFund, hasPlayerTwoFund, bet },
  } = useRouteLoaderData("game");

  const navigate = useNavigate();
  const {setAlert} = useAlert();



  useEffect(() => {
    const handleFunding = () => {
      setAlert("ETH funded!","success");
      navigate(`/game/${game._address}/placing`);
    };

    // Setup listener for BetProposal event with opponent filter
    const listener = game.events.FundsDeposited().on("data", handleFunding);

    // Clean up the event listener when the component unmounts
    return () => {
      listener.unsubscribe();
    };
  }, [game, navigate, hasPlayerOneFund, hasPlayerTwoFund, bet ]);

  return (
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
          Agreed bet:
        </Typography>
        <Typography variant="body1">{bet} wei</Typography>
        {(accounts[0] === playerOne && hasPlayerOneFund) ||
        (accounts[0] === playerTwo && hasPlayerTwoFund) ? (
          <Typography variant="body1" color="primary" fontWeight="bold">
            Waiting for opponent
          </Typography>
        ) : (
          <Form method="post">
            <input type="hidden" name="address" value={game._address} />
            <input type="hidden" name="agreedBetAmount" value={bet} />
            <CustomButton type="submit" className="btn btn-primary">
              Deposit funds
            </CustomButton>
          </Form>
        )}
      </Container>
    </>
  );
};
