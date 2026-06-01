import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ffd700",
    },
    secondary: {
      main: "#c084fc",
    },
    background: {
      default: "#0f0f1e",
      paper: "rgba(26, 26, 46, 0.85)",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0d0",
    },
  },
  typography: {
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    h4: {
      textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
      fontWeight: 700,
    },
    h5: {
      textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
      fontWeight: 700,
    },
    h6: {
      textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "rgba(26, 26, 46, 0.9)",
          border: "1px solid rgba(255, 215, 0, 0.2)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "uppercase",
          fontWeight: 700,
          letterSpacing: "0.08em",
        },
        contained: {
          background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
          color: "#0f0f1e",
          "&:hover": {
            background: "linear-gradient(135deg, #ffed4e 0%, #ffd700 100%)",
          },
        },
        outlined: {
          borderColor: "#ffd700",
          color: "#ffd700",
          "&:hover": {
            background: "rgba(255, 215, 0, 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            color: "#ffffff",
            background: "rgba(0, 0, 0, 0.3)",
            "& fieldset": {
              borderColor: "rgba(255, 215, 0, 0.3)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255, 215, 0, 0.6)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#ffd700",
            },
          },
          "& .MuiInputBase-input::placeholder": {
            color: "#b0b0d0",
            opacity: 0.7,
          },
          "& .MuiInputLabel-root": {
            color: "#b0b0d0",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#ffd700",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          color: "#ffffff",
          background: "rgba(0, 0, 0, 0.3)",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 215, 0, 0.3)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 215, 0, 0.6)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffd700",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          background: "rgba(255, 215, 0, 0.15)",
          color: "#ffd700",
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "#b0b0d0",
          "&.Mui-selected": {
            color: "#ffd700",
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 215, 0, 0.1)",
        },
      },
    },
  },
});

export default theme;
