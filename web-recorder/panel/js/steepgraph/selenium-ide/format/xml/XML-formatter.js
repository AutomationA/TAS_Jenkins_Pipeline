
/**
 * Parse source and update TestCase. Throw an exception if any error occurs.
 * 
 * @param testCase
 *            TestCase to update
 * @param source
 *            The source to parse
 */
function parse(testCase, source) {
	var parser = new DOMParser(); // https://developer.mozilla.org/en/DOMParser
	var doc = null;
	try {
		doc = parser.parseFromString(source, 'text/xml');

		if (doc.documentElement
			&& doc.documentElement.nodeName == 'parsererror') // https://bugzilla.mozilla.org/show_bug.cgi?id=45566
			throw 'Parse error';
	} catch (err) {
		throw "Can't parse XML file, XML not well-formed?";
	}

	// Set BaseURL if defined in XML file
	if (doc.documentElement && doc.documentElement.hasAttribute('baseURL')) {
		var rootNode = doc.documentElement;
		editor.app.setBaseURL(rootNode.getAttribute('baseURL'));
	}

	// Read XML with an XPath in order to get <selenese> and comments in the
	// good order
	var xpath = '//' + options.seleneseTag + '|//comment()';
	var nodes = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
	var current = nodes.iterateNext();

	var commands = [];
	while (current) {
		if (current.nodeName == options.seleneseTag) {
			var command = new Command();

			// Get Data from XML
			command.command = current.children[0].textContent; // 0 -> command
			command.target = current.children[1].textContent; // 1 -> target
			command.value = current.children[2].textContent; // 2 -> value

			commands.push(command);
		} else if (current.nodeType == Node.COMMENT_NODE) {
			var comment = new Comment();
			comment.comment = current.textContent;
			commands.push(comment);
		}
		current = nodes.iterateNext();
	}

	if (commands.length > 0) {
		testCase.commands = commands;
	} else {
		// Don't throw an exception, just warn
		alert('No command found');
	}
}

/**
 * Format TestCase and return the source.
 * 
 * @param testCase
 *            TestCase to format
 * @param name
 *            The name of the test case, if any. It may be used to embed title
 *            into the source.
 */
function format(testCase, name) {
	var dom = getDOMForCommands(testCase.commands);

	var s = new XMLSerializer(); // https://developer.mozilla.org/en/XMLSerializer
	var docXML = s.serializeToString(dom);

	var text = '<?xml version="1.0" encoding="UTF-8"?>';
	text+="\n<!-- Script Generated In SteepGraph 3DX Plugin Format -->"
	if (options.indentWithTab == 'true')
		text += '\n'
	text += docXML;

	return text;
}

/**
 * Format an array of commands to the snippet of source. Used to copy the source
 * into the clipboard.
 * 
 * @param The
 *            array of commands to sort.
 */
function formatCommands(commands) {
	var dom = getDOMForCommands(commands);

	var s = new XMLSerializer(); // https://developer.mozilla.org/en/XMLSerializer
	var docXML = s.serializeToString(dom);

	return docXML;
}

// -----

