/** @type {import('tailwindcss').Config} */

import { COLORS } from "./src/libs/tailwindCss/designToken/color";
import { FONT_SIZE } from "./src/libs/tailwindCss/designToken/fontSize";

export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                ...COLORS,
            },
            fontSize: {
                ...FONT_SIZE,
            },
            screens: {
                xl: "1600px",
                lg: "1200px",
                bg: "1000px",
                md: "800px",
                sm: "600px",
                ti: "400px",
            },
            backgroundImage: {
                "main-background": "url('/src/assets/imgs/mainBackground.png')",
            },

            keyframes: {
                roll: {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                },
            },
            animation: {
                roll: "roll 2s linear infinite",
            },
            fontFamily: {
                DungGeunMo: ["DungGeunMo"],
            },
        },
        plugins: [],
    },
};
