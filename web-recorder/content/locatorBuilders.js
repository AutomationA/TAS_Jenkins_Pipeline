/*
 * Copyright 2005 Shinya Kasatani
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function LocatorBuilders(window) {
    this.window = window;
    //this.log = new Log("LocatorBuilders");
}

LocatorBuilders.prototype.detach = function () {
    if (this.window._locator_pageBot) {
        //this.log.debug(this.window);
        this.window._locator_pageBot = undefined;
        // Firefox 3 (beta 5) throws "Security Manager vetoed action" when we use delete operator like this:
        // delete this.window._locator_pageBot;
    }
};

LocatorBuilders.prototype.pageBot = function () {
    var pageBot = this.window._locator_pageBot;
    if (pageBot == null) {
        //pageBot = BrowserBot.createForWindow(this.window);
        pageBot = new MozillaBrowserBot(this.window);
        var self = this;
        pageBot.getCurrentWindow = function () {
            return self.window;
        };
        this.window._locator_pageBot = pageBot;
    }
    return pageBot;
};

LocatorBuilders.prototype.buildWith = function (name, e, opt_contextNode) {
    return LocatorBuilders.builderMap[name].call(this, e, opt_contextNode);
};

LocatorBuilders.prototype.elementEquals = function (name, e, locator) {
    var fe = this.findElement(locator);
    //TODO: add match function to the ui locator builder, note the inverted parameters
    return (e == fe) || (LocatorBuilders.builderMap[name] && LocatorBuilders.builderMap[name].match && LocatorBuilders.builderMap[name].match(e, fe));
};

LocatorBuilders.prototype.build = function (e) {
    var locators = this.buildAll(e);
    if (locators.length > 0) {
        return locators[0][0];
    } else {
        return "LOCATOR_DETECTION_FAILED";
    }
};

LocatorBuilders.prototype.buildAll = function (el) {
    var e = core.firefox.unwrap(el); //Samit: Fix: Do the magic to get it to work in Firefox 4
    var xpathLevel = 0;
    var maxLevel = 10;
    var buildWithResults;
    var locators = [];
    //this.log.debug("getLocator for element " + e);
    var coreLocatorStrategies = this.pageBot().locationStrategies;
    for (var i = 0; i < LocatorBuilders.order.length; i++) {
        var finderName = LocatorBuilders.order[i];
        var locator;
        var locatorResults = []; // Array to hold buildWith results
        //this.log.debug("trying " + finderName);
        try {
            buildWithResults = this.buildWith(finderName, e);

            //only implement if no native implementation is available
            if (!Array.isArray) {
                Array.isArray = function (obj) {
                    return Object.prototype.toString.call(obj) === '[object Array]';
                }
            };

            // If locator is an array then dump its element in a new array
            if (Array.isArray(buildWithResults)) {
                for (var j = 0; j < buildWithResults.length; j++) {
                    locatorResults.push(buildWithResults[j]);
                }
            } else {
                locatorResults.push(buildWithResults);
            }

            for (var j = 0; j < locatorResults.length; j++) {
                locator = locatorResults[j];

                if (locator) {
                    locator = String(locator);
                    //this.log.debug("locator=" + locator);
                    // test the locator. If a is_fuzzy_match() heuristic function is
                    // defined for the location strategy, use it to determine the
                    // validity of the locator's results. Otherwise, maintain existing
                    // behavior.
                    //      try {
                    //        //alert(PageBot.prototype.locateElementByUIElement);
                    //        //Samit: The is_fuzzy_match stuff is buggy - comparing builder name with a locator name usually results in an exception :(
                    //        var is_fuzzy_match = this.pageBot().locationStrategies[finderName].is_fuzzy_match;
                    //        if (is_fuzzy_match) {
                    //          if (is_fuzzy_match(this.findElement(locator), e)) {
                    //            locators.push([ locator, finderName ]);
                    //          }
                    //        }
                    //        else {
                    //          if (e == this.findElement(locator)) {
                    //            locators.push([ locator, finderName ]);
                    //          }
                    //        }
                    //      }
                    //      catch (exception) {
                    //        if (e == this.findElement(locator)) {
                    //          locators.push([ locator, finderName ]);
                    //        }
                    //      }

                    //Samit: The following is a quickfix for above commented code to stop exceptions on almost every locator builder
                    //TODO: the builderName should NOT be used as a strategy name, create a feature to allow locatorBuilders to specify this kind of behaviour
                    //TODO: Useful if a builder wants to capture a different element like a parent. Use the this.elementEquals
                    if (finderName.startsWith("sgs:")) {
                        locators.push([locator, finderName]);
                    } else
                        if (finderName != 'tac') {
                            var fe = this.findElement(locator);
                            if ((e == fe) || (coreLocatorStrategies[finderName] && coreLocatorStrategies[finderName].is_fuzzy_match && coreLocatorStrategies[finderName].is_fuzzy_match(fe, e))) {
                                locators.push([locator, finderName]);
                            }
                        } else {
                            locators.splice(0, 0, [locator, finderName]);
                        }
                }
            }
        } catch (e) {
            // TODO ignore the buggy locator builder for now
            //this.log.debug("locator exception: " + e);
        }
    }
    return locators;
};

LocatorBuilders.prototype.findElement = function (locator) {
    try {
        return this.pageBot().findElement(locator);
    } catch (error) {
        //this.log.debug("findElement failed: " + error + ", locator=" + locator);
        return null;
    }
};

/*
 * Class methods
 */

