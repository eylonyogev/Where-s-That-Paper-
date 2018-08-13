// created by Eylon Yogev.

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete'){
		try
		{
			console.log(changeInfo.status);
			HandleTab(tab);
		}
		catch(err){
			console.log(err);
		}
	}
});

var handlers = {};
init();


function init(){
	handlers['eprint.iacr.org'] = ePrintScraper;
	handlers['arxiv.org'] = arxivScraper;
	handlers["eccc.weizmann.ac.il"] = ecccScraper;
	handlers['epubs.siam.org'] = siamScraper;
	handlers['research.microsoft.com'] = msrScraper;
	handlers['citeseerx.ist.psu.edu'] = citeseerxScraper;
	handlers['ac.els-cdn.com'] = sciencedirectScraper;
	handlers['www.sciencedirect.com'] = sciencedirectScraper;
	handlers['download.springer.com'] = springerScraper;
	handlers['link.springer.com'] = springerScraper;
	handlers['delivery.acm.org'] = acmScraper;
	handlers['proceedings.mlr.press'] = mlrScraper;
}


function HandleTab(tab){
	var url = tab.url;
	chrome.bookmarks.search(url, function(results) {
		if (results.length == 0){
			try{
				var host = getHost(url);
				if (handlers[host] != null){
					handlers[host](tab, url);
				}
			}
			catch(err){
				console.log(err);
			}
		}
		else{
			var t = tab;
		}
	});
}

function getHost(url){
	var parser = document.createElement('a');
	parser.href = url;
	return parser.host;
}

function AddBookmarks(url, title, authors, year){
	var ref = '[' + getInitials(authors) + year.substr(2, 2) + ']';
	var fullTitle = ref + ' - ' + title + " - " + authors.join(' and ');
	
	getYearFolderId(year, function(id){
		AddBookmark(url, fullTitle, id);
	});
}


function getYearFolderId(year, callback){
	getPapersFolderId(function(id){
		chrome.bookmarks.getChildren(id, function(children){
			var found = false;
			children.forEach(element => {
				if (element.title == year){
					callback(element.id);
					found = true;
					return;
				}
			});
			if (!found){
				chrome.bookmarks.create({
					'parentId': id,
					'title': year},
					function(newfolder){
						callback(newfolder.id);
					});
			}
		});
	});
}

function getPapersFolderId(callback){
	console.log('new');
	chrome.bookmarks.search("Papers", function(results) {
		var found = false;
		for (var i = 0; i < results.length; i++){
			if (results[i].title == "Papers"){
				found = true;
				var id = results[0].id;
				callback(id);
			}
		}
		if (!found){
			chrome.bookmarks.create({
				'parentId': '1',
				'title': 'Papers'},
				function(newfolder){
					console.log(newfolder);
					callback(newfolder.id);
			});
		}
	});
}


function AddBookmark(url, title, folderId){
	chrome.bookmarks.getChildren(folderId, function(children) {
		var found = false;
		children.forEach(function(bookmark) { 
			if (bookmark.url == url)
				found = true;
		});
		if (!found){
			chrome.bookmarks.create({
				'parentId': folderId,
				'title': title,
				'url': url,
				'index': 0}
			);
		}
	});
}