process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fs = require('fs'); // Define FileStream Library
const puppeteer = require('puppeteer'); // Define Puppeteer Library
const { exec } = require("child_process"); // Define Child Process Library
const express = require("express"); // Define Express
const { google } = require("googleapis"); // Define Google APIs
const app = express(); // Instaniate Express
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// start and stop 
// https://stackoverflow.com/questions/48530153/stop-function-in-node-js-with-click-in-frontend

// Retriving a representation of the main page resource
app.get("/", (req, res) => {
  res.render("main"); // Rendering the main.ejs file as a response on the webpage
});

// Retriving a representation of the Network Data Collector resource
app.get("/network", (req, res) => {
  res.render("index"); // Rendering the index.ejs file as a response on the webpage
  app.disable('program start'); // Disables any processes in the Network Data Collector function if still running
});
// A representation of a button as an HTML page for Online Mapping
app.get("/button", (req, res) => {
  // Checks if the program is not running, and runs the program if so. Otherwise, it stops the collecting.
  if(app.disabled('processing points')){app.enable('processing points');}
  else{app.disable('processing points');}
  res.redirect("close.html"); // Rendering the close.html file as a response on the webpage, which opens and closes a tab
});

// Retriving a representation of the Online Mapping resource
app.get("/online-mapping", (req, res) => {
  app.disable('processing points'); // Turns off Online Mapping Collection (iPerf commands + Ping + CPE) if still running
  // HTML Response to the webpage
  res.write('<!doctype html><html lang="en"><head><title>KCCTech - Online Mapping</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">');
  res.write('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"><link href="https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap" rel="stylesheet"><link rel="stylesheet" href="css/main.css">');
  res.write('<style> form   {text-align: center; margin: auto; padding-right: 10px;}label {text-align: center; display: block;}#typeOfTest_label {padding-right: 36px; display: inline-block; }#typeOfTest {display: inline-block;margin:auto;}');
  res.write('#isStatic_label {padding-right: 36px; display: inline-block; }#isStatic {display: inline-block;margin:auto;}#submit_button {text-align: center; margin:auto; display: flex;}');
  res.write('#locationImg {margin-left: 70px;} #location_img_label {margin:left; padding-right: 0px;}#display_image{margin-right:auto; margin-left: auto;width: 700px;height:800px;border: 1px solid black;background-position: center;background-size: 700px 800px;background-repeat: no-repeat; }');
  // ON WINDOWS VERSION, NEED TO MAKE HEIGHT OF display_image = 700
  res.write('#kpi_settings {margin-left: 70px;} #kpi_settings_label {margin:left; padding-right: 0px;}#point1 {z-index: 0;background: white;position: fixed; top: 0; left: 0;width: 10px;height: 10px;border-radius: 50%;display: flex;} #point2 {z-index: 1;background: white;position: fixed; top: 0; left: 0;width: 10px;height: 10px;border-radius: 50%;display: flex;}');
  res.write('</style></head><body><div class="header"><img id = "kcctech_logo" src = "logos/kcctech_logo.png" alt = "KCCTECH LOGO"></div><div class="container"><br><div class="row justify-content-center">');
  res.write('<form action="" method="POST" style="width:100%"><div class = "input_div"><h2 class="heading-section">Online Mapping</h2><div id ="hidden"></div>');
  res.write('<input type="hidden" id="whichCoordinate" name="whichCoordinate" value = 0 /><input type="hidden" id="currentPointIndex" name="currentPointIndex" value = 1 /><input type="hidden" id="display_orientation" name="display_orientation" value = "vertical" /><input type="hidden" id="display_size" name="display_size" value = "700px 800px" />');
  res.write('<input type="hidden" id="offset_left" name="offset_left" value = 598 /><br>');
  res.write('<label for="typeOfTest" id="typeOfTest_label"><b>Type of Test</b></label><select id="typeOfTest" name="typeOfTest">');

  let config_data = fs.readFileSync("config.csv").toString(); // Reads the "config.csv" file and outputs it to a string
  let config_lines = config_data.replace(/\n/g, '').split(","); // Removes any newline characters and creates an array from the string, splitting at ","
  let idx = 1
  // Creates <option> tags based on each command in the config.csv file
  for(let i = 5; i < config_lines.length; i+=4){
    res.write('<option value=' + i + '>' + config_lines[i] + '</option>'); //command
  }
  res.write('</select><br><label for="cpe_ip" id="cpe_ip_label"><b>CPE IP Address</b></label><input type="name" id="cpe_ip" name="cpe_ip" /><br><label for="isStatic" id="isStatic_label" ><b>Static Test?</b></label><input type="checkbox" id="isStatic" name="isStatic">');
  res.write('<label for="kpi_settings" id="kpi_settings_label"><b>KPI Settings File</b></label><input type="file" id="kpi_settings" name="kpi_settings" required/><br><label for="locationImg" id="location_img_label"><b>Location Image</b></label><input type="file" id="locationImg" name="locationImg" accept="image/png, image/jpg, image/jpeg" required/><br>');
  res.write('<br><button onclick="addPoint()" type="button" id="add_point_button">Add Point</button><button style ="margin-left: 10px;" onclick="removePoint()" type="button" id="remove_point_button">Remove Point</button><br><br><div id = "display_image"></div></div>');
  
  res.write('<script>function addPoint() {if(document.querySelector("#display_image").style.backgroundImage != ""){let newPoint = document.createElement("div"); let currentPointNum = document.getElementById("currentPointIndex").value;newPoint.setAttribute("id", "point" + currentPointNum); newPoint.setAttribute("style", "z-index: 1;background: white;position: absolute; top: 0; left: 0;width: 10px;height: 10px;border-radius: 50%;display: flex;");document.getElementById("display_image").appendChild(newPoint);');
  res.write('let newX = document.createElement("input"); newX.setAttribute("id", "startX" + parseInt(currentPointNum)); newX.setAttribute("name", "startX" + parseInt(currentPointNum)); newX.setAttribute("type", "hidden");let newY = document.createElement("input"); newY.setAttribute("id", "startY" + parseInt(currentPointNum)); newY.setAttribute("name", "startY" + parseInt(currentPointNum));');
  res.write('newY.setAttribute("type", "hidden");let inputBlock = document.getElementById("hidden"); inputBlock.appendChild(newX);inputBlock.appendChild(newY);document.getElementById("currentPointIndex").value = parseInt(currentPointNum) + 1;}}');
  
  res.write('function removePoint() {let currentPointNum = document.getElementById("currentPointIndex").value;if(parseInt(currentPointNum) > 1){ let parentNode = document.getElementById("display_image");');
  res.write('parentNode.removeChild(parentNode.lastElementChild);document.getElementById("currentPointIndex").value = parseInt(currentPointNum) - 1;let inputBlock = document.getElementById("hidden"); inputBlock.removeChild(inputBlock.lastElementChild);inputBlock.removeChild(inputBlock.lastElementChild);}}');


  res.write('function printMousePos(event) {if(document.getElementById("display_image").style.backgroundImage != ""){let pointVal = document.getElementById("currentPointIndex").value;let pntNum = parseInt(pointVal) - 1;let x_id = "startX" + pntNum;let y_id = "startY" + pntNum;');
  res.write('let picString = document.getElementById("display_size").value;let pictureSize = picString.split(" ");let offset_left = document.getElementById("display_image").offsetLeft;console.log(event.layerX, event.layerY); console.log("offset", offset_left);for(let i = 0; i < 2; i++){pictureSize[i] = parseInt(pictureSize[i].substring(0, pictureSize[i].length - 2));}if((event.layerX > offset_left && event.layerX < (offset_left + pictureSize[0])) && (event.layerY > 587 && event.layerY < (587 + pictureSize[1]))){');
  res.write('let change = "point"+parseInt(pntNum); document.getElementById(change).style.marginLeft = (event.layerX - 3).toString() +"px";document.getElementById(change).style.marginTop = (event.layerY - 4).toString() +"px";if(document.getElementById(change).style.backgroundColor == "white"){const randomColor = Math.floor(Math.random()*16777215).toString(16);let circleColor =  "#" + randomColor;');
  res.write('document.getElementById(change).style.backgroundColor = circleColor;}document.getElementById(x_id).value = event.layerX;document.getElementById(y_id).value = event.layerY;}   }}');

  res.write('document.addEventListener("click", printMousePos);let inputImage = document.querySelector("#locationImg"); let uploaded_image = ""; inputImage.addEventListener("change", function(){const reader = new FileReader();reader.addEventListener("load", () => {uploaded_image = reader.result;document.querySelector("#display_image").style.backgroundImage = `url(${uploaded_image})`;');//top left (92, 67) (792, 517)//(411,151) (868, 585)
  res.write('var img = new Image();img.onload = function() {let newDisplay = "";document.querySelector("#display_image").style.backgroundImage = `url(${uploaded_image})`;if(this.height >= 1100 && this.width >= 1100){ newDisplay = "1100px 1100px";document.getElementById("display_image").style.height = "1100px";document.getElementById("display_image").style.width = "1100px";}');
  res.write('else if(this.height < 1100 && this.width >= 1100){newDisplay = "1100px " + this.height.toString() + "px"; document.getElementById("display_image").style.height = this.height.toString() + "px";document.getElementById("display_image").style.width = "1100px";}');
  res.write('else{newDisplay = this.width.toString() + "px " + this.height.toString() + "px"; document.getElementById("display_image").style.height = this.height.toString() + "px";document.getElementById("display_image").style.width = this.width.toString() + "px";}document.getElementById("display_size").value = newDisplay;document.getElementById("display_image").style.backgroundSize = newDisplay;document.getElementById("offset_left").value = document.getElementById("display_image").offsetLeft;');
  res.write('};img.src = `${uploaded_image}`;');
  res.write('});reader.readAsDataURL(this.files[0]);})</script></div><br><button type="submit" id="submit_button">Start</button></form>');
  res.write('</div></div><script src="js/jquery.min.js"></script></body></html>');
  res.end();
});

