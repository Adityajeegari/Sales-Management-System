#!/usr/bin/env tsx
/*
  Codemod (ts-morph) template for Clerk -> Sales OS: preview or apply identifier renames.

  WARNING: This script only demonstrates an approach. Always run in a feature branch
  and inspect changes before committing.

  Usage (preview):
    pnpm dlx ts-node scripts/rename-clerk-to-salesos-codemod.ts --dry

  Usage (apply):
    pnpm dlx ts-node scripts/rename-clerk-to-salesos-codemod.ts --apply

*/
import { Project, SyntaxKind } from "ts-morph";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const repoRoot = path.resolve(dirname, "..");
const repoRootUnix = repoRoot.replace(/\\/g, "/");
const project = new Project();
project.addSourceFilesAtPaths([
  `${repoRootUnix}/artifacts/**/*.ts`,
  `${repoRootUnix}/artifacts/**/*.tsx`,
  `${repoRootUnix}/lib/**/*.ts`,
]);

const mapping: Record<string, string> = {
  // identifier renames that are safe to change across TypeScript code
  "clerkUserId": "salesOsUserId",
  "createdByClerkId": "createdBySalesOsId",
};

const dry = process.argv.includes("--dry") || !process.argv.includes("--apply");

function renameIdentifiers() {
  const sourceFiles = project.getSourceFiles();
  for (const sf of sourceFiles) {
    for (const [from, to] of Object.entries(mapping)) {
      const identifiers = sf.getDescendantsOfKind(SyntaxKind.Identifier).filter(id => id.getText() === from);
      if (identifiers.length === 0) continue;
      console.log(`${sf.getFilePath()}: ${identifiers.length} occurrences of ${from}`);
      if (!dry) {
        for (const id of identifiers) id.rename(to);
      }
    }
  }
  if (!dry) project.saveSync();
}

renameIdentifiers();

if (dry) console.log("Dry run complete. Re-run with --apply to modify files.");
