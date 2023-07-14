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
import {
  CustomButton,
  CustomSmallTextField,
} from "./../customTheme";
import { Send as SendIcon } from "@mui/icons-material";

export const action = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const address = form.get("address");
  const contract = gameContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();
  try {
    switch (intent) {
      case "acceptBet":
        await contract.methods
          .acceptBet()
          .send({ from: accounts[0] });
        break;
      case "proposeBet":
        await contract.methods
          .proposeBet(form.get("betAmount"))
          .send({ from: accounts[0] });
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
    data: { playerOne, playerTwo, playerOneBet, playerTwoBet },
  } = useRouteLoaderData("game");
  const navigate = useNavigate();
  const location = useLocation();
  const {setAlert} = useAlert();

  const opponent = playerOne === accounts[0] ? playerTwo : playerOne;
  const opponentBet = playerOne === accounts[0] ? playerTwoBet : playerOneBet;
  const yourBet = playerOne === accounts[0] ? playerOneBet : playerTwoBet;

  useEffect(() => {
    const handleBetProposal = () => {
      setAlert("The opponent proposed a bet","warning");
      navigate(`/game/${game._address}/bet`);
    };

    // Setup listener for BetProposal event with opponent filter
    const listener = game.events
      .BetProposal({ filter: { player: opponent } })
      .on("data", handleBetProposal);

    // Clean up the event listener when the component unmounts
    return () => {
      listener.unsubscribe();
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
                <CustomSmallTextField name="betAmount" label="bet"></CustomSmallTextField>
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

  return bettingView();
};
