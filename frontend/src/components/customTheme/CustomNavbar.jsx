import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { useEth } from "./../../contexts/EthContext";

export const CustomNavbar = () => {
  const {
    state: { accounts },
  } = useEth();

  const account = accounts ? (
    <span className="badge ">Account: {accounts[0]}</span>
  ) : (
    <></>
  );

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          sx={{
            textDecoration: "none",
            color: "inherit",
            fontWeight: "bold",
          }}
        >
          MerkEth Battleship
        </Typography>
        <Typography
          variant="b1"
          sx={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          {account}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};


