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
import { getFighterSource } from "../../constants/fighterAssets";

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
        <Select
          value={value}
          label="Select Fighter"
          onChange={handleChange}
          displayEmpty
          renderValue={(selected) => {
            const fighter = fightersList.find((item) => item.id === selected);

            if (!fighter) {
              return <em>None</em>;
            }

            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  component="img"
                  src={getFighterSource(fighter)}
                  alt={fighter.name}
                  sx={{
                    width: 28,
                    height: 28,
                    objectFit: "contain",
                    borderRadius: 1,
                  }}
                />
                <span>{fighter.name}</span>
              </Box>
            );
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {fightersList.map((f) => (
            <MenuItem
              key={f.id}
              value={f.id}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box
                component="img"
                src={getFighterSource(f)}
                alt={f.name}
                sx={{
                  width: 32,
                  height: 32,
                  objectFit: "contain",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <span>{f.name}</span>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selectedFighter && (
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              component="img"
              src={getFighterSource(selectedFighter)}
              alt={selectedFighter.name}
              sx={{
                width: 72,
                height: 72,
                objectFit: "contain",
                borderRadius: 2,
                bgcolor: "rgba(0, 0, 0, 0.18)",
                p: 0.5,
              }}
            />
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ color: "#ffd700" }}
            >
              {selectedFighter.name}
            </Typography>
          </Box>
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
