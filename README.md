# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

pub enum AlarmStatus {
Unknown,
Pending, // Primed.
Open, // Escalated.
Closed, // Alarm closed after escalation.
Cancelled, // User cancelled.
CancelledNoCoverage,
CancelledNoPersonnel,
}

Vakta { #[serde(default = "util::new_guid_v4")]
id: String,

        #[serde(skip_serializing_if = "util::is_false")]
        #[serde(default)]
        deleted: bool,

        #[serde(skip_serializing_if = "util::is_false")]
        #[serde(default)]
        test: bool,

        #[serde(skip_serializing_if = "Option::is_none")]
        #[serde(default)]
        office_id: Option<String>,

        #[serde(skip_serializing_if = "Option::is_none")]
        #[serde(default)]
        personnel_id: Option<String>,

        user_id: String,

        membership_id: String,

        // Partial response field.
        #[serde(skip_serializing_if = "Option::is_none")]
        #[serde(default)]
        user: Option<User>,

        status: AlarmStatus,

        locations: Vec<AlarmLocation>,

        #[serde(skip_serializing_if = "Option::is_none")]
        #[serde(default)]
        escalated: Option<u32>, // Position in location array where escalation happened.

        #[serde(default = "Utc::now")]
        modified: DateTime<Utc>,
    },
