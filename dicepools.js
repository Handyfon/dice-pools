Hooks.once('init', function() {
	game.settings.register('dicePools', 'useFadedUI', {
		name: 'Faded UI Style',
		hint: 'Should the dicepools section behave like standard v13 UI (half opacity until hovered)?',
		scope: 'client',
		config: true,
		default: true,
		type: Boolean,
		onChange: onChangeData,
	});
	game.settings.register('dicePools', 'data', {
        name: 'data',
        hint: 'stores data',
        scope: 'world',
        config: false,
        default: '[{"name":"DicePool","amount":1,"maxAmount":6,"diceFormat":"d6","color":"#65cce6"}]',
        type: String,
		onChange: onChangeData,
    });
	game.settings.register('dicePools', 'editMode', {
        name: 'editmode',
        hint: 'editMode',
        scope: 'world',
        config: false,
        default: false,
        type: Boolean,
		onChange: onChangeData,
    });
		game.settings.register('dicePools', 'howToUse', {
        name: 'How to use',
        hint: 'You can create pools with the + icon above the playerlist. To edit a DicePool click the edit icon next to the plus and then the Dicepool that you want to edit. You can destroy pools with you middle mouse button while in edit mode.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
		onChange: onChangeData,
    });

	console.log("Dicepools initializing...");
});

function updateDicePoolMargin() {
	const section = document.querySelector(".dicePoolsSection");
	const players = document.getElementById("players");
	if (!section || !players) return;

	if (players.classList.contains("expanded")) {
		section.style.marginBottom = "-8px";
	} else {
		section.style.marginBottom = "-30px";
	}
}

Hooks.once('ready', () => {
	console.log("DICEPOOLS | ready");

	// Initial check
	updateDicePoolMargin();

	// Add click handler to the expand button
	const expandButton = document.getElementById("players-expand");
	if (expandButton) {
		expandButton.addEventListener("click", () => {
			// delay since class toggle might happen async
			setTimeout(updateDicePoolMargin, 50);
		});
	}
});



Hooks.on('renderPlayers', async function(app, html) {
	console.log("DicePools | renderSceneControls");

	const sceneControls = html;
	const leftSideUI = sceneControls.parentElement;
	const playersAside = document.getElementById("players");

	if (!leftSideUI || !playersAside) return;
	if (leftSideUI.querySelector(".dicePoolsSection")) return;

	const section = document.createElement("section");
	section.classList.add("dicePoolsSection");
	if (game.settings.get('dicePools', 'useFadedUI')) {
		section.classList.add("faded-ui");
	}
	const editMode = game.settings.get('dicePools', 'editMode');

	let controls = "";
	if (game.user.isGM) {
		controls = `
		<div class="sidebar-control-group flexrow" style="pointer-events: auto; text-align: center;">
			<a class="sidebar-control" id="dicePoolBTPlus" title="Add Pool" onclick="dicePools.newDicePoolDialogue()">
				<i class="fa-solid fa-plus"></i>
			</a>
			<a class="sidebar-control ${editMode ? "active" : ""}" id="dicePoolBTEdit" title="Toggle Edit Mode" onclick="dicePools.toggleEditMode()">
				<i class="fa-solid fa-pen-to-square"></i>
			</a>
			<a class="sidebar-control" id="dicePoolInfoHint" title="Leftclick to add, Rightclick to remove, Middle-click to reset.">
				<i class="fa-solid fa-circle-info"></i>
			</a>
		</div>`;
	}

	section.innerHTML = `
		${controls}
		<ol id="dicePools" class="flexrow"></ol>
	`;

	leftSideUI.insertBefore(section, playersAside);

	await loadDicePools();
	updateDicePoolMargin();
});

async function loadDicePools() {
	const dicePoolList = await getdicePoolData();
	const container = document.getElementById("dicePools");
	if (!container) return;

	container.innerHTML = ""; // verhindert Mehrfach-Render

	for (let i = 0; i < dicePoolList.length; i++) {
		const pool = dicePoolList[i];

		let label = document.createElement("label");
		label.classList.add("dicePoolL");

		const hex = pool.color.substring(1);
		const rgb = parseInt(hex, 16);
		const r = (rgb >> 16) & 0xff;
		const g = (rgb >> 8) & 0xff;
		const b = rgb & 0xff;
		const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		const textColor = luma < 150 ? "white" : "black";

		label.id = `dp${i}`;
		label.style.backgroundColor = pool.color;
		label.style.color = textColor;
		label.innerText = `${pool.name} ${pool.amount}/${pool.maxAmount}`;

		if (game.user.isGM) {
			label.addEventListener("mouseup", (event) => {
				if (event.button === 0) dicePools.increaseDicePool(i);
				else if (event.button === 2) dicePools.decreaseDicePool(i);
				else if (event.button === 1) dicePools.spillDicePool(i);
			});
		}

		container.appendChild(label);
	}
}