// Processing the data / handling the submission of the Online Mapping resource
app.post("/online-mapping", async (req, res) => {
  // Checks if the test_logs folder has been created
  if (!fs.existsSync("../test_logs")) {
      //Folder doesn't exist
      fs.mkdir("../test_logs", function (err){
          if (err) throw err;
          console.log('Test Logs Folder is created successfully.');
      });
  }
  // Setting Constant Variables to the data recieved from the Online Mapping Submission
  const {startX1, startY1, startX2, startY2, startX3, startY3, startX4, startY4, startX5, startY5, startX6, startY6, startX7, startY7, startX8, startY8, startX9, startY9, startX10, startY10, startX11, startY11, startX12, startY12, startX13, startY13, startX14, startY14, startX15, startY15, currentPointIndex, locationImg, kpi_settings, cpe_ip, typeOfTest, isStatic, display_orientation, display_size, offset_left} = req.body;
  // Handling iPerf/Ping tests
  let config_data = fs.readFileSync("config.csv").toString(); // Reads the "config.csv" file and outputs it to a string
  let config_lines = config_data.replace(/\n/g, '').split(","); // Removes any newline characters and creates an array from the string, splitting at ","

  let testIdx = parseInt(typeOfTest) + 1; // Sets the index of where the command is located in the config_lines variable
  let command = config_lines[testIdx]; // Sets the specified command(s)

  // Checks if there are multiple commands separated by '&' sign
  if(command.indexOf("&") > -1){ // Multiple Commands
    commands = command.split("&");
  }
  else{ // Single Command
    commands = [command];
  }

  // Removes any empty strings in the commands variable if they exist
  commands = commands.filter(function (el) {
    return el != '';
  });

  // Handling Points
  let numPoints = parseInt(currentPointIndex) - 1; // Gets the total number of points for Online Mapping
  // Creating a 2-Dimension Array of the Chosen Points
  const pointArr = [[startX1, startY1], [startX2, startY2], [startX3, startY3], [startX4, startY4], [startX5, startY5]];
  pointArr.push([startX6, startY6], [startX7, startY7], [startX8, startY8], [startX9, startY9], [startX10, startY10]);
  pointArr.push([startX11, startY11], [startX12, startY12], [startX13, startY13], [startX14, startY14], [startX15, startY15]);

  // Opens and reads the kpi_settings file and parses the data to individual settings as an array
  let kpiSettings = fs.readFileSync("./views/post-processing/" + kpi_settings).toString().replace(/\r/g, '').split("\n");
  kpiSettings.shift(); // Removes the first line in the file (which is the format of the data)
  
  //[[kpi, less than, greater than]] -> Format of the kpi_settings array
  let checkValues = [];
  // Removes any empty strings if they exist
  kpiSettings = kpiSettings.filter(function (el) {
    return el != '';
  });

  const datatype = kpiSettings[0].split(",")[0]; // Sets the datatype for the Legend and Collection

  // Iterates through each line in the KPI Settings file to split the data for Parsing and Collection
  kpiSettings.forEach( function(line){
    let lineValues = line.split(","); // Splits line into its 3 individual pieces(Datatype, Range, Color)
    let kpiArr = [lineValues[0]]; // Creates 2-Dimensional Array starting with Datatype

    // Checks if there are any '<' signs in range
    if(lineValues[1].indexOf("<") > -1){
      let hasLessThan = lineValues[1].split("<");
      // Checks if there 2 '<'
      if(hasLessThan.length > 2){ // 2 '<'
        kpiArr.push(parseInt(hasLessThan[2]), parseInt(hasLessThan[0]))
      }
      else{ // Only 1 '<'
        kpiArr.push(parseInt(hasLessThan[1]), '')
      }
    }
    else{ // Only '>' signs in range
      let hasGreaterThan = lineValues[1].split(">");
      // Checks if there 2 '<'
      if(hasGreaterThan.length > 2){ // Only 2 '>'
        kpiArr.push(parseInt(hasGreaterThan[0]), parseInt(hasGreaterThan[2]))
      }
      else{ // Only 1 '>'
        kpiArr.push('', parseInt(hasGreaterThan[0]))
      }
    }
    kpiArr.push(lineValues[2]); // Puts the color into the new parsed array
    checkValues.push(kpiArr); // Puts new parsed array into the bigger list of arrays
    
  })

  if(puppeteer.Browser != undefined){puppeteer.Browser.close();} // Closes any Puppeteer Browsers if they exist

  let webpage = '';
  // Checks if the cpe_ip variable was set in the Online Mapping Submission
  if(cpe_ip == ''){
    webpage = "hx";
  }
  else{
    webpage = "x";
  }
  
  // Creates Current Time and Date for filename
  let currentDate = new Date();
  let months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
  let month = currentDate.getMonth() + 1;
  
  if(month < 10){
    month = "0" + month.toString();
  }
  else{
    month = month.toString();
  }

  let day = currentDate.getDate();
  if(day < 10){
    day = "0" + day.toString();
  }
  else{
    day = day.toString();
  }

  let hour = currentDate.getHours();

  if(hour < 10){
    hour = "0" + hour.toString();
  }
  else{
    hour = hour.toString();
  }

  let minute = currentDate.getMinutes();
  if(minute < 10){
    minute = "0" + minute.toString();
  }
  else{
    minute = minute.toString();
  }
  const testsLabelname = month + day + currentDate.getFullYear() + "_" + hour + minute + currentDate.getMilliseconds().toString().substring(0, 3);
  
  const pointsFileName = testsLabelname + "_Points_File.csv";
  // Writes / Creates Points LogFile
  fs.writeFile("../test_logs/" + pointsFileName, "", {flag: "w"}, function (err){
    if (err) throw err;
  });

  for(let i = 0; i < numPoints; i++){
    // Writes the points to the file
    fs.appendFileSync("../test_logs/" + pointsFileName, pointArr[i][0] + "," + pointArr[i][1] +"\n", function (err){
      if (err) throw err;
    });
  }
  // Initiate the Puppeteer browser 
  console.log("launch");
  const browser = await puppeteer.launch({pipe: true, executablePath: '/usr/bin/chromium-browser', ignoreHTTPSErrors: true});
  let page = await browser.newPage();
  // Try to go to the CPE Webpage
  try{
    let arrived = await page.goto(webpage, { waitUntil: 'networkidle2', }); // wait until page load
  } catch (e) {
    res.send("The following webpage could not load. Please reload and try again.")
    await browser.close();
    res.end();
  }
  
  // Successfully made it to the webpage, now to login using the credentials
  console.log('Page Loaded!');
  await page.type('#username', 'x');
  await page.type('#password', 'x');
  await Promise.all([
    page.click('#login'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);
  console.log('Logged in!');
  
  // HTML Response to Webpage
  res.write('<!doctype html><html lang="en"><head><title>KCCTech - Online Mapping</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">');
  res.write('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"><link href="https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap" rel="stylesheet">');
  res.write('<link rel="stylesheet" href="css/main.css"><style>');
  res.write('#locationImg {margin-left: 70px;} #location_img_label {margin:left; padding-right: 0px;}');

  // Set height and width based on picture size
  let disp_break = display_size.split(" ");
  res.write('#display_image{margin-right:0px; margin-left: 0px;width: ' + disp_break[0]+';height: ' + disp_break[1]+';border: 1px solid black;background-position: center;background-size: ' + display_size + ';background-repeat: no-repeat;background-image: url("../post-processing/' + locationImg + '")}');
  res.write('#kpi_info {margin-left: 70px;} #kpi_info_label {margin:left; padding-right: 0px;} #legend {border: 1px solid black;width: 200px; height:500px; background-color: #B8B8B4; margin-left:0px; margin-right:20px;}');
  res.write('#point {z-index: 0;background: white;position: fixed; top: 0; left: 0;width: 20px;height: 20px;border-radius: 50%;display: flex;} </style>');
  res.write('</head><body><div class="header"><img id = "kcctech_logo" src = "logos/kcctech_logo.png" alt = "KCCTECH LOGO"><h2 class="heading-section" style ="text-align: center;">Online Mapping</h2><br><a href ="/button" target = "_blank"><button style = "text-align: center; display: flex;margin-left:auto; margin-right:auto;"onclick="startStop()" type="button" id="onOffButton">Start</button></a></div><div class="container" style = "margin-left:0px;">');
  res.write('<br><div class="row justify-content-center" style="justify-content: left !important; margin-right:10px; margin-left:200px; width: 1500px;">');
  res.write('<script>function startStop() {if(document.getElementById("onOffButton").innerText == "Stop"){document.getElementById("onOffButton").innerText = "Start";}else{document.getElementById("onOffButton").innerText = "Stop";}}');
  res.write('function printMousePos(event) {console.log("x", event.clientX); console.log("y", event.clientY);}document.addEventListener("click", printMousePos);</script>')
  res.write('<br><div id = "legend">');
  // Create the Legend on Webpage 
  for(let k = 0; k < kpiSettings.length; k++){
    let kpiSetting = kpiSettings[k].split(","); // Creates an Array to separate the line
    res.write('<div id= "legendValue' + (k+1) + '" style= "background: ' + kpiSetting[2] + ';margin-top: 10px; margin-left: 10px; ')
    res.write('z-index: ' + k + '; position: absolute; width: 10px;height: 10px;border-radius: 50%;display: flex;"></div>');
    // https://www.w3schools.com/html/html_entities.asp
    // Creates Instance of Range with Color depending on format
    
    if(kpiSetting[1].split("<").length > 2){
        let line = kpiSetting[1].split("<");
        res.write('<p style = "margin-left: 25px; margin-bottom: 0px; width: 150px; color: white; display: flex;"> ' + line[0] + "&lt" + line[1] + "&lt" + line[2] +' </p>');
    }
    else if(kpiSetting[1].split(">").length > 2){
        let line = kpiSetting[1].split(">");
        res.write('<p style = "margin-left: 25px; margin-bottom: 0px;width: 150px; color: white; display: flex;"> ' + line[0] + "&gt" + line[1] + "&gt" + line[2] +' </p>');
    }
    else{
        res.write('<p style = "margin-left: 25px; margin-bottom: 0px; width: 150px; color: white; display: flex;"> ' + kpiSetting[1] +' </p>');
    }
   
  }
  
  res.write('</div><div id = "display_image">')
  
  await page.goto(webpage, { waitUntil: 'networkidle0' }); // Goes to CPE Webpage
  
  // Iterates for every point
  for(let idx = 0; idx < numPoints - 1; idx++){
    let cpeTestName = "../test_logs/"+testsLabelname+"_CPE_Collection_Test_Point" + (idx+1).toString() + ".txt"; // Creates CPE Log Filename
    exec("sudo killall -9 iperf3", (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
      }
    });
    while(app.disabled('processing points')){await waitSeconds(3);} // Waits until the user hits start
    // Checks if there is at least one command to run
    if(commands.length > 0){
      processCommands((idx+1), testsLabelname, commands); // Runs iPerf or Ping test(s) in background
    }
    
    // Writes / Creates CPE Log File
    fs.writeFile(cpeTestName, "", {flag: "w"}, function (err){
        if (err) throw err;
    });
    // Sets up the labels for the CPE Log File
    let labels = "Timestamp," + "DL Frequency (in MHz)," + "UL Frequency (in MHz)," + "Band," + "Bandwidth (in MHz)," + "RSRP (in dBm)," + 
      "RSSI (in dBm)," + "RSRQ (in dB)," + "SINR (in dB)," + "PCI," + "Cell ID," + "MCC," + "MNC,";

    // Writes the labels to the file
    fs.appendFileSync(cpeTestName, labels+"\n", function (err){
        if (err) throw err;
    });
    // Sets up the start and end points at firstPoint and secondPoint
    let firstPointX = pointArr[idx][0];
    let firstPointY = pointArr[idx][1];
    let secondPointX = pointArr[idx+1][0];
    let secondPointY = pointArr[idx+1][1];


    let kpi_storage = [[], [], [], [], [], [], [], [], [], [], [], []]; // Creates 2-Dimensional array for storing all the KPIs
    
    // Continues while the user hasn't hit 'stop'
    while(app.enabled('processing points')){
      // Access the page and it's DOM / HTML Elements
      let kpi_data = await page.evaluate(() => {
        let DLfreq = '',
        ULfreq = '',
        band = '',
        bndwdth = '',
        rsrp = '',
        rssi = '',
        rsrq = '',
        sinr = '',
        pci = '',
        cellid = '',
        mcc = '',
        mnc = ''; 
        
        // Create Timestamp
        let fullDate = new Date();
        let Timestamp = fullDate.toLocaleTimeString();
        let timeOfDay = Timestamp.slice(8);
        Timestamp = Timestamp.slice(0, 8).trim();
        let milliseconds = fullDate.getUTCMilliseconds();
        if(milliseconds < 10){milliseconds = "00" + milliseconds.toString();}
        else if(milliseconds < 100){milliseconds = "0" + milliseconds.toString();}
        Timestamp = Timestamp + ":" + milliseconds + " " + timeOfDay;

        // Access the inner text of each of the needed elements, stored on the webpage

        //DL
        if(document.getElementById('x') !== null)
          DLfreq = document.getElementById('x').innerText;

        //UL
        if(document.getElementById('x') !== null)
          ULfreq = document.getElementById('x').innerText;
        //Band
        if(document.getElementById('x') !== null)
          band = document.getElementById('x').innerText;
        //Bandwidth
        if(document.getElementById('x') !== null)
          bndwdth = document.getElementById('x').innerText;
        //RSRP
        if(document.getElementById('x') !== null)
          rsrp = document.getElementById('x').innerText;
        //RSSI
        if(document.getElementById('x') !== null)
          rssi = document.getElementById('x').innerText;
        //RSRQ
        if(document.getElementById('x') !== null)
          rsrq = document.getElementById('x').innerText;
        //SINR
        if(document.getElementById('x') !== null)
          sinr = document.getElementById('x').innerText;
        //PCI
        if(document.getElementById('x') !== null)
          pci = document.getElementById('x').innerText;
        //Cell ID
        if(document.getElementById('x') !== null)
          cellid = document.getElementById('x').innerText;
        //MCC
        if(document.getElementById('x') !== null)
          mcc = document.getElementById('x').innerText;
        //MNC
        if(document.getElementById('x') !== null)
          mnc = document.getElementById('x').innerText;
        
        return [Timestamp, DLfreq, ULfreq, band, bndwdth, rsrp, rssi, rsrq, sinr, pci, cellid, mcc, mnc]
        
      });
      // Write each KPI Value to the file
      kpi_data.forEach(function(val){
        fs.appendFileSync(cpeTestName, val +",", function (err){
          if (err) throw err;
        });
      })
      
      // Write a newline to separate each line
      fs.appendFileSync(cpeTestName, "\n", function (err){
        if (err) throw err;
      });
      console.log(kpi_data);
      // Put all the new information in the kpi_storage variable for formatting later
      for(let i = 1; i < 12; i++){
        kpi_storage[i-1].push(kpi_data[i])
      }
      // Wait for 2 seconds
      await waitSeconds(2);
    }
    exec("sudo killall -9 iperf3", (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
      }
    });
    // Set kpi_strings variable to get the necessary data based on the previously defined datatype
    const kpi_strings = ["timestamp", "dlfreq", "ulfreq", "band", "bandwidth", "rsrp", "rssi", "rsrq", "sinr", "pci", "cellid", "mcc", "mnc"]
    
    // Create an array for all the values for the specified data type
    let values = kpi_storage[kpi_strings.indexOf(datatype.toLowerCase()) - 1];
    
    // Find slopes from the firstPoint to the secondPoint for the points
    let xChange = (secondPointX - firstPointX) / (values.length - 1);
    let yChange = (secondPointY - firstPointY) / (values.length - 1);

    // Iterate to create a point for each value
    for(let i = 0; i < values.length; i++){
      let kpi = values[i];
      let color = "";
      // Iterates through each range
      for(let j = 0; j < checkValues.length; j++){
        if(checkValues[j][1] != ''){ // Check if there is at least a less than values to compare 
          if(checkValues[j][2] != ''){ // Check if there is two values to compare
            if(kpi < checkValues[j][1] && kpi > checkValues[j][2]){ // Check if kpi is in range, and set color if so
              color = checkValues[j][3];
            }
          }
          else{ // Only one less than value to compare
            if(kpi < checkValues[j][1]){// Check if kpi is in range, and set color if so
              color = checkValues[j][3];
            }
          }
        }
        else{ // Only one greater than value to compare
          if(kpi > checkValues[j][2]){// Check if kpi is in range, and set color if so
            color = checkValues[j][3];
          }
        }
      }
      if(color.length > 0){
        // Check if it is a Static Test
        if(isStatic == "on"){
          let degrees = (360.0 / values.length); // Calculate the equal split of degrees
          let xChangeCircle = Math.cos(degrees * i) * 8; // Normal Cosine
          let yChangeCircle = Math.sin(degrees * i) * -8; // Negative Sine, because a positive sine would move the point down, and not up.
          res.write('<div id= "p' + (i+1) + '" style= "background: ' + color + '; margin-top: ' + (parseInt(firstPointY) + -335 - 12 + yChangeCircle) + 'px; margin-left: '+ (parseInt(firstPointX) + (435 - offset_left - 1) + xChangeCircle) + 'px; '); // 
        }
        else{ // Dynamic test
          // Check if there's only one value to write
          if(values.length == 1){
            res.write('<div id= "p' + (i+1) + '" style= "background: ' + color + '; margin-top: ' + (parseInt(firstPointY) + -335 - 12 ) + 'px; margin-left: '+ (parseInt(firstPointX) + (435 - offset_left - 1)) + 'px; ');
          }
          else{
            res.write('<div id= "p' + (i+1) + '" style= "background: ' + color + '; margin-top: ' + (parseInt(firstPointY) + -335 -12 + (yChange * i)) + 'px; margin-left: '+ (parseInt(firstPointX) + (435 - offset_left - 1) + (xChange * i)) + 'px; ');
          }
        }
        res.write('z-index: ' + i + '; top: 0; left: 0; position: absolute; width: 10px;height: 10px;border-radius: 50%;display: flex;"></div>');
        
      }
      
    }
  }
  // Close browser to avoid overflow
  await browser.close();
  
  // Finish HTML Response
  res.write('</div></div></div><script src="js/jquery.min.js"></script>');
  res.write('</body></html>');
  res.end();
});
  

// Retriving a representation of the Offline Mapping resource
app.get("/offline-mapping", (req, res) => {
  res.render("post-offline");
});