LocatorBuilders.order = [];

LocatorBuilders.builderMap = {};
LocatorBuilders._preferredOrder = [];

// NOTE: for some reasons we does not use this part
// classObservable(LocatorBuilders);

LocatorBuilders.add = function (name, finder) {
    if (this.order.indexOf(name) < 0) {
        this.order.push(name);
    }
    this.builderMap[name] = finder;
    this._orderChanged();
};

/**
 * Call when the order or preferred order changes
 */
LocatorBuilders._orderChanged = function () {
    var changed = this._ensureAllPresent(this.order, this._preferredOrder);
    this._sortByRefOrder(this.order, this._preferredOrder);
    if (changed) {
        // NOTE: for some reasons we does not use this part
        // this.notify('preferredOrderChanged', this._preferredOrder);
    }
};

/**
 * Set the preferred order of the locator builders
 *
 * @param preferredOrder can be an array or a comma separated string of names
 */
LocatorBuilders.setPreferredOrder = function (preferredOrder) {
    if (typeof preferredOrder === 'string') {
        this._preferredOrder = preferredOrder.split(',');
    } else {
        this._preferredOrder = preferredOrder;
    }
    this._orderChanged();
};

/**
 * Returns the locator builders preferred order as an array
 */
LocatorBuilders.getPreferredOrder = function () {
    return this._preferredOrder;
};

/**
 * Sorts arrayToSort in the order of elements in sortOrderReference
 * @param arrayToSort
 * @param sortOrderReference
 */
LocatorBuilders._sortByRefOrder = function (arrayToSort, sortOrderReference) {
    var raLen = sortOrderReference.length;
    arrayToSort.sort(function (a, b) {
        var ai = sortOrderReference.indexOf(a);
        var bi = sortOrderReference.indexOf(b);
        return (ai > -1 ? ai : raLen) - (bi > -1 ? bi : raLen);
    });
};

/**
 * Function to add to the bottom of destArray elements from source array that do not exist in destArray
 * @param sourceArray
 * @param destArray
 */
LocatorBuilders._ensureAllPresent = function (sourceArray, destArray) {
    var changed = false;
    sourceArray.forEach(function (e) {
        if (destArray.indexOf(e) == -1) {
            destArray.push(e);
            changed = true;
        }
    });
    return changed;
};

/*
 * Utility function: Encode XPath attribute value.
 */
