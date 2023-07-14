import React, { useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { customTheme } from "./utils/CustomTheme.jsx";
import Navbar from "./components/Navbar";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Root } from "./components/Root";
import { Error } from "./components/utility/Error";
import { Home, action as homeAction } from "./components/Home";
import {
  Game,
  action as gameAction,
  loader as gameLoader,
} from "./components/game/Game";
import { Waiting, loader as waitingLoader } from "./components/game/Waiting";
import { Funding, action as fundingAction } from "./components/game/Funding";
import { Betting, action as bettingAction } from "./components/game/Betting";
import { Placing, action as placingAction } from "./components/game/Placing";
import {
  Attacking,
  action as attackingAction,
  loader as attackingLoader
} from "./components/game/Attacking";
import {
  End,
  action as endAction
} from "./components/game/End";
import {
  Withdraw,
  action as withdrawAction,
} from "./components/game/Withdraw";
import { useEth } from "./contexts/EthContext";
import { CssBaseline, Box } from "@mui/material";
import { AlertProvider } from "./contexts/AlertContext";
import AlertPopup from "./components/utility/AlertPopup";

const myRouter = createBrowserRouter([
  {
    path: "/",
    element: ((<AlertPopup />), (<Root />)),
    errorElement: <Error />,
    children: [
      { path: "/home", element: <Home />, action: homeAction },
      { path: "/wait/:address", element: <Waiting />, loader: waitingLoader },
      {
        path: "/game/:address",
        element: <Game />,
        loader: gameLoader,
        action: gameAction,
        id: "game",
        children: [
          {
            path: "/game/:address/bet",
            element: <Betting />,
            action: bettingAction,
          },
          {
            path: "/game/:address/funds",
            element: <Funding />,
            action: fundingAction,
          },
          {
            path: "/game/:address/placing",
            element: <Placing />,
            action: placingAction,
          },
          {
            path: "/game/:address/attacking",
            element: <Attacking />,
            action: attackingAction,
            loader: attackingLoader,
          },
          {
            path: "/game/:address/end",
            element: <End />,
            action: endAction,
          },
          {
            path: "/game/:address/withdraw",
            element: <Withdraw />,
            action: withdrawAction,
          },
        ],
      },
    ],
  },
]);

const App = () => {
  const {
    state: { contract, accounts },
  } = useEth();

  useEffect(() => {}, [accounts]);

  return (
    <ThemeProvider theme={customTheme}>
      <AlertProvider>
        <CssBaseline />
        <Box sx={{ backgroundColor: customTheme.palette.background.default }}>
          <Navbar />
          {contract ? <RouterProvider router={myRouter} /> : null}
        </Box>
      </AlertProvider>
    </ThemeProvider>
  );
};

export default App;