// Processing the data / handling the submission of the Offline Mapping resource
app.post("/offline-mapping", (req, res) => {
  // Setting Constant Variables to the data recieved from the Online Mapping Submission
  const {startX1, startY1, startX2, startY2, startX3, startY3, startX4, startY4, startX5, startY5, startX6, startY6, startX7, startY7, startX8, startY8, startX9, startY9, startX10, startY10, startX11, startY11, startX12, startY12, startX13, startY13, startX14, startY14, startX15, startY15, currentPointIndex, locationImg, kpi_settings, typeOfTest, isStatic, display_orientation, display_size, offset_left, pointsFile} = req.body;
  
  let numPoints = parseInt(currentPointIndex) - 1;
  let pointArr = []
  if(pointsFile != null){
    let pointsFileInfo = fs.readFileSync("./views/post-processing/" + pointsFile).toString().replace(/\r/g, '').split("\n");
    pointsFileInfo = pointsFileInfo.filter(function (el) {
        return el != '';
    });
    numPoints = 0;
    for(let i = 0; i < 15; i++){
      if(pointsFileInfo[i] != null && pointsFileInfo[i][0] != null){
        pointArr.push(pointsFileInfo[i].split(","));
        numPoints++;
      }
      else{
        break;
      }
    }
  }
  // Parses KPI Settings file
  // As long as its the same format, file name doesn't matter
  let kpiSettings = fs.readFileSync("./views/post-processing/" + kpi_settings).toString().replace(/\r/g, '').split("\n");
  kpiSettings.shift();
  
  //[[kpi, less than, greater than]]
  let checkValues = [];
  kpiSettings = kpiSettings.filter(function (el) {
      return el != '';
  });
  let datatype = kpiSettings[0].split(",")[0]; // Set the datatype specified in the file
  const kpi_strings = ["timestamp", "dlfreq", "ulfreq", "band", "bandwidth", "rsrp", "rssi", "rsrq", "sinr", "pci", "cellid", "mcc", "mnc"]
  
  // Iterates through each line in the KPI Settings file to split the data for Parsing and Collection
  kpiSettings.forEach( function(line){
    let lineValues = line.split(","); // Splits line into its 3 individual pieces(Datatype, Range, Color)
    let kpiArr = [lineValues[0]]; // Creates 2-Dimensional Array starting with Datatype

    // Checks if there are any '<' signs in range
    if(lineValues[1].indexOf("<") > -1){
      let hasLessThan = lineValues[1].split("<");
      // Checks if there 2 '<'
      if(hasLessThan.length > 2){ // 2 '<'
        kpiArr.push(parseInt(hasLessThan[2]), parseInt(hasLessThan[0]))
      }
      else{ // Only 1 '<'
        kpiArr.push(parseInt(hasLessThan[1]), '')
      }
    }
    else{ // Only '>' signs in range
      let hasGreaterThan = lineValues[1].split(">");
      // Checks if there 2 '<'
      if(hasGreaterThan.length > 2){ // Only 2 '>'
        kpiArr.push(parseInt(hasGreaterThan[0]), parseInt(hasGreaterThan[2]))
      }
      else{ // Only 1 '>'
        kpiArr.push('', parseInt(hasGreaterThan[0]))
      }
    }
    kpiArr.push(lineValues[2]); // Puts the color into the new parsed array
    checkValues.push(kpiArr); // Puts new parsed array into the bigger list of arrays
    
  })

  // actualDatatype -> Label Name
  // datatype -> Folder Name to look for info
  // Set the test labelname and the data foldername
  let actualDatatype = datatype;
  if(kpi_strings.indexOf(datatype.toLowerCase()) >= 0){
    datatype = "cpe";
  }
  if(datatype == "Throughput"){
    actualDatatype = typeOfTest;
  }
  // Read the Folder containing the data
  fs.readdir("./views/post-processing/" + datatype, function (err, files) {
    if (err) {
      console.error("Could not list the directory.", err);
      process.exit(1);
    }
    let totalFiles = 0;
    // Find how many info files exist
    for(let i = 0; i < files.length; i++){
        if((files[i].indexOf(".csv") > -1  || files[i].indexOf(".txt") > -1 ) && files[i].toLowerCase().indexOf("settings") < 0){
            totalFiles++;
        }
    }
    // Criteria for a Valid Test
    // Check if the test is Dynamic and the number of files is one less than the number of points,
    // or if the test is Static and the number of files equals the number of points
    if((isStatic === undefined && totalFiles != (numPoints - 1)) || (totalFiles != numPoints && isStatic == "on")){
      if((isStatic === undefined && totalFiles >= numPoints) || (totalFiles > numPoints && isStatic == "on")){ // Too many points
        res.send("You selected " + numPoints + " points for " + (totalFiles) + " files. Please select more points and try again.");
      }
      else{ // Too few points
        res.send("You selected " + numPoints + " points for " + (totalFiles) + " files. Please select less points and try again.");
      }
      
    }
    else{
        let idx = 0;
        // Sets up the array for possible points
        if(pointsFile == null){
          pointArr = [[startX1, startY1], [startX2, startY2], [startX3, startY3], [startX4, startY4], [startX5, startY5]];
          pointArr.push([startX6, startY6], [startX7, startY7], [startX8, startY8], [startX9, startY9], [startX10, startY10]);
          pointArr.push([startX11, startY11], [startX12, startY12], [startX13, startY13], [startX14, startY14], [startX15, startY15]);
        }
        //const pointArr = [[startX1, startY1], [startX2, startY2], [startX3, startY3], [startX4, startY4], [startX5, startY5]];
        //pointArr.push([startX6, startY6], [startX7, startY7], [startX8, startY8], [startX9, startY9], [startX10, startY10]);
        //pointArr.push([startX11, startY11], [startX12, startY12], [startX13, startY13], [startX14, startY14], [startX15, startY15]);

        // Start HTML Response to Webpage
        res.write('<!doctype html><html lang="en"><head><title>KCCTech - Offline Mapping</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">');
        res.write('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"><link href="https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap" rel="stylesheet">');
        res.write('<link rel="stylesheet" href="css/main.css"><style>');

        // Set height and width based on picture size
        let disp_break = display_size.split(" ");
        res.write('#display_image{margin-right:0px; margin-left: 0px;width: ' + disp_break[0]+';height: ' + disp_break[1]+';border: 1px solid black;background-position: center;background-size: ' + display_size + ';background-repeat: no-repeat;background-image: url("../post-processing/' + locationImg + '")}');
        res.write('#kpi_info {margin-left: 70px;} #kpi_info_label {margin:left; padding-right: 0px;} #legend {border: 1px solid black;width: 200px; height:500px; background-color: #B8B8B4; margin-left:0px; margin-right:20px;}');
        res.write('#point {z-index: 0;background: white;position: fixed; top: 0; left: 0;width: 20px;height: 20px;border-radius: 50%;display: flex;} </style>');
        res.write('</head><body><div class="header"><img id = "kcctech_logo" src = "logos/kcctech_logo.png" alt = "KCCTECH LOGO"><h2 class="heading-section" style ="text-align: center;">Offline Mapping - ' + actualDatatype + '</h2><br></div><div class="container" style = "margin-left:0px;">');
        res.write('<div class="row justify-content-center" style="justify-content: left !important; margin-right:10px; margin-left:200px; width: 1500px;">');//<div class="row justify-content-center"><div class="col-md-6 text-center mb-5"></div></div>
        res.write('<br><div id = "legend">');
        // Create the Legend
        for(let k = 0; k < kpiSettings.length; k++){
            let kpiSetting = kpiSettings[k].split(",");
            res.write('<div id= "legendValue' + (k+1) + '" style= "background: ' + kpiSetting[2] + ';margin-top: 10px; margin-left: 10px; ')
            res.write('z-index: ' + k + '; position: absolute; width: 10px;height: 10px;border-radius: 50%;display: flex; "></div>');
            // Create point based on range with color
            if(kpiSetting[1].split("<").length > 2){
                let line = kpiSetting[1].split("<");
                res.write('<p style = "margin-left: 25px; margin-bottom: 0px; width: 150px; color: white; display: flex;"> ' + line[0] + "&lt" + line[1] + "&lt" + line[2] +' </p>');
            }
            else if(kpiSetting[1].split(">").length > 2){
                let line = kpiSetting[1].split(">");
                res.write('<p style = "margin-left: 25px; margin-bottom: 0px;width: 150px; color: white; display: flex;"> ' + line[0] + "&gt" + line[1] + "&gt" + line[2] +' </p>');
            }
            else{
                res.write('<p style = "margin-left: 25px; margin-bottom: 0px; width: 150px; color: white; display: flex;"> ' + kpiSetting[1] +' </p>');
            }
           
        }
        res.write('</div><br><div id = "display_image">')
        
        // Iterate through each file in the folder
        files.forEach(function (file, index) {
          // Check if the file is valid
          if((file.indexOf(".csv") > -1  || file.indexOf(".txt") > -1 )&& file.indexOf("settings") < 0){
              let firstPointX = pointArr[idx][0];
              let firstPointY = pointArr[idx][1];
              let secondPointX = pointArr[idx+1][0];
              let secondPointY = pointArr[idx+1][1];
              idx++; // Increase the point index
              let values;
              // Check if the test is for the KPIs in the CPE
              if(typeOfTest == "KPI" && file.toLowerCase().indexOf("cpe") >= 0){
                // Read the File Data
                let kpi_data = fs.readFileSync("./views/post-processing/" + datatype + "/" + file).toString().replace(/\r/g, '').split("\n");
                kpi_data.shift();
                let kpi_storage = [[], [], [], [], [], [], [], [], [], [], [], []];
                // Parse the Collected Data
                kpi_data.forEach(function(entry){
                    let individualValues = entry.split(",");
                    kpi_storage[0].push(individualValues[1]); // DL Freq
                    kpi_storage[1].push(individualValues[2]); // UL Freq
                    kpi_storage[2].push(individualValues[3]); // Band
                    kpi_storage[3].push(individualValues[4]); // Bandwidth
                    kpi_storage[4].push(individualValues[5]); // RSRP
                    kpi_storage[5].push(individualValues[6]); // RSSI
                    kpi_storage[6].push(individualValues[7]); // RSRQ
                    kpi_storage[7].push(individualValues[8]); // SINR
                    kpi_storage[8].push(individualValues[9]); // PCI
                    kpi_storage[9].push(individualValues[10]); // Cell ID
                    kpi_storage[10].push(individualValues[11]); // MCC
                    kpi_storage[11].push(individualValues[12]); // MNC
                })
                // Set the values array to parse with the legend
                values = kpi_storage[kpi_strings.indexOf(actualDatatype.toLowerCase()) - 1];
              }
              // Check if the file is iPerf throughput information
              else if(datatype == "throughput" && file.toLowerCase().indexOf("cpe") < 0){
                // Read the File Data a
                let throughput = fs.readFileSync("./views/post-processing/" + datatype + "/" + file).toString().replace(/\r/g, '').split("\n");
                throughput.shift();
                let throughput_storage = [[], []];
                let hitEnd = false;
                let interval = 0;
                // Parse the information
                throughput.forEach(function(entry){
                  let splitValues = entry.split(" ");
                  splitValues = splitValues.filter(function (el) {
                    return el != '';
                  });
                  if(splitValues.indexOf("[SUM]") > -1){
                    if(hitEnd == true){
                      throughput_storage[1].push(splitValues[5])
                    }
                    else{
                      throughput_storage[0].push(splitValues[5])
                    }
                  }
                  else{
                    if(splitValues.indexOf("Interval") > -1){
                      interval++;
                    }
                    if(interval == 2){
                      hitEnd = true;
                    }
                  }
                })
                throughput_storage[1].shift();
                values = throughput_storage[0];
              }
              // Check if the file is Ping information
              else if(typeOfTest == "Ping" && file.toLowerCase().indexOf("cpe") < 0){
                let ping = fs.readFileSync("./views/post-processing/" + datatype + "/" + file).toString().replace(/\r/g, '').split("\n");
                ping.shift();
                let ping_storage = [[], [], [], [], [], [], [], [], [], [], [], []];
                ping.forEach(function(entry){
                })

                //values = kpi_storage[kpi_strings.indexOf(datatype.toLowerCase()) - 1];
              }
              else{console.log('Impossible');}


              // Set a max of 50 values for each file
              let totalValues = 50;
              if(values.length < 50){
                totalValues = values.length
              }
              // Find the slope from the firstPoint to the secondPoint for the points
              let xChange = (secondPointX - firstPointX) / (totalValues - 1);
              let yChange = (secondPointY - firstPointY) / (totalValues - 1);
              // Iterate for each point
              for(let i = 0; i < totalValues; i++){
                  let singleValue = values[i];
                  let color = "";
                  for(let j = 0; j < checkValues.length; j++){
                    if(checkValues[j][1] != ''){ // Check if there is at least a less than values to compare 
                      if(checkValues[j][2] != ''){ // Check if there is two values to compare
                        if(singleValue < checkValues[j][1] && singleValue > checkValues[j][2]){ // Check if kpi is in range, and set color if so
                          color = checkValues[j][3];
                        }
                      }
                      else{ // Only one less than value to compare
                        if(singleValue <= checkValues[j][1]){// Check if kpi is in range, and set color if so
                          color = checkValues[j][3];
                        }
                      }
                    }
                    else{ // Only one greater than value to compare
                      if(singleValue >= checkValues[j][2]){// Check if kpi is in range, and set color if so
                        color = checkValues[j][3];
                      }
                    }
                  }
                  if(color.length > 0){
                    // Check if Static Test
                    if(isStatic == "on"){
                      //2px
                      let degrees = (360.0 / totalValues);
                      let xChangeCircle = Math.cos(degrees * i) * 8; // Normal Cosine
                      let yChangeCircle = Math.sin(degrees * i) * -8; // Negative Sine, because a positive sine would move the point down, and not up.
                      //245, 180
                      //offset_left, 515
                      res.write('<div id= "p' + (i+1) + '" style= "background: ' + color + '; margin-top: ' + (parseInt(firstPointY) -335 - 5 + yChangeCircle) + 'px; margin-left: '+ (parseInt(firstPointX) + (435 - offset_left - 4) + xChangeCircle) + 'px; ') // vertical
                    }
                    else{ // Dynamic Test
                        res.write('<div id= "p' + (i+1) + '" style= "background: ' + color + '; margin-top: ' + (parseInt(firstPointY) -335 - 5 + (yChange * i)) + 'px; margin-left: '+ (parseInt(firstPointX) + (435 - offset_left - 4) + (xChange * i)) + 'px; ') // vertical
                    }
                    res.write('z-index: ' + i + '; top: 0; left: 0; position: absolute; width: 10px;height: 10px;border-radius: 50%;display: flex;"></div>');
                  }
                  
                  
              }
              res.write('</div><script>function printMousePos(event) {console.log("x", event.clientX); console.log("y", event.clientY);}');
              res.write('document.addEventListener("click", printMousePos);');
              res.write('</script>')
              
          }
        });
        res.write('</div></div><script src="js/jquery.min.js"></script>');
        res.write('</body></html>');
        res.end();
    }
  });
  
})

app.use( express.static( "views" ) );

// Retriving a representation of the Single Data Collection resource
app.get("/single", (req, res) => {
  app.disable('testing'); // tells to not run iperf;
  // Kills any and all iperf3 processes
  exec("sudo killall -9 iperf3", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
  });
  // Checks if the test_logs folder exists
  if (!fs.existsSync("../test_logs")) {
    //file doesn't exist
    fs.mkdir("../test_logs", function (err){
      if (err) throw err;
      console.log('Test Logs Folder is created successfully.');
    });
  }
  
  // Starts HTML Response
  res.write('<!doctype html><html lang="en"><head><title>Single Data Collection</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">');
  res.write('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"><link href="https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap" rel="stylesheet">');
  res.write('<link rel="stylesheet" href="css/main.css"><style>');
  res.write('form   {text-align: center; margin: auto; padding-right: 10px;}label {text-align: center; display: block;}#typeOfTest_label {padding-right: 36px; display: inline-block; }#typeOfTest {display: inline-block;margin:auto;}#submit_button {text-align: center; margin:auto; display: flex;}');
  res.write('</style></head></head><body><div class="header"><img id = "kcctech_logo" src = "logos/kcctech_logo.png" alt = "KCCTECH LOGO"></div><section class="ftco-section"><div class="container">');
  res.write('<div class="row justify-content-center"><div class="col-md-6 text-center mb-5"><h2 class="heading-section">Single Data Collection</h2></div></div><br><div class="row justify-content-center">');
  res.write('<form action="" method="POST" style="width:100%"><div class = "input_div">');
  res.write('<label for="typeOfTest" id="typeOfTest_label"><b>Type of Test</b></label><select id="typeOfTest" name="typeOfTest">');
  // Opens and reads config.csv file to parse the test options
  let config_data = fs.readFileSync("config.csv").toString();
  let config_lines = config_data.replace(/\n/g, '').split(",");
  let idx = 1
  for(let i = 5; i < config_lines.length; i+=4){
    res.write('<option value=' + i + '>' + config_lines[i] + '</option>'); //command
  }
  res.write('</select><br><label for="nodeName" id="nodeName_label"><b>Node Name</b></label><input type="name" id="nodeName" name="nodeName" required/>');
  //res.write('<br><label for="serverIP" id="serverIP_label"><b>Server IP Address</b></label><input type="name" id="ipAddress" name="ipAddress" />');
  //res.write('<br><label for="cpe_ip" id="cpe_ip_label"><b>CPE IP Address</b></label><input type="name" id="cpe_ip" name="cpe_ip" />')
  res.write('</div><br><button type="submit" id="submit_button">Start</button></form>');
  res.write('</div></div></section><script src="js/jquery.min.js"></script></body></html>');
  res.end();
});

