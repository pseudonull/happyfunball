# happyfunball

A Discord game bot inspired by PAX Online 2020's legendary **All Hail Ball** bot.

# Getting Started

If you intend to run the bot locally:

1. Install [NodeJS,](https://nodejs.org/en/download/) if you don't have it already
1. Create a [Discord bot token](https://discordjs.guide/preparations/setting-up-a-bot-application.html)
1. Clone this repository with ```git clone https://github.com/pseudonull/happyfunball/```
1. Install dependencies with ```npm install```
1. Create your configuration file with ```cp config.json.default config.json```
1. Edit ```config.json``` and set ```token``` to your Discord bot token
1. Run the bot with ```node index.js```
1. [Invite](https://discordjs.guide/preparations/adding-your-bot-to-servers.html) the bot to your server.

If you're instead running the bot on Heroku using GitHub integration, do **not** put your token in the config.json file. Create a [config var](https://devcenter.heroku.com/articles/config-vars) in Heroku named ```TOKEN``` and set it to your Discord bot token.

# Playing the Game

1. Type **!playball** to start a game. Additional players can join a game in progress by typing **!playball**.
1. When the ball appears in the channel, you will be prompted to type **!hitball** to begin the game.
1. The ball will bounce up and, after a brief delay, fall towards another player. They can hit the ball up and keep the game going by typing **!hitball** (unless the prompt tells them to type something else to hit it).
1. Each time the ball is hit, points are scored equal to the number of players in the game.
1. If a player doesn't hit the ball up in time, the ball will touch the ground and the game ends.
1. A player may leave the game by typing **!leaveball**.
1. The ball's speed can be increased during a game with **!tauntball** and decreased with **!pacifyball**. The ball's speed carries over between games.

# Customisation

There are various numerical parameters in ```config.json``` that can be adjusted, but the main things you'll probably want to customise are:

* ```successfulHitMessages``` is a list of possible messages that will be randomly displayed to a player when they hit the ball, adding colour and variety to the game.
* ```hitActions``` is a list of possible actions a player will need to type in order to hit the ball, along with weights that determine how often each action will appear, timeouts which determine how much time the player has to type the action, and a message that tells the player what action they need to type.
