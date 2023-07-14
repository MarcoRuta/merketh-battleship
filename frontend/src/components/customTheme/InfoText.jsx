import { Button, Box, Typography, TextField } from "@mui/material";

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
  