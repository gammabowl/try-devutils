import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const files = [
  "extension/manifest.json",
  "src-tauri/tauri.conf.json",
  "dist-extension/manifest.json",
];

const packageJsonPath = path.join(projectRoot, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const { version } = packageJson;

if (!version) {
  console.error("package.json has no version field.");
  process.exit(1);
}

const updateJsonVersion = (relativePath) => {
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return;
  }

  const json = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  if (json.version === version) {
    return;
  }

  json.version = version;
  fs.writeFileSync(fullPath, JSON.stringify(json, null, 2) + "\n");
  console.log(`Updated ${relativePath} to version ${version}`);
};

for (const file of files) {
  updateJsonVersion(file);
}