// Return a DOM object describing the test case, composed of `commands`
function getDOMForCommands(commands) {
	// Create a new DOM element
	var namespaceURI = null;
	var qualifiedNameStr = null;
	var DocumentType = null;
	var dom = document.implementation.createDocument(namespaceURI,
		qualifiedNameStr, DocumentType); // https://developer.mozilla.org/En/DOM/DOMImplementation.createDocument

	// Create root element
	var testCase = dom.createElement(options.rootTag);
	testCase.setAttribute("xmlns","https://www.steepgraph.com");
	testCase.setAttribute("xmlns:xsi","http://www.w3.org/2001/XMLSchema-instance");
	testCase.setAttribute("xsi:schemaLocation","https://www.steepgraph.com ../../resources/xsd/TestAutomationFramework.xsd");

	// Add version attribute
	// var tName = dom.createAttribute('seleniumIDEVersion');
	// tName.nodeValue = Editor.getString('selenium-ide.version');
	// t.setAttributeNode(tName);

	// Add baseURL attribute
	// tName = dom.createAttribute('baseURL');
	// tName.nodeValue = editor.getBaseURL(); // Request base url from editor
	// t.setAttributeNode(tName);

    for (i = 0; i < commands.length; i++) {
            if(commands[i].command.toLowerCase() == "select"){
            	if(commands[i-1].command.toLowerCase() == "click")
            			commands[i-1].command = "remove";
            	if(commands[i+1].command.toLowerCase() == "click")
            			commands[i+1].command = "remove";
            }
            if(commands[i].command.toLowerCase() == "assertconfirmation"){
                if(commands[i-2].command.toLowerCase() == "choosecancelonnextconfirmation"){
                    commands[i].command = commands[i].command+"dismiss";
                }else if(commands[i-2].command.toLowerCase() == "chooseokonnextconfirmation"){
                    commands[i].command = commands[i].command+"accept";
                }
            }
           //For Logout Tag
             if(commands[i].target == "//div[@id='topbar']/div[5]/div[2]/div[2]" && commands[i].command.toLowerCase() == "click"){
             	 if(commands[i+1].target == "//li[7]/div/span" && commands[i+1].command.toLowerCase() == "click"){
 	            	commands[i].command = "Logout";
 	            	commands[i+1].command = "remove";	
             	 }
             }
            // For SelectDate Tag
             if(commands[i].target == "//img[@alt='Date Picker']" && commands[i].command.toLowerCase() == "click"){
            	 commands[i].command = "remove";
             }
             if(commands[i].target == "id=tdMonth" && commands[i].command.toLowerCase() == "click"){
           	     commands[i].command = "remove";	
            	 commands[i+1].command = "remove";	
             }
		     if(commands[i].target == "id=tdYear1" && commands[i].command.toLowerCase() == "click"){
		  	     commands[i].command = "remove";	
		   	     commands[i+1].command = "remove";	
		     }
		     
		    //For ClickGlobalActionsMenu add button skip
		     if(commands[i].target == "//div[@id='topbar']/div[5]/div[2]/div[3]" && commands[i].command.toLowerCase() == "click"){
		    	 commands[i].command = "remove";
		     }
		     
		     //SEL-512 : For ClickGlobalToolsMenu User button skip
		     if(commands[i].target == "//div[@id='topbar']/div[5]/div[2]/div/div[2]" && commands[i].command.toLowerCase() == "click"){
		    	 commands[i].command = "remove";
		     }
		     if(commands[i].target == "//div[@id='topbar']/div[5]/div[2]/div/div[2]/div" && commands[i].command.toLowerCase() == "click"){
		    	 commands[i].command = "remove";
		     }
		     if(commands[i].target == "//div[@id='topbar']/div[5]/div[2]/div/div[2]/span" && commands[i].command.toLowerCase() == "click"){
		    	 commands[i].command = "remove";
		     }
		     if(commands[i].target == "//div[@id='topbar']/div[5]/div[2]/div/div" && commands[i].command.toLowerCase() == "click"){
		    	 commands[i].command = "remove";
		     }
		     
		     //SEL-512 : For ClickGlobalToolsMenu Profile button skip
		     if(commands[i].target == "//div[@id='topbar']/div[5]/div[2]/div[2]" && commands[i].command.toLowerCase() == "click"){
		    	 commands[i].command = "remove";
		     }
		     
		     //SEL-512 : For ClickGlobalToolsMenu Help button skip
		     if(commands[i].target == "//div[@id='topbar']/div[5]/div[2]/div[6]" && commands[i].command.toLowerCase() == "click"){
		    	 commands[i].command = "remove";
		     }
	  }

	for (i = 0; i < commands.length; i++) {
		//if (options.indentWithTab == 'true')
		//	testCase.appendChild(dom.createTextNode('\n'));

		if (commands[i].type == 'comment') {
			var textComment = dom.createComment(commands[i].comment);
			testCase.appendChild(textComment);
		} else if (commands[i].type == 'command') {
			buildCommand(dom, testCase, commands[i]);

		}
	}

	// Put the end tag (</TestCase>) on a new line
	if (options.indentWithTab == 'true')
		testCase.appendChild(dom.createTextNode('\n'));

	dom.appendChild(testCase);

	return dom;
}

