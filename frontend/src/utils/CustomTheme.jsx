import { createTheme } from "@mui/material/styles";
import React, { useState, useEffect } from "react";
import { Button, Box, Typography, TextField } from "@mui/material";
import shipImage from "../assets/ship.png";
import seaImage from "../assets/sea.png";

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
      padding: "50px",
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

// Custom box
export const StatusBox = ({
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
      gap: 1,
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      backdropFilter: "blur(10px)",
      padding: "10px",
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

export const PlacingBoard = ({ size, fleetSize, onBoardStateChange }) => {
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
          width: `${size * 75}px`,
          height: `${size * 75}px`,
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
                border: "1px solid white",
                cursor: "pointer",
                backgroundImage:
                  value === 0 ? `url(${seaImage})` : `url(${shipImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: `${100 / size}%`,
                paddingBottom: `${100 / size}%`,
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

export const DefendingBoard = ({
  size,
  fleetSize,
  board,
  shots,
  onBoardStateChange,
}) => {
  const [boardState, setBoardState] = useState(
    Array.from({ length: size }, () => Array(size).fill({ ship: 0, shot: 4 }))
  );

  useEffect(() => {
    const boardArray = [];
    for (const key in board) {
      const subArray = board[key];
      const isShip = subArray[0];
      const index = subArray[2];
      boardArray.push(isShip, index);
    }

    const newBoardState = Array.from({ length: size }, () =>
      Array(size).fill({ ship: 0, shot: 4 })
    );

    for (let i = 0; i < boardArray.length; i += 2) {
      const index = boardArray[i + 1];
      const value = boardArray[i] === 0 ? 0 : 1;
      const row = Math.floor(index / size);
      const col = index % size;

      const tile = { ...newBoardState[row][col] };
      tile.ship = value;
      newBoardState[row][col] = tile;
    }

    // Update the shots
    shots.forEach((shot) => {
      const { index, state } = shot;
      const row = Math.floor(index / size);
      const col = index % size;

      let shotValue = 4;
      if (state === "0") {
        shotValue = 0;
      } else if (state === "1") {
        shotValue = 1;
      } else if (state === "2") {
        shotValue = 2;
      }

      const tile = { ...newBoardState[row][col] };
      tile.shot = shotValue;
      newBoardState[row][col] = tile;
    });

    setBoardState(newBoardState);
  }, [size, board, shots]);

  useEffect(() => {
    // Invoke the onBoardStateChange callback with the updated board state
    onBoardStateChange(boardState);
  }, [boardState, onBoardStateChange]);

  const renderBoard = () => {
    return (
      <div
        style={{
          width: `${size * 65}px`,
          height: `${size * 65}px`,
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {boardState.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                border: "1px solid white",
                cursor: "pointer",
                backgroundColor:
                  value.shot === 0
                    ? "blue"
                    : value.shot === 1
                    ? "red"
                    : value.shot === 2
                    ? "green" : "background.paper",
                backgroundImage:
                  value.ship === 0 ? `none` : `url(${shipImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: `${100 / size}%`,
                paddingBottom: `${100 / size}%`,
              }}
            />
          ))
        )}
      </div>
    );
  };

  return <div>{renderBoard()}</div>;
};

export const AttackingBoard = ({
  size,
  fleetSize,
  shots,
  onBoardStateChange,
  canAttack,
  onTileClick,
}) => {
  const [boardState, setBoardState] = useState(
    Array.from({ length: size }, () => Array(size).fill(4))
  );

  useEffect(() => {
    const newBoardState = Array.from({ length: size }, () =>
      Array(size).fill(4)
    );

    // Update the shots
    shots.forEach((shot) => {
      const { index, state } = shot;
      const row = Math.floor(index / size);
      const col = index % size;

      let shotValue = 4;
      if (state === "0") {
        shotValue = 0;
      } else if (state === "1") {
        shotValue = 1;
      } else if (state === "2") {
        shotValue = 2;
      }

      newBoardState[row][col] = shotValue;
    });

    setBoardState(newBoardState);
  }, [size, shots]);

  useEffect(() => {
    // Invoke the onBoardStateChange callback with the updated board state
    onBoardStateChange(boardState);
  }, [boardState, onBoardStateChange]);

  const renderBoard = () => {
    const handleTileClick = (rowIndex, colIndex) => {
      const index = rowIndex * size + colIndex;
      onTileClick(index, boardState[rowIndex][colIndex]);
    };

    return (
      <div
        style={{
          width: `${size * 65}px`,
          height: `${size * 65}px`,
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {boardState.map((row, rowIndex) =>
          row.map((value, colIndex) => {

            return (
              <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                border: "1px solid white",
                cursor: canAttack ? "pointer" : "default",
                backgroundColor:
                  value === 0
                    ? "blue"
                    : value === 1
                    ? "red"
                    : value === 2
                    ? "green" : "background.paper",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: `${100 / size}%`,
                paddingBottom: `${100 / size}%`,
              }}
              onClick={() =>
                canAttack ? handleTileClick(rowIndex, colIndex) : null
              }
            />
            );
          })
        )}
      </div>
    );
  };

  return <div>{renderBoard()}</div>;
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
