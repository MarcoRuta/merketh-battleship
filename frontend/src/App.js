import React, {useEffect} from "react";
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
import { Betting, action as bettingAction } from "./components/game/Betting";
import { Waiting, loader as waitingLoader } from "./components/game/Waiting";
import { useEth } from "./contexts/EthContext";
import { CssBaseline, Box } from "@mui/material";
import { AlertProvider } from "./contexts/AlertContext";
import  AlertPopup  from "./components/utility/AlertPopup";

const myRouter = createBrowserRouter([
  {
    path: "/",
    element:       
    (<AlertPopup />,
     <Root />),
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
            path: "/game/:address/betting",
            element: <Betting />,
            action: bettingAction,
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
  
useEffect(()=>{},[accounts]);

  

  return (
    <ThemeProvider theme={customTheme}>
      <AlertProvider>
      <CssBaseline />
      <Box sx={{ backgroundColor: customTheme.palette.background.default }}>
        <Navbar/>
        {contract ? <RouterProvider router={myRouter} /> : null};
      </Box>
      </AlertProvider>
    </ThemeProvider>
  );
};

export default App;