// get the value of sgs child node
function getSGSTargetElement(command, elementName) {
	var elementValue = null;
	if (!command.sgsTarget)
		return elementValue;

	var elementNameTag = command.sgsTarget.getElementsByTagName(elementName)
	if (!elementNameTag || elementNameTag.length < 1)
		return elementValue;

	elementValue = elementNameTag[0].textContent;

	return elementValue;

}

function isElementHidden(commandName, commandValue)
{
	if(commandName == "sgs:hideCommands" && commandValue == "SGS::Export::HideCommand")
	{
		return true;
	}
	return false;
}

// Create GlobalActionMenu Tag in export
function addGlobalActionMenu(dom, testCase, command) {

	if (command.dataList) {
		for (var i = 0; i < command.dataList.options.length; i++) {
			var optionText = command.dataList.options[i].textContent;
			if (optionText && optionText.includes("div.add.topbar-menu-item.topbar-cmd.fonticon.fonticon-plus"))
				return true;
		}
	}

	var commandName = getSGSTargetElement(command, "name");
	var commandValue = getSGSTargetElement(command, "value");
	
	//Selenium-525
	if (command.target =="//div[@id='my-apps-ct']/div/div[2]/div" || command.target =="//div[@id='my-apps-ct']/div/div[3]/div/div[2]/div"
		|| command.target == "div[@id='my-apps-ct']/div/div[2]")  {
		return true;
	}

	if(isElementHidden(commandName, commandValue))
	{
		return true;
	}

// SELENIUM-240 : and SELENIUM-228 : 
		var custAttrName = "commandLabel";
		switch(commandName){
			case "sgs:globalActionMenu":
				selCommand = dom.createElement("ClickGlobalActionsMenu");
			break;
			case "sgs:globalMyDeskMenu":
				selCommand = dom.createElement("ClickMyDeskMenu");
			break;
			case "sgs:globalToolsMenu":
				selCommand = dom.createElement("ClickGlobalToolsMenu");
			break;
			case "sgs:globalSearchByType":
				selCommand = dom.createElement("GlobalSearch");
				custAttrName = "type";
			break;
			case "sgs:globalSearch":
				selCommand = dom.createElement("GlobalSearch");
				custAttrName = "input";
			break;
			case "sgs:IndentedTableSelectRow":
				selCommand = dom.createElement("SelectIndentedTableRow");
				selCommand.setAttribute("expand", "true");
				selCommand.setAttribute("criteria", "level");
				selCommand.setAttribute("selectcheckbox", "true");
				custAttrName = "input";
			break;
			case "sgs:IndentedTableEditRow":
				selCommand = dom.createElement("EditIndentedTableRow");
				if(commandValue)
				{
					var cmdValArr = commandValue.split("|");
					commandValue = cmdValArr[0];
					selCommand.setAttribute("position", cmdValArr[1]);
					selCommand.setAttribute("action", "");
				}
				custAttrName = "input";
			break;
			case "sgs:clickCategories":
				selCommand = dom.createElement("ClickCategoryCommand");
				if(commandValue)
				{
					var cmdValArr = commandValue.split("|");
					commandValue = cmdValArr[0];
				}
				custAttrName = "title";
			break;
			
			case "sgs:selectDate":
				selCommand = dom.createElement("SelectDate");
				if(commandValue)
				{
					var cmdValArr = commandValue.split("|");
					commandValue = cmdValArr[1];
					selCommand.setAttribute("locatorExpression", cmdValArr[0]);
					selCommand.setAttribute("locatorType", "xpath");
				}
				custAttrName = "input";
			break;
			
			case "sgs:backAndForwardButton":
				if(commandValue == "back")
					selCommand = dom.createElement("ClickBackButton");
				else if (commandValue == "forward") {
					selCommand = dom.createElement("ClickForwardButton");
				}
				custAttrName = null;
			break;

			case "sgs:lifecycle":
				selCommand = dom.createElement("Lifecycle");
				custAttrName = "action";
			break;

			case "sgs:OpenActionToolbarMenu":
				selCommand = dom.createElement("OpenActionToolbarMenu");
				if(commandValue)
				{
					var cmdValArr = commandValue.split("|");
					commandValue = cmdValArr[0];
				}
				custAttrName = "commandlabel";
			break;
			
			case "sgs:backButton":
				selCommand = dom.createElement("ClickBackButton");
				custAttrName = null;
			break;
			
			case "sgs:clickRefreshButton":
				selCommand = dom.createElement("ClickRefreshButton");
				custAttrName = null;
			break;
			
			case "sgs:openChooser":
                selCommand = dom.createElement("OpenChooser");
                custAttrName = "fieldlabel";
            break;
            
			case "sgs:clickhomemenu":
                selCommand = dom.createElement("ClickHomeMenu");
                custAttrName = null;
            break;

			case "sgs:forwardButton":
				selCommand = dom.createElement("ClickForwardButton");	
				custAttrName = null;
			break;

			case "sgs:clickportalcommand":
                selCommand = dom.createElement("ClickPortalCommand");
                custAttrName = "title";
            break;
            
			case "sgs:setcontent":
	            break;
	            
			case "sgs:downloadfileusingicon":
				
				if(commandValue)
				{
				    cmdValArr = commandValue.split("|");
					var position = cmdValArr[0];
					var rmbrow = cmdValArr[1];
					var id = cmdValArr[2];
					
					selCommand = dom.createElement("SelectIndentedTableRow");
					selCommand.setAttribute("id",id);
					selCommand.setAttribute("selectcheckbox","true");
					selCommand.setAttribute("level",rmbrow);
					selCommand.setAttribute("expand","true");
					
					testCase.appendChild(dom.createTextNode('\n\t'));
					testCase.appendChild(selCommand);
					
					selCommand = dom.createElement("DownloadFileUsingIcon");
					selCommand.setAttribute("refid",id);
					selCommand.setAttribute("position",position);
				}
				custAttrName = null;
			break;
			
			case "sgs:opencompassapp":
                selCommand = dom.createElement("OpenCompassApp");
                selCommand.setAttribute("quadrant", commandValue);
                custAttrName = null;
            break;
            
            case "sgs:opencompassappname":
                var childNode = testCase.children;
                childNode[childNode.length-1].setAttribute("appname", commandValue);
                custAttrName = null;
            break;

			default:
				return false;
		}
		if(custAttrName) {
			selCommand.setAttribute(custAttrName, commandValue);
		}
		testCase.appendChild(dom.createTextNode('\n\t'));
		testCase.appendChild(selCommand);
		return true;
	
}

