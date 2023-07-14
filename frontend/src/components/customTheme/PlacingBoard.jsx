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
                    value === 0 ? null : `url(${shipImage})`,
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
  