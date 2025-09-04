import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Button,
  MenuItem,
  Grid
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

export default function CreateNewHaltModal({ open, onClose, onSubmit, securities, haltReasons }) {
  const [form, setForm] = useState({
    haltId: '',
    symbol: '',
    issueName: '',
    listingMarket: '',
    allIssue: '',
    haltTime: dayjs(),
    resumptionTime: '',
    cancelTime: '',
    extendedHalt: false, 
    haltReason: '',
    remainReason: '',
    status: 'Halted',
    haltType: 'REG',
    createdBy: localStorage.getItem('loggedInUser') || '',
    createdTime: '',
    modifiedBy: '', 
    modifiedTime: '',
    sscbSrc: '',
    responseMessage: '' ,
    action: 'CreateImmediateHalt',
    comment: ''
  });

  const [errors, setErrors] = useState({
    symbol: false,
    allIssue: false,
  });

  const handleSymbolChange = (event, newValue) => {
    if (newValue) {
      setForm({
        ...form,
        symbol: newValue.symbol || '',
        issueName: newValue.securityName || '',
        listingMarket: newValue.listingMarket || ''
      });
    }

    if (newValue?.symbol) {
      setErrors((prev) => ({ ...prev, symbol: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setErrors((prev) => ({ ...prev, allIssue: false }));
  };

  async function sendNewImmediateHalt(form) {    
    const token = localStorage.getItem('token');
    const { apiNewHalt } = window.runConfig;

    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    try {
      console.log("debug new immediate halt", JSON.stringify(form))
      const response = await fetch(`${apiNewHalt}`, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(form)
      })

    } catch (err) {
      console.log("there is an error publishing new halt", err)
    }
  }

  const handleSubmit = () => {
    const symbolMissing = !form.symbol || form.symbol === '';
    const allIssueMissing = !form.allIssue || (form.allIssue !== 'Yes' && form.allIssue !== 'No');

    setErrors({
      symbol: symbolMissing,
      allIssue: allIssueMissing,
    });

    if (symbolMissing || allIssueMissing) {
      return; 
    }

    let formattedAllIssues = form.allIssue == "Yes" ? true : false
    let formattedHaltTime = form.haltTime?.format('YYYYMMDD-HH:mm:ss.SSS') || ''
    const createdTime = dayjs().format('YYYYMMDD-HH:mm:ss.SSS');

    const formattedForm = {
      ...form,
      haltTime: formattedHaltTime,
      allIssue: formattedAllIssues,
      createdTime: createdTime
    };
  
    sendNewImmediateHalt(formattedForm);

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Create Halt</DialogTitle>
      <DialogContent className="dialogContentCustom">
        <Grid container spacing={1.5} mt={1}>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={securities}
              getOptionLabel={(option) => `${option.symbol} - ${option.securityName} - ${option.listingMarket}`}
              onChange={handleSymbolChange}
              renderInput={(params) => (
                <TextField {...params} label="Symbol" required 
                error={errors.symbol}
                helperText={errors.symbol ? 'Symbol is required' : ''}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Issue Name" fullWidth disabled value={form.issueName} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Listing Market" fullWidth disabled value={form.listingMarket} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="All Issues"
              name="allIssue"
              value={form.allIssue}
              onChange={handleInputChange}
              error={errors.allIssue}
              helperText={errors.allIssue ? 'Please select All Issues' : ''}
              fullWidth
              required
            >
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Halt Time *"
                value={form.haltTime}
                onChange={() => {}}
                disabled
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </LocalizationProvider>
          </Grid>
           <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="immediateHalt"
                  checked={true}
                />
              }
              label="Immediate Halt"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Halt Reason"
              name="haltReason"
              value={form.haltReason}
              onChange={handleInputChange}
              fullWidth
            >
              {haltReasons.map((reason) => (
                <MenuItem key={reason.code} value={reason.description}>{reason.description}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Halt Type" value="REG" fullWidth disabled />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Created By" value={form.createdBy} fullWidth disabled />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="dialogActionsCustom">
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Create</Button>
      </DialogActions>
    </Dialog>
  );
}