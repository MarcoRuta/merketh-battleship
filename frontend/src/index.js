import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { EthProvider } from "./contexts/EthContext";
import { AlertProvider } from "./contexts/AlertContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <AlertProvider>
    <EthProvider>
      <App />
    </EthProvider>
  </AlertProvider>
);
