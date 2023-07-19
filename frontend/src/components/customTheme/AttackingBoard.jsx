import React, { useState, useEffect } from "react";
import brokenShipImage from "../../assets/brokenShip.png";
import missImage from "../../assets/miss.png";
import targetImage from "../../assets/target.png";

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

  const [hoveredTile, setHoveredTile] = useState(null);

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

      newBoardState[row][col] = shotValue;
    });

    setBoardState(newBoardState);
  }, [size, shots]);

  useEffect(() => {
    // Invoke the onBoardStateChange callback with the updated board state
    onBoardStateChange(boardState);
  }, [boardState, onBoardStateChange]);

  const renderBoard = () => {
    const xAxisLabels = Array.from({ length: size }, (_, index) => index + 1);
    const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase().split("");
    const yAxisLabels = alphabet.slice(0, size);

    const handleTileClick = (rowIndex, colIndex) => {
      setHoveredTile({ rowIndex, colIndex });
      const index = rowIndex * size + colIndex;
      const state = boardState[rowIndex][colIndex];
      onTileClick(index, state);
    };


    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "65px" }} />{" "}
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
                    border: `1px solid ${
                      hoveredTile &&
                      hoveredTile.rowIndex === rowIndex &&
                      hoveredTile.colIndex === colIndex
                        ? "red"
                        : "white"
                    }`,
                    cursor: canAttack ? "pointer" : "default",
                    backgroundImage:
                      value === 0
                        ? `url(${targetImage})`
                        : value === 1
                        ? `url(${brokenShipImage})`
                        : value === 2
                        ? `url(${missImage})`
                        : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    maxWidth: "65px",
                    maxHeight: "65px",
                    minWidth: "65px",
                    minHeight: "65px",
                  }}
                  onClick={() =>
                    canAttack ? handleTileClick(rowIndex, colIndex) : null
                  }
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
