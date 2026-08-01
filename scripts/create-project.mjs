#!/usr/bin/env node
/**
 * Wizard de criação de projeto a partir deste template.
 *
 * Copia o monorepo para um novo diretório, gera .env/.env.local com a
 * identidade do novo produto (nome, descrição, JWT_SECRET), e já deixa o
 * banco de pé: pnpm install -> docker compose up -> db:recreate.
 *
 * Uso: npm run create:project
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { randomBytes } from "node:crypto";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXCLUDE = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
  ".env",
  ".env.local",
]);

export function toKebabCase(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function setEnvValue(content, key, value) {
  const escapedValue = value.replace(/\\/g, "\\\\");
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) {
    return content.replace(pattern, `${key}=${escapedValue}`);
  }
  return `${content}\n${key}=${escapedValue}\n`;
}

function copyTemplate(target) {
  fs.cpSync(ROOT, target, {
    recursive: true,
    filter: (src) => !EXCLUDE.has(path.basename(src)),
  });
}

function writeApiEnv(target, { projectName, displayName }) {
  const examplePath = path.join(target, "apps/api/.env.example");
  let content = fs.readFileSync(examplePath, "utf8");
  content = setEnvValue(content, "APP_NAME", displayName);
  content = setEnvValue(content, "COMPOSE_PROJECT_NAME", projectName);
  content = setEnvValue(content, "JWT_SECRET", randomBytes(48).toString("base64"));
  fs.writeFileSync(path.join(target, "apps/api/.env"), content);
}

function writeWebEnv(target, { displayName, description, emailSupport }) {
  const examplePath = path.join(target, "apps/web/.env.example");
  let content = fs.readFileSync(examplePath, "utf8");
  content = setEnvValue(content, "NEXT_PUBLIC_APP_NAME", displayName);
  content = setEnvValue(content, "NEXT_PUBLIC_APP_DESCRIPTION", description);
  content = setEnvValue(content, "NEXT_PUBLIC_EMAIL_SUPPORT", emailSupport);
  fs.writeFileSync(path.join(target, "apps/web/.env.local"), content);
}

function patchRootPackageName(target, projectName) {
  const pkgPath = path.join(target, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = projectName;
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function patchPackageMetadata(target, { description }) {
  for (const pkgRelPath of ["apps/api/package.json", "apps/web/package.json"]) {
    const pkgPath = path.join(target, pkgRelPath);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if ("description" in pkg) pkg.description = description;
    if ("author" in pkg) pkg.author = "";
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const ask = async (question, fallback) => {
    const answer = (
      await rl.question(fallback ? `${question} (${fallback}): ` : `${question}: `)
    ).trim();
    return answer || fallback || "";
  };

  console.log("Criar novo projeto a partir do template\n");

  const targetInput = await ask("Caminho de destino (ex: ../meu-crm)");
  if (!targetInput) {
    rl.close();
    throw new Error("Caminho de destino é obrigatório.");
  }
  const target = path.resolve(process.cwd(), targetInput);
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    rl.close();
    throw new Error(`Destino "${target}" já existe e não está vazio.`);
  }

  const displayName = await ask("Nome de exibição do produto (ex: Minha Empresa CRM)");
  if (!displayName) {
    rl.close();
    throw new Error("Nome de exibição é obrigatório.");
  }
  const projectName = toKebabCase(displayName);
  const description = await ask(
    "Descrição curta",
    `${displayName} é uma plataforma de CRM para gestão de clientes e leads.`,
  );
  const emailSupport = await ask("E-mail de suporte", `suporte@${projectName}.com.br`);

  rl.close();

  console.log(`\nCriando "${projectName}" em ${target}...`);
  copyTemplate(target);
  writeApiEnv(target, { projectName, displayName });
  writeWebEnv(target, { displayName, description, emailSupport });
  patchRootPackageName(target, projectName);
  patchPackageMetadata(target, { description });

  console.log("\nInstalando dependências (pnpm install)...");
  execSync("pnpm install", { cwd: target, stdio: "inherit" });

  console.log("\nSubindo Postgres + Redis (docker compose)...");
  execSync("docker compose --env-file ../.env up -d --wait", {
    cwd: path.join(target, "apps/api/docker"),
    stdio: "inherit",
  });

  console.log("\nCriando schema do banco (db:recreate)...");
  execSync("npm run db:recreate", {
    cwd: path.join(target, "apps/api"),
    stdio: "inherit",
  });

  console.log(
    `\nPronto. Para rodar:\n  cd ${targetInput}\n  npm run dev\n\n` +
      "Primeiro acesso cai em /setup para criar organização + usuário admin.",
  );
}

main().catch((error) => {
  console.error(`\nErro: ${error.message}`);
  process.exit(1);
});