// Create GlobalSearch Tag in export
function addGlobalSearch(dom, testCase, command) {

	var commandName = getSGSTargetElement(command, "name");
	var commandValue = getSGSTargetElement(command, "value");

	if(isElementHidden(commandName, commandValue))
	{
		return true;
	}

	if (commandName && commandValue && commandValue == "true") {
		if (commandName == "sgs:globalSearch") {
			selCommand = dom.createElement("GlobalSearch");
			selCommand.setAttribute("id", "");
			selCommand.setAttribute("input", commandValue);
			testCase.appendChild(dom.createTextNode('\n\t'));
			testCase.appendChild(selCommand);
			return true;
		}
	}
	
	// Selenium-525
	if( command.target == "xpath=(//input[@type='text'])[2]") {
		return true;
	}
	
	return false;
}


// Create SwitchToFrame Tag in export
function addSwitchToFrame(dom, testCase, command) {

	var commandName = getSGSTargetElement(command, "name");
	var commandValue = getSGSTargetElement(command, "value");

	if (commandName && commandValue) {
		if (commandName == "sgs:SwitchToFrame") {
			if(commandValue.toLowerCase() == "content"){
				selCommand = dom.createElement("SwitchToContentFrame");
			}else if(commandValue.toLowerCase() == "detailsdisplay"){
				selCommand = dom.createElement("SwitchToDetailsDisplayFrame");
			}else if(commandValue.toLowerCase() == "portaldisplay"){
				selCommand = dom.createElement("SwitchToPortalDisplayFrame");
			}else if(commandValue.toLowerCase() == "slideinframe"){
				selCommand = dom.createElement("SwitchToSlideInWindow");
			}else{
				selCommand = dom.createElement("SwitchToFrame");
				selCommand.setAttribute("name", commandValue);
			}
			testCase.appendChild(dom.createTextNode('\n\t'));
			testCase.appendChild(selCommand);
			return true;
		}
	}

	return false;
}