window.dicePools = class dicePools{
		static async newEditDicePoolDialogue(id){
		let dicePoolList = await getdicePoolData();
		let dice = ["d1","d2","d4","d6","d8","d10","d12","d20","d100"]
		
		let content = `
		<label class="dicePoolLabel">DicePool Name</label>
		<input type="text" class="newDicePoolName" id="newDicePoolName" value="`+dicePoolList[id].name+`"></input>
		<label class="dicePoolLabel">Pool Information</label>
		<input type="number" class="newDicePoolAmount" id="newDicePoolAmount" value="`+dicePoolList[id].maxAmount+`" min="0" max="1000" step="1"></input>
		<select name="diceType" class="newDicePoolType" id="newDicePoolType">
		  <option value="d1">d1</option>
		  <option value="d2">d2</option>
		  <option value="d4">d4</option>
		  <option value="d6">d6</option>
		  <option value="d8">d8</option>
		  <option value="d10">d10</option>
		  <option value="d12">d12</option>
		  <option value="d20">d20</option>
		  <option value="d100">d100</option>
		</select>
		<label class="dicePoolColor">Color</label>
		<input class="newDicePoolColor" id="newDicePoolColor" type="color" id="head" name="head"
           value="`+dicePoolList[id].color+`">`
		content = content.replace('value="'+dicePoolList[id].diceFormat+'"', 'value="'+dicePoolList[id].diceFormat+'" selected');
		
		const dialogOptions = {
            width: 500,
			heith: 500,
            classes: ['dicepoolDialogue resizeable']
        };
		let d = new Dialog({
		  title: "Editing Dice Pool",
		  content: content,
		  options: dialogOptions,
		 buttons: {
			 one: {
				 icon: '<i class="fas fa-check"></i>',
				 label: "Add Dice Pool",
				 callback: (html) => dicePools.editDicePool(id, html[0].getElementsByClassName("newDicePoolName")[0].value, html[0].getElementsByClassName("newDicePoolAmount")[0].value, html[0].getElementsByClassName("newDicePoolType")[0].value, html[0].getElementsByClassName("newDicePoolColor")[0].value)
			 }
		 }
		});
		d.render(true);
	}
	static async newDicePoolDialogue(){
		let content = `
		<label class="dicePoolLabel">DicePool Name</label>
		<input type="text" class="newDicePoolName" id="newDicePoolName" value="DicePool"></input>
		<label class="dicePoolLabel">Pool Information</label>
		<input type="number" class="newDicePoolAmount" id="newDicePoolAmount" value="6" min="0" max="1000" step="1"></input>
		<select name="diceType" class="newDicePoolType" id="newDicePoolType">
		  <option value="d1">d1</option>
		  <option value="d2">d2</option>
		  <option value="d4">d4</option>
		  <option value="d6" selected>d6</option>
		  <option value="d8">d8</option>
		  <option value="d10">d10</option>
		  <option value="d12">d12</option>
		  <option value="d20">d20</option>
		  <option value="d100">d100</option>
		</select>
		<label class="dicePoolColor">Color</label>
		<input class="newDicePoolColor" id="newDicePoolColor" type="color" id="head" name="head"
           value="#e66465">`
		const dialogOptions = {
            width: 500,
			heith: 500,
            classes: ['dicepoolDialogue resizeable']
        };
		let d = new Dialog({
		  title: "Add Dice Pool",
		  content: content,
		  options: dialogOptions,
		 buttons: {
			 one: {
				 icon: '<i class="fas fa-check"></i>',
				 label: "Add Dice Pool",
				 callback: (html) => dicePools.addDicePool(html[0].getElementsByClassName("newDicePoolName")[0].value, html[0].getElementsByClassName("newDicePoolAmount")[0].value, html[0].getElementsByClassName("newDicePoolType")[0].value, html[0].getElementsByClassName("newDicePoolColor")[0].value)
			 }
		 }
		});
		d.render(true);
	}
	static async addDicePool(name, amount, diceFormat, color){
		let dicePoolList = await getdicePoolData();
		
		let newDicePool = new dicePool(name, 0, amount, diceFormat, color);
		dicePoolList.push(newDicePool);
		
		let data = JSON.stringify(dicePoolList);
		
		game.settings.set('dicePools', 'data', data);
	}
	static async editDicePool(id, name, amount, diceFormat, color){
		let dicePoolList = await getdicePoolData();

		dicePoolList[id].name = name;
		dicePoolList[id].maxAmount = amount;
		
		if(dicePoolList[id].amount > dicePoolList[id].maxAmount)
			dicePoolList[id].amount = dicePoolList[id].maxAmount;
		
		dicePoolList[id].diceFormat = diceFormat;
		dicePoolList[id].color = color;
		
		let data = JSON.stringify(dicePoolList);
		
		game.settings.set('dicePools', 'data', data);
	}
	static async removeDicePools(){
		let dicePoolList = await getdicePoolData();
		game.settings.set('dicePools', 'data', "[]");
	}
	static async destroyDicePool(id){
		let dicePoolList = await getdicePoolData();
		console.log("Destroyed Pool " + dicePoolList[id].name);
		dicePoolList.splice(id, 1);
		saveDicePools(dicePoolList);
	}

	static async increaseDicePool(id) {
		if (game.settings.get('dicePools', 'editMode')) {
			dicePools.newEditDicePoolDialogue(id);
			return;
		}
		let dicePoolList = await getdicePoolData();

		if (dicePoolList[id].amount + 1 > dicePoolList[id].maxAmount) return;

		dicePoolList[id].amount++;

		const content = `
		<header class="message-header flexrow">
			<span class="message-flavor">Increased <strong>${dicePoolList[id].name}</strong> Pool</span>
		</header>
		<div class="message-content">Pool is now at <strong>${dicePoolList[id].amount}/${dicePoolList[id].maxAmount}</strong>.</div>
		`;

		await ChatMessage.create({ content });
		saveDicePools(dicePoolList);
	}

	static async decreaseDicePool(id) {
		if (game.settings.get('dicePools', 'editMode')) {
			dicePools.newEditDicePoolDialogue(id);
			return;
		}
		let dicePoolList = await getdicePoolData();

		if (dicePoolList[id].amount - 1 < 0) return;

		dicePoolList[id].amount--;

		const content = `
		<header class="message-header flexrow">
			<span class="message-flavor">Used a <strong>${dicePoolList[id].name}</strong> Die</span>
		</header>
		<div class="dice-formula">Rolling <strong>${dicePoolList[id].diceFormat}</strong></div>
		<div>[[${dicePoolList[id].diceFormat}]]</div>
		`;

		await ChatMessage.create({ content });
		saveDicePools(dicePoolList);
	}
	static async toggleEditMode(){
		await game.settings.set('dicePools', 'editMode', !game.settings.get('dicePools', 'editMode'));
		onChangeData();
	}
	static async spillDicePool(id) {
		if (game.settings.get('dicePools', 'editMode')) {
			dicePools.destroyDicePool(id);
			return;
		}
		let dicePoolList = await getdicePoolData();

		const pool = dicePoolList[id];
		if (pool.amount === 0) return;

		const rolls = Array(pool.amount).fill(`[[${pool.diceFormat}]]`).join(" ");
		const content = `
		<header class="message-header flexrow">
			<span class="message-flavor">Spilled <strong>${pool.amount}</strong> Dice from <strong>${pool.name}</strong> Pool</span>
		</header>
		<div class="dice-formula">Rolling ${pool.diceFormat} x${pool.amount}</div>
		${rolls}
		`;

		pool.amount = 0;

		await ChatMessage.create({ content });
		saveDicePools(dicePoolList);
	}

}

async function getdicePoolData(){
	const dicePoolsData = await game.settings.get('dicePools', 'data');
	return dicePoolsData ? JSON.parse(dicePoolsData) : null;
}
async function saveDicePools(dicePoolList){
		let data = JSON.stringify(dicePoolList);
		game.settings.set('dicePools', 'data', data);
}

function onChangeData(){
	const old = document.querySelector(".dicePoolsSection");
	if (old) old.remove();

	ui.players.render(true); // Triggert renderPlayers erneut
}

class dicePool{
	constructor(name, amount, maxAmount, diceFormat, color){
		this.name = name;
		this.amount = amount;
		this.maxAmount = maxAmount;
		this.diceFormat = diceFormat;
		this.color = color;
	}
}