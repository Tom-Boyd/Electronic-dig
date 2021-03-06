var tooltipOn;


// EVENT LISTENERS
document.addEventListener("DOMContentLoaded", function(event) {
  //Declare DOM global variables
	svg = document.getElementById('svg');
	svgStyle = document.getElementById("svgMap");
	lines = document.querySelectorAll("svg *");

	//set Budget
	var budget = localStorage.getItem("budget");
	budget = (!budget) ? "-1" : budget;
	setBudget(budget);

	//Show map
	var svgMap = document.getElementById("svgMap");
	svgMap.style.display = "inline";

  //modal
  var modal = document.getElementById('myModal');
  var span = document.getElementsByClassName("close")[0];
  //When the user clicks on <span> (x), close the modal
  span.onclick = function() {	modal.style.display = "none";};

	var svgMap = document.getElementById("svgMap");
	svgMap.style.height = (svgMap.clientWidth * (15/13))+"px";
	if ($(window).width() < 760){
		smallWindow = true;
	} else {
		smallWindow = false;
		var section1 = document.getElementById("sidebar");
		var section2 = document.getElementById("squareInfo");
		var section3 = document.getElementById("infoBox");
		section1.style.gridColumn = "";
		section2.style.gridColumn = "";
		section3.style.gridColumn = "";
	}
});
window.addEventListener('mouseover',function(){
  //Drag selecting
	if (mouseDown == 1) {
		var element = event.target.parentElement;
		parent = element.parentElement;
		if (parent) {
			if (!excavatedSquaresObj.includes(element) && !selectedSquaresObj.includes(element)) {
				if (parent.id == "GRID_UNITS") {
					element.onclick();
				}
			}
		}
	}
	//tooltip
	parent = event.target.parentElement;
	if (parent) {
		var tooltip = document.getElementById('excavateFeatureTooltip');
		if( event.target !=  tooltipOn){
			if(parent.id=="Features"){
				tooltip.style.display = "inline";
				tooltip.style.left = event.screenX;
				tooltip.style.top = event.screenY;
				tooltipOn=  event.target;
			}
		}
	}
});
window.addEventListener('wheel',function(){
  //Allows scroll wheel to enter and exit a square
	var x = event.clientX, y = event.clientY,
  element = document.elementFromPoint(x, y).parentElement;
	if (excavatedSquaresObj.includes(element) && event.deltaY < 0){
		element.onclick();
	}
	if (element.id == "svgMap" && view == "square"  && event.deltaY > 0) {
		viewMap();
	}
});
var smallWindow = false
$(window).resize(function() {
	var svgMap = document.getElementById("svgMap");
	svgMap.style.height = (svgMap.clientWidth * (15/13))+"px";
  if ($(window).width() < 760){
		smallWindow = true;
		var section1 = document.getElementById("sidebar");
		var section2 = document.getElementById("squareInfo");
		var section3 = document.getElementById("infoBox");
		if (view == "map") {
			section1.style.gridColumn = "1/7";
			section2.style.gridColumn = "1/7";
			section3.style.gridColumn = "1/7";
		} else {
			section1.style.gridColumn = "1/4";
			section2.style.gridColumn = "1/4";
			section3.style.gridColumn = "1/4";
		}
	} else {
		smallWindow = false;
		var section1 = document.getElementById("sidebar");
		var section2 = document.getElementById("squareInfo");
		var section3 = document.getElementById("infoBox");
		section1.style.gridColumn = "";
		section2.style.gridColumn = "";
		section3.style.gridColumn = "";
	}
});

//nav
function navToggle() {
	var element = document.getElementById("navDropdown");
	if (element.style.display == "none" || element.style.display == "") {
		element.style.display = "block";
	} else {
		element.style.display = "none";
	}
}

