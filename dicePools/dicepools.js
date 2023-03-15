Hooks.once('init', function() {
	game.settings.register('dicePools', 'data', {
        name: 'data',
        hint: 'stores data',
        scope: 'world',
        config: false,
        default: '[{"name":"DicePool","amount":1,"maxAmount":6,"diceFormat":"d6", color="#65cce6"}]',
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
});

Hooks.on('renderPlayerList', function() {
let DP = document.createElement("div");
let editMode = game.settings.get('dicePools', 'editMode');
if(game.user.isGM){
DP.innerHTML = `
<div class="dicePoolControls">
<label class="dicePoolBT" id="dicePoolBTPlus" onclick="dicePools.newDicePoolDialogue()">+</label>
<label class="dicePoolBT editMode`+editMode+`" id="dicePoolBTEdit" onclick="dicePools.toggleEditMode()"><i class="fa-solid fa-pen-to-square"></i></label>
<label class="dicePoolBT" id="dicePoolBTEdit"><i class="fa-solid fa-square-info" title="Leftclick to add a dice, Rightclick to remove a dice, Click Mouse wheel to remove all dice from a pool"></i></i></label>
</div>
<div class="dicePools" id="dicePools">
</div>`
}
else{
DP.innerHTML = `
<div class="dicePools" id="dicePools">
</div>`
}
document.getElementById("player-list").prepend(DP);
loadDicePools();
});

async function loadDicePools(){
	let dicePoolList = JSON.parse(await game.settings.get('dicePools', 'data'));
	
	for(let i = 0; i < dicePoolList.length; i++){
		let DPL = document.createElement("label");
		let color = "black";
		var c = dicePoolList[i].color.substring(1);
		var rgb = parseInt(c, 16);
		var r = (rgb >> 16) & 0xff;
		var g = (rgb >>  8) & 0xff;
		var b = (rgb >>  0) & 0xff;

		var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
		//console.log("Luma:" + luma);
		if (luma < 150) {
			// pick a different colour
			color = "white";
		}
		DPL.innerHTML = `<label class="dicePoolL" id="dp`+i+`" style="background-color:`+dicePoolList[i].color+`; color:`+color+`;">`+dicePoolList[i].name + " " + dicePoolList[i].amount + "/" + dicePoolList[i].maxAmount +`</label>`;
		if(game.user.isGM){
			DPL.addEventListener("mouseup", (event) => {
			  if (event.button == 0) {
				dicePools.increaseDicePool(i);
			  } else if (event.button == 2) {
				dicePools.decreaseDicePool(i);
			  } else if (event.button == 1) {
				dicePools.spillDicePool(i);
			  }
			});
		}
		document.getElementById("dicePools").append(DPL);
	}
}

window.dicePools = class dicePools{
		static async newEditDicePoolDialogue(id){
		let dicePoolList = JSON.parse(game.settings.get('dicePools', 'data'));
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
		let dicePoolList = [];
		
		if(JSON.parse(game.settings.get('dicePools', 'data')).length != 0)
			dicePoolList = JSON.parse(game.settings.get('dicePools', 'data'));
		
		let newDicePool = new dicePool(name, 0, amount, diceFormat, color);
		dicePoolList.push(newDicePool);
		
		let data = JSON.stringify(dicePoolList);
		
		game.settings.set('dicePools', 'data', data);
	}
	static async editDicePool(id, name, amount, diceFormat, color){
		let dicePoolList = [];
		if(JSON.parse(game.settings.get('dicePools', 'data')).length != 0)
			dicePoolList = JSON.parse(game.settings.get('dicePools', 'data'));
		
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

	static async increaseDicePool(id){
		if(game.settings.get('dicePools', 'editMode')){
			dicePools.newEditDicePoolDialogue(id);
			return;
		}
		let dicePoolList = await getdicePoolData();
		
		let content = " inceased the size of the " + dicePoolList[id].name + " pool.";
		await ChatMessage.create({
			 content: content,
		});
		if(dicePoolList[id].amount+1 > dicePoolList[id].maxAmount)
			return;
		else{
			dicePoolList[id].amount ++;
		}
		saveDicePools(dicePoolList);
	}

	static async decreaseDicePool(id){
		if(game.settings.get('dicePools', 'editMode')){
			dicePools.newEditDicePoolDialogue(id);
			return;
		}
		let dicePoolList = await getdicePoolData();
			
		if(dicePoolList[id].amount-1 < 0)
			return;
		else{
			dicePoolList[id].amount --;	
			let content = " spent a " + dicePoolList[id].name + " dice. [[/r " +dicePoolList[id].diceFormat+ "]]"
			await ChatMessage.create({
			  content: content,
			});
		}
		saveDicePools(dicePoolList);
	}
	static async toggleEditMode(){
		await game.settings.set('dicePools', 'editMode', !game.settings.get('dicePools', 'editMode'));
		onChangeData();
	}

	static async spillDicePool(id){
	if(game.settings.get('dicePools', 'editMode')){
			dicePools.destroyDicePool(id);
			return;
		}
		let dicePoolList = await getdicePoolData();
		let content = " spillt <b>"+dicePoolList[id].amount+"</b> dice for the " + dicePoolList[id].name + " pool. ("+dicePoolList[id].diceFormat+")<br><br>";
		for(let i = dicePoolList[id].amount; i > 0; i--){
			content += "[[" +dicePoolList[id].diceFormat+ "]]";
		}
		await ChatMessage.create({
			  content: content,
		});
		
		if(dicePoolList[id].amount == 0)
			return;
		else{
			dicePoolList[id].amount = 0;
		}
		saveDicePools(dicePoolList);
	}
}

async function getdicePoolData(){
	return JSON.parse(await game.settings.get('dicePools', 'data'));
}
async function saveDicePools(dicePoolList){
		let data = JSON.stringify(dicePoolList);
		game.settings.set('dicePools', 'data', data);
}

function onChangeData(){
	game.users.apps[0].render();
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