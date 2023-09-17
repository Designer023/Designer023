// index.js
const Mustache = require("mustache");
const fs = require("fs");
const MUSTACHE_MAIN_DIR = "./main.mustache";
const {graphql} = require("@octokit/graphql");

const getLatestRepos = async () => {
    const data = await graphql(
        `
      {
          user(login: "designer023") {
            repositories(
              orderBy: {field: UPDATED_AT, direction: DESC}
              first: 3
              affiliations: OWNER
              isFork: false
            ) {
              edges {
                node {
                  url
                  name
                  description
                  isPrivate
                }
              }
            }
            repositoriesContributedTo(
              orderBy: {field: UPDATED_AT, direction: DESC}
              first: 3
            ) {
              edges {
                node {
                  url
                  name
                  description
                  isPrivate
                }
              }
            }
          }
        }
    `,
        {
            headers: {
                authorization: `token ${process.env.GITHUB_TOKEN}`,
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
    const repoData = result.user.repositories.edges.map((edge) => ({
            name: edge.node.name,
            url: edge.node.url,
            private: edge.node.isPrivate,
            description: edge.node.description
        })
    )

    const contribData = result.user.repositoriesContributedTo.edges.map((edge) => ({
            name: edge.node.name,
            url: edge.node.url,
            private: edge.node.isPrivate,
            description: edge.node.description
        })
    );

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
