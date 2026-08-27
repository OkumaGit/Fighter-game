import { useState } from "react";
import { Box, Paper, Tabs, Tab, Typography } from "@mui/material";
import SignIn from "../signIn";
import SignUp from "../signUp";

export default function SignInSignUpPage({ setIsLoggedIn }) {
  const [tab, setTab] = useState(1);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{ p: 4, width: "100%", maxWidth: 420, borderRadius: 3 }}
      >
        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{ mb: 3, fontWeight: 700 }}
        >
          FIGHTER ARENA
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Sign In" value={0} />
          <Tab label="Sign Up" value={1} />
        </Tabs>
        {tab === 0 ? (
          <SignIn setIsLoggedIn={setIsLoggedIn} />
        ) : (
          <SignUp setIsLoggedIn={setIsLoggedIn} />
        )}
      </Paper>
    </Box>
  );
}
