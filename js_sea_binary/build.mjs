import cp from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import postject from "postject";

async function main() {
  const args = { _: [] };
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.split("=");
    if (value === "" || value == null) {
      args._.push(arg);
      continue;
    }
    args[key.replace(/^--/, "")] = value;
  }

  const sandboxRoot = path.normalize(
    process.cwd().replace(process.env.BAZEL_BINDIR, "")
  );

  const seaConfigFilename = "sea-config.json";
  fs.writeFileSync(
    path.join(sandboxRoot, seaConfigFilename),
    JSON.stringify({
      main: args.entrypoint,
      output: "sea-prep.blob",
      disableExperimentalSEAWarning: true,
    })
  );
  cp.execSync(
    `node --preserve-symlinks --experimental-sea-config ${seaConfigFilename}`,
    {
      stdio: "inherit",
      cwd: sandboxRoot,
    }
  );

  const out = path.join(sandboxRoot, args.output);
  const nodeLocation = "/opt/homebrew/bin/node"; // cp.spawnSync("which", ["node"]).stdout.toString().trim();
  cp.execSync(`cp ${nodeLocation} ${out}`, {
    stdio: "inherit",
    cwd: sandboxRoot,
  });
  cp.execSync(`chmod 777 ${out}`, {
    stdio: "inherit",
    cwd: sandboxRoot,
  });

  await fs.promises.access(out, fs.constants.R_OK | fs.constants.W_OK);
  cp.execSync(`codesign --remove-signature ${out}`, {
    stdio: "inherit",
    sandboxRoot,
  });

  await postject.inject(
    out,
    "NODE_SEA_BLOB",
    fs.readFileSync(path.join(sandboxRoot, "sea-prep.blob")),
    {
      machoSegmentName: "NODE_SEA",
      sentinelFuse: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
    }
  );

  cp.execSync(`codesign --sign - ${out}`, {
    stdio: "inherit",
    cwd: sandboxRoot,
  });
}

main();
