import Web3 from "web3";
import {Snackbar, Alert} from "@mui/material";
import ReactDOM from "react-dom/client";
import localforage from "localforage";

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

export const Phase = {
  Waiting: "0",
  Betting: "1",
  Funding: "2",
  Placement: "3",
  Attack: "4",
  Winner: "5",
  End: "6",
};

export const ShotType = {
  Taken: "0",
  Hit: "1",
  Miss: "2",
};

export const phaseToString = (phase) => {
  switch (phase) {
    case Phase.Waiting:
      return "Waiting for an opponent...";
    case Phase.Betting:
      return "Is time to bet!";
    case Phase.Funding:
      return "Is time to fund!";
    case Phase.Placement:
      return "Place your fleet!";
    case Phase.Attack:
      return "Is time to attack!";
    case Phase.Winner:
      return "We have a winner!";
    case Phase.End:
      return "End of the game.";
    default:
      throw new Error("Invalid phase");
  }
};

export const isGameStarted = (phase) => {
  return (
    phase === Phase.Placement ||
    phase === Phase.Attack 
  );
};

export const rndNonce = () => {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);

  // Convert byte array to hexadecimal representation
  const bytesHex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  // Convert hexadecimal value to a decimal string
  return window.BigInt("0x" + bytesHex).toString(10);
};

export const saveBoardTree = async (tree) => {
  await localforage.setItem("tree", tree);
};

export const loadBoardTree = async () => {
  return await localforage.getItem("tree");
};

export const saveBoard = async (board) => {
  await localforage.setItem("board", board);
};

export const loadBoard = async () => {
  return await localforage.getItem("board");
};
