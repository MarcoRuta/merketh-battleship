import Web3 from "web3";
import ReactDOM from "react-dom/client";
import localforage from "localforage";

export const getWeb3Instance = () => {
  return new Web3(Web3.givenProvider || "http://localhost:8545");
};

export const gameContractFromAddress = (address) => {
  const web3 = getWeb3Instance();
  const { abi } = require("./contracts/Game.json");
  const contract = new web3.eth.Contract(abi, address);
  return contract;
};

export const gamesManagerContractFromAddress = (address) => {
  const web3 = getWeb3Instance();
  const { abi } = require("./contracts/GamesManager.json");
  const contract = new web3.eth.Contract(abi, address);
  return contract;
};

export const Phase = {
  Waiting: "0",
  Betting: "1",
  Placement: "2",
  Attack: "3",
  Winner: "4",
  End: "5",
};

export const ShotType = {
  Taken: "0",
  Hit: "1",
  Miss: "2",
};

export function indexToCoordinate(size, index) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = [...Array(size).keys()].map((num) => (num + 1).toString());

  const row = Math.floor(index / size) + 1;
  const column = alphabet[index % size];

  return "[" + row.toString() + ", " + column +"]";
}

export const phaseToString = (phase) => {
  switch (phase) {
    case Phase.Waiting:
      return "Waiting for an opponent...";
    case Phase.Betting:
      return "Is time to bet!";
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

export const isAFKAllowed = (phase) => {
  return (
    phase !== Phase.Waiting &&
    phase !== Phase.End
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
