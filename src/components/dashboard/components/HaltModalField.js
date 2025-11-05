import { Box, Typography } from "@mui/material";
import "./CreateNewHaltModal.css";

const HaltModalField = ({ label, value, isLink = false }) => {
  return (
    <Box className="cancel-halt-field-container">
      <Typography className="cancel-halt-label">{label}</Typography>
      <Box className="cancel-halt-value-box">
        <Typography
          className="cancel-halt-value-text"
          sx={isLink ? { color: "#1976d2", textDecoration: "underline" } : {}}
        >
          {value || ""}
        </Typography>
      </Box>
    </Box>
  );
};

export default HaltModalField;
