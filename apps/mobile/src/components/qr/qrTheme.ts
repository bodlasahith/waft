// components/qr/qrTheme.ts

export const qrTheme = {
  card: {
    radius: 30,

    paddingHorizontal: 28,
    paddingVertical: 30,

    background: "#121826",

    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,

    shadowColor: "#647CFF",
    shadowOpacity: 0.22,
    shadowRadius: 36,
    shadowOffset: {
      width: 0,
      height: 18,
    },

    maxWidth: 420,
  },

  qr: {
    size: 230,

    padding: 26,

    background: "#F9FAFB",

    radius: 26,
  },

  graph: {
    nodeOpacity: 0.08,
    edgeOpacity: 0.06,

    nodeRadius: 3,
  },

  typography: {
    title: 26,
    subtitle: 15,
    footer: 14,
  },

  spacing: {
    xl: 32,
    lg: 24,
    md: 16,
    sm: 10,
  },
};