//Budget
var budget = -1;
var rate = 15; //in dollars per hour
function formatBudget(val) {
	var budgetString = "$"+val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return budgetString;
}
function setBudget(val) {
	budget = val;
	var element = document.getElementById("budget");
	if (val == "-1") element.innerHTML = "Unlimited";
	else element.innerHTML = formatBudget(val);
}
function updateBudget(newBudget) {
	if (budget != newBudget) {
		var difference = budget - newBudget;
		setBudget(newBudget);
		//do minus animation
		var element = document.getElementsByClassName("budgetAnim")[0];
		var animate = element.cloneNode(false);
		element.parentElement.appendChild(animate);
		element.innerHTML = "-"+formatBudget(difference);
		element.style.top = "50px";
		element.style.opacity = "0";
		setTimeout(function(){
			element = document.getElementsByClassName("budgetAnim")[0];
			element.remove();
		}, 2000);
	}
}

//Info box
var log = [];
function updateInfo(info,colour) {
	if (info == 1) {
		var element = document.getElementById("infoSelected");
		element.innerHTML = selectedSquares.length;
	} else if (info == 2) {
		var element = document.getElementById("infoExcavated");
		element.innerHTML = excavatedSquares.length;
		updateInfo(1);
	} else {
		var element = document.getElementById("infoText");
		element.innerHTML = "<span style='color:"+colour+"'>"+info+"</span><br>"+element.innerHTML;
		log.push(info);
	}
}

//Ajax calls
var squares = [];
function getSquares(code) { //Gets squares that are over a feature
	var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
			squares = jQuery.parseJSON(this.response);
    }
  };
  xmlhttp.open("GET", "php/connection.php?codeFeat=" + code, false);
  xmlhttp.send();
}
var cost = 0;
function getCost(code) { //Gets cost of feature or square
	var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
			cost = parseInt(this.response)*rate;
    }
  };
  xmlhttp.open("GET", "php/connection.php?codeCost=" + code, false);
  xmlhttp.send();
}
var pics = [];
function getPics(code) { //Gets pictures of square
	var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
			pics = (this.response).split(",");
    }
  };
  xmlhttp.open("GET", "php/connection.php?codeSquFeaPics=" + code, false);
  xmlhttp.send();
}
var sqcontextTable, sqartifactTable, sqproperties, sqmoreTables, sqpictures;
var feacontextTable, feaartifactTable, feaproperties, feamoreTables, feapictures;
function getData(code) { //Gets all info for square or feature
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          var data = jQuery.parseJSON(this.response);
          var cTable = data[0];
          var aTable = data[1];
          var props = data[2];
					var mTables = data[3];
					var pics = data[4];
					if (view == "square") {
						sqcontextTable = cTable;
						sqartifactTable = aTable;
						console.log("SQUARE");
						sqproperties = props;
						sqmoreTables = mTables;
						sqpictures = pics;
					} else {
						feacontextTable = cTable;
						feaartifactTable = aTable;
						feaproperties = props;
						feamoreTables = mTables;
						feapictures = pics;
					}
          update();
      }
  };
  xmlhttp.open("GET", "php/connection.php?code=" + code, true);
  xmlhttp.send();
}

//Updates page with all info about square or feature
function update() {
  var title = document.getElementById("ajTitle");
  var type = document.getElementById("ajType");
  var length = document.getElementById("ajLength");
  var width = document.getElementById("ajWidth");
  var depth = document.getElementById("ajDepth");
  var volume = document.getElementById("ajVolume");
  var area = document.getElementById("ajArea");
	if (view == "square") {
	  title.innerHTML = sqproperties[0] !== null ? sqproperties[0] : "Unavailable";
	  type.innerHTML = sqproperties[1] !== null ? sqproperties[1] : "Unavailable";
	  length.innerHTML = sqproperties[2] !== null ? sqproperties[2] : "Unavailable";
	  width.innerHTML = sqproperties[3] !== null ? sqproperties[3] : "Unavailable";
	  depth.innerHTML = sqproperties[4] !== null ? sqproperties[4] : "Unavailable";
	  area.innerHTML = sqproperties[5] !== null ? sqproperties[5] : "Unavailable";
	  volume.innerHTML = sqproperties[6] !== null ? sqproperties[6] : "Unavailable";
	  generateCTable(sqcontextTable);
	  generateATable(0,sqartifactTable,sqpictures);
	} else {
		title.innerHTML = feaproperties[0] !== null ? feaproperties[0] : "Unavailable";
	  type.innerHTML = feaproperties[1] !== null ? feaproperties[1] : "Unavailable";
	  length.innerHTML = feaproperties[2] !== null ? feaproperties[2] : "Unavailable";
	  width.innerHTML = feaproperties[3] !== null ? feaproperties[3] : "Unavailable";
	  depth.innerHTML = feaproperties[4] !== null ? feaproperties[4] : "Unavailable";
	  area.innerHTML = feaproperties[5] !== null ? feaproperties[5] : "Unavailable";
	  volume.innerHTML = feaproperties[6] !== null ? feaproperties[6] : "Unavailable";
		generateCTable(feacontextTable);
		generateATable(0,feaartifactTable,feapictures);
	}
}

