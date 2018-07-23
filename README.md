# Idle-RPG-Bot
An Idle-RPG bot for Discord created using node.js with the discord.js framework.
This is an open-source project and is currently still in development. A lot is still to be done.

This is a project to practice and learn more on how to create bots for Discord/Twitch and to practice javascript.
Anyobody who is willing to join in on this project is welcome to do so!

To see this bot in action it is currently running at this discord server:
[Idle-RPG Discord Server](https://discord.gg/nAEBTcj)

# Setup
Created a .env file in the project root directory with these env variables: (Without < >)
```
DISCORD_BOT_LOGIN_TOKEN=<Bot login token>

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