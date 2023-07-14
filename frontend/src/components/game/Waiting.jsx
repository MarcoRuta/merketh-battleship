import React from "react";
import { useEffect } from "react";
import Logo from "../../assets/logo.svg";
import { gameContractFromAddress } from "../../utils";
import { useLocation, redirect, useLoaderData, useNavigate } from "react-router-dom";
import { useEth } from "./../../contexts/EthContext";
import { useAlert } from "./../../contexts/AlertContext";
import { DefaultCopyField } from "@eisberg-labs/mui-copy-field";
import { ThemeProvider, Box, Typography, Container } from "@mui/material";
import { customTheme } from "./../customTheme";

export const loader = ({ params }) => {
  try {
    const game = gameContractFromAddress(params.address);
    return { game };
  } catch (err) {
    console.log(err);
    return redirect("/home");
  }
};

export const Waiting = () => {
  const {
    state: { accounts, contract },
  } = useEth();
  const { game } = useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();
  const {setAlert} = useAlert();

  useEffect(() => {

    const handleJoinGame = (e) => {
      const { game } = e.returnValues;
      if (location.pathname !== "/home" || location.pathname !== "/")  {
        navigate(`/game/${game}/bet`);
        setAlert("Game joined!", "success");
      }
    };


    // Setup listener for JoinGame event with game filter
    const listener = contract.events
      .JoinGame({ filter: { game: game._address } })
      .on("data", handleJoinGame);

    // Clean up the event listener when the component unmounts
    return () => {
      listener.unsubscribe();
    };
  }, [location, game, navigate, contract.events]);

  const view = (
    <Container
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
        gap: 9,
      }}
    >
      <Typography variant="h5" color="background.paper" fontWeight="bold">
        Waiting for a player to join!
      </Typography>
      <DefaultCopyField
        sx={{
          "& .MuiInputLabel-root": {
            color: "background.paper",
          },
          "& .MuiIconButton-root": {
            color: "background.paper",
          },
          "& .MuiInputBase-root": {
            color: "background.paper",
          },
          width: "450px",
        }}
        label={"Game ID"}
        value={game._address}
      />
    </Container>
  );

  return (
    <ThemeProvider theme={customTheme}>
      <Container
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <Box mt={10}>
          <img
            src={Logo}
            alt="MerkEth Battleship Logo"
            style={{ width: "450px", height: "auto" }}
          />
        </Box>
        <Box mt={5}></Box>
        <Box>{view}</Box>
      </Container>
    </ThemeProvider>
  );
};
