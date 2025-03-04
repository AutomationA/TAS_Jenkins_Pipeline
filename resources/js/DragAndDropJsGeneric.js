function createEvent(typeOfEvent) {
    var event = document.createEvent("CustomEvent");
    var object;
    event.initCustomEvent(typeOfEvent, true, true, null);
    event.dataTransfer = {
        data: {},
        setData: function (key, value) {
       		this.data[key] = value;
       		this.event = event.target;
        },
        getData: function (key) {
        	if(this.data[key] !== undefined){
        		return this.data[key];
        	} else {
        		return this.event.outerHTML;
        	}
        }
    };
    return event;
}
function dispatchEvent(element, event, transferData) {
    if (transferData !== undefined) {
        event.dataTransfer = transferData;
    }
    if (element.dispatchEvent) {
        element.dispatchEvent(event);
    } else if (element.fireEvent) {
    	element.fireEvent("on" + event.type, event);
    }
}

function simulateHTML5DragAndDrop(element, target) {
    var dragStartEvent = createEvent('dragstart');
    dispatchEvent(element, dragStartEvent);
    var dropEvent = createEvent('drop');
    dispatchEvent(target, dropEvent, dragStartEvent.dataTransfer);
    var dragEndEvent = createEvent('dragend');    
    dispatchEvent(element, dragEndEvent, dropEvent.dataTransfer);
}