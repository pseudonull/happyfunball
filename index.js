const Ball = require("./lib/ball");
const Discord = require("discord.js");

try {
	var config = require("./config.json");
} catch (e) {
	var config = require("./config.default.json");
}
config.hitActionKeywords = config.hitActions.map(function(hitAction) {
	return hitAction.action;
});
config.hitActionWeights = config.hitActions.map(function(hitAction) {
	return hitAction.weight;
});

const client = new Discord.Client();

var balls = {};

if ("TOKEN" in process.env) {
	client.login(process.env.TOKEN)
} else if ("token" in config) {
	client.login(config.token);
} else {
	console.error("Could not find a Discord bot token in config.json or the TOKEN environment variable!");
	process.exit(1);
}

// Start handling messages.
client.on("message", message => {
	processAction(message);
});

function processAction(message) {
	switch(message.content) {
		case "!checkhighscore":
			ball = getBall(message.channel);
			ball.checkHighScore();
			break;
		case "!leaveball":
			ball = getBall(message.channel);
			ball.leaveBall(message);
			break;
		case "!pacifyball":
			ball = getBall(message.channel);
			ball.pacifyBall(message.author.id);
			break;
		case "!playball":
			ball = getBall(message.channel);
			ball.playBall(message);
			break;
		case "!tauntball":
			ball = getBall(message.channel);
			ball.tauntBall(message.author.id);
		default:
			// Check if one of the configured keywords for hitting the ball has been used.
			if (config.hitActionKeywords.includes(message.content)) {
				ball = getBall(message.channel);
				ball.hitBall(message);
			}
			break;
	}
}

function getBall(channel) {
	if (channel.id in balls) {
		return balls[channel.id];
	} else {
		balls[channel.id] = new Ball(config, channel);
		return balls[channel.id];
	}
}
