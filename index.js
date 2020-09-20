const Discord = require("discord.js");
const weightedRandom = require("weighted-random");

try {
	var config = require("./config.json");
} catch (e) {
	var config = require("./config.default.json");
}
config.hitActionWeights = config.hitActions.map(function(hitAction) {
	return hitAction.weight;
});

const client = new Discord.Client();

var games = {};
var highscores = {};

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
			checkHighScore(message);
			break;
		case "!playball":
			if (message.channel.id in games && "state" in games[message.channel.id]) {
				addPlayer(message);
			} else {
				startGame(message);
			}
			break;
		case "!tauntball":
			if (message.channel.id in games && "state" in games[message.channel.id]) {
				tauntBall(message);
			}
		default:
			if (message.channel.id in games && "state" in games[message.channel.id] && games[message.channel.id]["state"] === "soaring" && games[message.channel.id]["nextaction"] === message.content) {
				hitBall(message);
			}
			break;
	}
}

function startGame(message) {
	games[message.channel.id] = {
		"state": "starting",
		"players": [],
		"score": 0,
		"taunted": false,
		"tauntMultiplier": 1
	}
	addPlayer(message);
	message.channel.send("The game will start in 5 seconds.");
	setTimeout(function() {
		message.channel.send("A ball appears. It looks happy and fun. Type **!hitball** to get started.");
		games[message.channel.id]["state"] = "soaring";
		games[message.channel.id]["nextplayer"] = "any";
		games[message.channel.id]["nextaction"] = config.firstHitAction;
		games[message.channel.id]["timeout"] = setTimeout(function() {
			groundBall(message);
		}, config.firstHitTimeout);
	}, config.startingTimeout);
}

function addPlayer(message) {
	if (games[message.channel.id]["players"].includes(message.author.id)) {
		message.channel.send("<@" + message.author.id + "> is already playing the game!");
	} else {
		games[message.channel.id]["players"].push(message.author.id);
		message.channel.send("<@" + message.author.id + "> has joined the game.");
	}
}

function checkHighScore(message) {
	if (message.channel.id in highscores) {
		message.channel.send("The current high score is " + highscores[message.channel.id] + ".");
	} else if (message.channel.id in games) {
		message.channel.send("You're in the middle of your first game! Wait for it to finish.");
	} else {
		message.channel.send("Nobody's played yet! Type **!playball** to start a new game.");
	}
}

function groundBall(message) {
	games[message.channel.id]["state"] = "ending";
	// Send the ending message.
	message.channel.send("The ball drops to the ground." + " (Final Score: " + games[message.channel.id]["score"] + ")");
	// Check if the high score has been beaten.
	if (!(message.channel.id in highscores) || games[message.channel.id]["score"] > highscores[message.channel.id]) {
		message.channel.send("Congratulations, " + games[message.channel.id]["score"] + " is the new high score!")
		highscores[message.channel.id] = games[message.channel.id]["score"];
	}
	// Clean up.
	delete games[message.channel.id];
}

function hitBall(message) {
	// Check that the right player is hitting the ball.
	if (games[message.channel.id]["nextplayer"] === "any" || games[message.channel.id]["nextplayer"] === message.author.id) {
		// Clear the event that drops the ball on the ground.
		clearTimeout(games[message.channel.id]["timeout"]);
		// Update the score and tell the player they hit it.
		games[message.channel.id]["score"] += games[message.channel.id]["players"].length * games[message.channel.id]["tauntMultiplier"];
		var successfulHitMessage = config.successfulHitMessages[Math.floor(Math.random() * config.successfulHitMessages.length)];
		message.channel.send(successfulHitMessage.replace("PLAYER", "<@" + message.author.id + ">") + " (Score: " + games[message.channel.id]["score"] + ")");
		// Transition to the next state.
		games[message.channel.id]["state"] = "pickingplayer";
		pickPlayer(message);
	} else {
		message.channel.send("<@" + message.author.id + "> The ball isn't heading for you.");
	}
}

function pickPlayer(message) {
	// Choose a random player to be our next victim.
	games[message.channel.id]["nextplayer"] = games[message.channel.id]["players"][Math.floor(Math.random() * games[message.channel.id]["players"].length)];
	// Wait for a period within the specified min and max delay, then tell the player the ball is coming for them.
	timeoutPeriod = config.pickPlayerMinDelay + Math.random() * (config.pickPlayerMaxDelay - config.pickPlayerMinDelay);
	setTimeout(function() {
		// Transition state and set the timer for the ball to hit the ground.
		games[message.channel.id]["state"] = "soaring";
		// Choose the action that will be required to hit the ball, send the associated message and set the associated timeout.
		var selectedActionIndex = weightedRandom(config.hitActionWeights);
		var selectedAction = config.hitActions[selectedActionIndex];
		games[message.channel.id]["nextaction"] = selectedAction.action;
		message.channel.send(selectedAction.message.replace("PLAYER", "<@" + games[message.channel.id]["nextplayer"] + ">"));
		games[message.channel.id]["timeout"] = setTimeout(function() {
			groundBall(message);
		}, selectedAction.timeout / games[message.channel.id]["tauntMultiplier"]);
	}, timeoutPeriod);
}

function tauntBall(message) {
	if (games[message.channel.id]["taunted"] === true) {
		message.channel.send("The ball is already thoroughly taunted.");
	} else {
		games[message.channel.id]["taunted"] = true;
		games[message.channel.id]["tauntMultiplier"] = config.tauntMultiplier;
		message.channel.send("<@" + message.author.id + "> taunts the ball. It begins to smoke ominously.");
	}
}
