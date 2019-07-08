<div align="center">
  <br />
  <p>
    <a href="https://github.com/sizzlorox/Idle-RPG-Bot/blob/master/LICENSE"><img src="https://img.shields.io/packagist/l/doctrine/orm.svg" alt="MIT Liscense" /></a>
    <a href="https://www.patreon.com/sizzlorox"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Patreon" /></a>
  </p>
</div>

# Idle-RPG-Bot
An Idle-RPG bot for Discord created using node.js with the [discord.js](https://github.com/discordjs) framework.
This is an open-source project and is currently still in development. A lot is still to be done.

This is a project to practice and learn more on how to create a bot for Discord and to practice javascript.
Anybody who is willing to join in on this project is welcome to do so!

To see this bot in action it is currently running at the [Idle-RPG Discord Server](https://discord.gg/nAEBTcj)

There is also a [Idle-RPG Trello Board](https://trello.com/b/OnpWqvlp/idle-rpg)

## Deploy AvaIre on Heroku
You can deploy in a simple way to Heroku using the button below.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

# Setup
Create a .env file in the project root directory with these env variables: (Without < >)
```
DISCORD_BOT_LOGIN_TOKEN=<Bot login token>
DISCORD_BOT_OPERATORS_ID=<Comma seperated list of Bot Operator ID's>
Example:
DISCORD_BOT_OPERATORS_ID=123456789
DISCORD_BOT_OPERATORS_ID=123456789, 987654321

MIN_TIMER=<Minimal Timer in minutes>
MAX_TIMER=<Maximum Timer in minutes>

MONGODB_URI=<MongoDB Connection URI>
```

# Requirements
```
nodejs
mongodb
```

# Installation
```
npm install
npm run start
(if on windows)
npm run start:windows
```
