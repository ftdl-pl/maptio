![Logo of the project](./public/images/logo.png)

[![Code Climate](https://codeclimate.com/repos/58ddc02f974e760287000b1d/badges/be1b4f8e1652075411b3/gpa.svg)](https://codeclimate.com/repos/58ddc02f974e760287000b1d/feed)
[![Test Coverage](https://codeclimate.com/repos/58ddc02f974e760287000b1d/badges/be1b4f8e1652075411b3/coverage.svg)](https://codeclimate.com/repos/58ddc02f974e760287000b1d/coverage)
[![Issue Count](https://codeclimate.com/repos/58ddc02f974e760287000b1d/badges/be1b4f8e1652075411b3/issue_count.svg)](https://codeclimate.com/repos/58ddc02f974e760287000b1d/feed)

# Maptio

For founders of purpose-driven companies and initiatives who want to create a scalable, autonomous and focussed organisation structure and culture.
Our simple online initiative mapping tool visualises who has taken responsibility for what and who is helping who to meet those responsibilities
So that people throughout the organisation can: 

- make autonomous decisions while at the same time supporting the autonomy of others, all the way up to the founder holding the overall vision
- see how responsibilities throughout the organisation feed into the greater system
- enjoy greater transparency
- avoid the tyranny of heavy-weight processes, bureaucracy and excessive management.

## Installing / Getting started

```shell
npm install
npm start
```
This installs all the dependencies and start the  Node.js server.
Go to  `http://localhost:3000` to see it in the browser.

## Developing

### Built With

- Angular 4.1.1
- Typescript 2.3.4
- Webpack 2.1
- Bootstrap 3.3
- D3 4.0
- Express 4.14.1

Additionally ,
- Angular Tree Component `angular2-tree-component@1.3.5`
- Auth0
- `ng2-bs3-modal`

### Prerequisites
What is needed to set up the dev environment. For instance, global dependencies or any other tools. include download links.


### Setting up Dev

```shell
git clone https://github.com/Safiya/maptio.git
cd maptio/
npm install
```

### Deploying / Publishing

We use Travis CI,  Code Climate and Heroku for deploying to `http://maptio.herokuapp.com'.

A simple `git push` on `master` will triggers the following events : 

1. Build and run tests on Travis CI
2. If pass, analyse on CodeClimate and report test coverage & quality metrics
3. Deploy to Heroku at `http://maptio.herokuapp.com`

Each step is logged on our private Slack `maptio.slack.com`.

## Versioning


## Configuration

## Tests

Tests are written in Jasmine and ran with Karma.

- Single run 
```shell
npm test
```

- Auto updated run 
```shell
npm run test:headless
```

Locally, you can follow test coverate statistics by opening `./coverage/html/index.html/index.html` in a browser (generated with Istanbul)

## Style guide

Enabled/disabled rules can be found in `.codeclimate.yml`

In general, we use standards rules from out of the box TSLint.

## Api Reference

TODO 

## Database

MongoDB hosted on MLab, ORM is MongoJS.

## Licensing

UNLICENSED