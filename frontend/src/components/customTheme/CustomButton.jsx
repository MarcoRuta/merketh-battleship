import { Button } from "@mui/material";

// Custom Button
export const CustomButton = ({ onClick, children, width }) => (
  <Button
    type="submit"
    color="primary"
    onClick={onClick}
    sx={{
      width: { width },
    }}
  >
    {children}
  </Button>
);