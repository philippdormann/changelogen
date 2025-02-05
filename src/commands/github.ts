import { promises as fsp } from "node:fs";
import open from "open";
import type { Argv } from "mri";
import { resolve } from "pathe";
import consola from "consola";
import { underline, cyan } from "colorette";
import { getGithubChangelog, githubNewReleaseURL } from "../github";
import {
  ChangelogConfig,
  loadChangelogConfig,
  parseChangelogMarkdown,
} from "..";

export default async function githubMain(args: Argv) {
  const cwd = resolve(args.dir || "");
  process.chdir(cwd);

  const [subCommand, ..._versions] = args._;
  if (subCommand !== "release") {
    consola.log(
      "Usage: changelogen gh release [all|versions...] [--dir] [--token]",
    );
    process.exit(1);
  }

  const config = await loadChangelogConfig(cwd, {});

  if (config.repo?.provider !== "github") {
    consola.error(
      "This command is only supported for github repository provider.",
    );
    process.exit(1);
  }

  if (args.token) {
    config.tokens.github = args.token;
  }

  let changelogMd: string;
  if (typeof config.output === "string") {
    changelogMd = await fsp
      .readFile(resolve(config.output), "utf8")
      .catch(() => null);
  }
  if (!changelogMd) {
    changelogMd = await getGithubChangelog(config).catch(() => null);
  }
  if (!changelogMd) {
    consola.error(`Cannot resolve CHANGELOG.md`);
    process.exit(1);
  }

  const changelogReleases = parseChangelogMarkdown(changelogMd).releases;

  let versions = [..._versions].map((v) => v.replace(/^v/, ""));
  if (versions[0] === "all") {
    versions = changelogReleases.map((r) => r.version).sort();
  } else if (versions.length === 0) {
    if (config.newVersion) {
      versions = [config.newVersion];
    } else if (changelogReleases.length > 0) {
      versions = [changelogReleases[0].version];
    }
  }

  if (versions.length === 0) {
    consola.error(`No versions specified to release!`);
    process.exit(1);
  }

  for (const version of versions) {
    const release = changelogReleases.find((r) => r.version === version);
    if (!release) {
      consola.warn(
        `No matching changelog entry found for ${version} in CHANGELOG.md. Skipping!`,
      );
      continue;
    }
    if (!release.body || !release.version) {
      consola.warn(
        `Changelog entry for ${version} in CHANGELOG.md is missing body or version. Skipping!`,
      );
      continue;
    }
    githubRelease(config, {
      version: release.version,
      body: release.body,
    });
  }
}

export function githubRelease(
  config: ChangelogConfig,
  release: { version: string; body: string },
) {
  const url = githubNewReleaseURL(config, release);
  open(url);
  consola.info(
    `Open this link to manually create a release: \n` +
      underline(cyan(url)) +
      "\n",
  );
}