// Processing the data / handling the submission of the Single Data Collection resource
app.post("/single", async (req, res) => {
  // Kill Iperf if still there
  exec("sudo killall -9 iperf3", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
  });
  //const {typeOfTest, nodeName, ipAddress, cpe_ip} = req.body; // ADDED BC REMOVED IT ON FRONTEND / START PAGE
  const {typeOfTest, nodeName} = req.body;
  
  // Setting Constant Variables to the data recieved from the Single Data Collection submission
  ipAddress = ''; // ADDED BC REMOVED IT ON FRONTEND / START PAGE
  cpe_ip = '';// ADDED BC REMOVED IT ON FRONTEND / START PAGE

  app.disable('testing'); // tells to not run iperf in case running
  // Reads and Parses the config.csv file
  let config_data = fs.readFileSync("config.csv").toString();
  let config_lines = config_data.replace(/\n/g, '').split(",");
  let testIdx = parseInt(typeOfTest) + 1; // Sets index in the config.csv file for the command
  let typeOfCMD = config_lines[testIdx + 1]; // Sets type of command to run
  let command = config_lines[testIdx]; // Sets the actual command

  // Sets up Time and Data for filename
  let currentDate = new Date(); 
  let months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
  let month = currentDate.getMonth() + 1;
  if(month < 10){
    month = "0" + month.toString();
  }
  else{
    month = month.toString();
  }

  let day = currentDate.getDate();
  if(day < 10){
    day = "0" + day.toString();
  }
  else{
    day = day.toString();
  }

  let hour = currentDate.getHours();

  if(hour < 10){
    hour = "0" + hour.toString();
  }
  else{
    hour = hour.toString();
  }

  let minute = currentDate.getMinutes();
  if(minute < 10){
    minute = "0" + minute.toString();
  }
  else{
    minute = minute.toString();
  }

  // Sets Test Labelname
  const testsLabelname = month + day + currentDate.getFullYear() + "_" + hour + minute + currentDate.getMilliseconds().toString().substring(0, 3);
  res.write('<!doctype html><html lang="en"><head><title>Single Data Collection</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">');
  res.write('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"><link href="https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap" rel="stylesheet"><link rel="stylesheet" href="css/main.css">');
  
  // Check if the test doesn't include CPE
  if(typeOfCMD.split(" ").indexOf("CPE") < 0){res.write('<style> h1 {text-align: center;} .output {font-size: 25px; color: green; background-color: black;max-height: none; width: 1400px;border: 15px solid grey;padding: 50px;margin: auto;font-family: monospace, monospace;}#new_command_button {font-size: 15px;text-align: center; margin: auto; display: flex;}</style>');}
  else{res.write('<style> h1 {text-align: center;} .output {font-size: 18px; color: green; background-color: black;max-height: none; width: 1800px;border: 15px solid grey;padding: 25px;margin: auto;font-family: monospace, monospace;}#new_command_button {font-size: 15px;text-align: center; margin: auto; display: flex;}</style>');}
  
  res.write('</head><body><div class="header"><img id = "kcctech_logo" src = "logos/kcctech_logo.png" alt = "KCCTECH LOGO"></div><section class="ftco-section"><div class="container">');
  res.write('<div class="row justify-content-center"><div class="col-md-6 text-center mb-5">');
  res.write('<h2 class="heading-section">Single Data Collection</h2></div></div><br><div class="row justify-content-center"><a href="/single"><button type="submit" id="new_command_button">New Command</button></a><br><br></div></div><div class = "output">');
  let idx = 0;
  // Check if the test doesn't include CPE
  if(typeOfCMD.split(" ").indexOf("CPE") < 0){
    // ADDED THIS BC RUNNING CPE IN BETWEEN CMD LINE TESTS
    //if(puppeteer.Browser != undefined){await puppeteer.Browser.close();}
    var spawn = require('child_process').spawn;
    // regular is 5
    let commands = [];
    // Check if there are multiple commands split by an '&' sign
    if(command.indexOf("&") > -1){
      commands = command.split("&");
    }
    else{
      commands = [command];
    }
    let webpage = '';

    // Check if a CPE IP Address was defined
    if(cpe_ip != ''){
      webpage = "x"
    }
    else{
      webpage = "x";
    }
    // Sets CPE Test filename
    let cpeTestFileName = "../test_logs/"+testsLabelname+"_CPE_Collection_Test_" + nodeName + ".txt";
    await app.enable('testing'); // tells when to run iperf
    runCPE(cpeTestFileName, webpage); // Runs CPE Collection in the background
    // Iterates through each command
    for(let k = 0; k < commands.length; k++){
      let command = commands[k];
      // Checks if the ipAddress variable isn't blank
      if(ipAddress != ''){
        let splitCommand = commands[k].split(" ");
        // Sets IP Address for either iPerf or Ping depending on test
        if(splitCommand[0].toLowerCase() == "iperf3"){
          splitCommand[2] = ipAddress.toString();
        }
        if(splitCommand[0].toLowerCase() == "ping"){
          splitCommand[1] = ipAddress.toString();
        }
        command = '';
        // Creates new command if ipAddress is new
        for(let i = 0; i < splitCommand.length - 1; i++){
          command = command + splitCommand[i] + " ";
        }
        command = command + splitCommand[splitCommand.length - 1];
      }
      res.write("Command: " + command);
      res.write("<br>");
      let actualTest = "../test_logs/"+testsLabelname+"_test_" + (k+1).toString()+ "_" + nodeName + ".txt";
      if(app.enabled('testing')){
        await runCommands(actualTest, res, command, nodeName);
      }
      
      res.write("<br>");
      await waitSeconds(3);
    }
    // COMMENTED OUT BC NEED IT TO CONTINUE FOR CONTINUOUS TEST
    app.disable('testing'); // tells to stop iperf;
    //app.disable('testing');
    res.write('</div>');
    res.write('<br></section><script src="js/jquery.min.js"></script></body></html>');
    res.end();
    
  }
  else{ // CPE only - Option isn't active currently
    app.disable('testing')
    res.write("Command: " + command);
    res.write("<br>");
    // Create filename and log file for CPE Information
    let fileName = "../test_logs/"+testsLabelname+"_CPE_Collection_Test" + ".txt";
    fs.writeFile(fileName, "", {flag: "w"}, function (err){
      if (err) throw err;
      //console.log('File is created successfully.');
    });
    if(puppeteer.Browser != undefined){puppeteer.Browser.close();}
    app.enable('testing');
    let webpage = '';
    // Checks if CPE_IP exists
    if(cpe_ip != ''){
      webpage = "x"
    }
    else{
      webpage = config_lines[testIdx + 2].split(" ")[0];
    }
    // Sets variables for the collection settings including refresh rate and test length
    let collectionSettings = command.split(" ");
    let refreshRate = collectionSettings[3] // Refresh Rate in Seconds
    let timeInMinutes = collectionSettings[6]; // Test Length in Minutes
    
    // Checks if refresh rate is in minutes
    if(collectionSettings[4].indexOf("minute") > -1){
      refreshRate = refreshRate * 60
    }
    // Checks if test length is in seconds
    if(collectionSettings[7].indexOf("second") > -1){
      timeInMinutes = (parseFloat(timeInMinutes) / 60.0);
    }
    // Checks if test length is in hours
    if(collectionSettings[7].indexOf("hour") > -1){
      timeInMinutes = timeInMinutes * 60;
    }
    let instancesPerMinute = 60 / refreshRate; // Number of instances per minute
    let timeToInstances = instancesPerMinute * timeInMinutes; // Number of total instances
    // Initiate the Puppeteer browser
    console.log("launch");
    //const browser = await puppeteer.launch({ignoreHTTPSErrors: true});
    // Launch Browser in Linux
    const browser = await puppeteer.launch({pipe: true, executablePath: '/usr/bin/chromium-browser', ignoreHTTPSErrors: true});
    // Launch New Page
    const page = await browser.newPage();
    // Try to launch to the CPE Webpage
    try{
      let arrived = await page.goto(webpage, { waitUntil: 'networkidle2', }); // wait until page load
    } catch (e) {
      res.send("The following webpage could not load. Please reload and try again.")
      await browser.close();
      res.end();
    }
    // Successful Launch and now to login to webpage
    console.log('Page Loaded!');
    await page.type('#username', 'x');
    await page.type('#password', 'x');
    await Promise.all([
      page.click('#login'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    console.log('Logged in!');
    await page.goto(webpage, { waitUntil: 'networkidle0' });

    // Write labels to HTML Response and to the log file
    res.write("Timestamp &emsp;&emsp;&emsp;" + "DL Frequency (in MHz) " + "UL Frequency (in MHz) " + "Band " + "Bandwidth (in MHz) " + "RSRP (in dBm) " + 
    "RSSI (in dBm) " + "RSRQ (in dB) " + "SINR (in dB) " + "PCI " + "Cell ID " + "MCC " + "MNC ");
    res.write("<br>");
    let labels = "Timestamp," + "DL Frequency (in MHz)," + "UL Frequency (in MHz)," + "Band," + "Bandwidth (in MHz)," + "RSRP (in dBm)," + 
    "RSSI (in dBm)," + "RSRQ (in dB)," + "SINR (in dB)," + "PCI," + "Cell ID," + "MCC," + "MNC,";
    fs.appendFileSync(fileName, labels+"\n", function (err){
      if (err) throw err;
    });

    // Iterate for the test length in instances
    for(let i = 0; i < timeToInstances + 1; i++){
      // Break from loop if testing is disabled
      if(app.disabled('testing')){
        break;
      }
      // Access the page and it's DOM / HTML Elements
      let data = await page.evaluate(() => {
        let DLfreq = '',
        ULfreq = '',
        band = '',
        bndwdth = '',
        rsrp = '',
        rssi = '',
        rsrq = '',
        sinr = '',
        pci = '',
        cellid = '',
        mcc = '',
        mnc = ''; 
        
        // Set Timestamp
        let fullDate = new Date();
        let Timestamp = fullDate.toLocaleTimeString();
        let timeOfDay = Timestamp.slice(8);
        Timestamp = Timestamp.slice(0, 8).trim();
        let milliseconds = fullDate.getUTCMilliseconds();
        if(milliseconds < 10){milliseconds = "00" + milliseconds.toString();}
        else if(milliseconds < 100){milliseconds = "0" + milliseconds.toString();}
        Timestamp = Timestamp + ":" + milliseconds + " " + timeOfDay;

        // Get necessary KPI Information from HTML DOM Elements, the inner text more specifically
        //DL
        if(document.getElementById('x') !== null)
          DLfreq = document.getElementById('x').innerText;

        //UL
        if(document.getElementById('x') !== null)
          ULfreq = document.getElementById('x').innerText;
        //Band
        if(document.getElementById('x') !== null)
          band = document.getElementById('x').innerText;
        //Bandwidth
        if(document.getElementById('x') !== null)
          bndwdth = document.getElementById('x').innerText;
        //RSRP
        if(document.getElementById('x') !== null)
          rsrp = document.getElementById('x').innerText;
        //RSSI
        if(document.getElementById('x') !== null)
          rssi = document.getElementById('x').innerText;
        //RSRQ
        if(document.getElementById('x') !== null)
          rsrq = document.getElementById('x').innerText;
        //SINR
        if(document.getElementById('x') !== null)
          sinr = document.getElementById('x').innerText;
        //PCI
        if(document.getElementById('x') !== null)
          pci = document.getElementById('x').innerText;
        //Cell ID
        if(document.getElementById('x') !== null)
          cellid = document.getElementById('x').innerText;
        //MCC
        if(document.getElementById('x') !== null)
          mcc = document.getElementById('x').innerText;
        //MNC
        if(document.getElementById('x') !== null)
          mnc = document.getElementById('x').innerText;
        
        return [Timestamp, DLfreq, ULfreq, band, bndwdth, rsrp, rssi, rsrq, sinr, pci, cellid, mcc, mnc]
        
      });
      // Write HTML Response containing the data recieved
      let output = data[0] + "&emsp;" + data[1] + "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;" +  data[2] + "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;";
      output = output +  data[3] + "&emsp;&emsp;" +  data[4] + "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;" +  data[5] + "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;";
      output = output +  data[6] + "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;" +  data[7] + "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;" +  data[8] + "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;" 
      output = output +  data[9] + "&emsp;&emsp;&emsp;" +  data[10] + "&emsp;&emsp;"+  data[11] + "&emsp;" +  data[12];
      res.write(output);
      res.write("<br>");
      // Write recieved data to the log file
      data.forEach(function(val){
        fs.appendFileSync(fileName, val +",", function (err){
          if (err) throw err;
        });
      })
      
      fs.appendFileSync(fileName, "\n", function (err){
        if (err) throw err;
      });
      // Wait for the number of seconds/minutes specified as the refresh rate
      await waitSeconds(refreshRate);
    }
      
    // Finish HTML Response and close the Puppeteer Browser
    await browser.close();
    res.write('</div>');
    res.write('<br>');
    res.end();
  }
  
});

// Retriving a representation of the Stop resource, which is the page when the Network Data Collection is stopped
app.get("/stop", (req, res) => {
  app.disable('program start'); 
  res.render("stop");
});

// Retriving a representation of the Close resource, turning off the program
app.get("/close", (req, res) => {
  // Finds program with port 1771
  exec("lsof -i tcp:1771 -Fp", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    // kills all node processes
    exec("sudo killall -9 node", (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
      }
    });
  });
  
})