//Highlights background of selected context
function contextBackground(contextID) {
	var allRows = document.getElementsByClassName("contextrow");
	for (var i = 0; i < allRows.length; ++i) {
		if (i == contextID) allRows[i].style.backgroundColor = "gray";
		else allRows[i].style.backgroundColor = "";
	}
}

//Truncate a string
function truncate(string) {
	var length = 10;
	if (string.length > length) {
		return string.substring(0,length) + "...";
	}
	return string;
}

//Creates artifact table
function generateATable(contextID, artifactTable, pictures) {
	contextBackground(contextID);
	if (view != "square") {
		artifactTable = feaartifactTable;
		pictures = feapictures;
	} else {
		artifactTable = sqartifactTable;
		pictures = sqpictures;
	}
  var aTable = document.getElementById("artifactTable");
  var table = "<table id='artifactTableTable'><tr class='artifactrow'>";
  table += "<th>Cat No.</th>";
  table += "<th>Artifacts</th>";
	table += "<th>Picture</th>";
  table += "<th>More</th>";
  table += "</tr>";
  for (var i = 0; i < artifactTable[contextID].length-1; ++i) {
    table += "<tr class='artifactrow'>";
    table += "<td>"+artifactTable[contextID][i][8]+"</td>";
		table += "<td>"+truncate(artifactTable[contextID][i][3])+"</td>";
		var more = parseInt(artifactTable[contextID][i][9]);
		if (more > 0){
			if (pictures[(more-1)]){
				table += "<td><img style='height:15px' src='../images/cam.png'></td>";
			} else {
				table += "<td></td>";
			}
			table += "<td><button onclick='more("+(more-1)+")'>More</button></td>";
		} else {
			table += "<td></td>";
			table += "<td></td>";
		}
    table += "</tr>";
  }
  aTable.innerHTML = table;
}

//Creates context table
function generateCTable(contextTable) {
  var cTable = document.getElementById("contextTable");
  var table = "<table id='contextTableTable'><tr class='artifactrow'>";
  table += "<th>Context</th>";
  table += "<th>Entries</th>";
  table += "<th>Photo</th>";
  table += "</tr>";
  for (var i = 0; i < contextTable.length; ++i) {
		table += "<tr class='contextrow' onclick='generateATable("+i+")'>";
    for (var z = 0; z < contextTable[i].length; ++z) {
      table += "<td>"+contextTable[i][z]+"</td>";
    }
    table += "</tr>";
  }
  cTable.innerHTML = table;
}

//When the user clicks anywhere outside of the modal, close it
var modal;
window.onclick = function(event) {
		if (event.target == modal) {
				modal.style.display = "none";
		}
};

