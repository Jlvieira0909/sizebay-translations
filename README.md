<div align="center">

# 🌍 Sizebay Translator

**Editor lado a lado para os textos do provador virtual e da tabela de medidas — em 30+ idiomas, sem sair do navegador.**

Escolha os idiomas, encontre o texto pelas palavras que aparecem na loja, edite todos em paralelo e baixe os arquivos prontos para subir.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

[**🔗 Acessar a ferramenta**](https://sizebay-translations.vercel.app)

</div>

---

## 📖 Sobre o projeto

Os textos do provador virtual da Sizebay vivem em arquivos JSON, um por idioma. Traduzir ou corrigir uma frase significava abrir vários arquivos em paralelo, procurar a chave certa no meio de centenas e não errar a estrutura — um processo lento e fácil de quebrar.

O **Sizebay Translator** transforma isso numa tela só: você busca pelo texto que o cliente vê na loja, e a ferramenta mostra a mesma chave em todos os idiomas selecionados, prontos para edição simultânea.

> 🔒 **Nada sai do navegador.** Os arquivos são lidos com a File API, editados em memória e devolvidos por download. Os originais no disco nunca são tocados.

## ✨ Funcionalidades

- 🔎 **Busca pelo texto visível** — encontre a chave pelo conteúdo, não pelo caminho no JSON
- 🌐 **Edição lado a lado** — todos os idiomas escolhidos na mesma tela
- 📁 **Duas fontes de dados** — use os textos padrão embarcados ou faça upload dos seus arquivos
- 🗂️ **Navegação por seção** — trilha lateral para percorrer os grupos de textos
- 📝 **Registro de mudanças** — gaveta com tudo que foi alterado (antes → depois) antes de exportar
- 🔤 **Suporte a RTL** — árabe e hebraico renderizam na direção correta
- ➕ **Chaves faltantes** — uma chave ausente aparece com borda tracejada; digitar nela cria a chave
- ⬇️ **Export só do que mudou** — cada idioma alterado baixa como `<arquivo>.changes.json`, só com as chaves editadas e o aninhamento original, pronto para mesclar com o arquivo do S3 sem sobrescrever chaves customizadas do cliente

## 🗣️ Idiomas suportados

Mais de 30 locales organizados por grupo — **Português & Espanhol**, **Europa Ocidental**, **Nórdicos**, **Europa Central & Oriental**, **Oriente Médio** e **Ásia & Pacífico**.

> ⚠️ Os códigos seguem a convenção interna da Sizebay, que não é ISO padrão. Atenção especial a:
>
> | Código | Idioma | Observação |
> | ------ | ------ | ---------- |
> | `br` | Português (Brasil) | Brasil é `br`, **não** `pt-BR` |
> | `pt` | Português (Portugal) | — |
> | `esAR` | Espanhol (Argentina) | Camel case importa |
> | `esCT` | Espanhol (Castelhano) | Camel case importa |
> | `mx` | Espanhol (México) | — |

## 🛠️ Stack

| Tecnologia | Versão | Uso |
| ---------- | ------ | --- |
| [Next.js](https://nextjs.org/) | 16 | Framework React (App Router) |
| [React](https://react.dev/) | 19 | Biblioteca de UI |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Tipagem estática |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Base de estilos |
| File API + Blob | — | Leitura e download local, sem backend |

**Zero dependências extras.** Next, React e as APIs do DOM cobrem tudo, incluindo o download.

## 🚀 Como rodar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- npm, yarn, pnpm ou bun

### Instalação

```bash
git clone https://github.com/Jlvieira0909/sizebay-translations.git
cd sizebay-translations
npm install
```

### Carregando os textos padrão

Para que ninguém precise fazer upload só para começar, os arquivos padrão ficam em `public/locales`. Aponte o script para a pasta que você já tem:

```bash
node scripts/prepare-locales.mjs ~/sizebay/locales
```

O script lê todo `.json` da pasta (incluindo um nível de subpastas), valida o parse, deduz o idioma pelo nome do arquivo — `br.json`, `pt-BR.json` e `translations.esAR.json` todos resolvem — copia para `public/locales/<código>.json` e gera o `manifest.json` que o app lê ao carregar.

A pasta de origem nunca é modificada, e rodar de novo é seguro: é assim que você atualiza os textos padrão quando eles mudam.

```
public/locales — 24 idiomas instalados

  br       462 textos   br.json
  es       462 textos   es.json
  esAR     460 textos   esAR.json
  …
```

> Sem `public/locales` o app funciona normalmente — ele apenas oferece o caminho de upload e explica como adicionar os padrões.

### Executando

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run start    # servir o build
npm run lint     # ESLint
```

Abra [http://localhost:3000](http://localhost:3000).

## 📁 Estrutura

```
sizebay-translations/
├── app/                    # layout, página e design system (globals.css)
├── components/             # 12 componentes de UI
│   ├── SetupScreen.tsx     #   escolha de fonte e idiomas
│   ├── EditorScreen.tsx    #   tela principal de edição
│   ├── ChangesDrawer.tsx   #   gaveta de alterações
│   └── ...
├── lib/                    # 8 módulos de lógica
│   ├── locales.ts          #   catálogo de idiomas e grupos
│   ├── parse.ts            #   flatten/unflatten dos JSONs
│   ├── search.ts           #   busca pelo texto visível
│   ├── files.ts            #   leitura e download
│   └── store.tsx           #   estado global
├── public/locales/         # textos padrão + manifest.json
└── scripts/
    └── prepare-locales.mjs # instalador dos textos padrão
```

## 🎨 Detalhes de implementação

- **`globals.css` carrega o design system inteiro** e não importa Tailwind. Se você quiser manter Tailwind para outras páginas, basta devolver `@import "tailwindcss";` como primeira linha — nada aqui depende disso.
- **Path alias `@/*`** aponta para a raiz. Se o seu `tsconfig.json` aponta para `./src/*`, mova `app/`, `components/` e `lib/` para dentro de `src/`.
- **Fontes** (Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono) vêm do Google Fonts via `app/layout.tsx` — troque por `next/font` se preferir self-host.

## 🌐 Deploy

Hospedado na [Vercel](https://vercel.com/): **[sizebay-translations.vercel.app](https://sizebay-translations.vercel.app)**

---

<div align="center">

Feito com ❤️ por [João Luiz Vieira](https://github.com/Jlvieira0909)

</div>