// Processing the data / handling the submission of the Network Data Collector resource
app.post("/network", async (req, res) => {
  // Setting Constant Variables to the data recieved from the Online Mapping Submission
  const {runtime, refresh, desiredURL, filename, username, password, typeOfData, wantEmailList, wantPDF, wantSingleEmail} = req.body;
  app.enable('program start'); // Enables the Collection to begin

  // Sets the Main Email to share this instance of the collection
  const email = 'nick.aspiras@kcctech.com'; //'ranteam@kcctech.com'
  // Define the Authentcication for the Google APIs
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Create Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });
  // Create Instance of Google Drive API
  const drive = google.drive({ version: "v3", auth: client });

  let collectionSpreadsheetId = ''; // Define Collection Spreadsheet ID variable

  let timeInMinutes = runtime; // Total Run Time (in Minutes)
  let seconds = timeInMinutes * 60;
  let minutes = seconds / 60;
  let hours = seconds / (60 * 60);
  let infoCollectingLabelname = '';
  let currentDate = new Date();
  //console.log("pst test", currentDate.toLocaleDateString('us-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' , hour: 'numeric', minute: 'numeric', second: 'numeric'}));
  let months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
  if(filename == ''){
    // File/Folder Name is created based on runtime
    let month = currentDate.getMonth() + 1;
    
    if(month < 10){
      month = "0" + month.toString();
    }
    else{
      month = month.toString();
    }

    let day = currentDate.getDate();
    if(day < 10){
      day = "0" + day.toString();
    }
    else{
      day = day.toString();
    }

    let hour = currentDate.getHours();

    if(hour < 10){
      hour = "0" + hour.toString();
    }
    else{
      hour = hour.toString();
    }

    let minute = currentDate.getMinutes();
    if(minute < 10){
      minute = "0" + minute.toString();
    }
    else{
      minute = minute.toString();
    }
    if(typeOfData == "BBU"){
      infoCollectingLabelname = "x" ;
    }
    if(typeOfData == "CPE"){
      infoCollectingLabelname = "x";
    }
    infoCollectingLabelname = infoCollectingLabelname + month + day + currentDate.getFullYear() + "_" + hour + minute + currentDate.getMilliseconds().toString().substring(0, 3);
  }
  else{
    infoCollectingLabelname = filename;
  }
  


  // https://developers.google.com/drive/api/guides/search-files
  const fileList = await drive.files.list(); // create a list of all the files in the service account's drive
  let foundCollectionId = '';
  let mainFolderId = '';
  let subFolderId = '';
  let mainFolderName = '';
  // Set main folder name for this collection based on test type
  if(typeOfData == "CPE"){
    mainFolderName = "x"
  }
  if(typeOfData == "BBU"){
    mainFolderName = "x"
  }
  let currentMonth = months[currentDate.getMonth()];
  // Iterate through the list of files to check for overwriting
  fileList.data.files.forEach(function(file) {
    
    if(file.name == "pdfDocument"){
      drive.files.delete({fileId: file.id});
    }
    if(file.name == infoCollectingLabelname){
      foundCollectionId = file.id;
    }
    if(file.name == mainFolderName){
      //drive.files.delete({fileId: file.id});
      mainFolderId = file.id;
    }
    if(file.name == currentMonth + "_" + currentDate.getFullYear()){
      //drive.files.delete({fileId: file.id});
      subFolderId = file.id;
    }
  });

  console.log("Main Folder Check");
  // Create Main Folder if Folder isn't created
  if(mainFolderId == ''){
    const mainFolderMetaData = {
      name: mainFolderName,
      mimeType: "application/vnd.google-apps.folder",
    };
    const newFolder = await drive.files.create({
      supportsAllDrives: true,
      fields: "id",
      resource: mainFolderMetaData
    });
    mainFolderId = newFolder.data.id;
  }
  console.log("Sub Folder Check");
  // Create Sub/Month Folder if Folder isn't created
  if(subFolderId == ''){
    const subFolderMetaData = {
      name: currentMonth + "_" + currentDate.getFullYear(),
      mimeType: "application/vnd.google-apps.folder",
      parents: [mainFolderId],
    };
    const newFolder = await drive.files.create({
      supportsAllDrives: false,
      fields: "id",
      resource: subFolderMetaData
    });
    subFolderId = newFolder.data.id;
  }
  
  // No found spreadsheet / not overwritting
  if(foundCollectionId == ''){
    // Set up Metadata for Collection Spreadsheet
    const collectionMetaData = {
      name: infoCollectingLabelname,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [subFolderId],
    };
    // Create new Collection Spreadsheet
    const newCollectionSpreadsheet = await drive.files.create({
      supportsAllDrives: true,
      fields: "id",
      resource: collectionMetaData
    });
    collectionSpreadsheetId = newCollectionSpreadsheet.data.id;
  }
  else{ // if found, overwrite spreadsheet
    collectionSpreadsheetId = foundCollectionId;
    // to clear spreadsheet, if overwriting
    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/clear
    const clearValues = await googleSheets.spreadsheets.values.clear({
      spreadsheetId: collectionSpreadsheetId,
      range: "Sheet1"
    });
  }

  console.log("Created Spreadsheet Check");
  // Create Write Permission for Main Folder
  const mainFolderWritingPerm = await drive.permissions.create({
    resource: {
      type: "user",
      role: "writer",
      emailAddress: email,  // Please set the email address you want to give the permission.
    },
    fileId: mainFolderId,
    sendNotificationEmail: false,
    fields: "id",
  });

  // Create Write Permission for Sub/Year Folder
  const yearFolderWritingPerm = await drive.permissions.create({
    resource: {
      type: "user",
      role: "writer",
      emailAddress: email,  // Please set the email address you want to give the permission.
    },
    fileId: subFolderId,
    sendNotificationEmail: false,
    fields: "id",
    
  });
  // setting permissions to file
  // https://developers.google.com/drive/api/v3/reference/permissions/create
  // Create Write Permission for Collection Spreadsheet
  const collectionWritingPerm = await drive.permissions.create({
    resource: {
      type: "user",
      role: "writer",
      emailAddress: email,  // Please set the email address you want to give the permission.
    },
    fileId: collectionSpreadsheetId,
    sendNotificationEmail: false,
    fields: "id",
    
  });

  console.log("Created Permissions Check");
  // Create Write Permissions for additional emails in email_config.txt file
  let firstEmail = ''
  if(wantEmailList == "on"){
    //for emails
    var emails = fs.readFileSync("emails_config.txt").toString().replace(/\r/g, "").split("\n");
    emails = emails.filter(function (el) {
      return el != '';
    });
    // Iterate through every email and create the necessary write permissions
    for(let i = 0; i < emails.length; i++){
      let userEmail = emails[i];

      const collectionWritingPerm = await drive.permissions.create({
        resource: {
          type: "user",
          role: "reader",
          emailAddress: userEmail,  // Please set the email address you want to give the permission.
        },
        fileId: collectionSpreadsheetId,
        sendNotificationEmail: false,
        fields: "id",
        
      });
      
      // main folder perm
      const mainFolderWritingPerm = await drive.permissions.create({
        resource: {
          type: "user",
          role: "writer",
          emailAddress: userEmail,  // Please set the email address you want to give the permission.
        },
        fileId: mainFolderId,
        sendNotificationEmail: false,
        fields: "id",
      });

      // year folder perm
      const yearFolderWritingPerm = await drive.permissions.create({
        resource: {
          type: "user",
          role: "writer",
          emailAddress: userEmail,  // Please set the email address you want to give the permission.
        },
        fileId: subFolderId,
        sendNotificationEmail: false,
        fields: "id",
        
      });
    }
  }
  console.log("Created Other Permissions Check");
  const kpi = ["RSRP (in dBm)", "RSRQ (in dB)", "SINR (in dB)"];

  // Set Google Spreadsheet Link for new Collection spreadsheet
  const collectionLink = "https://docs.google.com/spreadsheets/d/" + collectionSpreadsheetId + "/edit#gid=0";


  
  

  console.log("Sent Response Check");
  // Set CPE Collection Labels Preset and Add to Collection Spreadsheet
  if(typeOfData == "CPE"){
    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId: collectionSpreadsheetId,
      range: "Sheet1!A:B",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [["Timestamp", "DL Frequency (in MHz)", "UL Frequency (in MHz)", "Band", "Bandwidth (in MHz)", "RSRP (in dBm)", 
        "RSSI (in dBm)", "RSRQ (in dB)", "SINR (in dB)", "PCI", "Cell ID", "MCC", "MNC"]],
      },
    });
  }
  // Set BBU Collection Labels Preset and Add to Collection Spreadsheet
  else if(typeOfData == "BBU"){
    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId: collectionSpreadsheetId,
      range: "Sheet1!A:B",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [["Timestamp", "gNB Name", "gNB ID", "Cell ID", "PCI", "AMF IP", 
        "AMF PLMN", "NR_ARFCN (DL)", "NR_ARFCN (UL)", "SSB", "TAC", "PLMN ID", "Bandwidth (DL)", "Bandwidth (UL)", 
        "Active Timer", "Transmit Power", "QOS PLMN ID", "RbNumber", "SRSEnable", "C-SRS"]],
      },
    });
  }

  console.log("Append Labels Check");
  // loop through the refresh rate
  let refreshRate = refresh; // Refresh Rate in Seconds
  let instancesPerMinute = 60 / refreshRate; // Number of instances per minute
  let timeToInstances = instancesPerMinute * timeInMinutes;

  // This is an asynchronous function that is called automatically to run data scrapping
  (async () => {
    // Initiate the Puppeteer browser
    console.log("Launch Browser");
    let website = '';
    if(desiredURL != ''){
      website = "x";
    }
    else{
      website = "x";
    }
    //const browser = await puppeteer.launch({ignoreHTTPSErrors: true});
    // Launch Browser in LINUX
    const browser = await puppeteer.launch({executablePath: '/usr/bin/chromium-browser', ignoreHTTPSErrors: true});
    const page = await browser.newPage();
    if(typeOfData == "CPE"){// Login to CPE Webpage
      try{
        await page.goto(webpage, { waitUntil: 'networkidle2', }); // wait until page load
        console.log("Browser Successful Check");
      } catch (e) {
        console.log("Browser Failed Check");
        await browser.close();
        return;
      }
      
      await page.type('#username', username);
      await page.type('#password', password);
      await Promise.all([
        page.click('#login'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);
      // https://pptr.dev/api/puppeteer.page.reload

      await page.goto(website, { waitUntil: 'networkidle0' });
    }
    else if(typeOfData == "BBU"){// Login to BBU Webpage
      
      try{
        await page.goto(webpage, { waitUntil: 'networkidle2', }); // wait until page load
        console.log("Browser Successful Check");
      } catch (e) {
        console.log("Browser Failed Check");
        await browser.close();
        return;
      }
      //await page.goto(desiredURL, { waitUntil: 'networkidle0' });
      await page.click(".layui-select-title");
      await page.click(".layui-anim.layui-anim-upbit > dd:nth-child(1)")
      await waitSeconds(2);
      
      //console.log(await page.waitForResponse(response => console.log(response.data)));
      //await page.type('#LAY-user-login-username', username);
      //await page.type('#LAY-user-login-password', password);
      //console.log("img", img);
    }
    // Set and Send HTML Response for Webpage
    let header = '<!doctype html><html lang="en"><head><title>Network Data Collection</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">';
    header = header + '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"><link href="https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap" rel="stylesheet">';
    header = header + '<link rel="stylesheet" href="css/main.css"></head>';
    let body = '<body><div class="header"><img id = "kcctech_logo" src = "logos/kcctech_logo.png" alt = "KCCTECH LOGO"></div><section class="ftco-section"><div class="container">';
    body = body + '<div class="row justify-content-center"><div class="col-md-6 text-center mb-5"><h2 class="heading-section">Network Data Collector</h2></div></div><br><br>';
    body = body + '<div class="row justify-content-center"><div class="col-md-7 col-lg-5"><div class="login-wrap p-4 p-md-5"><div class="icon d-flex align-items-center justify-content-center"><span class="fa fa-user-o"></span>';
    body = body + '</div><h5 style="text-align: center;" >The data is now being collected!</h5><a href='
    body = body + collectionLink + '" target = "_blank"><button class="form-control rounded-left">View the Spreadsheet</button></a><a href="/stop" target="_parent"><button class="form-control rounded-left" type="submit" id="stop_button">Stop Test</button></a>';
    body = body + '<a href="/" target="_parent"><button class="form-control rounded-left" type="submit" id="stop_button">New Test</button></a>';
    body = body + '</div></div></div></div></section><script src="js/jquery.min.js"></script></body></html>';
    res.send(header + body);

    let isBBUTested = false;
    console.log('Logged In Check');
    // replace all sub: https://stackoverflow.com/questions/13340131/string-prototype-replaceall-not-working
    // reading file to var: https://stackoverflow.com/questions/18494226/storing-nodejs-fs-readfiles-result-in-a-variable-and-pass-to-global-variable
    let lines = [];
    // Setup for Speedtest Spreadsheets
    // Read the speedtest_config file to run iPerf/Ping test(s)
    let global_data = fs.readFileSync("speedtest_config.txt").toString();
    lines = global_data.replace(/\r/g, '').split("\n");
    lines = lines.filter(function (el) {
      return el != '';
    });
    let map =[];
    let testLength = lines[0];
    for(let i = 1; i < lines.length; i++){
      map[i - 1] = lines[i]; //command
    }

    let breaks = [];
    let iperfOutput = [];
    let labels = [];
    let done = 0;

    let setPlaceholders = false;
    // Iterate through each test and decide the type of test based on the command
    for(let i = 0; i < map.length; i++){
      let testName = '';
      let commandSeparation = map[i].split(" ");
      //console.log(i, commandSeparation);
      if(commandSeparation[0].toLowerCase() == "ping"){
        testName = "Ping";
      }
      else if(commandSeparation.indexOf("-u") > -1){
        testName = "UDP"
        if(commandSeparation.indexOf("-R") > -1){
          testName += " DL"
        }
        else{
          testName += " UL"
        }
      }
      else{
        testName = "TCP"
        if(commandSeparation.indexOf("-R") > -1){
          testName += " DL"
        }
        else{
          testName += " UL"
        }
      }
      // Create a new Spreadsheet for iPerf throughput or Ping
      let newSheetName = "iPerf Speedtest " + (i + 1) + " " + testName;
      const createNewSheet = {
        "requests": [
          {
            "addSheet": {
              "properties":{
                "sheetId": i + 1,
                "title": newSheetName.trim()
              }
            }
          }
        ]
      };
      const createSpeedtestSpreadsheet = await googleSheets.spreadsheets.batchUpdate({
        spreadsheetId: collectionSpreadsheetId,
        requestBody:createNewSheet
      });
    }
    console.log("Created Throughput/Ping Tests Check");
    
    // Create a regular ping spreadsheet
    let createNewRegularSheet = {
      "requests": [
        {
          "addSheet": {
            "properties":{
              "sheetId": map.length + 1,
              "title": "Regular Ping Speedtest"
            }
          }
        }
      ]
    };
    
    const createSpeedtestSpreadsheet = await googleSheets.spreadsheets.batchUpdate({
      spreadsheetId: collectionSpreadsheetId,
      requestBody:createNewRegularSheet
    });
    console.log('Starting Loop Check');
    // Loop for the number of instances / the entire test length
    for(let i = 0; i < timeToInstances; i++){
      // Break from the program if 'program start' is enabled / back at the main page
      if(app.disabled('program start')){
        break;
      }
      // Check if the number of instances equals 0 or the number of instances for the throughput tests


      
      if(i % (testLength * instancesPerMinute) == 0 || i == 0){
        console.log("Start Throughput/Ping Tests");
        for(let j = 0; j < map.length; j++){
          // runs the specified command 
          stdout = await execShellCommand("sudo " + map[j]); // Checks if you can run shell command
          if(stdout != "error"){
            // gathers output and parses the output as necessary
            var output = stdout.toString().split("\n");
            var filteredOutput = output.filter(function (el) {
              return el != '';
            });

            let iperfOutput = [];
            let commandProg = map[j].split(" ")[0].toLowerCase();
            let works = 0;
            // Attempts to connect and grab the necessary spreadsheet to append output
            try {
              const iperfEntireSpreadsheet = (await googleSheets.spreadsheets.get({spreadsheetId: collectionSpreadsheetId}));
              works = 1;
            } catch (e) {
              console.log('cant connect');
            }
            // Checks if the command is ping and the spreadsheet was able to be connected
            if (commandProg == "ping" && works == 1){
              let pingTestOutput = filteredOutput.map(element => {
                return element.trim();
              });
              
              iperfOutput = []
              // Iterates through the response output and parses it based on how it outputs to the command line
              for(let i = 1; i < pingTestOutput.length; i++){
                let splitOutput = pingTestOutput[i].split(" ");
                if(i == 1){
                  labels = ["Timestamp", "Bytes", "Ping Sequence #", "TTL", "Time (in " + splitOutput[7] + ")"];
                }
                if(i < pingTestOutput.length- 4){
                  
                  filteredOutput = [getTime(), splitOutput[0], splitOutput[4].split("=")[1], splitOutput[5].split("=")[1], splitOutput[6].split("=")[1]]
                  
                  iperfOutput.push(filteredOutput);
                }
                else{
                  if(i == pingTestOutput.length - 2){
                    let timeMeasurement = '';
                    if(splitOutput[9].length > 0) {timeMeasurement = splitOutput[9].replace(/\d/g,'');}
                    iperfOutput[0].push(splitOutput[0], splitOutput[3], splitOutput[5], splitOutput[9].split(timeMeasurement.charAt(0))[0]);
                    labels.push("Total " + splitOutput[1] + " " + splitOutput[2].replace(",", ""), "Total packets " + splitOutput[4].replace(",", ""));
                    labels.push("Total " + splitOutput[6] + " " + splitOutput[7].replace(",", ""), "Total time (in " + timeMeasurement +")");
                  }
                  if(i == pingTestOutput.length - 1){
                    let rtt = splitOutput[3].split("/");
                    let timeMeasurement = splitOutput[4].replace(",", "");
                    iperfOutput[0].push(rtt[0], rtt[1], rtt[2], rtt[3],);
                    labels.push("Min Roundtrip Time (in " + timeMeasurement + ")", "Avg Roundtrip Time (in " + timeMeasurement + ")", 
                    "Max Roundtrip Time (in " + timeMeasurement + ")", "MDEV Roundtrip Time (in " + timeMeasurement + ")");
                  }
                }
                
              }
                
            }
            // Checks if the command is throughput and the spreadsheet was able to be connected
            else if(commandProg == "iperf3" && works == 1){
              // Accesses the entire spreadsheet and find the specific sheet to append to
              const iperfEntireSpreadsheet = (await googleSheets.spreadsheets.get({spreadsheetId: collectionSpreadsheetId}));
              let currentSheet = iperfEntireSpreadsheet.data.sheets[j + 1].properties.title;
              // Sets up the necessary variables that will be used throughout the parsing
              iperfOutput = [];
              let parallelChannels = 1;
              let iterater = 1;
              if(map[j].split(" ").indexOf("-P") > -1){
                let idxOfP = map[j].split(" ").indexOf("-P");
                parallelChannels = parseInt(map[j].split(" ")[idxOfP + 1]);
                iterater = 1 + parallelChannels - 1 + 1 + 1; // initial + num of channels - 1 (to eliminate original) + sum + dashed
              }
              var output = stdout.split("\n");
              var filteredOutput = output.filter(function (el) {
                return el != '';
              });
              filteredOutput = filteredOutput.map(element => {
                return element.trim();
                
              });
              let additionalSum = 0;
              if(parallelChannels > 1){additionalSum = 2}
              let startEndPoint = filteredOutput.length - 7 - (2 * (parallelChannels - 1)) - additionalSum;

              // Iterates through the response output and parses it based on how it outputs to the command line for TCP
              if(currentSheet.indexOf("TCP") != -1){
                if(currentSheet.indexOf("DL") != -1){ // DL Parsing
                  let measurements = filteredOutput[4 + parallelChannels - 1].split(" ").filter(function (el) {
                    return el != ''
                  });
                  
                  let fileLabels = filteredOutput[3 + parallelChannels - 1].split(" ").filter(function (el) {
                    return el != ''
                  });
                  
                  labels = ["Timestamp", fileLabels[2] + " (in " + measurements[3] + ")", fileLabels[3] + " (in " + measurements[5] + ")", 
                  fileLabels[4] + " (in " + measurements[7] + ")", "Retr", "Sender/Reciever"];
                  for(let i = 4 + parallelChannels -1; i < startEndPoint + 2; i+=iterater){
                    for(let j = 0; j < parallelChannels; j++){
                      let results = filteredOutput[i + j].split(" ").filter(function (el) {
                        return el != ''
                      }); 
                      iperfOutput.push([getTime(), results[2], results[4], results[6]]);
                    }
                    if(iterater > 1){
                      let results = filteredOutput[i + parallelChannels].split(" ").filter(function (el) {
                        return el != ''
                      }); 
                      iperfOutput.push([getTime(), results[1], results[3], results[5]]);
                    }
                    
                  }
                }
                else{ // UL Parsing
                  let measurements = filteredOutput[3 + parallelChannels - 1].split(" ").filter(function (el) {
                    return el != ''
                  }); //34710
                  
                  let fileLabels = filteredOutput[2 + parallelChannels - 1].split(" ").filter(function (el) {
                    return el != ''
                  });
                  
                  labels = ["Timestamp", fileLabels[2] + "(in " + measurements[3] + ")", fileLabels[3] + "(in " + measurements[5] + ")", 
                  fileLabels[4] + "(in " + measurements[7] + ")", fileLabels[5], fileLabels[6] + "(in " + measurements[10] + ")",
                  "Sender/Reciever"];
                  for(let i = 3 + parallelChannels -1; i < startEndPoint + 2; i+=iterater){
                    for(let j = 0; j < parallelChannels; j++){
                      let results = filteredOutput[i + j].split(" ").filter(function (el) {
                        return el != ''
                      })
                      iperfOutput.push([getTime(), results[2], results[4], results[6], results[8], results[9]]);
                      
                    }
                    if(iterater > 1){
                      let results = filteredOutput[i + parallelChannels].split(" ").filter(function (el) {
                        return el != ''
                      }); 
                      iperfOutput.push([getTime(), results[1], results[3], results[5], results[7], results[8]]);
                    }
                    
                    
                  }
                }
                // TCP UL and DL finish in the same way, so we can parse the same way for both
                for(let i = startEndPoint +4; i < filteredOutput.length - 2; i++){
                  let results = filteredOutput[i].split(" ").filter(function (el) {
                    return el != ''
                  });
                
                  if(results[0] == "[SUM]"){
                    iperfOutput.push([getTime(), results[1], results[3], results[5]]);
                    if(results.length == 8){
                      iperfOutput[iperfOutput.length - 1].push("", results[7]);
                    }
                    else{
                      iperfOutput[iperfOutput.length - 1].push(results[7], results[8]);
                    }
                  }
                  else{
                    if(results.length == 9){
                      iperfOutput.push([getTime(), results[2], results[4], results[6], "", results[8]]);
                    }
                    else{
                      iperfOutput.push([getTime(), results[2], results[4], results[6], results[8], results[9]]);
                    }
                  }
                  if(currentSheet.indexOf("UL") != -1){
                    
                    iperfOutput[iperfOutput.length - 1].splice(iperfOutput[iperfOutput.length - 1].length -1, 0, "");
                  }
                  
                }

              }
              // Iterates through the response output and parses it based on how it outputs to the command line for UDP
              else if(currentSheet.indexOf("UDP") != -1){
                if(currentSheet.indexOf("DL") != -1){ // DL parsing
                  let results = filteredOutput[4].split(" ").filter(function (el) {
                    return el != ''
                  });
                  
                  let prcntIdx = results[11].indexOf("%");
                  let placeholders = [];
                  placeholders = filteredOutput[3].split(" ").filter(function (el) {
                    return el != ''
                  });
                  labels = ["Timestamp", placeholders[2] + ` (in ${results[3]})`, placeholders[3] + ` (in ${results[5]})`, 
                    placeholders[4] + ` (in ${results[7]})`, placeholders[5] +  ` (in ${results[9]})`, 
                    placeholders[6] + " " + placeholders[7], placeholders[6] + " " + placeholders[7] +  ` (in ${results[11].charAt(prcntIdx)})`];
    
                  
                  for(let i = 4; i < filteredOutput.length - 5; i++){
                    let results = filteredOutput[i].split(" ").filter(function (el) {
                      return el != ''
                    });
                    
                    let percent = results[11].substring(1, results[11].length-2);
                    iperfOutput.push([getTime(), results[2], results[4], results[6], results[8], results[10], percent]);
                  }
                }
                else{ // UL Parsing
                  let results = filteredOutput[3].split(" ").filter(function (el) {
                    return el != ''
                  });
                  
                  
                  let placeholders = [];
                  placeholders = filteredOutput[2].split(" ").filter(function (el) {
                    return el != ''
                  });
                  labels = ["Timestamp", placeholders[2] + ` (in ${results[3]})`, placeholders[3] + ` (in ${results[5]})`, 
                    placeholders[4] + ` (in ${results[7]})`, placeholders[5] + " " + placeholders[6]];
    
                  
                  for(let i = 3; i < filteredOutput.length - 5; i++){
                    let results = filteredOutput[i].split(" ").filter(function (el) {
                      return el != ''
                    });
                    
                    iperfOutput.push([getTime(), results[2], results[4], results[6], results[8]]);
                    
                  }
                }
                // UDP UL and DL finish in the same way, so we can parse the same way for both
                for(let i = filteredOutput.length - 4; i < filteredOutput.length - 1; i++){
                  let results = filteredOutput[i].split(" ").filter(function (el) {
                    return el != ''
                  });
                  
                  if(i == filteredOutput.length - 4){ // End Labels
                    labels.push(results[2], results[3], results[4], results[5], results[6] + " " + results[7], results[6] + " " + results[7] + " (in %)");
                  }
                  if(i == filteredOutput.length - 3){ // End Results
                    iperfOutput[0].push(results[2], results[4], results[6], results[8], results[10], results[11].substring(1, results[11].length-2))
                  }
                  if(i == filteredOutput.length - 2){
                    iperfOutput[1].push(results[2], results[4], results[6], results[8], results[10], results[11].substring(1, results[11].length-2));
                  }
                }
              }
            } 
            
            // If the labels haven't been set, add them to the spreadsheet
            if(setPlaceholders === false){
              iperfOutput.unshift(labels);
            }
            const iperfEntireSpreadsheet = (await googleSheets.spreadsheets.get({spreadsheetId: collectionSpreadsheetId}));
            let sheetName = iperfEntireSpreadsheet.data.sheets[j + 1].properties.title;
            
            // While you can connect, add the iPerf test output to the spreadsheet
            try {
              await googleSheets.spreadsheets.values.append({
                auth,
                spreadsheetId: collectionSpreadsheetId,
                range: sheetName,
                valueInputOption: "USER_ENTERED",
                resource: {
                  values: iperfOutput,
                },
              });
            } catch (e) {

              //console.error(e);
              setTimeout(function (){
                console.log('iPerf test connection interrupted!');
              }, 5000);
            }
            done = 1;
            console.log("Test Finished: ", i);
          }
          
        }

        // NOTE
        // Pinging google will add another item to each line, thus needed to shift the item capture by one space
        exec("sudo ping google.com -i 0.01 -c 120", async (error, stdout, stderr) => {
          if (error) {
              console.log(`error: ${error.message}`);
              return;
          }
          if (stderr) {
              console.log(`stderr: ${stderr}`);
              return;
          }
          works = 0;
          try {
            const iperfEntireSpreadsheet = (await googleSheets.spreadsheets.get({spreadsheetId: collectionSpreadsheetId}));
            works = 1;
          } catch (e) {
            console.log('cant connect');
          }
          // If you can connect, parse the output from the ping specified to Linux
          if(works == 1){
            var output = stdout.toString().split("\n");//replace(/\n/g, "").split("\r");
            var filteredOutput = output.filter(function (el) {
              return el != '';
            });
            let normalTestOutput = filteredOutput.map(element => {
              return element.trim();
            });
            let pingPrint = [];
            // Iterate through the entire output and store in the spreadsheet
            for(let i = 1; i < normalTestOutput.length; i++){
              let splitOutput = normalTestOutput[i].split(" ");
              if(i == 1){
                labels = ["Timestamp", "Bytes", "Ping Sequence #", "TTL", "Time (in " + splitOutput[8] + ")"];
              }
              // Check if the output is from the beginning or middle
              if(i < normalTestOutput.length- 4){
                //console.log(splitOutput);
                filteredOutput = [getTime(), splitOutput[0], splitOutput[5].split("=")[1], splitOutput[6].split("=")[1], splitOutput[7].split("=")[1]]
                
                pingPrint.push(filteredOutput);
              }
              else{ // output is from the beginning or middle
                if(i == normalTestOutput.length - 2){
                  let timeMeasurement = splitOutput[9].replace(/\d/g,'');
                  pingPrint[0].push(splitOutput[0], splitOutput[3], splitOutput[5], splitOutput[9].split(timeMeasurement.charAt(0))[0]);
                  labels.push("Total " + splitOutput[1] + " " + splitOutput[2], "Total packets " + splitOutput[2].replace(",", ""));
                  labels.push("Total " + splitOutput[6] + " " + splitOutput[7].replace(",", ""), "Total time (in " + timeMeasurement +")");
                }
                if(i == normalTestOutput.length - 1){
                  let rtt = splitOutput[3].split("/");
                  let timeMeasurement = splitOutput[4].replace(",", "");
                  pingPrint[0].push(rtt[0], rtt[1], rtt[2], rtt[3],);
                  labels.push("Min Roundtrip Time (in " + timeMeasurement + ")", "Avg Roundtrip Time (in " + timeMeasurement + ")", 
                  "Max Roundtrip Time (in " + timeMeasurement + ")", "MDEV Roundtrip Time (in " + timeMeasurement + ")");
                }
              }
              
            }
            // Set placeholders if they haven't been set
            if(setPlaceholders == false){
              pingPrint.unshift(labels);
              setPlaceholders = true;
            }
            const regularSpreadsheet = (await googleSheets.spreadsheets.get({spreadsheetId: collectionSpreadsheetId}));
            let sheetName = regularSpreadsheet.data.sheets[map.length + 1].properties.title;
            // While you are able to connect, add the data to the spreadsheet
            try {
              await googleSheets.spreadsheets.values.append({
                auth,
                spreadsheetId: collectionSpreadsheetId,
                range: sheetName,
                valueInputOption: "USER_ENTERED",
                resource: {
                  values: pingPrint,
                },
              });
            } catch (e) {
              //console.error(e);
              setTimeout(function (){
                console.log('Regular test connection interrupted!');
              }, 5000);
            }
          }
          
          console.log('All Throughput/Ping Tests Finished Check');
        });
      }

      // If the type of data being collected is CPE, parse the information as CPE
      if(typeOfData == "CPE"){
        console.log("CPE Collect Check");
        // Parse the HTML DOM Elements, specifically for the inner text
        let data = await page.evaluate(() => {
          let DLfreq = '',
          ULfreq = '',
          band = '',
          bndwdth = '',
          rsrp = '',
          rssi = '',
          rsrq = '',
          sinr = '',
          pci = '',
          cellid = '',
          mcc = '',
          mnc = ''; 
          
          // Setup Timestamp
          let fullDate = new Date();
          let Timestamp = fullDate.toLocaleTimeString();
          let timeOfDay = Timestamp.slice(8);
          Timestamp = Timestamp.slice(0, 8).trim();
          let milliseconds = fullDate.getUTCMilliseconds();
          Timestamp = Timestamp + ":" + milliseconds + " " + timeOfDay;

          //DL
          if(document.getElementById('x') !== null)
            DLfreq = document.getElementById('x').innerText;
          //UL
          if(document.getElementById('x') !== null)
            ULfreq = document.getElementById('x').innerText;
          //Band
          if(document.getElementById('x') !== null)
            band = document.getElementById('x').innerText;
          //Bandwidth
          if(document.getElementById('x') !== null)
            bndwdth = document.getElementById('x').innerText;
          //RSRP
          if(document.getElementById('x') !== null)
            rsrp = document.getElementById('x').innerText;
          //RSSI
          if(document.getElementById('x') !== null)
            rssi = document.getElementById('x').innerText;
          //RSRQ
          if(document.getElementById('x') !== null)
            rsrq = document.getElementById('x').innerText;
          //SINR
          if(document.getElementById('x') !== null)
            sinr = document.getElementById('x').innerText;
          //PCI
          if(document.getElementById('x') !== null)
            pci = document.getElementById('x').innerText;
          //Cell ID
          if(document.getElementById('x') !== null)
            cellid = document.getElementById('x').innerText;
          //MCC
          if(document.getElementById('x') !== null)
            mcc = document.getElementById('x').innerText;
          //MNC
          if(document.getElementById('x') !== null)
            mnc = document.getElementById('x').innerText;
          
              /* Returning an object filled with the scraped data */
          return [Timestamp, DLfreq, ULfreq, band, bndwdth, rsrp, rssi, rsrq, sinr, pci, cellid, mcc, mnc]
        });
        let recieved = 0;
        
        // While you can connect, add the data to the spreadsheet
        try {
          await googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId: collectionSpreadsheetId,
            range: "Sheet1!A:B",
            valueInputOption: "USER_ENTERED",
            resource: {
              values: [data],
            },
          });
        } catch (e) {
          console.error('spreadsheet connection interrupted!');
        }
        console.log("Appended New Info Check");
      }
      // If the data is BBU, parse it as BBU
      else if(typeOfData == "BBU" && isBBUTested == false){
        let data = []
        isBBUTested = true;

        // All of the parsing and going into the different webpages and getting the necessary information
        await page.goto("x", { waitUntil: 'networkidle0' });

        //document.querySelector('.layui-col-md12 > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > ul > li:nth-child(8)');
        await page.click('.layui-col-md12 > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > ul > li:nth-child(8)');
        await waitSeconds(4);
        initial = await page.evaluate(() => {
          let gNBName = '';

          let fullDate = new Date();
          let Timestamp = fullDate.toLocaleTimeString();
          let timeOfDay = Timestamp.slice(8);
          Timestamp = Timestamp.slice(0, 8).trim();
          let milliseconds = fullDate.getUTCMilliseconds();
          Timestamp = Timestamp + ":" + milliseconds + " " + timeOfDay;

          //gNBName
          if(document.querySelector('tbody') !== null)
            gNBName = document.querySelector('tbody').childNodes[1].childNodes[1].innerText;

          
          return [Timestamp, gNBName]
        });
        data.push(initial);
        await page.goto('x', { waitUntil: 'networkidle0' });
        await waitSeconds(4);
        let numOfCells = await page.evaluate(() => {
          let cells = 0;
          //Number of Cells
          cells = document.querySelector('#test1 > div').childNodes.length;
          return cells
        })
        for(let i = 0; i < numOfCells; i++){
          await page.goto('x', { waitUntil: 'networkidle0' });
          await waitSeconds(4);
          if(i != 0){
            data.push(["", ""]);
          }
          
          await page.click('#test1 > div > div:nth-child(' + (i+1) + ')');
          await waitSeconds(3);
          let arr = await page.evaluate(() => {
            let gNBID = '',
            cellid = '',
            pci = '',
            amfip = '',
            amfplmn = '',
            nr_arfcn_dl = '',
            nr_arfcn_ul = '',
            SSB = '';


            //gNB ID
            if(document.querySelectorAll('tbody')[1].childNodes[0].childNodes[1] !== null)
              gNBID = document.querySelectorAll('tbody')[1].childNodes[0].childNodes[1].innerText;

            // Cell Id
            if(document.querySelectorAll('tbody')[0].childNodes[1].childNodes[1] !== null)
              cellid = document.querySelectorAll('tbody')[0].childNodes[1].childNodes[1].innerText;
            
            // PCI
            if(document.querySelectorAll('tbody')[0].childNodes[0].childNodes[1] !== null)
              pci = document.querySelectorAll('tbody')[0].childNodes[0].childNodes[1].innerText;
            
            // AMF IP
            if(document.querySelectorAll('tbody')[2].childNodes[0].childNodes[1] !== null)
              amfip = document.querySelectorAll('tbody')[2].childNodes[0].childNodes[1].innerText;
            // AMF PLMN
            if(document.querySelectorAll('tbody')[2].childNodes[0].childNodes[2] !== null)
              amfplmn = document.querySelectorAll('tbody')[2].childNodes[0].childNodes[2].innerText;
            // NR-ARFCN DL
            if(document.querySelectorAll('tbody')[0].childNodes[8].childNodes[1] !== null)
              nr_arfcn_dl = document.querySelectorAll('tbody')[0].childNodes[8].childNodes[1].innerText;

            // NR-ARFCN UL
            if(document.querySelectorAll('tbody')[0].childNodes[9].childNodes[1] !== null)
              nr_arfcn_ul = document.querySelectorAll('tbody')[0].childNodes[9].childNodes[1].innerText;
            
            // SSB
            if(document.querySelectorAll('tbody')[0].childNodes[10].childNodes[1] !== null)
              SSB = document.querySelectorAll('tbody')[0].childNodes[10].childNodes[1].innerText;
            
            
            
            return [gNBID, cellid, pci, amfip, amfplmn, nr_arfcn_dl, nr_arfcn_ul, SSB]
          });

          arr.forEach((val) => {
            data[i].push(val);
          });

          await page.click('.layui-form.layui-border-box.layui-table-view > div > div:nth-child(2) > table > tbody > tr:nth-child(13) > td:nth-child(2) > div > a');
          await waitSeconds(2);
          let TAC = await page.evaluate(() => {
            let TAC = '';
            //TAC
            let TAC_id = '.layui-layer.layui-layer-page > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2) > table > tbody > tr > td:nth-child(2) > div'
            if(document.querySelector(TAC_id) !== null)
              TAC = document.querySelector(TAC_id).innerText;
            return TAC
          });
          data[i].push(TAC);

          await waitSeconds(2);
          let plmn_list = '.layui-layer.layui-layer-page > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2) > table > tbody > tr > td:nth-child(3) > div > a'
          await page.click(plmn_list);
          await waitSeconds(2);

          let PLMN_ID = await page.evaluate(() => {
            let plmnid = '';
            //TAC
            let plmn_id_find = document.querySelectorAll('.layui-layer.layui-layer-page')[1].querySelector('.layui-layer-content > div > div:nth-child(2) > div:nth-child(2) > table > tbody > tr > td:nth-child(2) > div');
            if(plmn_id_find !== null)
              plmnid = plmn_id_find.innerText;
            return plmnid
          });
          data[i].push(PLMN_ID);

        }
        //console.log("1", data);
        
        for(let i = 0; i < numOfCells; i++){
          await page.goto('x', { waitUntil: 'networkidle0' });
          await waitSeconds(1);
          let tab = '#test1 > div > div:nth-child(' + (i+1) + ')'
          if(i != 0){
            await page.click(tab);
            await waitSeconds(3);
          }
          //await page.click('.layui-tree-pack.layui-tree-lineExtend.layui-tree-showLine > div:nth-child(2) > div > div');
          await page.click(tab + ' > div:nth-child(2) > div:nth-child(2) > div > div');
          await waitSeconds(1);
          arr = await page.evaluate(() => {
            let bandwidth_dl = '',
            bandwidth_ul = '';
  
            //Bandwidth
            if(document.querySelector('tbody').childNodes[0].childNodes[1].attributes[4].value !== null){
              bandwidth_dl = document.querySelector('tbody').childNodes[0].childNodes[1].attributes[4].value;
              bandwidth_ul = document.querySelector('tbody').childNodes[1].childNodes[1].attributes[4].value;
            }
              
            
            return [bandwidth_dl, bandwidth_ul]
          });
          arr.forEach((val) => {
            data[i].push(val);
          });

          //await page.click('.layui-tree-pack.layui-tree-lineExtend.layui-tree-showLine > div:nth-child(4) > div > div');
          await page.click(tab + ' > div:nth-child(2) > div:nth-child(4) > div > div');
          await waitSeconds(1);


          let activeTimer = await page.evaluate(() => {
            let activeTimer = '';
  
            //Active Timer
            if(document.querySelector('tbody').childNodes[0].childNodes[1].attributes[4].value !== null){
              activeTimer = document.querySelector('tbody').childNodes[0].childNodes[1].attributes[4].value;
            }
            return activeTimer
          });
          data[i].push(activeTimer);

          //await page.click('.layui-tree-pack.layui-tree-lineExtend.layui-tree-showLine > div:nth-child(11) > div > div');
          await page.click(tab + ' > div:nth-child(2) > div:nth-child(11) > div > div');
          await waitSeconds(1);

          let transmitPower = await page.evaluate(() => {
            let transmitPower = '';
  
            //Transmit Power
            if(document.querySelector('tbody').childNodes[0].childNodes[1].attributes[4].value !== null){
              transmitPower = document.querySelector('tbody').childNodes[0].childNodes[1].attributes[4].value;
            }
            return transmitPower
          });
          data[i].push(transmitPower);
        }
        //console.log("2", data);
        

        for(let i = 0; i < numOfCells; i++){
          await page.goto('x', { waitUntil: 'networkidle0' });
          await waitSeconds(1);
          if(i != 0){
            await page.click('#test1 > div > div:nth-child(' + (i+1) + ')');
            await waitSeconds(3);
          }
          await page.click('.layui-table-body.layui-table-main > table > tbody > tr:nth-child(11) > td:nth-child(2) > div > a');
          await waitSeconds(1);
          await page.click('.layui-layer-content > div > div:nth-child(2) > div:nth-child(2) > table > tbody > tr > td:nth-child(3) > div > a');
          await waitSeconds(1);

          
          let QOS_PLMN = await page.evaluate(() => {
            let QOS_PLMN = '';
  
            //QOS_IDEX_PLMN
            let qos_plmn_id = '#layui-layer2 > div:nth-child(2) > div > div:nth-child(1) > div:nth-child(2) > table > tbody > tr:nth-child(4) > td:nth-child(2) > div > div';
            if(document.querySelector(qos_plmn_id) !== null){
              QOS_PLMN = document.querySelector(qos_plmn_id).innerText;
            }
            return QOS_PLMN
          });
          data[i].push(QOS_PLMN);
        }
        //console.log("3", data);
        

        for(let i = 0; i < numOfCells; i++){
          await page.goto('x', { waitUntil: 'networkidle0' });
          await waitSeconds(1);
          if(i != 0){
            await page.click('#test1 > div > div:nth-child(' + (i+1) + ')');
            await waitSeconds(3);
          }
          let tab = '#test1 > div > div:nth-child(' + (i+1) + ')';
          const MAC = tab + ' > div:nth-child(2) > div:nth-child(2)';
          const PDCCH = '.layui-form.layui-border-box.layui-table-view > div > div:nth-child(2) > table > tbody > tr > td:nth-child(2) > div > a';
          const SRSCONFIG = '.layui-form.layui-border-box.layui-table-view > div > div:nth-child(2) > table > tbody > tr:nth-child(2) > td:nth-child(2) > div > a';
          const CRSTAMList = '.layui-layer.layui-layer-page > div:nth-child(2) > div > div > div:nth-child(2) > table > tbody > tr:nth-child(3) > td:nth-child(2) > div > a'
          await page.click(MAC);
          await waitSeconds(1);
          await page.click(PDCCH);
          await waitSeconds(1);
          await page.click(CRSTAMList);
          await waitSeconds(1);
          let rb_number = await page.evaluate(() => {
            let rb_number = '';
  
            //RB NUMBER
            let rb_number_id = '#layui-layer2 > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2) > table > tbody > tr > td:nth-child(6) > div'
            if(document.querySelector(rb_number_id) !== null){
              rb_number = document.querySelector(rb_number_id).innerText;
            }
            return rb_number
          });
          data[i].push(rb_number);
          await page.goto('x', { waitUntil: 'networkidle0' });
          await waitSeconds(1);
          if(i != 0){
            await page.click('#test1 > div > div:nth-child(' + (i+1) + ')');
            await waitSeconds(3);
          }
          await page.click(MAC);
          await waitSeconds(1);
          await page.click(SRSCONFIG);
          await waitSeconds(1);
          let srs_enable = await page.evaluate(() => {
            let srs_enable = '';
            //SRS ENABLE
            let srs_enble_id = '.layui-layer-content > div > div > div:nth-child(2) > table > tbody > tr:nth-child(2) > td:nth-child(2) > div > div > em'
            if(document.querySelector(srs_enble_id) !== null){
              srs_enable = document.querySelector(srs_enble_id).innerText;
            }
            return srs_enable
          });
          data[i].push(srs_enable);

          const SRSCONFIG_CONFIG = '.layui-layer-content > div > div > div:nth-child(2) > table > tbody > tr:nth-child(4) > td:nth-child(2) > div > a'
          await page.click(SRSCONFIG_CONFIG);
          await waitSeconds(1);
          let c_srs = await page.evaluate(() => {
            let c_srs = '';
            //C_SRS
            let c_srs_id = '#layui-layer2 > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2) > table > tbody > tr > td:nth-child(7) > div'
            if(document.querySelector(c_srs_id) !== null){
              c_srs = document.querySelector(c_srs_id).innerText;
            }
            return c_srs
          });
          data[i].push(c_srs);
        }
        //console.log("4", data);

        let recieved = 0;
        for(let i = 0; i < data.length; i++){
          const collectionInput = data[i];
          while(recieved == 0){
            try {
              await googleSheets.spreadsheets.values.append({
                auth,
                spreadsheetId: collectionSpreadsheetId,
                range: "Sheet1!A:B",
                valueInputOption: "USER_ENTERED",
                resource: {
                  values: [collectionInput],
                },
              });
              recieved = 1;
            } catch (e) {
              console.error('connection interrupted!');
            }
          }
          console.log(i, 'sent');
          recieved = 0;
        }
      }
      
      
      // Reload and wait the necessary
      await waitSeconds(refresh - 0.3);
      console.log("Reload Check");
      //await page.reload();
    }
    console.log("Collection Finished Check");
    // Finished with Collection and now close the browser
    await browser.close();

    console.log("Graph Setup Check");

    // Find the number of rows caught in the collection
    const numberOfCollectionRows = (await googleSheets.spreadsheets.values.get({spreadsheetId: collectionSpreadsheetId, range: 'Sheet1'}));
    // Find the Collection Spreadsheet
    const entireSpreadsheet = (await googleSheets.spreadsheets.get({spreadsheetId: collectionSpreadsheetId}));
    // Set all the sheets
    const allSheets = entireSpreadsheet.data.sheets;
    // Set the maximum rows
    const maxRows = numberOfCollectionRows.data.values.length

    // Set up the information and variables for collection
    let existingGraphs = [[],[]];
    const rowStart = [0, 5, 7, 8];
    const kpiCheck = ["", "RSRP", "RSRQ", "SINR"];

    // Iterate through the Spreadsheet if graphs were already created
    for(let i = 5; i < allSheets.length; i++){     
      existingGraphs[0].push(allSheets[i].charts[0].spec.altText); // adds kpi
      existingGraphs[1].push(allSheets[i].charts[0].chartId); // adds chartId
      //existingGraphs[1].push(allSheets[i].properties.sheetId); // adds sheetId
    }

    // If the wantPDF variable is checked or if they want to share to a single email
    if(wantPDF || wantSingleEmail.length > 0){
      console.log("Graph Started Check");
      // Set Min and Maxs for Data
      const axisMinMax = [[-120, -50], [-40, 20], [-23, 40]];
      let m = '';
      // Check if KPI is in dB or dBm
      for(let i = 0; i < kpi.length; i++){
          if(i != 0){
            m = " (in dB)";
          }
          else{
            m = " (in dBm)";
          }
        let idxOfGraph = existingGraphs[0].indexOf(kpi[i].substring(0,4));
        
        // Check if the graph was already created
        if(idxOfGraph == -1){
          // Chart Request Body with all the labels and information
          const createSheet = {
            "requests": [
              {
                "addChart": {
                  "chart": {
                    "spec": {
                      "title": "Data Collector " + kpi[i].substring(0,4) + " & PCI vs Time",
                      "altText": kpi[i].substring(0,4),
                      "subtitle": "Below is a graph of " + kpi[i].substring(0,4) + 
                      " and PCI vs Time. PCI will be marked with a blue color and follow the right vertical axis, while " + 
                      kpi[i].substring(0,4) + " will be marked an orange color and follow the left vertical axis.",
                      "basicChart": {
                        "chartType": "LINE",
                        "legendPosition": "BOTTOM_LEGEND",
                        "axis": [
                          {
                            "position": "BOTTOM_AXIS",
                            "title": "Timestamp"
                          },
                          {
                            "position": "LEFT_AXIS",
                            "title": kpi[i].substring(0,4) + m,
                            "format":{
                              "foregroundColorStyle":{
                                "rgbColor":{
                                  "red": 1,
                                  "green": 0.4,
                                  "blue": 0
                                }
                              }
                              
                            },
                            "viewWindowOptions": {
                              "viewWindowMin": axisMinMax[i][0],
                              "viewWindowMax": axisMinMax[i][1],
                            }
                          },
                          {
                            "position": "RIGHT_AXIS",
                            "title": "PCI",
                            "format":{
                              "foregroundColorStyle":{
                                "rgbColor":{
                                  "red": 0,
                                  "green": 0,
                                  "blue": 1
                                }
                              }
                            }
                          }
                        ],
                        "domains": [
                          {
                            "domain": {
                              "sourceRange": {
                                "sources": [
                                  {
                                    "sheetId": allSheets[0].properties.sheetId,
                                    "startRowIndex": 0,
                                    "endRowIndex": maxRows,
                                    "startColumnIndex": 0,
                                    "endColumnIndex": 1
                                  }
                                ]
                              }
                            }
                          }
                        ],
                        "series": [
                          {
                            "series": {
                              "sourceRange": {
                                "sources": [
                                  {
                                    "sheetId": allSheets[0].properties.sheetId,
                                    "startRowIndex": 0,
                                    "endRowIndex": maxRows,
                                    "startColumnIndex": rowStart[kpiCheck.indexOf(kpi[i].substring(0,4))],
                                    "endColumnIndex": rowStart[kpiCheck.indexOf(kpi[i].substring(0,4))] + 1
                                  }
                                ]
                              }
                            },
                            "targetAxis": "LEFT_AXIS",
                            "pointStyle":{
                              "size": 7
                            },
                            "color":{
                              "red": 1,
                              "green": 0.4,
                              "blue": 0
                            },
                            "type": "LINE"
                          },
                          {
                            "series": {
                              "sourceRange": {
                                "sources": [
                                  {
                                    "sheetId": allSheets[0].properties.sheetId,
                                    "startRowIndex": 0,
                                    "endRowIndex": maxRows,
                                    "startColumnIndex": 9,
                                    "endColumnIndex": 10
                                  }
                                ]
                              }
                            },
                            "targetAxis": "RIGHT_AXIS",
                            "pointStyle":{
                              "size": 7
                            },
                            "color":{
                              "red": 0,
                              "green": 0,
                              "blue": 1
                            },
                            "type": "LINE"
                          },
                        ],
                        "headerCount": 1
                      }
                    },
                    "position": {
                      "newSheet": true
                    }
                  }
                }
              }
            ]
          };
          // create request to graph
          const batchCreateChart = await googleSheets.spreadsheets.batchUpdate({
            spreadsheetId: collectionSpreadsheetId,
            requestBody: createSheet
          });
          console.log("Graph Ended Check");
          
        }
        else{// Graph was already created and found
          // Chart Request Body with all the labels and information
          const updateSheet ={
            "requests": [
              {
                "updateChartSpec": {
                  "chartId": existingGraphs[1][idxOfGraph],
                  "spec": {
                    "title": "Data Collector " + existingGraphs[0][idxOfGraph] + " & PCI vs Time",
                    "altText": existingGraphs[0][idxOfGraph],
                    "subtitle": "Below is a graph of " + kpi[i].substring(0,4) + 
                      " and PCI vs Time. PCI will be marked with a blue color and follow the right vertical axis, while " + 
                      kpi[i].substring(0,4) + " will be marked an orange color and follow the left vertical axis.",
                    "basicChart": {
                      "chartType": "LINE",
                      "legendPosition": "BOTTOM_LEGEND",
                      "axis": [
                        {
                          "position": "BOTTOM_AXIS",
                          "title": "Timestamp"
                        },
                        {
                          "position": "LEFT_AXIS",
                          "title": existingGraphs[0][idxOfGraph] + m,
                          "format":{
                            "foregroundColorStyle":{
                              "rgbColor":{
                                "red": 1,
                                "green": 0.4,
                                "blue": 0
                              }
                              
                            }
                          },
                          "viewWindowOptions": {
                            "viewWindowMin": axisMinMax[i][0],
                            "viewWindowMax": axisMinMax[i][1],
                          }
                        },
                        {
                          "position": "RIGHT_AXIS",
                          "title": "PCI",
                          "format":{
                            "foregroundColorStyle":{
                              "rgbColor":{
                                "red": 0,
                                "green": 0,
                                "blue": 1
                              }
                              
                            }
                          },
                        }
                      ],
                      "domains": [
                        {
                          "domain": {
                            "sourceRange": {
                              "sources": [
                                {
                                  "sheetId": allSheets[0].properties.sheetId,
                                  "startRowIndex": 0,
                                  "endRowIndex": maxRows,
                                  "startColumnIndex": 0,
                                  "endColumnIndex": 1
                                }
                              ]
                            }
                          }
                        }
                      ],
                      "series": [
                        {
                          "series": {
                            "sourceRange": {
                              "sources": [
                                {
                                  "sheetId": allSheets[0].properties.sheetId,
                                  "startRowIndex": 0,
                                  "endRowIndex": maxRows,
                                  "startColumnIndex": rowStart[idxOfGraph+1],
                                  "endColumnIndex": rowStart[idxOfGraph+1] + 1
                                }
                              ]
                            }
                          },
                          "targetAxis": "LEFT_AXIS",
                          "pointStyle":{
                            "size": 7
                          },
                          "color":{
                            "red": 1,
                            "green": 0.4,
                            "blue": 0
                          },
                          "type": "LINE"
                        },
                        {
                          "series": {
                            "sourceRange": {
                              "sources": [
                                {
                                  "sheetId": allSheets[0].properties.sheetId,
                                  "startRowIndex": 0,
                                  "endRowIndex": maxRows,
                                  "startColumnIndex": 9,
                                  "endColumnIndex": 10
                                }
                              ]
                            }
                          },
                          "targetAxis": "RIGHT_AXIS",
                          "pointStyle":{
                            "size": 7
                          },
                          "color":{
                            "red": 0,
                            "green": 0,
                            "blue": 1
                          },
                          "type": "LINE"
                        },
                      ],
                      "headerCount": 1
                    }
                  }
                }                
              }
            ]
          };
          // Batch Request for Chart/Graph
          const batchUpdateChart = await googleSheets.spreadsheets.batchUpdate({
            spreadsheetId: collectionSpreadsheetId,
            requestBody:updateSheet
          });
        } 
      }

      console.log("Mail Start Check");
      var nodemailer = require('nodemailer'); // Define nodemailer for mailing

      // Create login and setup for mailing
      var transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
          user: 'x',
          pass: 'x'
        }
      });
      // Check if the user wants only a single email to email the PDF to
      if(wantSingleEmail != ''){
        var mailOptions = {
          from: "x",
          to: wantSingleEmail,
          subject: 'Results of: ' + infoCollectingLabelname,
          text: 'Attached is the results of the ' + infoCollectingLabelname + "\nfile: " + "https://docs.google.com/spreadsheets/d/" + collectionSpreadsheetId 
          + "/export?exportFormat=pdf&format=pdf&portrait=false",
        };
        // Send Email with contents
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      }
      else{ // User wants all emails in email list to send PDF to
        for(let e = 0; e < emails.length; e++){
          var mailOptions = {
            from: "x",
            to: emails[e],
            subject: 'Results of: ' + infoCollectingLabelname,
            text: 'Attached is the results of the ' + infoCollectingLabelname + "\nfile: " + "https://docs.google.com/spreadsheets/d/" + collectionSpreadsheetId 
            + "/export?exportFormat=pdf&format=pdf&portrait=false",
          };
          // Send Email with contents
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        }
      }
      console.log("Mail Finished Check");

      
    }
  })();
});