//When the more button is clicked
function more(index) {
	if (view == "feature") {
		var pictures = feapictures;
		var moreTables = feamoreTables;
	}
	else {
		var pictures = sqpictures;
		var moreTables = sqmoreTables;
	}

	//Filter Columns
	var tableName = moreTables[index][0];
	var columnNames = [];
	var indexes = [];
	var title = "";

	if (tableName == "aabeads") {
		title = "Beads";
		columnNames = ["Catalog Number","Material","Condition","Manufacture","Size","Shape","Diaphaneity","Color","Count"];
		indexes = [1,3,4,5,6,7,8,9,10];
	}
	if (tableName == "aaceram") {
		title = "Ceramics";
		columnNames = ["Catalog Number","Portion","Temper","Surface","Interior","Size","Thickness","Decoration"];
		indexes = [1,2,3,4,5,6,7,11];
	}
	if (tableName == "aafaun") {
		title = "Fauna";
		columnNames = ["Catalog Number","Species","Name","Class","Element","Size","Count"];
		indexes = [1,2,3,4,5,10,12];
	}
	if (tableName == "aahc") {
		title = "Historic Ceramics";
		columnNames = ["Catalog Number","Portion","Ware","Type","Decoration","Size","Count"];
		indexes = [1,2,3,4,5,8,9];
	}
	if (tableName == "aahist") {
		title = "Historic Artifacts";
		columnNames = ["Catalog Number","Material Type","Type","Function","Size","Count"];
		indexes = [1,3,4,5,8,9];
	}
	if (tableName == "aalithic") {
		title = "Stone Tools";
		columnNames = ["Catalog Number","Category","Raw Material","Condition","Size","Count"];
		indexes = [1,2,5,6,7,8];
	}
	if (tableName == "aapip") {
		title = "Pipes";
		columnNames = ["Catalog Number","Raw Material","Morphology","Portion","Count"];
		indexes = [1,2,3,4,18];
	}

	var modal = document.getElementById('myModal');
	var modalEdit = document.getElementById('modalEdit');
	var modalPicts = document.getElementById('modalPics');
	modalPicts.innerHTML = "";
	modal.style.display = "block";

	title = "<h1>"+title+"</h1>";
	//Column names
	var table = title+"<table><tr>";
	for (var i = 0; i < columnNames.length; ++i) {
			table += "<th>"+columnNames[i]+"</th>";
	}
	table += "</tr>";
	for (var i = 2; i < moreTables[index].length; ++i) {
		table += "<tr>";
		for (var z = 0; z < indexes.length; ++z) {
			table += "<td>"+moreTables[index][i][indexes[z]]+"</td>";
		}
		table += "</tr>";
	}
	table += "</table>";

	var content = table+"<br>";
	if (pictures[index] != "") {
		content += "<img src='db/images/"+pictures[index].toString().toLowerCase()+".gif'/>";
	}
	modalEdit.innerHTML = content;
	modal.style.display = "block";
}

//Used to keep track of the type of square
var selectedSquares = [];
var selectedSquaresObj = [];
var excavatedSquares = [];
var excavatedSquaresObj = [];

//Used for drag selecting
var mouseDown = 0;
document.body.onmousedown = function() {
  mouseDown = 1;
};
document.body.onmouseup = function() {
  mouseDown = 0;
};

//Lets user select a random number of squares
var unselectedSquares;
function random() {
	var number = prompt("Enter number of squares to select", 0);
	if (number > 0){
		var squares = document.querySelectorAll("#GRID_UNITS a");
		unselectedSquares = [];
		for (var i = 0; i < squares.length; ++i) {
			if (!(selectedSquaresObj.includes(squares[i]) || excavatedSquaresObj.includes(squares[i]))){
				unselectedSquares.push(squares[i]);
			}
		}
		if (number > unselectedSquares.length) number = unselectedSquares.length;
		running = true;
		for (var i = 0; i < number; i++){
			var x = Math.floor(Math.random() * unselectedSquares.length);
			unselectedSquares[x].onclick();
			remove(unselectedSquares,unselectedSquares[x]);
		}
		if (number == 1) updateInfo("Randomly selected 1 square","black");
		else updateInfo("Randomly selected "+number+" squares","black");
		updateInfo(1,"");
		running = false;
	}
}

//Global vars to do with map zooming
var to, from = [];
var per, sto, sfrom, hto, hfrom = 0;
var svg, svgStyle, lines, zooming;
var view = "map";
//mapZoom gets a new value using a percentage of
//what the value started as, to what the value will be.
//This creates a animation of zooming in and out
function mapZoom() {
	per += 0.2;
	var val = [0,0,0,0];
	for (var i = 0; i < 4; i++) val[i] = from[i] + ((to[i]-from[i]) * per);
	var stroke = sfrom + ((sto-sfrom) * per);
	for (var i = 0; i < lines.length; ++i) lines[i].style.strokeWidth = stroke;
	var height = hfrom + ((hto-hfrom) * per);
	svgStyle.style.height = height+"px";
	if (val[2] < 0) val[2] = 0;
	if (val[3] < 0) val[3] = 0;
	if (per >= 1) {
		svg.setAttribute("viewBox", to[0]+" "+to[1]+" "+to[2]+" "+to[3]);
		zooming = false;
		if (view == "square") hideGrid();
		return;
	} else svg.setAttribute("viewBox", val[0]+" "+val[1]+" "+val[2]+" "+val[3]);
	setTimeout(mapZoom, 1);
}

