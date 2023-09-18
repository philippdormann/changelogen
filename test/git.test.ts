import { describe, expect, test } from "vitest";
import { getGitDiff, getRepoConfig, formatReference } from "../src";
import { RepoConfig } from "./../src/repo";

describe("git", () => {
  test("getGitDiff should work", async () => {
    const COMMIT_INITIAL = "4554fc49265ac532b14c89cec15e7d21bb55d48b";
    const COMMIT_VER002 = "38d7ba15dccc3a44931bf8bf0abaa0d4d96603eb";
    expect((await getGitDiff(COMMIT_INITIAL, COMMIT_VER002)).length).toBe(2);

    const all = await getGitDiff(undefined);
    expect((await getGitDiff(COMMIT_INITIAL, "HEAD")).length + 1).toBe(
      all.length,
    );
  });

  test("parse host config", () => {
    expect(getRepoConfig(undefined)).toMatchObject({});
    expect(getRepoConfig("")).toMatchObject({});
    expect(getRepoConfig("unjs")).toMatchObject({});

    const github = {
      provider: "github",
      repo: "unjs/changelogen",
      domain: "github.com",
    };
    expect(getRepoConfig("unjs/changelogen")).toStrictEqual(github);
    expect(getRepoConfig("github:unjs/changelogen")).toStrictEqual(github);
    expect(getRepoConfig("https://github.com/unjs/changelogen")).toStrictEqual(
      github,
    );
    expect(
      getRepoConfig("https://github.com/unjs/changelogen.git"),
    ).toStrictEqual(github);
    expect(getRepoConfig("git@github.com:unjs/changelogen.git")).toStrictEqual(
      github,
    );

    const gitlab = {
      provider: "gitlab",
      repo: "unjs/changelogen",
      domain: "gitlab.com",
    };

    expect(getRepoConfig("gitlab:unjs/changelogen")).toStrictEqual(gitlab);
    expect(getRepoConfig("https://gitlab.com/unjs/changelogen")).toStrictEqual(
      gitlab,
    );
    expect(
      getRepoConfig("https://gitlab.com/unjs/changelogen.git"),
    ).toStrictEqual(gitlab);
    expect(getRepoConfig("git@gitlab.com:unjs/changelogen.git")).toStrictEqual(
      gitlab,
    );

    const bitbucket = {
      provider: "bitbucket",
      repo: "unjs/changelogen",
      domain: "bitbucket.org",
    };

    expect(getRepoConfig("bitbucket:unjs/changelogen")).toStrictEqual(
      bitbucket,
    );
    expect(
      getRepoConfig("https://bitbucket.org/unjs/changelogen"),
    ).toStrictEqual(bitbucket);
    expect(
      getRepoConfig("https://bitbucket.org/unjs/changelogen.git"),
    ).toStrictEqual(bitbucket);
    expect(
      getRepoConfig("https://donaldsh@bitbucket.org/unjs/changelogen.git"),
    ).toStrictEqual(bitbucket);
    expect(
      getRepoConfig("git@bitbucket.org:unjs/changelogen.git"),
    ).toStrictEqual(bitbucket);

    const selfhosted = {
      repo: "unjs/changelogen",
      domain: "git.unjs.io",
    };

    expect(getRepoConfig("selfhosted:unjs/changelogen")).toMatchObject({
      provider: "selfhosted",
      repo: "unjs/changelogen",
    });

    expect(getRepoConfig("https://git.unjs.io/unjs/changelogen")).toMatchObject(
      selfhosted,
    );

    expect(
      getRepoConfig("https://git.unjs.io/unjs/changelogen.git"),
    ).toMatchObject(selfhosted);
    expect(
      getRepoConfig("https://donaldsh@git.unjs.io/unjs/changelogen.git"),
    ).toMatchObject(selfhosted);
    expect(getRepoConfig("git@git.unjs.io:unjs/changelogen.git")).toMatchObject(
      selfhosted,
    );
  });

  test("format reference", () => {
    expect(formatReference({ type: "hash", value: "3828bda" })).toBe("3828bda");
    expect(formatReference({ type: "pull-request", value: "#123" })).toBe(
      "#123",
    );
    expect(formatReference({ type: "issue", value: "#14" })).toBe("#14");

    const github: RepoConfig = {
      provider: "github",
      repo: "unjs/changelogen",
      domain: "github.com",
    };

    expect(formatReference({ type: "hash", value: "3828bda" }, github)).toBe(
      "[3828bda](https://github.com/unjs/changelogen/commit/3828bda)",
    );
    expect(
      formatReference({ type: "pull-request", value: "#123" }, github),
    ).toBe("[#123](https://github.com/unjs/changelogen/pull/123)");
    expect(formatReference({ type: "issue", value: "#14" }, github)).toBe(
      "[#14](https://github.com/unjs/changelogen/issues/14)",
    );

    const gitlab: RepoConfig = {
      provider: "gitlab",
      repo: "unjs/changelogen",
      domain: "gitlab.com",
    };

    expect(formatReference({ type: "hash", value: "3828bda" }, gitlab)).toBe(
      "[3828bda](https://gitlab.com/unjs/changelogen/commit/3828bda)",
    );
    expect(
      formatReference({ type: "pull-request", value: "#123" }, gitlab),
    ).toBe("[#123](https://gitlab.com/unjs/changelogen/merge_requests/123)");
    expect(formatReference({ type: "issue", value: "#14" }, gitlab)).toBe(
      "[#14](https://gitlab.com/unjs/changelogen/issues/14)",
    );

    const bitbucket: RepoConfig = {
      provider: "bitbucket",
      repo: "unjs/changelogen",
      domain: "bitbucket.org",
    };

    expect(formatReference({ type: "hash", value: "3828bda" }, bitbucket)).toBe(
      "[3828bda](https://bitbucket.org/unjs/changelogen/commit/3828bda)",
    );
    expect(
      formatReference({ type: "pull-request", value: "#123" }, bitbucket),
    ).toBe("[#123](https://bitbucket.org/unjs/changelogen/pull-requests/123)");
    expect(formatReference({ type: "issue", value: "#14" }, bitbucket)).toBe(
      "[#14](https://bitbucket.org/unjs/changelogen/issues/14)",
    );

    const unkown: RepoConfig = {
      repo: "unjs/changelogen",
      domain: "git.unjs.io",
    };

    expect(formatReference({ type: "hash", value: "3828bda" }, unkown)).toBe(
      "3828bda",
    );
    expect(
      formatReference({ type: "pull-request", value: "#123" }, unkown),
    ).toBe("#123");
    expect(formatReference({ type: "issue", value: "#14" }, unkown)).toBe(
      "#14",
    );
  });
});