// Async function to wait for x seconds 
async function waitSeconds(seconds) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, seconds*1000);
  });
}

// Function to get the Timestamp
function getTime(){
  let fullDate = new Date();
  let Timestamp = fullDate.toLocaleTimeString();
  let timeOfDay = Timestamp.slice(8);
  Timestamp = Timestamp.slice(0, 8).trim();
  let milliseconds = fullDate.getUTCMilliseconds();
  Timestamp = Timestamp + ":" + milliseconds + " " + timeOfDay;
  return Timestamp;
}

// https://ali-dev.medium.com/how-to-use-promise-with-exec-in-node-js-a39c4d7bbf77
// Async function to execute a shell command and return output or error
async function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      resolve(stdout? stdout : "error");
    });
  });
}

// Async function to run the CPE Collection in the background
async function runCPE(fileName, webpage){
  const browser = await puppeteer.launch({pipe: true, executablePath: '/usr/bin/chromium-browser', ignoreHTTPSErrors: true});
  const page = await browser.newPage();
  try{
    let arrived = await page.goto(webpage, { waitUntil: 'networkidle2', }); // wait until page load
  } catch (e) {
    await browser.close();
    return;
    
  }
  console.log('Page Loaded!');
  await page.type('#username', 'x');
  await page.type('#password', 'x');
  await Promise.all([
    page.click('#login'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);
  console.log('Logged in!');

  await page.goto(webpage, { waitUntil: 'networkidle0' });

  fs.writeFile(fileName, "", {flag: "w"}, function (err){
    if (err) throw err;
    //console.log('File is created successfully.');
  });
  //every two seconds
  let labels = "Timestamp," + "DL Frequency (in MHz)," + "UL Frequency (in MHz)," + "Band," + "Bandwidth (in MHz)," + "RSRP (in dBm)," + 
      "RSSI (in dBm)," + "RSRQ (in dB)," + "SINR (in dB)," + "PCI," + "Cell ID," + "MCC," + "MNC,";
  fs.appendFileSync(fileName, labels+"\n", function (err){
    if (err) throw err;
  });
  // ADDED THIS BC WE ARE RUNNING IPERF AND CPE AT THE SAME TIME
  // Collect the CPE Data as long as the tests are running or the tests stop
  while(true && app.enabled('testing')){
    let data = await page.evaluate(() => {
      let DLfreq = '',
      ULfreq = '',
      band = '',
      bndwdth = '',
      rsrp = '',
      rssi = '',
      rsrq = '',
      sinr = '',
      pci = '',
      cellid = '',
      mcc = '',
      mnc = ''; 
      
      // Get Time Stamp
      let fullDate = new Date();
      let Timestamp = fullDate.toLocaleTimeString();
      let timeOfDay = Timestamp.slice(8);
      Timestamp = Timestamp.slice(0, 8).trim();
      let milliseconds = fullDate.getUTCMilliseconds();
      if(milliseconds < 10){milliseconds = "00" + milliseconds.toString();}
      else if(milliseconds < 100){milliseconds = "0" + milliseconds.toString();}
      Timestamp = Timestamp + ":" + milliseconds + " " + timeOfDay;

      //get website data
      let title = document.title;
      //DL
      if(document.getElementById('x') !== null)
        DLfreq = document.getElementById('x').innerText;

      //UL
      if(document.getElementById('x') !== null)
        ULfreq = document.getElementById('x').innerText;
      //Band
      if(document.getElementById('x') !== null)
        band = document.getElementById('x').innerText;
      //Bandwidth
      if(document.getElementById('x') !== null)
        bndwdth = document.getElementById('x').innerText;
      //RSRP
      if(document.getElementById('x') !== null)
        rsrp = document.getElementById('x').innerText;
      //RSSI
      if(document.getElementById('x') !== null)
        rssi = document.getElementById('x').innerText;
      //RSRQ
      if(document.getElementById('x') !== null)
        rsrq = document.getElementById('x').innerText;
      //SINR
      if(document.getElementById('x') !== null)
        sinr = document.getElementById('x').innerText;
      //PCI
      if(document.getElementById('x') !== null)
        pci = document.getElementById('x').innerText;
      //Cell ID
      if(document.getElementById('x') !== null)
        cellid = document.getElementById('x').innerText;
      //MCC
      if(document.getElementById('x') !== null)
        mcc = document.getElementById('x').innerText;
      //MNC
      if(document.getElementById('x') !== null)
        mnc = document.getElementById('x').innerText;
      
      return [Timestamp, DLfreq, ULfreq, band, bndwdth, rsrp, rssi, rsrq, sinr, pci, cellid, mcc, mnc]
      
    });
    // Add all the collection data to the log file
    data.forEach(function(val){
      fs.appendFileSync(fileName, val +",", function (err){
        if (err) throw err;
      });
    })
    // Add newline to the log file
    fs.appendFileSync(fileName, "\n", function (err){
      if (err) throw err;
    });
    await waitSeconds(1);
  }
  await browser.close();
}

// Async function to run the iPerf throughput or ping commands 
async function runCommands(fileName, res, command, nodeName){
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, "", {flag: "w"}, function (err){
      if (err) throw err;
      //console.log('File is created successfully.');
    });
    if(nodeName != ''){
      fs.appendFileSync(fileName, nodeName, function (err){
        if (err) throw err;
        console.log('File is created successfully.');
      });
      fs.appendFileSync(fileName, "\n", function (err){
        if (err) throw err;
        console.log('File is created successfully.');
      });
    }
    
    // Create a spawn process to run the commands
    var spawn = require('child_process').spawn;
    
    // Set up command to be run
    let arrayProg = command.split(" ");// Get the command as an array of strings
    let commandProg = arrayProg[0]; // Get the type of command (iperf3 or ping)
    let firstLine = true;
    // let arr = ["apple", "pear", "peach"];
    // arr.unshift("pineapple", "grapes");
    //["pineapple", "grapes", "apple", "pear", "peach"]
    arrayProg.unshift("stdbuf", "-oL", "-eL"); // -oL and -eL clears buffer and outputs live
    // Run Command
    var cmd  = spawn("sudo", arrayProg);
    cmd.stdout.setEncoding('utf8');
    cmd.stdout.on('data', function(line) {
      // Recieved Data
      // Check if Single Collection has been stopped
      if(app.disabled('testing')){
        resolve();
      }
      else{
        let out = line.toString().split("\n");
        out = out.filter(function (el) {
          return el != '';
        });
        // For each line of output
        out.forEach( function(singleLine) {
          res.write(singleLine); // Write to HTML response
          if((commandProg.toLowerCase() === "iperf3" && (singleLine.charAt(0) === '[' || firstLine == true)) || commandProg.toLowerCase() === "ping" || singleLine.charAt(0) === '-'){
            res.write("<br>");
          }
          // Write each line of data to the log file 
          fs.appendFileSync(fileName, singleLine, function (err){
            if (err) throw err;
            console.log('File is created successfully.');
          });
          fs.appendFileSync(fileName, "\n", function (err){
            if (err) throw err;
            console.log('File is created successfully.');
          });
        })
        if(firstLine == true){firstLine == false;}
      }
    });
    cmd.on('exit', function(code) {
      // When output finishes
      res.write('<br>');
      resolve(); // Resolves the promise set by the await/async syntax
    });
  })
}