LocatorBuilders.prototype.attributeValue = function (value) {
    if (value.indexOf("'") < 0) {
        return "'" + value + "'";
    } else if (value.indexOf('"') < 0) {
        return '"' + value + '"';
    } else {
        var result = 'concat(';
        var part = "";
        while (true) {
            var apos = value.indexOf("'");
            var quot = value.indexOf('"');
            if (apos < 0) {
                result += "'" + value + "'";
                break;
            } else if (quot < 0) {
                result += '"' + value + '"';
                break;
            } else if (quot < apos) {
                part = value.substring(0, apos);
                result += "'" + part + "'";
                value = value.substring(part.length);
            } else {
                part = value.substring(0, quot);
                result += '"' + part + '"';
                value = value.substring(part.length);
            }
            result += ',';
        }
        result += ')';
        return result;
    }
};

LocatorBuilders.prototype.xpathHtmlElement = function (name) {
    if (this.window.document.contentType == 'application/xhtml+xml') {
        // "x:" prefix is required when testing XHTML pages
        return "x:" + name;
    } else {
        return name;
    }
};

LocatorBuilders.prototype.relativeXPathFromParent = function (current) {
    var index = this.getNodeNbr(current);
    var currentPath = '/' + this.xpathHtmlElement(current.nodeName.toLowerCase());
    if (index > 0) {
        currentPath += '[' + (index + 1) + ']';
    }
    return currentPath;
};

LocatorBuilders.prototype.getNodeNbr = function (current) {
    var childNodes = current.parentNode.childNodes;
    var total = 0;
    var index = -1;
    for (var i = 0; i < childNodes.length; i++) {
        var child = childNodes[i];
        if (child.nodeName == current.nodeName) {
            if (child == current) {
                index = total;
            }
            total++;
        }
    }
    return index;
};

LocatorBuilders.prototype.getCSSSubPath = function (e) {
    var css_attributes = ['id', 'name', 'class', 'type', 'alt', 'title', 'value'];
    for (var i = 0; i < css_attributes.length; i++) {
        var attr = css_attributes[i];
        var value = e.getAttribute(attr);
        if (value) {
            if (attr == 'id')
                return '#' + value;
            if (attr == 'class')
                return e.nodeName.toLowerCase() + '.' + value.replace(/\s+/g, ".").replace("..", ".");
            return e.nodeName.toLowerCase() + '[' + attr + '="' + value + '"]';
        }
    }
    if (this.getNodeNbr(e))
        return e.nodeName.toLowerCase() + ':nth-of-type(' + this.getNodeNbr(e) + ')';
    else
        return e.nodeName.toLowerCase();
};

