import React from "react";
import {
  gameContractFromAddress,
  getWeb3Instance,
  phaseToString,
  isGameStarted,
} from "../../utils/utils";
import { useAlert } from "../../contexts/AlertContext";
import { useEth } from "../../contexts/EthContext";
import { useEffect } from "react";
import {
  Form,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ThemeProvider,
  Box,
  Typography,
  Container,
  IconButton,
  FormControl,
  InputLabel,
  Input,
} from "@mui/material";
import { FlagCircle as FlagIcon } from "@mui/icons-material";
import {
  customTheme,
  CustomButton,
  CustomButtonBox,
  CustomTextField,
  GameBox,
  InfoText,
} from "./../../utils/CustomTheme.jsx";

export const loader = async ({ params }) => {
  try {
    const game = gameContractFromAddress(params.address);
    const playerOne = await game.methods.owner().call();
    const playerTwo = await game.methods.adversary().call();
    const playerOneData = await game.methods.players(playerOne).call();
    const playerTwoData = await game.methods.players(playerTwo).call();
    const fleetSize = await game.methods.fleetSize().call();
    const boardSize = await game.methods.boardSize().call();
    const data = {
      playerOne,
      playerTwo,
      hasPlayerOneFund: playerOneData.hasPaid,
      hasPlayerTwoFund: playerTwoData.hasPaid,
      fleetSize,
      boardSize,
      currentPhase: await game.methods.gamePhase().call(),
      bet: await game.methods.bet().call(),
      playerOneBet: await game.methods.betsQueue(playerOne).call(),
      playerTwoBet: await game.methods.betsQueue(playerTwo).call(),
      playerTurn: await game.methods.turn().call(),
      winner: await game.methods.winner().call(),
    };
    return { game, data };
  } catch (err) {
    console.log(err);
    return redirect("/home");
  }
};

export const action = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const address = form.get("address");
  const contract = gameContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();
  const loc = form.get("location");
  try {
    switch (intent) {
      case "forfait":
        await contract.methods.forfait().send({ from: accounts[0] });

      case "reportAFK":
        await contract.methods.reportAFK().send({ from: accounts[0] });
        break;
    }
  } catch (err) {
    console.log("Error in the game page: " + err);
  }
  return redirect(loc);
};

export const Game = () => {
  const {
    game,
    data: { playerOne, playerTwo, currentPhase, bet, playerTurn, winner },
  } = useLoaderData();
  const {
    state: { accounts },
  } = useEth();
  const navigate = useNavigate();
  const location = useLocation();
  const {setAlert} = useAlert();

  useEffect(() => {
    (async () => {
      game.events.BetAgreed().on("data", () => {
        navigate(`/game/${game._address}/funds`);
        setAlert("Agreement on the bet", "success");
      });
    })();

    (async () => {
      game.events.PlayerAFK().on("data", (e) => {
        e.returnValues.player !== accounts[0]
          ? setAlert("Opponent has been reported as AFK.", "success")
          : setAlert("You have been reported as AFK.", "warning");
      });
    })();
  }, []);

  const gameStatusBar = () => (
    <>
      <Box mt={3} />
      <Container
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
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
          <GameBox flexDirection="column" left="20px" width="200px">
            <Box width="30px" />
            <Typography variant="body1" color="primary" fontWeight="bold">
              {phaseToString(currentPhase)}
            </Typography>
            {playerTurn !== "0x0000000000000000000000000000000000000000" ? (
              playerTurn === accounts[0] ? (
                <>
                  <Typography color="green" fontWeight="bold">
                    Your turn
                  </Typography>
                </>
              ) : (
                <>
                  <Typography color="red" fontWeight="bold">
                    Opponent Turn
                  </Typography>
                </>
              )
            ) : (
              <></>
            )}{" "}
            {isGameStarted(currentPhase) ? (
              <>
                {" "}
                <Form method="post">
                  <input
                    type="hidden"
                    name="address"
                    value={game._address}
                  />
                  <input type="hidden" name="intent" value="reportAFK" />
                  <CustomButton variant="contained" color="primary">
                    report afk
                  </CustomButton>
                </Form>
                <Form method="post">
                  <input
                    type="hidden"
                    name="address"
                    value={game._address}
                  />
                  <input type="hidden" name="intent" value="forfait" />
                  <CustomButton variant="contained" color="primary">
                    forfait
                  </CustomButton>
                </Form>{" "}
              </>
            ) : (
              <></>
            )}
          </GameBox>
        </Container>
        <GameBox width="80%" right="50px">
        <Outlet />
        </GameBox>
        <GameBox bottom="20px">
          <Typography variant="body1" color="primary" fontWeight="bold">
            game:
          </Typography>
          <Typography variant="body1" color="white">
            {game._address}
          </Typography>
          <Box width="100px" />
          <Typography variant="body1" color="primary" fontWeight="bold">
            adversary:
          </Typography>
          <Typography variant="body1" color="white">
            {accounts[0] === playerOne ? playerTwo : playerOne}{" "}
          </Typography>
        </GameBox>
      </Container>
    </>
  );

  return gameStatusBar();
};