// Asynchronous function that will process the commands from Online mapping
async function processCommands(pointNum, fileName, commands){
    let ipAddress = '';
    for(let k = 0; k < commands.length; k++){
      if(app.disabled('processing points')){
        return;
      }
      let nonCPETestName = "../test_logs/"+fileName+"_test_" + (k+1).toString() + "_Point" + pointNum + ".txt";
        let command = commands[k];
        // If the ipAddress variable is not blank, set it based on the command
        if(ipAddress != ''){
          let splitCommand = commands[k].split(" ");
          if(splitCommand[0].toLowerCase() == "iperf3"){
            splitCommand[2] = ipAddress.toString();
          }
          if(splitCommand[0].toLowerCase() == "ping"){
            splitCommand[1] = ipAddress.toString();
          }
          command = '';
          for(let i = 0; i < splitCommand.length - 1; i++){
            command = command + splitCommand[i] + " ";
          }
          command = command + splitCommand[splitCommand.length - 1];
        }
        await runBackgroundCommands(nonCPETestName, command);
    }
}

// Asynchronous function that will run the commands from Online mapping
async function runBackgroundCommands(fileName, command){
  return new Promise((resolve, reject) => {
    // Create log file for specific test
    fs.writeFile(fileName, "", {flag: "w"}, function (err){
      if (err) throw err;
      //console.log('File is created successfully.');
    });
    var spawn = require('child_process').spawn;
    let arrayProg = command.split(" "); // Get the command as an array of strings
    let commandProg = arrayProg[0]; // Get the type of command (iperf3 or ping)
    let firstLine = true;
    arrayProg.unshift("stdbuf", "-oL", "-eL");
    var cmd  = spawn("sudo", arrayProg);
    // Run command
    cmd.stdout.setEncoding('utf8');
    cmd.stdout.on('data', function(line) {
      // Recieved Data
      // Check if Online Mapping has been stopped or finished
      if(app.disabled('processing points')){
        resolve();
      }
      else{
        let out = line.toString().split("\n");
        out = out.filter(function (el) {
          return el != '';
        });
        out.forEach( function(singleLine) {
          // Write each line of data to the log file 
          fs.appendFileSync(fileName, singleLine, function (err){
            if (err) throw err;
            console.log('File is created successfully.');
          });
          fs.appendFileSync(fileName, "\n", function (err){
            if (err) throw err;
            console.log('File is created successfully.');
          });
          
        })
        if(firstLine == true){firstLine == false;}
      }
    });
    cmd.on('exit', function(code) {
      // When output finishes
      resolve(); // Resolves the promise set by the await/async syntax
    });
  })
}
app.listen(1771, (req, res) => console.log("Server running on port 1771. Press Ctrl+C to quit."));