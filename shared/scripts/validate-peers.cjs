const fs = require("node:fs");
const path = require("node:path");

const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const peerDeps = pkg.peerDependencies || {};

const parseVersion = (version) => {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
};

const compare = (left, right) => {
  if (left.major !== right.major) return left.major - right.major;
  if (left.minor !== right.minor) return left.minor - right.minor;
  return left.patch - right.patch;
};

const satisfiesRange = (version, range) => {
  const parsed = parseVersion(version);
  if (!parsed) {
    return false;
  }

  const parts = range.split(/\s+/).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith(">=")) {
      const limit = parseVersion(part.slice(2));
      if (!limit || compare(parsed, limit) < 0) return false;
      continue;
    }
    if (part.startsWith(">")) {
      const limit = parseVersion(part.slice(1));
      if (!limit || compare(parsed, limit) <= 0) return false;
      continue;
    }
    if (part.startsWith("<=")) {
      const limit = parseVersion(part.slice(2));
      if (!limit || compare(parsed, limit) > 0) return false;
      continue;
    }
    if (part.startsWith("<")) {
      const limit = parseVersion(part.slice(1));
      if (!limit || compare(parsed, limit) >= 0) return false;
      continue;
    }
    const exact = parseVersion(part.replace(/^v/, ""));
    if (!exact || compare(parsed, exact) !== 0) return false;
  }

  return true;
};

const satisfies = (version, range) => {
  const alternatives = range.split("||").map((entry) => entry.trim()).filter(Boolean);
  return alternatives.some((entry) => satisfiesRange(version, entry));
};

let hasError = false;

for (const [name, range] of Object.entries(peerDeps)) {
  try {
    const depPkgPath = require.resolve(`${name}/package.json`, {
      paths: [process.cwd()],
    });
    const depPkg = JSON.parse(fs.readFileSync(depPkgPath, "utf8"));
    const version = depPkg.version;
    if (!version || !satisfies(version, range)) {
      console.error(
        `Peer dependency ${name}@${range} not satisfied (installed ${version || "unknown"}).`,
      );
      hasError = true;
    }
  } catch (error) {
    console.error(`Missing peer dependency ${name}@${range}.`);
    hasError = true;
  }
}

if (hasError) {
  process.exitCode = 1;
}
