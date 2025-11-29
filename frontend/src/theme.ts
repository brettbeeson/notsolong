import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#3f2afc",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#c400ff",
    },
    background: {
      default: "#f4f5ff",
      paper: "#ffffff",
    },
    error: {
      main: "#ff2975",
    },
    text: {
      primary: "#1d1f2e",
      secondary: "#9aa0c2",
    },
    divider: "#e1e4f5",
    grey: {
      100: "#f6f7fc",
      200: "#e1e4f5",
      300: "#c7cce7",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 999,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          padding: "4px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
  },
});

export default theme;