//Hides grid so a feature can be clicked
function hideGrid() {
	var grid = document.getElementById("GRID_UNITS");
	grid.style.display = "none";
}

//Shows grid so a square can be clicked
function showGrid() {
	var grid = document.getElementById("GRID_UNITS");
	grid.style.display = "inline";
}

//These 3 functions can show the 3 different views
var prevcode = "";
function viewSquare(info){
	if (!zooming) {
		var wasFeature = false;
		if (view == "feature") {
			wasFeature = true;
		}
		view = "square";
		if (wasFeature) {
			getPics(prevcode);
			update();
			var svgStyle = document.getElementById("svgMap");
			svgStyle.style.display = "inline";
		}
		var map = document.getElementById("map");
		var square = document.getElementById("info");
		var artifacts = document.getElementById("artifacts");
		var squtab = document.getElementById("squaretab");
		var maptab = document.getElementById("maptab");
		var featab = document.getElementById("featuretab");
		var desc = document.getElementById("description");
		if (smallWindow){
			var section1 = document.getElementById("sidebar");
			var section2 = document.getElementById("squareInfo");
			var section3 = document.getElementById("infoBox");
			section1.style.gridColumn = "1/4";
			section2.style.gridColumn = "1/4";
			section3.style.gridColumn = "1/4";
		}
		desc.style.display = "none";
		featab.style.display = "none";
		maptab.style.pointerEvents = "auto";
		squtab.style.display = "inline";
		featab.style.color = "white";
		maptab.style.color = "white";
		squtab.style.color = "black";
		artifacts.style.display = "inline";
		map.style.display = "none";
		square.style.display = "inline";

		if (!wasFeature && info) {
			//Set value for zooming in
			zooming = true;
			per = 0;
			var string = info.split("S")[1];
			if (string.includes("R")) {
				var first = parseInt(string.split("R")[0]);
				var second = parseInt(string.split("R")[1]);
				if (second == 103) second = 110;
				first = (first+10)*-1;
			} else {
				var first = parseInt(string.split("L")[0]);
				var second = -10;
				first = (first+10)*-1;
			}
			second = second-10;
			to = [second,first,10,150]; //viewbox
			from = [-20, -330, 130, 150]; //viewbox
			sto = 0.05; //stroke
			sfrom = 0.3; //stroke
			var svgMap = document.getElementById("svgMap");
			hto = svgMap.clientWidth; //height
			hfrom = svgMap.clientHeight; //height
			mapZoom();
			getPics(info);
			prevcode = info;
		}
	}
}
function viewMap() {
	if (!zooming) {
		if (view == "feature") {
			var svgStyle = document.getElementById("svgMap");
			svgStyle.style.display = "inline";
		}
		view = "map";
		zooming = true;
		showGrid();
		var map = document.getElementById("map");
		var square = document.getElementById("info");
		var artifacts = document.getElementById("artifacts");
		var squtab = document.getElementById("squaretab");
		var featab = document.getElementById("featuretab");
		var maptab = document.getElementById("maptab");
		var desc = document.getElementById("description");
		if (smallWindow){
			var section1 = document.getElementById("sidebar");
			var section2 = document.getElementById("squareInfo");
			var section3 = document.getElementById("infoBox");
			section1.style.gridColumn = "1/7";
			section2.style.gridColumn = "1/7";
			section3.style.gridColumn = "1/7";
		}
		desc.style.display = "none";
		maptab.style.pointerEvents = "none";
		squtab.style.pointerEvents = "none";
		featab.style.display = "none";
		squtab.style.display = "none";
		featab.style.color = "white";
		maptab.style.color = "black";
		squtab.style.color = "white";
		artifacts.style.display = "none";
		map.style.display = "inline";
		square.style.display = "none";

		//Reverses all values for map zooming
		per = 0;
		var temp = to;
		to = from;
		from = temp;
		temp = sto;
		sto = sfrom;
		sfrom = temp;
		var svgMap = document.getElementById("svgMap");
		hto = svgMap.clientWidth * (15/13);
		hfrom = svgMap.clientHeight;
		mapZoom();
	}
}
function viewFeature() {
	view = "feature";
	var map = document.getElementById("map");
	var artifacts = document.getElementById("artifacts");
	var squtab = document.getElementById("squaretab");
	var featab = document.getElementById("featuretab");
	var desc = document.getElementById("description");
	desc.style.display = "block";
	squtab.style.pointerEvents = "auto";
	featab.style.display = "inline";
	featab.style.color = "black";
	maptab.style.color = "white";
	squtab.style.color = "white";
	artifacts.style.display = "inline";
	map.style.display = "none";

    var picLocation = document.getElementById("mapbackground");
    $(picLocation).empty().append("<img src=db/images/" + featureCode + ".gif id='featureimages' style='margin: 5px;width:calc(100% - 10px);display:block;'>");

	var svgStyle = document.getElementById("svgMap");
	svgStyle.style.display = "none";

    getPics(featureCode);
}

