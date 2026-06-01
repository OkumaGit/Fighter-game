import { useState } from "react";
import { Box } from "@mui/material";
import SignInUpPage from "../signInUpPage";
import { isSignedIn } from "../../services/authService";
import Fight from "../fight";
import FightHistory from "../fightHistory";
import SignOut from "../signOut";

export default function StartScreen() {
  const [loggedIn, setLoggedIn] = useState(isSignedIn());
  const [isBattleActive, setIsBattleActive] = useState(false);

  if (!loggedIn) {
    return <SignInUpPage setIsLoggedIn={setLoggedIn} />;
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        zIndex: 1,
      }}
    >
      <Fight onBattleChange={setIsBattleActive} />
      {!isBattleActive && <FightHistory />}
      <SignOut isSignedIn={loggedIn} onSignOut={() => setLoggedIn(false)} />
    </Box>
  );
}
