import React, { createContext, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material";

export const MoodContext = createContext();

export const MoodProvider = ({ children }) => {
  const [mood, setMood] = useState("default");

  const getTheme = () => {
    let color = "#1976d2";
    let type = "light";

    if (mood === "nature") color = "#2e7d32";
    if (mood === "urban") color = "#6200ea";
    if (mood === "ocean") color = "#00bcd4";
    if (mood === "romantic") color = "#d81b60";
    if (mood === "royal") color = "#ffab00";
    if (mood === "midnight") {
      color = "#90caf9";
      type = "dark";
    }

    return createTheme({
      palette: {
        primary: { main: color },
        mode: type,
      },
      typography: {
        fontFamily: "Poppins, sans-serif",
      },
    });
  };

  return (
    <MoodContext.Provider value={{ mood, setMood }}>
      <ThemeProvider theme={getTheme()}>{children}</ThemeProvider>
    </MoodContext.Provider>
  );
};

export default MoodProvider;
