import { useState, useEffect } from "react";
import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import { getFighters } from "../../services/domainRequest/fightersRequest";
import { startFight } from "../../services/domainRequest/fightRequest";
import NewFighter from "../newFighter";
import Fighter from "../fighter";
import Arena from "../arena";

export default function Fight({ onBattleChange }) {
  const [fighters, setFighters] = useState([]);
  const [fighter1, setFighter1] = useState(null);
  const [fighter2, setFighter2] = useState(null);
  const [view, setView] = useState("select");
  const [fightResult, setFightResult] = useState(null);
  const [savingMessage, setSavingMessage] = useState("");

  useEffect(() => {
    getFighters().then((data) => {
      if (data && !data.error) {
        setFighters(data);
      }
    });
  }, []);

  const onCreate = (fighter) => {
    setFighters((prev) => [...prev, fighter]);
  };

  const fighter1List = fighter2
    ? fighters.filter((f) => f.id !== fighter2.id)
    : fighters;
  const fighter2List = fighter1
    ? fighters.filter((f) => f.id !== fighter1.id)
    : fighters;

  const startBattle = () => {
    setView("battle");
    setFightResult(null);
    setSavingMessage("");
    onBattleChange?.(true);
  };

  const returnToSelect = () => {
    setView("select");
    setFightResult(null);
    setFighter1(null);
    setFighter2(null);
    setSavingMessage("");
    onBattleChange?.(false);
  };

  const handleFightFinish = async (result) => {
    setFightResult(result);

    try {
      const res = await startFight(fighter1.id, fighter2.id);
      if (res && !res.error) {
        setSavingMessage(`Fight saved as winner: ${result.winner.name}`);
      } else {
        setSavingMessage(`Fight finished, but saving failed.`);
      }
    } catch (err) {
      console.error(err);
      setSavingMessage("Fight finished, but saving failed.");
    }
  };

  if (view === "battle") {
    return (
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          pb: 2,
          pt: 2,
        }}
      >
        <Arena
          fighter1={fighter1}
          fighter2={fighter2}
          onFinish={handleFightFinish}
        />

        {fightResult && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.85)",
              zIndex: 10,
              px: 2,
            }}
          >
            <Box
              sx={{
                maxWidth: 520,
                width: "100%",
                bgcolor: "background.paper",
                borderRadius: 3,
                p: 4,
                textAlign: "center",
                boxShadow: 24,
                border: "2px solid #ffd700",
              }}
            >
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  color: "#ffd700",
                  textTransform: "uppercase",
                  fontWeight: 900,
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
                }}
              >
                ⚔️ {fightResult.winner.name} WINS! ⚔️
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: "#b0b0d0" }}>
                {savingMessage ||
                  `Fight saved as winner: ${fightResult.winner.name}`}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={returnToSelect}
              >
                New Game
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4, p: 2 }}>
      <NewFighter onCreated={onCreate} />
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          maxWidth: "1000px",
          mx: "auto",
          mt: 3,
          display: "flex",
          alignItems: "flex-start",
          borderRadius: 3,
        }}
      >
        <Fighter
          selectedFighter={fighter1}
          onFighterSelect={setFighter1}
          fightersList={fighter1List}
        />
        <Divider orientation="vertical" flexItem />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            pt: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            disabled={!fighter1 || !fighter2}
            onClick={startBattle}
            sx={{
              textTransform: "uppercase",
              fontWeight: 900,
              fontSize: "1.1rem",
            }}
          >
            ⚔️ Start Fight ⚔️
          </Button>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Fighter
          selectedFighter={fighter2}
          onFighterSelect={setFighter2}
          fightersList={fighter2List}
        />
      </Paper>
    </Box>
  );
}