function addSwitchTParentFrame(dom, testCase, command) {

	var commandName = getSGSTargetElement(command, "name");
	var commandValue = getSGSTargetElement(command, "value");

	if (commandName && commandValue) {
		if (commandName == "sgs:SwitchToDefaultContent") {
			selCommand = dom.createElement("SwitchToDefaultContent");
			testCase.appendChild(dom.createTextNode('\n\t'));
			testCase.appendChild(selCommand);
			return true;
		}
		if (commandName == "sgs:ignore" && commandValue == "ignore=false") {
			selCommand = dom.createElement("SwitchToParentFrame");
			testCase.appendChild(dom.createTextNode('\n\t'));
			testCase.appendChild(selCommand);
			return true;
		}
	}

	return false;
}

function buildCommand(dom, testCase, command) {

	//when you manually adds the commands in that case dom could be null
	if (!dom || !command || !testCase)
		return;

	var selCommand = null;

	var command_name = "";

	if (command && command.command)
		command_name = command.command.toLowerCase();

	var isValidTag = true;

	switch (command_name) {
		case "open":
			// not required in current case
			isValidTag = false;
			break;
		
		case "handlealert":
		case "alert":
		case "prompt":
		case "assertconfirmation":
				var expArr = getLocatorExpression(command);
				selCommand = dom.createElement("HandleAlert");
				selCommand.setAttribute("input", expArr[1]);
				selCommand.setAttribute("action", "accept");
			break;

		case "clickelement":
		case "clickandwait":
		case "click":
			if (!addGlobalActionMenu(dom, testCase, command)) {
				var expArr = getLocatorExpression(command);
				selCommand = dom.createElement("ClickElement");
				selCommand.setAttribute("locatorType", expArr[0]);
				selCommand.setAttribute("locatorExpression", expArr[1]);
			}
			break;

		case "inputtext":
		case "type":
			if (!addGlobalSearch(dom, testCase, command)) {
				expArr = getLocatorExpression(command);
				selCommand = dom.createElement("InputText");
				selCommand.setAttribute("locatorType", expArr[0]);
				selCommand.setAttribute("locatorExpression", expArr[1]);
				selCommand.setAttribute("input", command.value);
			}
			break;

		case "sendkey":
		case "sendkeys":
			expArr = getLocatorExpression(command);
			selCommand = dom.createElement("SendKey");
			selCommand.setAttribute("locatorType", expArr[0]);
			selCommand.setAttribute("locatorExpression", expArr[1]);
			selCommand.setAttribute("key", command.value);
			break;

		case "selectelement":
		case "select":
			expArr = getLocatorExpression(command);
			selCommand = dom.createElement("SelectElement");
			selCommand.setAttribute("locatorType", expArr[0]);
			selCommand.setAttribute("locatorExpression", expArr[1]);
			selCommand.setAttribute("input", command.value.replace("label=", ""));
			break;

		case "switchtoframe":
		case "selectframe":
			if (!addSwitchToFrame(dom, testCase, command)) {
				if (command.target && command.target.startsWith("index=")) {
					selCommand = dom.createElement("SwitchToFrame");
					selCommand.setAttribute("index", command.target.replace("index=", ""));
				} else if (command.target && command.target === "relative=parent") {
					addSwitchTParentFrame(dom, testCase, command);
				} else {
					selCommand = dom.createElement("SwitchToFrame");
					selCommand.setAttribute("name", command.target);
				}
			}
			break;
		
		case "switchtowindow":
		case "selectwindow":
			selCommand = dom.createElement("SwitchToWindow");
			if (command.target) {
				selCommand.setAttribute("title", command.target.replace("title=", ""));
			}
			break;

		//SELENIUM-262 - Unkown tag for close button
		case "close":
		case "closecurrentwindow":
			selCommand = dom.createElement("CloseCurrentWindow");
			if (command.target) {
				selCommand.setAttribute("title", command.target.replace("title=", ""));
			}
			break;
		case "choosecancelonnextconfirmation":
		case "chooseokonnextconfirmation":
		case "remove":	
			break;
		case "assertconfirmationdismiss":
            expArr = getLocatorExpression(command);
            selCommand = dom.createElement("HandleAlert");
            selCommand.setAttribute("input", expArr[1]);
            selCommand.setAttribute("action", "dismiss");
            break;
        case "assertconfirmationaccept":
            expArr = getLocatorExpression(command);
            selCommand = dom.createElement("HandleAlert");
            selCommand.setAttribute("input", expArr[1]);
            selCommand.setAttribute("action", "accept");
            break;
        case "logout":
            selCommand = dom.createElement("Logout");
            break;
        case "assertalert":
            expArr = getLocatorExpression(command);
            selCommand = dom.createElement("AssertAlert");
            selCommand.setAttribute("id", expArr[1]);
            selCommand.setAttribute("action", "accept");
            break;
        case "editcontent":    
            selCommand = dom.createElement("SetContent");
            selCommand.setAttribute("locatorType", "xpath");
            selCommand.setAttribute("locatorExpression", command.target);
            var textvalue = command.value.replace("<p>", "").replace("</p>", "").replace("<br>", "");
            selCommand.setAttribute("input", textvalue);
            custAttrName = null;
            break;
        
		default:
			break;
	}

	if (selCommand) {
		testCase.appendChild(dom.createTextNode('\n\t'));
		testCase.appendChild(selCommand);
	}

}

