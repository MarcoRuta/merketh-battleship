import React from 'react';
import {
    gameContractFromAddress,
    getWeb3Instance,
  } from "../../utils/utils";

export const action = async ({ request }) => {
    const form = await request.formData();
    const intent = form.get("intent");
    const address = form.get("address");
    const contract = gameContractFromAddress(address);
    const accounts = await getWeb3Instance().eth.getAccounts();
    try {
      switch (intent) {
        case "acceptBet":
          await contract.methods
            .acceptBet(form.get("betAmount"))
            .send({ from: accounts[0] });
          break;
        case "proposeBet":
          await contract.methods
            .proposeBet(form.get("betAmount"))
            .send({ from: accounts[0] });
          break;
        default:
          break;
      }
    } catch (err) {
      console.log("Error in betting phase");
    }
    return null;
  };

export const Betting = () => {
    return (
        <div>
        Betting Page!
        </div>
    );
};
