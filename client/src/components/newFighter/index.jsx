import { useState } from "react";
import { TextField, Button, Stack, Paper, Typography } from "@mui/material";
import { createFighter } from "../../services/domainRequest/fightersRequest";

export default function NewFighter({ onCreated }) {
  const [name, setName] = useState();
  const [power, setPower] = useState();
  const [defense, setDefense] = useState();

  const onNameChange = (event) => {
    setName(event.target.value);
  };

  const onPowerChange = (event) => {
    const value =
      event.target.value || event.target.value === 0
        ? Number(event.target.value)
        : null;
    setPower(value);
  };

  const onDefenseChange = (event) => {
    const value =
      event.target.value || event.target.value === 0
        ? Number(event.target.value)
        : null;
    setDefense(value);
  };

  const onSubmit = async () => {
    const data = await createFighter({ name, power, defense });
    if (data && !data.error) {
      onCreated(data);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{ p: 4, width: "50%", mx: "auto", mt: 2, borderRadius: 3 }}
    >
      <Typography variant="h6" align="center" gutterBottom sx={{ mb: 3 }}>
        New Fighter
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Name"
          value={name}
          onChange={onNameChange}
          size="small"
          fullWidth
        />
        <TextField
          label="Power"
          type="number"
          value={power}
          onChange={onPowerChange}
          size="small"
          fullWidth
        />
        <TextField
          label="Defense"
          type="number"
          value={defense}
          onChange={onDefenseChange}
          size="small"
          fullWidth
        />
        <Button variant="contained" onClick={onSubmit} fullWidth>
          Create
        </Button>
      </Stack>
    </Paper>
  );
}
