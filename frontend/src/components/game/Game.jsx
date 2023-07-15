import React from "react";
import {
  gameContractFromAddress,
  getWeb3Instance,
  phaseToString,
  isGameStarted,
} from "../../utils";
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
import { Box, Typography, Container } from "@mui/material";
import { CustomButton, GameBox, StatusBox } from "./../customTheme";

export const loader = async ({ params }) => {
  try {
    const game = gameContractFromAddress(params.address);
    const playerOne = await game.methods.owner().call();
    const playerTwo = await game.methods.adversary().call();
    const playerOneData = await game.methods.players(playerOne).call();
    const playerTwoData = await game.methods.players(playerTwo).call();
    const playerOneShots = await game.methods.getShotsTaken(playerOne).call();
    const playerTwoShots = await game.methods.getShotsTaken(playerTwo).call();
    const fleetSize = await game.methods.fleetSize().call();
    const boardSize = await game.methods.boardSize().call();
    const data = {
      playerOne,
      playerTwo,
      playerOneShots,
      playerTwoShots,
      hasPlayerOneFund: playerOneData.hasPaid,
      hasPlayerTwoFund: playerTwoData.hasPaid,
      isPlayerOneAKF: playerOneData.afk,
      isPlayerTwoAFK: playerTwoData.afk,
      playerOneBoard: playerOneData.board,
      playerTwoBoard: playerTwoData.board,
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
      case "forfeit":
        await contract.methods.forfeit().send({ from: accounts[0] });
        break;

      case "reportAFK":
        await contract.methods.reportAFK().send({ from: accounts[0] });
        break;

      case "verifyAFK":
        await contract.methods.verifyAFK().send({ from: accounts[0] });
        break;

      default:
        break;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};

export const Game = () => {
  const {
    game,
    data: { playerOne, playerTwo, currentPhase, playerTurn },
  } = useLoaderData();

  const {
    state: { accounts },
  } = useEth();

  const navigate = useNavigate();
  const location = useLocation();
  const { setAlert } = useAlert();

  useEffect(() => {

    const handleBetAgreed = () => {
      navigate(`/game/${game._address}/funds`);
      setAlert("Agreement on the bet", "success");
    };

    const handleWinner = () => {
      navigate(`/game/${game._address}/end`);
      setAlert("We have a winner!", "success");
    };

    const handleWinnerVerified = () => {
      navigate(`/game/${game._address}/withdraw`);
      setAlert("Victory confirmed!", "info")
    };

      const listener1 = game.events.BetAgreed().on("data", handleBetAgreed);
      const listener2 = game.events.Winner().on("data",handleWinner);
      const listener3 = game.events.WinnerVerified().on("data",handleWinnerVerified);

      return () => {
        listener1.unsubscribe();
        listener2.unsubscribe();
        listener3.unsubscribe();
      };
  }, [currentPhase, location]);

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
          <StatusBox flexDirection="column" left="20px" width="200px">
            <Box width="30px" />
            <Typography variant="body1" color="primary" fontWeight="bold">
              {phaseToString(currentPhase)}
            </Typography>
            {isGameStarted(currentPhase) === true ? (
              playerTurn !== "0x0000000000000000000000000000000000000000" ? (
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
              )
            ) : (
              <> </>
            )}{" "}
            {isGameStarted(currentPhase) ? (
              <>
                {" "}
                <Form method="post">
                  <input type="hidden" name="address" value={game._address} />
                  <input type="hidden" name="intent" value="reportAFK" />
                  <CustomButton variant="contained" color="primary">
                    report afk
                  </CustomButton>
                </Form>
                <Form method="post">
                  <input type="hidden" name="address" value={game._address} />
                  <input type="hidden" name="intent" value="verifyAFK" />
                  <CustomButton variant="contained" color="primary">
                    verify afk
                  </CustomButton>
                </Form>
                <Form method="post">
                  <input type="hidden" name="address" value={game._address} />
                  <input type="hidden" name="intent" value="forfeit" />
                  <CustomButton variant="contained" color="primary">
                    forfeit
                  </CustomButton>
                </Form>{" "}
              </>
            ) : (
              <></>
            )}
          </StatusBox>
        </Container>
        <GameBox width="80%" right="50px">
          <Outlet />
        </GameBox>
        <StatusBox bottom="20px">
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
        </StatusBox>
      </Container>
    </>
  );

  return gameStatusBar();
};
