
# Dirty RAG

## Description

Simple and stupid local RAG chatbot in TypeScript

This relies on:
* ollama (backend)
* nodejs (script part)
  * vectra (json file system vector store)
  * tsx (typescript file executer)

## How To Install:

```bash
# here assuming ollama is installed
ollama serve # if not running
ollama pull nomic-embed-text:latest
ollama pull mistral:latest

# here assuming nodejs is installed
npm install
```

## How To Run:
```bash
npx tsx ./src/index.ts
```

