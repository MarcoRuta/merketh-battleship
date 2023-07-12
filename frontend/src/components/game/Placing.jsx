import { Form, useRouteLoaderData, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { gameContractFromAddress, getWeb3Instance } from "../../utils/utils";
import { useAlert } from "../../contexts/AlertContext";
import { useEth } from "../../contexts/EthContext";
import {
  customTheme,
  CustomButton,
  CustomButtonBox,
  CustomTextField,
  CustomBoard,
  GameBox,
  InfoText,
} from "./../../utils/CustomTheme.jsx";
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

export const action = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const address = form.get("address");
  const boardState = form.get("boardState");
  try {
    switch (intent) {
      case "commitBoard":
        console.log(boardState);
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};

export const Placing = () => {
  const {
    state: { accounts },
  } = useEth();
  const {
    game,
    data: { fleetSize, boardSize },
  } = useRouteLoaderData("game");

  const navigate = useNavigate();
  const setAlert = useAlert();
  const size = Math.sqrt(boardSize);

  // Define a state to store the board state
  const [boardState, setBoardState] = useState([]);

  // Callback function to handle board state changes
  const handleBoardStateChange = (newBoardState) => {
    setBoardState(newBoardState);
  };

  return (
    <>
      <Container
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 15,
        }}
      >
        <CustomBoard
          size={size}
          fleetSize={fleetSize}
          onBoardStateChange={handleBoardStateChange}
        ></CustomBoard>
        <Container
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 15,
          }}
        >
          <Form method="post">
            <input type="hidden" name="address" value={game._address} />
            <input type="hidden" name="intent" value="commitBoard" />
            <input type="hidden" name="boardState" value={boardState} />
            <CustomButton type="submit" className="btn btn-primary">
              Commit board
            </CustomButton>
          </Form>
          <Typography variant="h7" color="background.paper" fontWeight="bold">
            You must place your entire fleet ({fleetSize})!
          </Typography>
        </Container>
      </Container>
    </>
  );
};
