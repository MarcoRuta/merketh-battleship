import { TextField } from "@mui/material";

// Custom text field
export const CustomTextField = ({ name, onChange, value, label }) => (
    <TextField
      autoComplete="off"
      inputProps={{
        style: {
          color: "rgba(0, 0, 0, 0.8)",
          borderColor: "black",
          fontSize: "10px",
        },
      }}
      InputLabelProps={{
        style: { color: "rgba(0, 0, 0, 0.4)", fontSize: "12px" },
      }}
      sx={{
        height: "40px",
        width: "80px",
        padding: "0px",
      }}
      onChange={onChange}
      value={value}
      label={label}
      name={name}
    />
  );