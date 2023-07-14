import { createTheme } from "@mui/material/styles";

// Custom theme
export const customTheme = createTheme({
    palette: {
      mode: "dark",
      background: {
        default: "#B1AAEF",
        paper: "#5E57AA",
      },
      primary: {
        main: "#5E57AA",
      },
      secondary: {
        main: "#915736",
      },
      text: {
        main: "#000000",
        secondary: "#FFFFFF",
      },
    },
    typography: {
      fontFamily: "Helvetica, Arial, sans-serif",
    },
  });