LocatorBuilders.prototype.preciseXPath = function (xpath, e) {
    //only create more precise xpath if needed
    if (this.findElement(xpath) != e) {
        var result = e.ownerDocument.evaluate(xpath, e.ownerDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        //skip first element (result:0 xpath index:1)
        for (var i = 0, len = result.snapshotLength; i < len; i++) {
            var newPath = 'xpath=(' + xpath + ')[' + (i + 1) + ']';
            if (this.findElement(newPath) == e) {
                return newPath;
            }
        }
    }
    return xpath;
}

/*
 * ===== builders =====
 */

LocatorBuilders.add('ui', function (pageElement) {
    return UIMap.getInstance().getUISpecifierString(pageElement,
        this.window.document);
});

LocatorBuilders.add('id', function (e) {
    if (this.isValidId(e.id)) {
        return 'id=' + e.id;
    }
    return null;
});

LocatorBuilders.add('link', function (e) {
    if (e.nodeName == 'A') {
        var text = e.textContent;
        if (!text.match(/^\s*$/)) {
            return "link=" + exactMatchPattern(text.replace(/\xA0/g, " ").replace(/^\s*(.*?)\s*$/, "$1"));
        }
    }
    return null;
});

LocatorBuilders.add('name', function (e) {
    if (e.name) {
        return 'name=' + e.name;
    }
    return null;
});

/*
 * This function is called from DOM locatorBuilders
 */
LocatorBuilders.prototype.findDomFormLocator = function (form) {
    if (form.hasAttribute('name')) {
        var name = form.getAttribute('name');
        var locator = "document." + name;
        if (this.findElement(locator) == form) {
            return locator;
        }
        locator = "document.forms['" + name + "']";
        if (this.findElement(locator) == form) {
            return locator;
        }
    }
    var forms = this.window.document.forms;
    for (var i = 0; i < forms.length; i++) {
        if (form == forms[i]) {
            return "document.forms[" + i + "]";
        }
    }
    return null;
};

LocatorBuilders.add('dom:name', function (e) {
    if (e.form && e.name) {
        var formLocator = this.findDomFormLocator(e.form);
        if (formLocator) {
            var candidates = [formLocator + "." + e.name,
            formLocator + ".elements['" + e.name + "']"
            ];
            for (var c = 0; c < candidates.length; c++) {
                var locator = candidates[c];
                var found = this.findElement(locator);
                if (found) {
                    if (found == e) {
                        return locator;
                    } else if (found instanceof NodeList) {
                        // multiple elements with same name
                        for (var i = 0; i < found.length; i++) {
                            if (found[i] == e) {
                                return locator + "[" + i + "]";
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
});

LocatorBuilders.add('xpath:link', function (e) {
    if (e.nodeName == 'A') {
        var text = e.textContent;
        if (!text.match(/^\s*$/)) {
            return this.preciseXPath("//" + this.xpathHtmlElement("a") + "[contains(text(),'" + text.replace(/^\s+/, '').replace(/\s+$/, '') + "')]", e);
        }
    }
    return null;
});

LocatorBuilders.add('xpath:img', function (e) {
    if (e.nodeName == 'IMG') {
        if (e.alt != '') {
            return this.preciseXPath("//" + this.xpathHtmlElement("img") + "[@alt=" + this.attributeValue(e.alt) + "]", e);
        } else if (e.title != '') {
            return this.preciseXPath("//" + this.xpathHtmlElement("img") + "[@title=" + this.attributeValue(e.title) + "]", e);
        } else if (e.src != '') {
            return this.preciseXPath("//" + this.xpathHtmlElement("img") + "[contains(@src," + this.attributeValue(e.src) + ")]", e);
        }
    }
    return null;
});

LocatorBuilders.add('xpath:attributes', function (e) {
    const PREFERRED_ATTRIBUTES = ['id', 'name', 'title', 'value', 'type', 'action', 'onclick'];
    var i = 0;

    function attributesXPath(name, attNames, attributes) {
        var locator = "//" + this.xpathHtmlElement(name) + "[";
        for (i = 0; i < attNames.length; i++) {
            if (i > 0) {
                locator += " and ";
            }

            // id greater than 6 would be considered as dyanamic id, skip this kind of id in expression
            var attName = attNames[i];
            var attValue = this.attributeValue(attributes[attName]);
            if ("id" == attName && !this.isValidId(attValue))
                continue;

            locator += '@' + attName + "=" + attValue;
        }
        locator += "]";
        return this.preciseXPath(locator, e);
    }

    if (e.attributes) {
        var atts = e.attributes;
        var attsMap = {};
        for (i = 0; i < atts.length; i++) {
            var att = atts[i];
            if (att.value)
                attsMap[att.name] = att.value;
        }
        var names = [];
        // try preferred attributes
        for (i = 0; i < PREFERRED_ATTRIBUTES.length; i++) {
            var name = PREFERRED_ATTRIBUTES[i];
            if (attsMap[name] != null) {
                names.push(name);
                var locator = attributesXPath.call(this, e.nodeName.toLowerCase(), names, attsMap);
                if (e == this.findElement(locator)) {
                    return locator;
                }
            }
        }
    }
    return null;
});

LocatorBuilders.add('xpath:idRelative', function (e) {
    var path = '';
    var current = e;
    while (current != null) {
        if (current.parentNode != null) {
            path = this.relativeXPathFromParent(current) + path;
            if (1 == current.parentNode.nodeType && // ELEMENT_NODE
                current.parentNode.getAttribute("id")) {
                // id greater than 6 would be considered as dyanamic id, skip this kind of id in expression    
                var idAttValue = this.attributeValue(current.parentNode.getAttribute('id'));
                if (this.isValidId(idAttValue))
                    return this.preciseXPath("//" + this.xpathHtmlElement(current.parentNode.nodeName.toLowerCase()) +
                        "[@id=" + idAttValue + "]" +
                        path, e);
            }
        } else {
            return null;
        }
        current = current.parentNode;
    }
    return null;
});

LocatorBuilders.add('xpath:href', function (e) {
    if (e.attributes && e.hasAttribute("href")) {
        href = e.getAttribute("href");
        if (href.search(/^http?:\/\//) >= 0) {
            return this.preciseXPath("//" + this.xpathHtmlElement("a") + "[@href=" + this.attributeValue(href) + "]", e);
        } else {
            // use contains(), because in IE getAttribute("href") will return absolute path
            return this.preciseXPath("//" + this.xpathHtmlElement("a") + "[contains(@href, " + this.attributeValue(href) + ")]", e);
        }
    }
    return null;
});

LocatorBuilders.add('dom:index', function (e) {
    if (e.form) {
        var formLocator = this.findDomFormLocator(e.form);
        if (formLocator) {
            var elements = e.form.elements;
            for (var i = 0; i < elements.length; i++) {
                if (elements[i] == e) {
                    return formLocator + ".elements[" + i + "]";
                }
            }
        }
    }
    return null;
});

LocatorBuilders.add('xpath:position', function (e, opt_contextNode) {
    //this.log.debug("positionXPath: e=" + e);
    var path = '';
    var current = e;
    while (current != null && current != opt_contextNode) {
        var currentPath;
        if (current.parentNode != null) {
            currentPath = this.relativeXPathFromParent(current);
        } else {
            currentPath = '/' + this.xpathHtmlElement(current.nodeName.toLowerCase());
        }
        path = currentPath + path;
        var locator = '/' + path;
        if (e == this.findElement(locator)) {
            return locator;
        }
        current = current.parentNode;
        //this.log.debug("positionXPath: current=" + current);
    }
    return null;
});

LocatorBuilders.add('css', function (e) {
    var current = e;
    var sub_path = this.getCSSSubPath(e);
    while (this.findElement("css=" + sub_path) != e && current.nodeName.toLowerCase() != 'html') {
        sub_path = this.getCSSSubPath(current.parentNode) + ' > ' + sub_path;
        current = current.parentNode;
    }
    return "css=" + sub_path;
});

LocatorBuilders.add('xpath:text', function (e) {
    var text = e.textContent;
    if (!text.match(/^\s*$/)) {
        return this.preciseXPath("//" + this.xpathHtmlElement(e.nodeName.toLowerCase()) + "[contains(text(),'" + text.replace(/^\s+/, '').replace(/\s+$/, '') + "')]", e);
    }
    return null;
});

LocatorBuilders.add('sgs:globalActionMenu', function (e) {

    var returnValue = null;
    if (!e.hasAttribute("class"))
        return returnValue;

    var className = e.getAttribute("class");
    if (!className)
        return returnValue;

    if (className == "item topbar-menu-dd-item") {
        var parentElement = this.getElementByXpath(e.parentNode, ".//li[@class='item item-back']//span[@class='item-text']");
        returnValue = parentElement.textContent;
        var childElement = this.getElementByXpath(e, ".//span[@class='item-text']");
        returnValue = returnValue + "|" + childElement.textContent;
    }

    if (className == "item-text") {
        var parentElement = this.getElementByXpath(e, "./ancestor::ul[@class='dropdown-menu-wrap']/li[@class='item item-back']//span[@class='item-text']");

        returnValue = parentElement.textContent + "|" + e.textContent;
    }

    // Get immediate child menu of GlobalActionsMenu
    if (returnValue) {
        var topMenuElement = this.getElementByXpath(document, "//li[@class='item topbar-menu-dd-item item-submenu js-selected']");
        if (topMenuElement)
        	if(!returnValue.includes(topMenuElement.textContent + "|"))
        		returnValue = topMenuElement.textContent + "|" + returnValue;
    }
    return returnValue;
});

// find element relative another element
LocatorBuilders.prototype.getElementByXpath = function (element, path) {
    return document.evaluate(path, element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

LocatorBuilders.prototype.isValidId = function (id) {
    if (id) {
        var res = id.match(/^[\w-\/'"]{30,}$|^itm-[\w]{6,}$/g);
        if (!res)
            return true;
    }
    return false;
}
LocatorBuilders.add('sgs:globalSearch', function (e) {

    if (!e.hasAttribute("class"))
        return null;

    var className = e.getAttribute("class");
    if (className == "uwa-autocomplete nv-autocomplete-input" || className == "uwa-autocomplete nv-autocomplete-input clear-visible") {
        var globalSearchElement = this.getElementByXpath(e, "./ancestor::div[@id='global_ctn_search']");
        if (globalSearchElement)
            return true;
    }

    return null;
});
LocatorBuilders.add('sgs:backButton', function (e) {
	var className = e.getAttribute("class");
    if (className == "previous") {
    	 return "back";
    }

    return null;
});
LocatorBuilders.add('sgs:clickRefreshButton', function (e) {
	var className = e.getAttribute("class");
	if (className == "refresh" && e.parentNode.getAttribute("title") == "Refresh") {
		return true;
    }
	return null;
});
LocatorBuilders.add('sgs:clickCategories', function (e) {
	var className = e.parentNode.getAttribute("class");
	if (className == "menu text-only") {
    	 var title = e.parentNode.getAttribute("title");
    	 return title;
    }
	
	return null;
});
LocatorBuilders.add('sgs:lifecycle', function (e) {
    var lcsAction = null;
    if(e.parentNode.getAttribute("id") == "AEFLifecyclePromote" && e.parentNode.getAttribute("title") == "Promote" ){
       lcsAction = "promote";
    } 
    else if(e.parentNode.getAttribute("id") == "AEFLifecycleDemote" && e.parentNode.getAttribute("title") == "Demote" ){
            lcsAction = "demote";
    }
    return lcsAction;
});
LocatorBuilders.add('sgs:openChooser', function (e) {
	if(e.parentNode.getAttribute("class") == "createInputField" && e.hasAttribute("onclick")){
		var childNode = e.parentNode.children;
		var value = childNode[0].getAttribute("fieldlabel");
		return value;
    }
	return null;
});
LocatorBuilders.add('sgs:selectDate', function (e) {
    var selectedDate = null;
    if(e.nodeName.toLowerCase()=="td" && e.hasAttribute("title") && e.hasAttribute("class") && e.getAttribute("class")=="day")
    {   
    	selectedDate = "//a[@id='formDateChooser']//img|"+e.getAttribute("title");
    }
    return selectedDate;
});
LocatorBuilders.add('sgs:forwardButton', function (e) {
	var className = e.getAttribute("class");
    if (className == "next") {
    	 return "forward";
    }    
    return null;
});
LocatorBuilders.add('sgs:clickhomemenu', function (e) {
	var returnValue = null;
    if (!e.parentNode.hasAttribute("class"))
        return returnValue;

    var className = e.parentNode.getAttribute("class");
    if (!className)
        return returnValue;

    if (className == "topbar-menu") {
        returnValue = e.getAttribute("class");
    }
   
    if(returnValue.includes("home")){
    	returnValue = "home";
    	return returnValue
    }else{
    	return null;
    }
});
LocatorBuilders.add('sgs:clickportalcommand', function (e) {
	var className = e.getAttribute("class");
    if (className == "text" && e.getAttribute("nowrap") == "nowrap") {
    	 return e.textContent;
    }
   
    return null;
});
LocatorBuilders.add('sgs:setcontent', function (e) {
	var value = e.nodeName;
	var className = e.parentNode.getAttribute("class");
	 if (className == "cke_editable cke_editable_themed cke_contents_ltr cke_show_borders" && value.toLowerCase() == "p") {
    	return  true;
    }

    return null;
});
LocatorBuilders.add('sgs:downloadfileusingicon', function (e) {
	
	if(e.nodeName.toLowerCase() == "img" && e.getAttribute("alt") == "Download a copy of the file but keep it unlocked" && e.hasAttribute("src")){
		var position = e.parentNode.parentNode.getAttribute("position");
		var rmbrow = e.parentNode.parentNode.getAttribute("rmbrow");
		var id = "id_"+position;
		return position+"|"+rmbrow+"|"+id;
	}

 return null;
});
LocatorBuilders.add('sgs:opencompassapp', function (e) {
    var className = e.getAttribute("class");
    var quadrantvalue = null;
    if(className.includes("compass")){
        if(className.includes("west")){
            quadrantvalue = "west";
        }else if(className.includes("north")){
            quadrantvalue = "north";
        }else if(className.includes("south")){
            quadrantvalue = "south";
        }else if(className.includes("east")){
            quadrantvalue = "east";
        }
    }
    
    return quadrantvalue;
});
LocatorBuilders.add('sgs:opencompassappname', function (e) {
    var className = e.getAttribute("class");
    var appname = null;
    if(className == "icon"){
        var childNode = e.parentNode.children;
        var value = childNode[1].getAttribute("class");
        if(value == "title"){
            appname = childNode[1].textContent;
        }
    }
    if(className.includes("widget-item")){
    	 var childNode = e.children;
         var value = childNode[1].getAttribute("class");
         if(value == "title"){
             appname = childNode[1].textContent;
         }
    }
    return appname;
});



//SELENIUM-512:
LocatorBuilders.add('sgs:globalToolsMenu', function (e) {

    var returnValue = null;
    if (!e.hasAttribute("class"))
        return returnValue;

    var className = e.getAttribute("class");

    if (!className)
        return returnValue;
    
    if (className == "item-text") {
    	if(this.getElementByXpath(e, "./ancestor::li[contains(@class,'topbar-menu-dd-item')]") || this.getElementByXpath(e, "./ancestor::li[contains(@class,'collabspace')]"))
    		returnValue = e.textContent;
    }
    
    if (className.includes("item object d-collabspace")){
    	returnValue = e.textContent;
    }

    if (className == "item-text") {
    	var parentElement = this.getElementByXpath(e, "./ancestor::ul[@class='dropdown-menu-wrap dropdown-multiselect']/li[@class='item item-back']//span[@class='item-text']");
    	if(parentElement)
    		if(!returnValue.includes(parentElement.textContent + "|"))
    			returnValue = parentElement.textContent + "|" + e.textContent;
    }
    
    if (className == "item item-template") {
    	if(this.getElementByXpath(e, "./ancestor::li[contains(@class,'topbar-menu-dd-item')]")){
    		var childElement = this.getElementByXpath(e, ".//span[@class='item-text']");
    		if(this.getElementByXpath(e.parentNode.parentNode, ".//li[@class='item item-back']//span[@class='item-text']")){
    			var parentElement = this.getElementByXpath(e.parentNode.parentNode, ".//li[@class='item item-back']//span[@class='item-text']");
    			returnValue = parentElement.textContent + "|" + childElement.textContent;
    		}else
    			returnValue = childElement.textContent;
    	}
    }
    
    if (className == "item topbar-menu-dd-item") {
        var childElement = this.getElementByXpath(e, ".//span[@class='item-text']");
        returnValue = childElement.textContent;
    }
    
    if (className == "item topbar-menu-dd-item selectable selected") {
        var parentElement = this.getElementByXpath(e.parentNode, ".//li[@class='item item-back']//span[@class='item-text']");
        var childElement = this.getElementByXpath(e, ".//span[@class='item-text']");
        returnValue = parentElement.textContent + "|" + childElement.textContent;
    }
    
    if (className == "item topbar-menu-dd-item selectable") {
    	var parentElement = this.getElementByXpath(e.parentNode, ".//li[@class='item item-back']//span[@class='item-text']");
        var childElement = this.getElementByXpath(e, ".//span[@class='item-text']");
        returnValue = parentElement.textContent + "|" + childElement.textContent;
    }

    if(returnValue){
    	if(this.getElementByXpath(e, "./ancestor::div[@class='topbar-menu-dd responsive-dropdown-menu profile']")){
    		var topMenuElement = this.getElementByXpath(e, "./ancestor::div[@class='topbar-menu-dd responsive-dropdown-menu profile']");
        	if (topMenuElement)
            	if(!returnValue.includes("Profile" + "|"))
            		returnValue = "Profile" + "|" + returnValue;
    	}else if(this.getElementByXpath(e, "./ancestor::div[@class='topbar-menu-dd responsive-dropdown-menu help topbar-end-edge']")){
    		var topMenuElement = this.getElementByXpath(e, "./ancestor::div[@class='topbar-menu-dd responsive-dropdown-menu help topbar-end-edge']");
        	if (topMenuElement)
        		if(!returnValue.includes("Help" + "|"))
            		returnValue = "Help" + "|" + returnValue;
    	}else if(this.getElementByXpath(document,"//div[@class='topbar-user topbar-user-right-menu active']")){
    		returnValue = "User" + "|" + returnValue;
    	}
    }
    
    if (className.includes("topbar-menu-item")) {       
    	if(className.includes("share")){ 
        	returnValue = "share";
        }
    }
    
    return returnValue;
});

//SELENIUM-299:
LocatorBuilders.add('sgs:OpenActionToolbarMenu', function (e) {

	var topMenuElement=this.getElementByXpath(e, "./ancestor::div[@class='menu-content']");
	if (topMenuElement){
    	var activeElement = this.getElementByXpath(document,"//td[@class='icon-button menu-button menu-button-active']");
    	if(activeElement){
    		var titleActiveElement = activeElement.getAttribute("title");
    		if(titleActiveElement == "Actions"){
    			var title = e.textContent;
        		return title;
    		}
    	}
    }
	
	return null;
});

//SELENIUM-298:
LocatorBuilders.add('sgs:globalMyDeskMenu', function (e) {

	var returnValue = null;
	var topParentElement=this.getElementByXpath(e, "./ancestor::div[@id='mydeskpanel']");
	if (topParentElement){
		var tmpElem;
		if(e.tagName.toLowerCase() =="a")
			tmpElem = e;
		else if(e.tagName.toLowerCase() =="label")
			tmpElem = e.parentNode;
		if(this.getElementByXpath(tmpElem,"./following-sibling::ul"))
			return null;
		else if(this.getElementByXpath(tmpElem.parentNode,"./following-sibling::div[@class='group-body']/ul"))
			return null;
		else
			returnValue = e.textContent;
		
		if(this.getElementByXpath(e,"./ancestor::li[@class='menu expanded']/a")){
			var tempElement1;
			if(e.tagName.toLowerCase() =="a")
				tempElement1 = e.parentNode.parentNode.parentNode;
			else if(e.tagName.toLowerCase() =="label")
				tempElement1 = e.parentNode.parentNode.parentNode.parentNode;
			
			if(this.getElementByXpath(tempElement1,"./a")){
				var parentElement1 = this.getElementByXpath(tempElement1,"./a");
				if(!parentElement1.isSameNode(e.parentNode))
					returnValue = parentElement1.textContent + "|" + returnValue;
				
				var tempElement2 = parentElement1.parentNode.parentNode.parentNode;
				if(this.getElementByXpath(tempElement2,"./a")){
					var parentElement2 = this.getElementByXpath(tempElement2,"./a");
					if(!( parentElement2.isSameNode(e.parentNode) || parentElement2.isSameNode(parentElement1)))
						returnValue = parentElement2.textContent + "|" + returnValue;
				}
			}
		}
		
		var tempElement;
		if(e.tagName.toLowerCase() =="a")
			tempElement = e;
		else if(e.tagName.toLowerCase() =="label")
			tempElement = e.parentNode;
		if(this.getElementByXpath(tempElement,"./ancestor::div[@class='group expanded']/div[@class='group-head']/a")){
			var parentElement = this.getElementByXpath(tempElement,"./ancestor::div[@class='group expanded']/div[@class='group-head']/a");
			if(!parentElement.isSameNode(tempElement)){
				returnValue =  parentElement.textContent + "|" + returnValue;
			}
		}
	}

	return returnValue;
});
