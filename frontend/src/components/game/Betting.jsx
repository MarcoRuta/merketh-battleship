import React, { useEffect } from "react";
import { gameContractFromAddress, getWeb3Instance } from "../../utils";
import {
  Box,
  Typography,
  Container,
  IconButton,
  FormControl,
} from "@mui/material";
import { useAlert } from "../../contexts/AlertContext";
import { useEth } from "../../contexts/EthContext";
import {
  Form,
  useRouteLoaderData,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { CustomButton, CustomTextField } from "./../customTheme";
import { Send as SendIcon } from "@mui/icons-material";

export const action = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const address = form.get("address");
  const agreedBetAmount = form.get("agreedBetAmount");
  const contract = gameContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();
  try {
    switch (intent) {
      case "acceptBet":
        await contract.methods.acceptBet().send({ from: accounts[0] });
        break;
      case "proposeBet":
        await contract.methods
          .proposeBet(form.get("betAmount"))
          .send({ from: accounts[0] });
        break;
      case "funding":
        await contract.methods
          .betFunds()
          .send({ from: accounts[0], value: agreedBetAmount });
        break;
      default:
        break;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};

export const Betting = () => {
  const {
    state: { accounts },
  } = useEth();
  const {
    game,
    data: {
      playerOne,
      playerTwo,
      playerOneBet,
      playerTwoBet,
      hasPlayerOneFund,
      hasPlayerTwoFund,
      bet,
    },
  } = useRouteLoaderData("game");
  const navigate = useNavigate();
  const location = useLocation();
  const { setAlert } = useAlert();

  const opponent = playerOne === accounts[0] ? playerTwo : playerOne;
  const opponentBet = playerOne === accounts[0] ? playerTwoBet : playerOneBet;
  const yourBet = playerOne === accounts[0] ? playerOneBet : playerTwoBet;

  useEffect(() => {
    const handleFunding = () => {
      setAlert("ETH funded!", "success");
      navigate(`/game/${game._address}/placing`);
    };

    const handleBetProposal = () => {
      setAlert("The opponent proposed a bet", "warning");
      navigate(`/game/${game._address}/bet`);
    };

    // Setup listener for BetProposal event with opponent filter
    const listener1 = game.events
      .BetProposal({ filter: { player: opponent } })
      .on("data", handleBetProposal);

    // Setup listener for FundDeposited event
    const listener2 = game.events.FundsDeposited().on("data", handleFunding);

    // Clean up the event listener when the component unmounts
    return () => {
      listener1.unsubscribe();
    };
  }, [game, navigate, location, opponent, opponentBet, setAlert]);

  const bettingView = () => (
    <>
      <Container
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Container
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          <Typography variant="body1" color="primary" fontWeight="bold">
            your bet
          </Typography>
          <Typography variant="body1" color="white">
            {yourBet} wei
          </Typography>
          <Box mt={10} />
          <Form method="post">
            <Container
              sx={{
                display: "flex",
                width: "60%",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <input type="hidden" name="address" value={game._address} />
              <input type="hidden" name="intent" value="proposeBet" />
              <FormControl>
                <CustomTextField name="betAmount" label="bet"></CustomTextField>
              </FormControl>
              <IconButton
                color="primary"
                aria-label="Bet Amount"
                type="submit"
                size="small"
              >
                <SendIcon />
              </IconButton>
            </Container>
          </Form>
        </Container>

        <Container
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          <Typography variant="body1" color="primary" fontWeight="bold">
            opponent bet
          </Typography>
          <Typography variant="body1" color="white">
            {opponentBet} wei
          </Typography>
          <Box mt={10} />
          <Form method="post">
            <input type="hidden" name="address" value={game._address} />
            <input type="hidden" name="intent" value="acceptBet" />
            <CustomButton variant="contained" color="primary">
              accept
            </CustomButton>
          </Form>
        </Container>
      </Container>
    </>
  );

  const fundingView = () => (
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
            <input type="hidden" name="intent" value="funding" />
            <CustomButton type="submit" className="btn btn-primary">
              Deposit funds
            </CustomButton>
          </Form>
        )}
      </Container>
    </>
  );

  return bet === "0" ? bettingView() : fundingView();
};
