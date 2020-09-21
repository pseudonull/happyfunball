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
		this.tauntLevel = this.config.tauntLevel;
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
		this.timer = setTimeout(function () {
			var actionTimeout = selectedAction.timeout - this.tauntLevel * this.config.tauntDelayIncrement;
			if (actionTimeout < this.config.tauntDelayIncrement) {
				actionTimeout = this.config.tauntDelayIncrement;
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
			this.score += this.players.length;
			// Choose which success message to send.
			var successfulHitMessage = this.config.successfulHitMessages[Math.floor(Math.random() * this.config.successfulHitMessages.length)];
			// Send the message to the channel.
			this.channel.send(successfulHitMessage.replace("PLAYER", `<@${message.author.id}>`) + ` (Score: ${this.score})`);
			// Transition to the next state.
			this.ballGoesUp();
		}
	}

	leaveBall(message) {
		// Check if a game is actually in progress.
		if (this.state === "idle") {
			this.channel.send("Nobody's playing right now!");
		} else {
			this.removePlayer(message.author.id);
			// If the last player left the game is over.
			if (this.players.length == 0) {
				// Clear the active timer and drop the ball.
				clearTimeout(this.timer);
				this.groundBall();
			}
		}
	}

	pacifyBall(userId) {
		if (this.state === "idle" || this.state === "starting") {
			this.channel.send("No ball is present to be pacified.");
		} else {
			this.tauntLevel--;
			this.channel.send(`<@${userId}> calms the ball. It visibly mellows and slows down in flight.`);
		}
	}

	playBall(message) {
		if (this.state === "idle") {
			this.startGame();
		}
		this.addPlayer(message.author.id);
	}

	removePlayer(userId) {
		if (this.players.includes(userId)) {
			this.players.splice(this.players.indexOf(userId), 1);
			this.channel.send(`<@${userId}> has left the game. The ball can't wave, but it sadly wobbles at them as they go.`);
		} else {
			this.channel.send(`<@${userId}> isn't in the game!`);
		}
	}

	startGame() {
		// Set the FSM state.
		this.state = "starting";
		// Initialise the game state, excluding tauntLevel.
		this.nextAction = this.config.firstHitAction;
		this.nextPlayer = "any";
		this.players = [];
		this.score = 0;

		this.channel.send(`The game will start in ${Math.floor(this.config.startingDelay/1000)} seconds.`);

		this.timer = setTimeout(function() {
			this.channel.send(`A ball appears. It looks happy and fun. Type **${this.config.firstHitAction}** to get started.`);
			this.ballGoesDown(this.config.firstHitTimeout);
		}.bind(this), this.config.startingDelay);
	}

	tauntBall(userId) {
		if (this.state === "idle" || this.state === "starting") {
			this.channel.send("No ball is present to be taunted.");
		} else {
			this.tauntLevel++;
			this.channel.send(`The ball heard <@${userId}>. It accelerates dangerously, leaving an angry trail of smoke!`);
		}
	}
}
module.exports = Ball;
