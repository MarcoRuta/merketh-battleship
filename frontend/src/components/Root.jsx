import { useEffect } from "react";
import AlertPopup from "./utility/AlertPopup";
import { useEth } from "../contexts/EthContext";
import { useAlert } from "../contexts/AlertContext";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export const Root = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAlert } = useAlert();
  const {
    state: { contract, accounts },
  } = useEth();

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "") {
      navigate("/home");
    }
  });

  useEffect(() => {
    contract.events
      .GameNotValid({ filter: { creator: accounts[0] } })
      .on("data", (e) => {
        setAlert("This game is not valid!", "info");
      });

    contract.events
      .NewGame({ filter: { creator: accounts[0] } })
      .on("data", (e) => {
        navigate(`/wait/${e.returnValues.game}`);
        setAlert("Game created", "success");
      });

    contract.events
      .JoinGame({ filter: { player: accounts[0] } })
      .on("data", (e) => {
        navigate(`/game/${e.returnValues.game}/bet`);
        setAlert("Game joined!", "success");
      });

    contract.events
      .NoGame({ filter: { player: accounts[0] } })
      .on("data", (e) => {
        setAlert("No game available at the moment!", "info");
      });
  }, [accounts, contract.events, navigate]);

  return (
    <>
      <AlertPopup />
      <Outlet style={{ maxHeight: "100vh" }} />
    </>
  );
};
