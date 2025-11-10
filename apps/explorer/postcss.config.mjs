import tailwindcss from "@tailwindcss/postcss";

const config = {
  plugins: [
    tailwindcss,
    ...(process.env.NODE_ENV === "production"
      ? [
          [
            "cssnano",
            {
              preset: [
                "default",
                {
                  discardComments: {
                    removeAll: true,
                  },
                  normalizeWhitespace: true,
                },
              ],
            },
          ],
        ]
      : []),
  ],
};

export default config;

