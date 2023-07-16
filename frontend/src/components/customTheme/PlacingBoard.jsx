import React, { useState, useEffect } from "react";
import { Button, Box, Typography, TextField } from "@mui/material";
import shipImage from "../../assets/ship.png";
import brokenShipImage from "../../assets/brokenShip.png";
import missImage from "../../assets/miss.png";
import seaImage from "../../assets/sea.png";

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
    const xAxisLabels = Array.from({ length: size }, (_, index) => index + 1);
    const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase().split("");
    const yAxisLabels = alphabet.slice(0, size);

    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "75px" }} />{" "}
          {/* Empty space for y-axis labels */}
          {yAxisLabels.map((label) => (
            <div
              key={`x-${label}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "75px",
                height: "75px",
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ width: "75px" }}>
            {xAxisLabels.map((label) => (
              <div
                key={`y-${label}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "75px",
                }}
              >
                {label}
              </div>
            ))}
          </div>
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
                    padding: 1,
                    border: "1px solid white",
                    cursor: "pointer",
                    backgroundImage: value === 0 ? null : `url(${shipImage})`,
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
        </div>
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