//Opens modal with description of feature
function showDescription() {
	$.ajax({ url: '../db/descriptions/'+featureCode+".html", success: function(data) {
		var modal = document.getElementById('myModal');
		var modalEdit = document.getElementById('modalEdit');
		var modalPicts = document.getElementById('modalPics');
		modalPicts.innerHTML = "";
		//remove <a> tags
		var content = "<h1>"+feaproperties[0]+"</h1>"+data.split(data.split("<p>")[0])[1];
		while (content.includes("<a ")) {
			var before = content.split("<a ")[0];
			var split2 = content.split('">')[1];
			var middle = split2.split("</a>")[0];
			var split3 = content.split("</a>");
			var after = "";
			for (var i = 1; i < split3.length; ++i) {
				after += split3[i];
			}
			content = before + middle + after;
		}
		modalEdit.innerHTML = content;
		modal.style.display = "block";
	}});
}

//Opens the modal with slideshow of pictures
function showPictures() {
	var modal = document.getElementById('myModal');
	var modalEdit = document.getElementById('modalEdit');
	var modalPicts = document.getElementById('modalPics');
	var content = "<div class='slideshow-container'>"
  if (view == "square") content += "<h1 style='margin-top:20px'>"+sqproperties[0]+" Images</h1>";
  else content += "<h1 style='margin-top:20px'>"+feaproperties[0]+" Images</h1>";
	for (var i = 0; i < pics.length; ++i) {
		if (i == 0) content += "<div class='mySlides fade' style='display:block'>";
		else content += "<div class='mySlides fade' style='display:none'>";
		content += "<div class='numbertext'>";
		content += (i)+" / "+pics.length+"</div>";
		content += "<img src=db/images/"+pics[i].toLowerCase()+".gif style='max-width:100%;display:block;margin-left:auto;margin-right:auto;max-height:390px'>";
		content += "</div>";
	}
	content += "<a class='prev' onclick='plusSlides(-1)'>&#10094;</a>";
	content += "<a class='next' onclick='plusSlides(1)'>&#10095;</a>";
	content += "<div style='text-align:center'>";
	content += "<span class='dot' style='background-color:black' onclick='currentSlide("+0+")'></span>";
	for (var i = 1; i < pics.length; ++i) {
		content += "<span class='dot' onclick='currentSlide("+(i)+")'></span>";
	}
	content += "</div>";
	modalPicts.innerHTML = content;
	modalEdit.innerHTML = "";
	modal.style.display = "block";
	slideIndex = 0;
}
var slideIndex = 0;
function currentSlide(n) {
	showPic(n);
}
function plusSlides(n) {
	showPic(slideIndex + n);
}
function showPic(n) {
	var i;
	var x = document.getElementsByClassName("mySlides");
	var dots = document.getElementsByClassName("dot");
	if (!(n >= x.length || n < 0)) {
		for (i = 0; i < x.length; i++) {
			 x[i].style.display = "none";
			 dots[i].style.backgroundColor = "#bbb";
		}
		x[n].style.display = "block";
		dots[n].style.backgroundColor = "black";
		slideIndex = n;
	}
}

