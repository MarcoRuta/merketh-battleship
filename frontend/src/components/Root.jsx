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
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleGameNotValid = (e) => {
      setAlert("This game is not valid!", "info");
    };

    const handleNewGame = (e) => {
      const { game } = e.returnValues;
      if (location.pathname === "/home" || location.pathname ==="/") {
        navigate(`/wait/${game}`);
        setAlert("Game created", "success");
      }
    };

    const handleJoinGame = (e) => {
      const { game } = e.returnValues;
      if (location.pathname === "/home" || location.pathname ==="/") {
        navigate(`/game/${game}/bet`);
        setAlert("Game joined!", "success");
      }
    };

    const handleNoGame = (e) => {
      setAlert("No game available at the moment!", "info");
    };

    // Add event listeners and assign corresponding handlers
    const listener1 = contract.events
      .GameNotValid({ filter: { creator: accounts[0] } })
      .on("data", handleGameNotValid);

    const listener2 = contract.events
      .JoinGame({ filter: { player: accounts[0] } })
      .on("data", handleJoinGame);

    const listener3 = contract.events
      .NewGame({ filter: { creator: accounts[0] } })
      .on("data", handleNewGame);

    const listener4 = contract.events
      .NoGame({ filter: { player: accounts[0] } })
      .on("data", handleNoGame);

    // Clean up the event listeners when the component unmounts
    return () => {
      listener1.unsubscribe();
      listener2.unsubscribe();
      listener3.unsubscribe();
      listener4.unsubscribe();
    };
  }, []);

  return (
    <>
      <AlertPopup />
      <Outlet />
    </>
  );
};
