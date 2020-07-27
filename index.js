// index.js
const Mustache = require("mustache");
const fs = require("fs");
const MUSTACHE_MAIN_DIR = "./main.mustache";
const { graphql } = require("@octokit/graphql");

console.log`Using token: ${process.env.GH_TOKEN}`;

const getLatestRepos = async () => {
  const data = await graphql(
    `
      {
        user(login: "designer023") {
          repositories(
            orderBy: { field: UPDATED_AT, direction: DESC }
            first: 5
            affiliations: OWNER
            isFork: false
          ) {
            edges {
              node {
                url
                name
              }
            }
          }
          repositoriesContributedTo(
            orderBy: { field: UPDATED_AT, direction: DESC }
            first: 5
            privacy: PUBLIC
          ) {
            edges {
              node {
                url
                name
              }
            }
          }
        }
      }
    `,
    {
      headers: {
        authorization: `token ${process.env.GH_TOKEN}`,
      },
    }
  );

  return data;
};

/**
 * A - We open 'main.mustache'
 * B - We ask Mustache to render our file with the data
 * C - We create a README.md file with the generated output
 */
function generateReadMe(content) {
  fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
    if (err) throw err;
    const output = Mustache.render(data.toString(), content);
    fs.writeFileSync("README.md", output);
  });
}

getLatestRepos().then((result) => {
  const repoData = [];

  result.user.repositories.edges.map((edge) => {
    repoData.push({
      name: edge.node.name,
      url: edge.node.url,
    });
  });

  const contribData = [];

  result.user.repositoriesContributedTo.edges.map((edge) => {
    contribData.push({
      name: edge.node.name,
      url: edge.node.url,
    });
  });

  let content = {
    name: "Carl",
    date: new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZoneName: "short",
      timeZone: "Europe/London",
    }),
    repos: repoData,
    contribData,
  };

  generateReadMe(content);
});
