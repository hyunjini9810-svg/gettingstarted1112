# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
# Wordmate

주제와 난이도에 맞춰 영어 단어를 배우고 짧은 퀴즈로 복습하는 챗봇입니다.

## 로컬 실행

1. 프로젝트 루트의 `.env.local`에 `OPENAI_API_KEY=` 뒤로 OpenAI API 키를 직접 입력합니다.
2. 최초 실행 시 Vercel CLI 로그인을 요청하면 계정으로 로그인합니다.
3. `npm run dev`를 실행하고 안내된 로컬 주소를 엽니다. `vercel dev`가 Vite 프런트엔드와 `/api/chat` 서버 함수를 함께 실행합니다.

배포할 때는 Vercel 프로젝트 설정의 Environment Variables에 `OPENAI_API_KEY`를 등록하세요. 키는 브라우저 번들에 포함되지 않고 서버 함수에서만 읽습니다.