function getLocatorExpression(command) {
	var locatorType = "xpath";
	var locatorExpression = command.target;

	if (command.target) {
		if (command.target.startsWith("id=")) {
			locatorType = "id";
			locatorExpression = command.target.replace("id=", "");
		} else if (command.target.startsWith("name=")) {
			locatorType = "name";
			locatorExpression = command.target.replace("name=", "");
		}
		else if (command.target.startsWith("xpath=")) {
			locatorType = "xpath";
			locatorExpression = command.target.replace("xpath=", "");
		}
		else if (command.target.startsWith("css=")) {
			locatorType = "css";
			locatorExpression = command.target.replace("css=", "");
		}

	}
	return [locatorType, locatorExpression];
}

// Will be stored in extensions.selenium-ide.formats.xmlformatter.
this.options = {
	rootTag: 'TestCase',
	seleneseTag: 'selenese',
	commandTag: 'command',
	targetTag: 'target',
	valueTag: 'value',
	indentWithTab: 'true'
};

// Optional: XUL XML String for the UI of the options dialog
this.configForm = '<description>Root Tag</description>'
	+ '<textbox id="options_rootTag" />'
	+ '<description>Selenese Tag</description>'
	+ '<textbox id="options_seleneseTag" />'
	+ '<description>Command Tag</description>'
	+ '<textbox id="options_commandTag" />'
	+ '<description>Target Tag</description>'
	+ '<textbox id="options_targetTag" />'
	+ '<description>Value Tag</description>'
	+ '<textbox id="options_valueTag" />'
	+ '<separator class="groove"/>'
	+ '<checkbox id="options_indentWithTab" label="Indent XML with tabulations" />';
