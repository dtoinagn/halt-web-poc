import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
} from "@mui/material";
import HaltModalField from "./HaltModalField";

const HaltReasonSelector = ({
  haltReasons = [],
  value,
  onChange,
  onError,
  loading = false,
  required = true,
  showType = true,
  error: externalError = ""
}) => {
  const [internalError, setInternalError] = useState("");

  const handleHaltReasonChange = useCallback((event, newValue) => {
    // Clear any existing errors
    setInternalError("");
    if (onError) onError("");

    // Special handling for haltReason selection
    if (newValue && (newValue.description === "Single Stock Circuit Breaker" || newValue.description === "Market Wide Circuit Breaker")) {
      const errorMsg = "You cannot select this halt reason. Circuit Breaker halts are created automatically by the system.";
      setInternalError(errorMsg);
      // Still call onChange but with the invalid value to show it in the UI
      onChange(newValue);
      return;
    }

    // Clear internal error and call parent onChange
    setInternalError("");
    if (onError) onError("");
    onChange(newValue);
  }, [onChange, onError]);

  const haltReasonType = value ? value.type : "";
  const displayError = internalError;

  return (
    <>
      <Box className="cancel-halt-field-container">
        <Typography className="cancel-halt-label">
          Halt Reason {required && <span style={{ color: "red" }}>*</span>}
        </Typography>
        <Box sx={{ flex: 1 }}>
          <Autocomplete
            options={haltReasons}
            getOptionLabel={(option) => option.description || option}
            value={value}
            onChange={handleHaltReasonChange}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                variant="outlined"
                required={required}
                error={!!displayError}
                InputProps={{
                  ...params.InputProps,
                  style: { backgroundColor: "white", height: "36px" },
                }}
              />
            )}
          />
        </Box>
      </Box>
      {displayError && (
        <Typography
          variant="body2"
          className="create-halt-error-text-light"
        >
          {displayError}
        </Typography>
      )}
      {showType && (
        <HaltModalField
          label="Halt Reason Type"
          value={haltReasonType}
        />
      )}
    </>
  );
};

export default HaltReasonSelector;