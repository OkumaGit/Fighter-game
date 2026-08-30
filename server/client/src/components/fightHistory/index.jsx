import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  Collapse,
  Divider,
  Grid,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getFights } from "../../services/domainRequest/fightRequest";
import { getFighters } from "../../services/domainRequest/fightersRequest";

export default function FightHistory() {
  const [fights, setFights] = useState([]);
  const [fighters, setFighters] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    Promise.all([getFights(), getFighters()]).then(
      ([fightsData, fightersData]) => {
        if (fightsData && !fightsData.error) setFights(fightsData);
        if (fightersData && !fightersData.error) setFighters(fightersData);
      },
    );
  }, []);

  const getFighterName = (fighterId) => {
    const fighter = fighters.find((f) => f.id === fighterId);
    return fighter ? fighter.name : fighterId;
  };

  const getRoundStats = (log) => {
    if (!log || !Array.isArray(log)) return null;
    const lastRound = log[log.length - 1];
    return {
      totalRounds: log.length,
      lastRound: lastRound,
    };
  };

  if (!fights || fights.length === 0)
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography sx={{ color: "#b0b0d0" }}>No fights yet.</Typography>
      </Box>
    );

  return (
    <Paper
      elevation={2}
      sx={{
        m: 2,
        p: 3,
        maxWidth: "800px",
        mx: "auto",
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: "#ffd700",
          textTransform: "uppercase",
          fontWeight: 900,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
        }}
      >
        ⚔️ BATTLE REPORTS
      </Typography>
      <Divider sx={{ my: 2, borderColor: "rgba(255, 215, 0, 0.2)" }} />
      <List sx={{ width: "100%" }}>
        {fights.map((f, index) => {
          const stats = getRoundStats(f.log);
          const fighter1Name = getFighterName(f.fighter1);
          const fighter2Name = getFighterName(f.fighter2);
          const isExpanded = expandedId === f.id;

          return (
            <Box key={f.id}>
              <Card
                onClick={() => setExpandedId(isExpanded ? null : f.id)}
                sx={{
                  mb: 1.5,
                  background: "rgba(255, 215, 0, 0.08)",
                  border: `2px solid ${
                    isExpanded
                      ? "rgba(255, 215, 0, 0.4)"
                      : "rgba(255, 215, 0, 0.15)"
                  }`,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "rgba(255, 215, 0, 0.12)",
                    borderColor: "rgba(255, 215, 0, 0.3)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardContent sx={{ pb: "16px !important" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#ffd700",
                            fontWeight: 900,
                            fontSize: "1.1rem",
                          }}
                        >
                          {fighter1Name}
                        </Typography>
                        <Typography sx={{ color: "#b0b0d0" }}>vs</Typography>
                        <Typography
                          sx={{
                            color: "#ffd700",
                            fontWeight: 900,
                            fontSize: "1.1rem",
                          }}
                        >
                          {fighter2Name}
                        </Typography>
                      </Box>

                      <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={12} sm="auto">
                          <Chip
                            icon="👑"
                            label={`Winner: ${getFighterName(f.winner)}`}
                            sx={{
                              background: "rgba(255, 215, 0, 0.2)",
                              color: "#ffd700",
                              fontWeight: 700,
                            }}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm="auto">
                          <Chip
                            icon="🥊"
                            label={`${stats?.totalRounds || 0} Rounds`}
                            sx={{
                              background: "rgba(192, 132, 252, 0.2)",
                              color: "#c084fc",
                            }}
                            size="small"
                          />
                        </Grid>
                      </Grid>

                      <Typography
                        sx={{
                          color: "#b0b0d0",
                          fontSize: "0.85rem",
                        }}
                      >
                        {new Date(f.createdAt).toLocaleString()}
                      </Typography>
                    </Box>

                    <ExpandMoreIcon
                      sx={{
                        transform: isExpanded
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.3s",
                        color: "#ffd700",
                        ml: 2,
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: 2,
                    p: 3,
                    mb: 2,
                    border: "1px solid rgba(255, 215, 0, 0.15)",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#ffd700",
                      fontWeight: 700,
                      mb: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    Fight Log ({stats?.totalRounds || 0} Rounds)
                  </Typography>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {f.log && Array.isArray(f.log) ? (
                      f.log.map((round, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            background: "rgba(255, 215, 0, 0.05)",
                            border: "1px solid rgba(255, 215, 0, 0.1)",
                            borderRadius: 1,
                            p: 2,
                          }}
                        >
                          <Typography
                            sx={{
                              color: "#ffd700",
                              fontWeight: 700,
                              mb: 1,
                              fontSize: "0.95rem",
                            }}
                          >
                            Round {round.round}
                          </Typography>

                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography
                                  sx={{
                                    color: "#c084fc",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    mb: 0.5,
                                  }}
                                >
                                  {fighter1Name}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                                  <Chip
                                    label={`🤜 ${round.fighter1Shot || 0} DMG`}
                                    size="small"
                                    sx={{
                                      background: "rgba(76, 175, 80, 0.2)",
                                      color: "#4caf50",
                                      fontSize: "0.75rem",
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{
                                    color: "#b0b0d0",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  ❤️ {round.fighter1Health || 0} HP
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography
                                  sx={{
                                    color: "#c084fc",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    mb: 0.5,
                                  }}
                                >
                                  {fighter2Name}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                                  <Chip
                                    label={`🤜 ${round.fighter2Shot || 0} DMG`}
                                    size="small"
                                    sx={{
                                      background: "rgba(76, 175, 80, 0.2)",
                                      color: "#4caf50",
                                      fontSize: "0.75rem",
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{
                                    color: "#b0b0d0",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  ❤️ {round.fighter2Health || 0} HP
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: "#b0b0d0" }}>
                        No round data available
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Collapse>

              {index < fights.length - 1 && (
                <Divider
                  sx={{ my: 2, borderColor: "rgba(255, 215, 0, 0.1)" }}
                />
              )}
            </Box>
          );
        })}
      </List>
    </Paper>
  );
}
