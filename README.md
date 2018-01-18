# Idle-RPG-Bot
An Idle-RPG bot for Discord created using node.js with the discord.js framework.
This is an open-source project and is currently still in development. A lot is still to be done.

This is a project to practice and learn more on how to create bots for Discord/Twitch and to practice javascript.
Anyobody who is willing to join in on this project is welcome to do so!

# Setup
Created a .env file in the project root directory with these env variables: (Without < >)
```
DISCORD_ACTION_WEBHOOK_ID=<Your discord action channel webhook ID here>
DISCORD_ACTION_WEBHOOK_TOKEN=<Your discord action channel webhook token here>
DISCORD_MOVEMENT_WEBHOOK_ID=<Your discord movement channel webhook ID here>
DISCORD_MOVEMENT_WEBHOOK_TOKEN=<Your discord movement channel webhook token here>

DISCORD_BOT_OPERATOR_ID=<Discord bot operator ID here>
DISCORD_RPG_WELCOME_CHANNEL_ID=<Discord welcome channel ID here>
DISCORD_RPG_CHANNEL_ID=<Discord action channel ID here>
DISCORD_RPG_COMMAND_CHANNEL_ID=<Discord command channel ID here>
DISCORD_RPG_FAQ_CHANNEL=<Discord FAQ channel ID here>
DISCORD_BOT_LOGIN_TOKEN=<Discord bot login token here>

MIN_TIMER=<Minimal timer in minutes here>
MAX_TIMER=<Maximum timer in minutes here>

VIRUS_TOTAL_APIKEY=<api key for your virus total account (not required)>
MONGODB_URI=<mongodb connection URI>
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
```