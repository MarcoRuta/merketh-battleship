import { createTheme } from "@mui/material/styles";
import { Button, Box, Typography, TextField } from "@mui/material";

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

// Custom Button
export const CustomButton = ({ onClick, children }) => (
  <Button
    type="submit"
    color="primary"
    onClick={onClick}
    sx={{
      width: "100px",
    }}
  >
    {children}
  </Button>
);

// Custom box
export const CustomButtonBox = ({ children }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2,
      width: "50%",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.00)",
      backdropFilter: "blur(10px)",
      padding: "10px",
      borderRadius: "5px",
    }}
  >
    {children}
  </Box>
);


// Custom text field
export const CustomTextField = ({ name, onChange, value, label }) => (
  <TextField
    autoComplete="off"
    inputProps={{
      style: { color: "rgba(0, 0, 0, 0.8)", borderColor: "black", fontSize: "10px" },
    }}
    InputLabelProps={{
      style: { color: "rgba(0, 0, 0, 0.4)",
      fontSize: "12px" },
    }}
    sx={{ 
      height: "40px",
      width: "80px",
      padding: "0px"}}
    onChange={onChange}
    value={value} 
    label={label}
    name={name}
  />
);


export const InfoText = () => (
  <>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        width: "85%",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.02)",
        backdropFilter: "blur(10px)",
        padding: "10px",
        borderRadius: "5px",
      }}
    >
      <Typography variant="body1" color="text.main">
        🚀 MerkEth is a decentralized application (DApp) that brings the classic
        Battleship game to the Ethereum blockchain 🚀
      </Typography>
      <Typography variant="body1" color="text.main">
        🎲 With MerkEth, two players can engage in epic battleship matches,
        leveraging the power of the Ethereum blockchain. ⛓️⚔️
      </Typography>
      <Typography variant="body1" color="text.main">
        🔒 The blockchain ensures fair play by preventing cheating and providing
        a tamper-proof environment for the players. 🔐
      </Typography>
      <Typography variant="body1" color="text.main">
        💰 The blockchain manages the betting and withdrawal system, keeping
        them decentralized, anonymous, and safe. 💵💸
      </Typography>
    </Box>
  </>
);
