import Web3 from "web3";
import {Snackbar, Alert} from "@mui/material";
import ReactDOM from "react-dom/client";

export const getWeb3Instance = () => {
  return new Web3(Web3.givenProvider || "http://localhost:8545");
};

export const gameContractFromAddress = (address) => {
  const web3 = getWeb3Instance();
  const { abi } = require("./../contracts/Game.json");
  const contract = new web3.eth.Contract(abi, address);
  return contract;
};

export const gamesManagerContractFromAddress = (address) => {
  const web3 = getWeb3Instance();
  const { abi } = require("./../contracts/GamesManager.json");
  const contract = new web3.eth.Contract(abi, address);
  return contract;
};

