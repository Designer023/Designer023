import "dotenv/config"
import path from "path";

const Mustache = require("mustache");
const fs = require("fs");
const MUSTACHE_MAIN_DIR = "templates/main.mustache";
const {graphql} = require("@octokit/graphql");

type Repository = {
    "node": {
        "url": string,
        "name": string,
        "description": string,
        "isPrivate": boolean
    }
}
type Contributed = {
    "node": {
        "url": string,
        "name": string,
        "description": string,
        "isPrivate": boolean
    }
}

type ProfileData = {
    "user": {
        "repositories": {
            "edges": Repository[]
        },
        "repositoriesContributedTo": {
            "edges": Contributed[]
        }
    }
}

const getLatestRepos = async (): Promise<ProfileData> => {
    return graphql(
        `
      {
  user(login: "designer023") {
    # todo: fix the dates
    contributionsCollection(from: "2019-09-28T23:05:23Z", to: "2020-09-28T23:05:23Z") {
      contributionCalendar {
        totalContributions
         weeks {
           contributionDays {
             # weekday
             # date 
             contributionCount 
             color
           }
         }
        months  {
          name
            year
            firstDay 
            totalWeeks
          
          
        }
        totalContributions
      }
    }
    repositories(
      orderBy: {field: UPDATED_AT, direction: DESC}
      first: 10
      affiliations: OWNER
      isFork: false
      # privacy: PUBLIC
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
      orderBy: {field: PUSHED_AT, direction: DESC}
      first: 10
      contributionTypes: [COMMIT, PULL_REQUEST, ISSUE]
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
};

type Data = {
    name: string,
    url: string,
    private: boolean,
    description: string,
    privateName?: string
}

type Content = {
    name: string,
    date: string,
    repos: Data[],
    contribData: Data[],
}

const generateReadMe = (content: Content) => {
    fs.readFile(path.join(__dirname, MUSTACHE_MAIN_DIR), (err: Error, data: Buffer) => {
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
            description: edge.node.description,
            privateName: edge.node.name.replace(/[A-Za-z0-9]/gm, "░")
        })
    )

    const contribData = result.user.repositoriesContributedTo.edges.map((edge) => ({
            name: edge.node.name,
            url: edge.node.url,
            private: edge.node.isPrivate,
            description: edge.node.description,
            privateName: edge.node.name.replace(/[A-Za-z0-9]/gm, "░")
        })
    );

    let content: Content = {
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
