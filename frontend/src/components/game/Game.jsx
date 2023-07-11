import React from "react";
import { gameContractFromAddress, getWeb3Instance } from "../../utils/utils";
import { redirect } from "react-router-dom";

export const loader = async ({ params }) => {
  try {
    const game = gameContractFromAddress(params.address);
    const playerOne = await game.methods.playerOne().call();
    const playerTwo = await game.methods.playerTwo().call();
    const data = {
      playerOne,
      playerTwo,
      currentPhase: await game.methods.currentPhase().call(),
      bet: await game.methods.agreedBetAmount().call(),
      agreedBetAmount: await game.methods.agreedBetAmount().call(),
      playerOneBet: await game.methods.proposedBets(playerOne).call(),
      playerTwoBet: await game.methods.proposedBets(playerTwo).call(),
      playerTurn: await game.methods.playerTurn().call(),
      winner: await game.methods.winner().call(),
      AFKPlayer: await game.methods.AFKPlayer().call(),
    };
    return { game, data };
  } catch (err) {
    return redirect("/home");
  }
};

export const action = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const address = form.get("address");
  const contract = gameContractFromAddress(address);
  const accounts = await getWeb3Instance().eth.getAccounts();
  const loc = form.get("location");
  try {
    switch (intent) {
      case "report":
        await contract.methods.reportOpponentAFK().send({ from: accounts[0] });
        break;
      case "validate":
        await contract.methods.verifyOpponentAFK().send({ from: accounts[0] });
        break;
      default:
        break;
    }
  } catch (err) {
    console.log("Error in the game page: " + err);
  }
  return redirect(loc);
};

export const Game = () => {
  return <div></div>;
};
