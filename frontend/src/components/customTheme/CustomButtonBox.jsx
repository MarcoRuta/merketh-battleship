import { Box } from "@mui/material";

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
  