//When the user clicks on a square:
//Selects a square if its not excavated or already selected
//Deselects a square if its already selected
var selectedSquares = [];
var selectedSquaresObj = [];
var excavatedSquares = [];
var excavatedSquaresObj = [];
function square(object,info) {
	if(selectedSquaresObj.includes(object)) { //deselect
		object.firstChild.style.fill= "url(#imgGrass)";
		remove(selectedSquares, info);
		remove(selectedSquaresObj, object);
		if (!running) updateInfo(1,"");
	} else {
		if(excavatedSquaresObj.includes(object)) {
			if (info != 'null') {
        getData(info);
        viewSquare(info);
      }
		} else {
			object.firstChild.style.fill= "url(#imgGrassSelected)";
			selectedSquares.push(info);
			selectedSquaresObj.push(object);
			if (!running) updateInfo(1,"");
		}
	}
}

var featuredExcavated = [];
var featureCode = "";
function feature(info) {
	featureCode = info;
	//budget
	if (budget != -1) {
		if (featuredExcavated.includes(info)) {
			getData(info);
			viewFeature();
		} else {
			//check if uncovered
			getSquares(info);
			var uncovered = true;
			for (var i = 0; i < squares.length; ++i) {
				if(!excavatedSquares.includes(squares[i])){
					uncovered = false;
					break;
				}
			}
			if (!uncovered) {
				updateInfo("This feature is not fully uncovered","red");
			} else {
				getCost(info);
				var newBudget = budget;
				if (cost <= newBudget || isNaN(cost)) {
					if (isNaN(cost)) {
						getData(info);
						viewFeature();
						featuredExcavated.push(info);
						updateInfo("You have excavated a feature for $0","green");
					} else {
						newBudget -= cost;
						getData(info);
						viewFeature();
						updateBudget(newBudget);
						featuredExcavated.push(info);
						updateInfo("You have excavated a feature for "+formatBudget(cost),"green");
					}
				} else {
					updateInfo("Not enough money to excavate!","red");
				}
			}
		}
	} else {
		getData(info);
		viewFeature();
	}
}

//Deselects all squares
var running = false;
function deselect() {
	if (selectedSquares.length == 0) {
		updateInfo("No squares selected to deselect","red");
	} else {
		while (selectedSquares.length != 0) {
			var num = selectedSquares.length;
			running = true;
			var arr = selectedSquaresObj.slice();
			for (var i = num-1; i>=0; i--){
				arr[i].onclick();
			}
			running = false;
		}
		updateInfo("All squares were deselected","black");
		updateInfo(1,"");
	}
}

//Removes element from array
function remove(list,value) {
	for (var i = 0; i< list.length; i++){
		if (list[i] == value){
			list.splice(i,1);
		}
	}
}

//Excavates all the squares selected
function excavateSquare() {
	var num = selectedSquares.length;
	if (num == 0) {
		updateInfo("No squares selected to excavate","red");
	} else {
		var newBudget = budget;
		for (var i = 0; i< num; i++){
			//budget
			if (budget != -1){
				cost = 40 * rate;
				if (cost <= newBudget) {
					newBudget -= cost;
				} else {
					updateInfo("Not enough money to excavate further!","red");
					break;
				}
			}
			selectedSquaresObj[i].firstChild.style.fill= "rgba(255, 255, 255,0)";
			excavatedSquares.push(selectedSquares[i]);
			excavatedSquaresObj.push(selectedSquaresObj[i]);
		}
		if (i != 0) {
			if (budget != -1) {
				if (i == 1) updateInfo("You have excavated "+i+" square for "+formatBudget(budget-newBudget),"green");
				else updateInfo("You have excavated "+i+" squares for "+formatBudget(budget-newBudget),"green");
				updateBudget(newBudget);
			} else {
				if (i == 1) updateInfo("You have excavated "+i+" square","green");
				else updateInfo("You have excavated "+i+" squares","green");
			}
			selectedSquares = selectedSquares.diff(excavatedSquares);
			selectedSquaresObj = selectedSquaresObj.diff(excavatedSquaresObj);
			updateInfo(2,"");
		}
	}
}

//Gets the difference between 2 arrays
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};
