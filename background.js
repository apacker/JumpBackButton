//
// JumpBack Button
// Brian Slakter and Andrew Packer
// August 21, 2014
//

//get number of pages to jump back
function getJumpCount(history) {

 	var jumpCount = 0;
 
 	//get unique root of current URL (URL previous to final '/')
 	var curUrl = history[history.length-1];
 	
 	//if URL ends in '/', remove it
 	if (curUrl.lastIndexOf("/") == curUrl.length-1) {
 		curUrl = curUrl.substring(0, curUrl.length-1);
 	}
 	
 	//remove text after last '/'
 	curUrl = curUrl.substring(0, curUrl.lastIndexOf("/"));
 	
 	//curUrl has now been modified to the root we are concerned with
 	var curRoot = curUrl;
 	
	//search history until another unique root is found
   	for (i = history.length-2; i > 0; i--) {

   		//extract root from nextUrl as we did for curUrl
     	var nextUrl = history[i];

     	if (nextUrl.lastIndexOf("/") == nextUrl.length-1) {
 			nextUrl = nextUrl.substring(0, nextUrl.length-1);
 		}

 		nextUrl = nextUrl.substring(0, nextUrl.lastIndexOf("/"));

 		var nextRoot = nextUrl;

 		//if root is different from that of current page, 
 		//this is where we jump back to
 		if (nextRoot != curRoot) {
 			jumpCount = history.length-i-1;
 			break;
 		}	

 	}

 	return jumpCount;
}

//called when the user clicks the JumpBack Button
chrome.browserAction.onClicked.addListener(function(tab) {

	//access chrome local storage
	chrome.storage.local.get(tab.index.toString(), function(items) {

  		//get history from chrome storage
  		var curTabHistory = items[tab.index.toString()];
	    var jumpCount = getJumpCount(curTabHistory);
	    
	    if (jumpCount > 0) {
	    	//jump back
	    	chrome.tabs.update(tab.id, 
	    		{ 'url': 'javascript:history.go(-' + jumpCount + ')' });

	    	//remove history of pages skipped over from local storage
	    	for (i = 0; i <= jumpCount; i++) {
	      		curTabHistory.pop();
	    	}

	    }

	    //update history in chrome storage
		chrome.storage.local.set(items);
		
  	});
  
});


//called when tab is created
chrome.tabs.onCreated.addListener(function(tab) {

	//Create object to hold history in array
	var newTab = {};

	//use tab index as key
  	newTab[tab.index] = [];
  
  	//store page in history
  	if (tab.url) {
    	newTab[tab.index].push(tab.url);
  	}
  	
	//update history in chrome storage
  	chrome.storage.local.set(newTab);
    
});

//called when tab updated with new web page
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  
  	//if change info status is loading and url is defined
  	if (changeInfo.url != undefined && changeInfo.status == "loading") {
	  	    
		//access chrome local storage
	    chrome.storage.local.get(tab.index.toString(), function(items) {

  			//add web page to history, and updated history in chrome storage
	      	curTabHistory = items[tab.index.toString()];
	      	curTabHistory.push(changeInfo.url);
	      	chrome.storage.local.set(items);
	    
	    });
	    
  	}
  
});

//update history for tabs once a tab is moved
chrome.tabs.onMoved.addListener(function(tabId, moveInfo) {
	
	var replacedData = null;
	var movedData = null;
	var tempData = null;

	//access storage and history relevant to tab that is moved
	chrome.storage.local.get(moveInfo.fromIndex.toString(), function(items) {
		movedData = items[moveInfo.fromIndex.toString()];
	});

	//access storage and history relevant to tab in location where moved 
	//tab will be placed, update in chrome storage
	chrome.storage.local.get(moveInfo.toIndex.toString(), function(items) {
		replacedData = items[moveInfo.toIndex.toString()];
		items[moveInfo.toIndex.toString()] = movedData;
      	chrome.storage.local.set(items);
	});

	var curIndex = moveInfo.toIndex;

	//tab moved left - update storage of tabs to right of new tab location
	if (moveInfo.fromIndex > moveInfo.toIndex) {

		curIndex++;

		//update storage based on cascading effects from moving tab
		while (curIndex <= moveInfo.fromIndex) {

			chrome.storage.local.get(curIndex.toString(), function(items) {
				tempData = items[moveInfo.toIndex.toString()];
				items[moveInfo.toIndex.toString()] = replacedData;
				replacedData = tempData;
		      	chrome.storage.local.set(items);
			});
			
			curIndex++;

		}

	}

	//tab moved right - update storage of tabs to left of new tab location
	else if (moveInfo.fromIndex < moveInfo.toIndex) {

		curIndex--;

		//update storage based on cascading effects from moving tab
		while (curIndex >= moveInfo.fromIndex) {

			chrome.storage.local.get(curIndex.toString(), function(items) {
				tempData = items[moveInfo.toIndex.toString()];
				items[moveInfo.toIndex.toString()] = replacedData;
				replacedData = tempData;
		      	chrome.storage.local.set(items);
			});

			curIndex--;
		
		}

	}

});
