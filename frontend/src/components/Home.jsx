import React from "react";
import { Form } from "react-router-dom";
import {
  ThemeProvider,
  Box,
  Typography,
  Container,
  IconButton,
  FormControl,
} from "@mui/material";
import {
  customTheme,
  CustomButton,
  CustomButtonBox,
  CustomTextField,
  InfoText,
} from "./../utils/CustomTheme.jsx";
import Logo from "../assets/logo.svg";
import { Search as SearchIcon } from "@mui/icons-material";
import { useEth } from "../contexts/EthContext";
import {
  gamesManagerContractFromAddress,
  getWeb3Instance,

} from "../utils/utils";

export const action = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const address = form.get("address");
  const contract = gamesManagerContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();
  try {
    switch (intent) {
      case "createStandardGame":
        await contract.methods.createGame(false).send({ from: accounts[0] });
        break;

      case "createSmallGame":
        await contract.methods.createGame(true).send({ from: accounts[0] });
        break;

      case "joinGameByID":
        const gameID = form.get("gameID");
        await contract.methods.joinGameByID(gameID).send({ from: accounts[0] });
        break;

      case "joinRandomGame":
        await contract.methods.joinRandomGame().send({ from: accounts[0] });
        break;

      default:
        return null;
    }
  } catch (err) {
    console.log("An error occurred in the Home page." + err);
  }
  return null;
};

export const Home = () => {
  const accounts = getWeb3Instance().eth.getAccounts();

  const {
    state: { contract },
  } = useEth();

  const connectView = () => (
    <Container
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        alignItems: "center",
        height: "100vh",
      }}
    >
      <InfoText />
      <CustomButtonBox>
        <Typography variant="h7" color="background.paper" fontWeight="bold">
          Connect your wallet to start!
        </Typography>
      </CustomButtonBox>
    </Container>
  );

  const menuView = () => (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h7" color="background.paper" fontWeight="bold">
          Create a game
        </Typography>
          <Form method="post">
            <input type="hidden" name="address" value={contract._address} />
            <input type="hidden" name="intent" value="createStandardGame" />
            <CustomButton variant="contained" color="primary" width="100px">
              Standard
            </CustomButton>
          </Form>
          <Form method="post">
            <input type="hidden" name="address" value={contract._address} />
            <input type="hidden" name="intent" value="createSmallGame" />
            <CustomButton variant="contained" color="primary" width="100px">
              Small
            </CustomButton>
          </Form>
      </Container>
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <Typography variant="h7" color="background.paper" fontWeight="bold">
          Join a game
        </Typography>
          <Form method="post">
            <input type="hidden" name="address" value={contract._address} />
            <input type="hidden" name="intent" value="joinRandomGame" />
            <CustomButton variant="contained" color="primary" width="100px">
              Random
            </CustomButton>
          </Form>
          <Form method="post">
            <Container
              sx={{
                display: "flex",
                width: "120%",
                flexDirection: "row",
                alignItems: "center",
                gap: 1,
              }}
            >
              <input type="hidden" name="address" value={contract._address} />
              <input type="hidden" name="intent" value="joinGameByID" />
              <FormControl>
                <CustomTextField
                  name="gameID"
                  label="Game ID"
                ></CustomTextField>
              </FormControl>
              <IconButton color="primary" aria-label="Join Game" type="submit" size="small">
                <SearchIcon />
              </IconButton>
            </Container>
          </Form>
      </Container>
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
        {!accounts[0] ? menuView() : connectView()}
      </Container>
    </ThemeProvider>
  );
};

export default Home;
