import { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
} from "@mui/material";

export default function Fighter({
  fightersList,
  onFighterSelect,
  selectedFighter,
}) {
  const [value, setValue] = useState("");

  const handleChange = (event) => {
    const fighter =
      fightersList.find((f) => f.id === event.target.value) || null;
    setValue(event.target.value);
    onFighterSelect(fighter);
  };

  return (
    <Box sx={{ p: 2, flex: 1 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Select Fighter</InputLabel>
        <Select value={value} label="Select Fighter" onChange={handleChange}>
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {fightersList.map((f) => (
            <MenuItem key={f.id} value={f.id}>
              {f.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selectedFighter && (
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ color: "#ffd700" }}
          >
            {selectedFighter.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`⚡ ${selectedFighter.power}`}
              sx={{ background: "rgba(255, 215, 0, 0.2)", color: "#ffd700" }}
              size="small"
            />
            <Chip
              label={`🛡️ ${selectedFighter.defense}`}
              sx={{ background: "rgba(192, 132, 252, 0.2)", color: "#c084fc" }}
              size="small"
            />
            <Chip
              label={`❤️ ${selectedFighter.health}`}
              sx={{ background: "rgba(76, 175, 80, 0.2)", color: "#4caf50" }}
              size="small"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
