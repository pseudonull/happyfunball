const weightedRandom = require("weighted-random");

class Ball {
	constructor(config, channel) {
		this.channel = channel;
		this.config = config;
		this.highScore = 0;
		this.nextAction = this.config.firstHitAction;
		this.nextPlayer = "any";
		this.players = [];
		this.score = 0;
		this.state = "idle";
		this.taunted = false;
		this.timer = null;
	}

	addPlayer(userId) {
		if (this.players.includes(userId)) {
			this.channel.send(`<@${userId}> is already playing the game!`);
		} else {
			this.players.push(userId);
			this.channel.send(`<@${userId}> has joined the game.`);
		}
	}

	ballGoesDown(timeout) {
		// Set the FSM state.
		this.state = "goingdown";
		// Set the timer for the ball to drop.
		this.timer = setTimeout(function() {
			this.groundBall();
		}.bind(this), timeout);
	}

	ballGoesUp() {
		// Set the FSM state.
		this.state = "goingup";
		// Choose which player the ball goes to next.
		this.nextPlayer = this.players[Math.floor(Math.random() * this.players.length)];
		// Choose which action the player will need to use to hit the ball.
		var selectedActionIndex = weightedRandom(this.config.hitActionWeights);
                var selectedAction = this.config.hitActions[selectedActionIndex];
		this.nextAction = selectedAction.action;
		// Wait for a period within the specified min and max delay, then tell the player the ball is coming for them.
		var timeoutPeriod = this.config.ballMinDelay + Math.random() * (this.config.ballMaxDelay - this.config.ballMinDelay);
		setTimeout(function () {
			var actionTimeout = selectedAction.timeout;
			if (this.taunted === true) {
				actionTimeout /= this.config.tauntMultiplier;
			}
			this.channel.send(selectedAction.message.replace("PLAYER", `<@${this.nextPlayer}>`));
			this.ballGoesDown(actionTimeout);
		}.bind(this), timeoutPeriod);
	}

	checkHighScore() {
		this.channel.send(`The current high score is ${this.highScore}.`);
	}

	groundBall() {
		// Set the FSM state.
		this.state = "idle";
		// Send the ending message.
		this.channel.send(`The ball plops gently to the ground. (Final Score: ${this.score})`);
		// Check if the high score has been beaten.
		if (this.score > this.highScore) {
			this.channel.send(`Congratulations, ${this.score} is the new high score!`);
			this.highScore = this.score;
		}
	}

	hitBall(message) {
		// Check that the ball is going down and the right player is hitting it with the right action.
		if (this.state == "goingdown" && (this.nextPlayer === "any" || this.nextPlayer === message.author.id) && this.nextAction === message.content) {
			// Clear the timer for the ball hitting the ground.
			clearTimeout(this.timer);
			// Update the score and tell the player they hit it.
			if (this.taunted === true) {
				this.score += this.players.length * this.config.tauntMultiplier;
			} else {
				this.score += this.players.length;
			}
			// Choose which success message to send.
			var successfulHitMessage = this.config.successfulHitMessages[Math.floor(Math.random() * this.config.successfulHitMessages.length)];
			// Send the message to the channel.
			this.channel.send(successfulHitMessage.replace("PLAYER", `<@${message.author.id}>`) + ` (Score: ${this.score})`);
			// Transition to the next state.
			this.ballGoesUp();
		}
	}

	playBall(message) {
		if (this.state === "idle") {
			this.startGame();
		}
		this.addPlayer(message.author.id);
	}

	startGame() {
		// Set the FSM state.
		this.state = "starting";
		// Initialise the game state.
		this.nextAction = this.config.firstHitAction;
		this.nextPlayer = "any";
		this.players = [];
		this.score = 0;
		this.taunted = false;

		this.channel.send(`The game will start in ${Math.floor(this.config.startingDelay/1000)} seconds.`);

		setTimeout(function() {
			this.channel.send(`A ball appears. It looks happy and fun. Type **${this.config.firstHitAction}** to get started.`);
			this.ballGoesDown(this.config.firstHitTimeout);
		}.bind(this), this.config.startingDelay);
	}

	tauntBall(userId) {
		if (this.state === "idle" || this.state === "starting") {
			this.channel.send("No ball is present to be taunted.");
		} else if (this.taunted === true) {
			this.channel.send("The ball is already thoroughly taunted.");
		} else {
			this.taunted = true;
			this.channel.send(`The ball heard <@${userId}>. It accelerates dangerously, leaving an angry trail of smoke!`);
		}
	}
}
module.exports = Ball;
