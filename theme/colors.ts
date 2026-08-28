export const Colors = {
  background: "#FAF3EE",
  primary: "#4A2B20",
  secondary: "#D89A92",
  white: "#FFFFFF",
  black: "#000000",
  gray: {
    100: "#F5F5F5",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
  },
} as const;

export type ColorKey = keyof typeof Colors;
