import { Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { unsetLoginSession } from "../../services/authService";

export default function SignOut({ isSignedIn, onSignOut }) {
  const signOut = () => {
    unsetLoginSession();
    onSignOut();
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<LogoutIcon />}
      onClick={signOut}
      sx={{
        position: "absolute",
        top: 16,
        right: 16,
        color: "#ffd700",
        borderColor: "#ffd700",
      }}
    >
      Sign Out
    </Button>
  );
}
