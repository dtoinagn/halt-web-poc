import { useState, useCallback, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Autocomplete,
    TextField,
} from "@mui/material";
import { apiService } from "../../../services/api";
import { authUtils } from "../../../utils/storageUtils";
import { HALT_ACTIONS } from "../../../constants";
import HaltModalField from "./HaltModalField";
import "./CreateNewHaltModal.css";
import dayjs from "dayjs";

const EditHaltReasonModal = ({ open, onClose, haltData, haltReasons = [], onHaltUpdated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [haltReasonError, setHaltReasonError] = useState("");
    const [formData, setFormData] = useState({
        haltReason: null,
    });

    // Update form data when haltData changes
    useEffect(() => {
        if (haltData) {
            // Find matching halt reason
            const matchedHaltReason = haltReasons.find(
                (reason) => reason.description === haltData.haltReason
            );

            setFormData({
                haltReason: matchedHaltReason || null,
            });
            setError("");
            setHaltReasonError("");
        }
    }, [haltData, haltReasons]);

    const handleClose = useCallback(() => {
        if (!loading) {
            setError("");
            setHaltReasonError("");
            onClose();
        }
    }, [loading, onClose]);

    const handleHaltReasonChange = useCallback((field, value) => {
        setError("");
        // Special handling for haltReason selection
        if (value && (value.description === "Single Stock Circuit Breaker" || value.description === "Market Wide Circuit Breaker")) {
            // Clear the value and show an error
            setHaltReasonError("You cannot select this halt reason. Circuit Breaker halts are created automatically by the system.");
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));
            return;
        }
        setHaltReasonError("");

        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const handleConfirm = useCallback(async () => {
        setError("");

        try {
            if (!haltData) {
                throw new Error("No halt data available");
            }

            // Validate halt reason is selected
            if (!formData.haltReason) {
                throw new Error("Please select a halt reason");
            }

            // Guard against circuit breaker halts
            if (formData.haltReason && (formData.haltReason.description === "Single Stock Circuit Breaker" || formData.haltReason.description === "Market Wide Circuit Breaker")) {
                throw new Error("You cannot select this halt reason. Circuit Breaker halts are created automatically by the system.");
            }

            setLoading(true);

            // Build the payload
            const payload = {
                ...haltData,
                haltReason: formData.haltReason.description,
                lastModifiedBy: authUtils.getLoggedInUser() || "",
                action: HALT_ACTIONS.MODIFY_HALT_DETAILS,
            };

            await apiService.updateHalt(payload);

            // Call onHaltUpdated callback if provided
            if (onHaltUpdated) {
                await onHaltUpdated();
            }

            handleClose();
        } catch (err) {
            console.error("Failed to update halt reason:", err);
            setError(err.message || "Failed to update halt reason. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [haltData, formData, handleClose, onHaltUpdated]);

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            onClose={(event, reason) => {
                if (reason === "backdropClick") {
                    return; // Prevent closing on backdrop click
                }
                handleClose();
            }}
            slotProps={{
                paper: {
                    className: "cancel-halt-dialog-paper",
                },
            }}
        >
            <DialogTitle className="cancel-halt-dialog-title">
                <Typography
                    variant="h6"
                    component="div"
                    className="cancel-halt-dialog-title-text"
                >
                    Edit Halt Reason
                </Typography>
            </DialogTitle>

            <DialogContent className="cancel-halt-dialog-content">
                {error && (
                    <Box className="create-halt-error-message">
                        <Typography className="create-halt-error-text">{error}</Typography>
                    </Box>
                )}

                <Typography className="cancel-halt-confirmation-text">
                    Please modify the halt reason as required:
                </Typography>

                <HaltModalField label="Halt Event ID" value={haltData?.haltId} />

                <HaltModalField label="Symbol" value={haltData?.symbol} />

                <HaltModalField
                    label="Halt Time"
                    value={haltData?.haltTime ? dayjs(haltData.haltTime).format("YYYY-MM-DD HH:mm:ss.SSS") : ""}
                />

                <HaltModalField
                    label="All Issues"
                    value={haltData?.allIssue === "Yes" || haltData?.allIssue === "true" ? "Yes" : "No"}
                />

                <Box className="cancel-halt-field-container">
                    <Typography className="cancel-halt-label">
                        Halt Reason <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                        <Autocomplete
                            fullWidth
                            value={formData.haltReason}
                            onChange={(event, newValue) => handleHaltReasonChange("haltReason", newValue)}
                            options={haltReasons}
                            getOptionLabel={(option) => option.description || ""}
                            isOptionEqualToValue={(option, value) =>
                                option.description === value?.description
                            }
                            disabled={loading}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select halt reason..."
                                    error={!!haltReasonError}
                                    InputProps={{
                                        ...params.InputProps,
                                        style: { backgroundColor: "white", height: "36px" },
                                    }}
                                />
                            )}
                        />
                    </Box>
                </Box>

                {haltReasonError && (
                    <Typography
                        variant="body2"
                        className="create-halt-error-text-light"
                    >
                        {haltReasonError}
                    </Typography>
                )}

                <HaltModalField
                    label="Halt Reason Type"
                    value={formData.haltReason ? formData.haltReason.type : ""}
                />
            </DialogContent>

            <DialogActions className="cancel-halt-dialog-actions">
                <Button
                    onClick={handleConfirm}
                    disabled={loading}
                    variant="contained"
                    className="create-halt-submit-button"
                >
                    {loading ? "Saving..." : "Confirm"}
                </Button>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    className="cancel-halt-close-button"
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditHaltReasonModal;