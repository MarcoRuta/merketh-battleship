import { createTheme } from "@mui/material/styles";
import React, { useState, useEffect } from "react";
import { Button, Box, Typography, TextField } from "@mui/material";
import Logo from "../assets/logo.svg";

// Custom theme
export const customTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#B1AAEF",
      paper: "#5E57AA",
    },
    primary: {
      main: "#5E57AA",
    },
    secondary: {
      main: "#915736",
    },
    text: {
      main: "#000000",
      secondary: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: "Helvetica, Arial, sans-serif",
  },
});

// Custom Button
export const CustomButton = ({ onClick, children, width }) => (
  <Button
    type="submit"
    color="primary"
    onClick={onClick}
    sx={{
      width: { width },
    }}
  >
    {children}
  </Button>
);

// Custom box
export const CustomButtonBox = ({ children }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2,
      width: "50%",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.00)",
      backdropFilter: "blur(10px)",
      padding: "10px",
      borderRadius: "5px",
    }}
  >
    {children}
  </Box>
);

// Custom box
export const GameBox = ({
  children,
  flexDirection,
  width,
  right,
  bottom,
  left,
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: { flexDirection },
      gap: 2,
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      backdropFilter: "blur(10px)",
      padding: "15px",
      borderRadius: "5px",
      position: "fixed",
      width: { width },
      bottom: { bottom },
      left: { left },
      right: { right },
    }}
  >
    {children}
  </Box>
);

// Custom text field
export const CustomTextField = ({ name, onChange, value, label }) => (
  <TextField
    autoComplete="off"
    inputProps={{
      style: {
        color: "rgba(0, 0, 0, 0.8)",
        borderColor: "black",
        fontSize: "10px",
      },
    }}
    InputLabelProps={{
      style: { color: "rgba(0, 0, 0, 0.4)", fontSize: "12px" },
    }}
    sx={{
      height: "40px",
      width: "80px",
      padding: "0px",
    }}
    onChange={onChange}
    value={value}
    label={label}
    name={name}
  />
);

// Custom text field
export const BetTextField = ({ name, onChange, value, label }) => (
  <TextField
    autoComplete="off"
    inputProps={{
      style: {
        color: "rgba(0, 0, 0, 0.8)",
        borderColor: "black",
        fontSize: "10px",
      },
    }}
    InputLabelProps={{
      style: { color: "rgba(0, 0, 0, 0.4)", fontSize: "12px" },
    }}
    sx={{
      height: "40px",
      width: "50px",
      padding: "0px",
    }}
    onChange={onChange}
    value={value}
    label={label}
    name={name}
  />
);

export const CustomBoard = ({ size, fleetSize, onBoardStateChange }) => {
  const [boardState, setBoardState] = useState(
    Array.from({ length: size }, () => Array(size).fill(0))
  );

  const handleClick = (row, col) => {
    const newBoardState = [...boardState];
    const currentTileState = newBoardState[row][col];

    if (currentTileState === 0) {
      // Check if the maximum fleet size has been reached
      const numberOfSetTiles = newBoardState
        .flat()
        .filter((value) => value === 1).length;
      if (numberOfSetTiles >= fleetSize) {
        return;
      }
      newBoardState[row][col] = 1;
    } else {
      newBoardState[row][col] = 0;
    }

    setBoardState(newBoardState);
  };

  useEffect(() => {
    // Invoke the onBoardStateChange callback with the updated board state
    onBoardStateChange(boardState);
  }, [boardState, onBoardStateChange]);

  // Calculate the number of set tiles
  const numberOfSetTiles = boardState
    .flat()
    .filter((value) => value === 1).length;

  const renderBoard = () => {
    return (
      <div
        style={{
          width: `${size * 80}px`,
          height: `${size * 80}px`,
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {boardState.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleClick(rowIndex, colIndex)}
              style={{
                width: "80px",
                height: "80px",
                border: "1px solid black",
                marginRight: "-1px",
                marginBottom: "-1px",
                cursor: "pointer",
                backgroundColor: value === 1 ? "green" : "#B1AAEF",
              }}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div>
      {renderBoard()}
      <p>
      <Typography variant="h7" color="background.paper" fontWeight="bold">
        Remaining ships: 
      </Typography>
      <Typography variant="h7" color="white" fontWeight="bold">
      {fleetSize - numberOfSetTiles}
      </Typography>
      </p>
    </div>
  );
};

export const InfoText = () => (
  <>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        width: "85%",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.02)",
        backdropFilter: "blur(10px)",
        padding: "10px",
        borderRadius: "5px",
      }}
    >
      <Typography variant="body1" color="text.main">
        🚀 MerkEth is a decentralized application (DApp) that brings the classic
        Battleship game to the Ethereum blockchain 🚀
      </Typography>
      <Typography variant="body1" color="text.main">
        🎲 With MerkEth, two players can engage in epic battleship matches,
        leveraging the power of the Ethereum blockchain. ⛓️⚔️
      </Typography>
      <Typography variant="body1" color="text.main">
        🔒 The blockchain ensures fair play by preventing cheating and providing
        a tamper-proof environment for the players. 🔐
      </Typography>
      <Typography variant="body1" color="text.main">
        💰 The blockchain manages the betting and withdrawal system, keeping
        them decentralized, anonymous, and safe. 💵💸
      </Typography>
    </Box>
  </>
);
