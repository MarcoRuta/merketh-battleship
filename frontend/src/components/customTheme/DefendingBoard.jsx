import React, { useState, useEffect } from "react";
import { Button, Box, Typography, TextField } from "@mui/material";
import shipImage from "../../assets/ship.png";
import brokenShipImage from "../../assets/brokenShip.png";
import missImage from "../../assets/miss.png";
import seaImage from "../../assets/sea.png";

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
        //Taken
        if (state === "0") {
          shotValue = 0;
        //Hit
        } else if (state === "1") {
          shotValue = 1;
        //Miss
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
            <div style={{ width: "65px" }} />{" "}
            {/* Empty space for y-axis labels */}
            {yAxisLabels.map((label) => (
              <div
                key={`x-${label}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "65px",
                  height: "65px",
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ width: "65px" }}>
              {xAxisLabels.map((label) => (
                <div
                  key={`y-${label}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "65px",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
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
                      backgroundImage:
                      value.ship === 1 && (value.shot === 0 || value.shot === 4)
                      ? `url(${shipImage})`
                      : value.ship === 1 && value.shot === 1
                      ? `url(${brokenShipImage})`
                      : value.ship === 0 && value.shot === 2
                      ? `url(${missImage})`
                      : "none",
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
  
    return <div>{renderBoard()}</div>;
  };