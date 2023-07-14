import { Box } from "@mui/material";

// Custom box
export const StatusBox = ({
    children,
    flexDirection,
    width,
    right,
    bottom,
    left,
  }) => (
    <Box
      sx={{
        display: "flex",
        flexDirection: { flexDirection },
        gap: 1,
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        backdropFilter: "blur(10px)",
        padding: "10px",
        borderRadius: "5px",
        position: "fixed",
        width: { width },
        bottom: { bottom },
        left: { left },
        right: { right },
      }}
    >
      {children}
    </Box>
  );