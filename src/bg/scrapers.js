
function bibtexParser(url, pageUrl, options={}){
	getUrl(pageUrl, function(req){
		bibtexParserString(url, req.responseText, options);
	});
}

function bibtexParserString(url, bibtexString, options={}){
	if (options == null)
		options = {};
	
	if (options['titleName'] == null)
		options['titleName'] = 'title';
	if (options['authorsName'] == null)
		options['authorsName'] = 'author';
	if (options['yearName'] == null)
		options['yearName'] = 'year';
	
	if (options['callback'] == null)
		options['callback'] = AddBookmarks;
	
	var data = parseBibFile(bibtexString);
	var key = Object.keys(data.entries$)[0];
	var entry = data.entries$[key];
	
	var title = entry.getFieldAsString('Title');
	var authorField = entry.getField("author");

	var authors = [];
	authorField.authors$.map((author, i) => 
		authors.push(author.firstNames + ' ' + author.lastNames)
	);
	
	var year = entry.getFieldAsString('Year');
	options['callback'](url, title, authors, year);
}


function metaParser(url, pageUrl, options={}){
	if (options == null)
		options = {};
	
	if (options['titleName'] == null)
		options['titleName'] = 'citation_title';
	if (options['authorsName'] == null)
		options['authorsName'] = 'citation_author';
	if (options['yearName'] == null)
		options['yearName'] = 'citation_date';
	
	if (options['callback'] == null)
		options['callback'] = AddBookmarks;
	
	getDom(pageUrl, function(dom){
		var title = getElementByName(dom, 'meta', options['titleName'])[0].content;
		var authorsHtml = getElementByName(dom, 'meta', options['authorsName']);
		var authors = [];
		for (var i = 0; i < authorsHtml.length; i++){
			if (!authors.includes(authorsHtml[i]))
				authors.push(authorsHtml[i].content);
		}
		
		var year = getElementByName(dom, 'meta', options['yearName'])[0].content.substr(0,4);
		
		options['callback'](url, title, authors, year);
	});
}

function metaParserSingleAuthor(url, pageUrl, delimiter, options){
	if (options == null)
		options = {};
	var theirCallback = options['callback'];
	if (theirCallback == null)
		theirCallback = AddBookmarks;
	
	options['callback'] = function(url, title, authors, year){
		var authors = authors.split(delimiter);
		callback(url, title, authors, year);
	}
	
	metaParser(url, pageUrl, options);
}

function ePrintScraper(tab, url){
	if (!url.endsWith('.pdf'))
		return;
	
	var pageUrl = url.substr(0, url.length-4);
	getDom(pageUrl, function(dom){
		var title = cleanSpaces(dom.getElementsByTagName('b')[0].innerText);
		var authorsStr = cleanSpaces(dom.getElementsByTagName('i')[0].innerText);
		var authors = authorsStr.split(" and ");
		var year = url.split('/')[3];
		
		AddBookmarks(url, title, authors, year);
	});
}

function arxivScraper(tab, url){
	if (!url.endsWith('.pdf'))
		return;
	
	var pageUrl = url.replace('/pdf/','/abs/');
	metaParser(url, pageUrl);
}

function ecccScraper(tab, url){
	if (url.indexOf('/report/') == -1)
		return;
	
	getDom(url, function(dom){
		var title = dom.getElementsByTagName('h4')[0].innerText;
		var authorsHtml = getElementWithHref(dom, '/author/');
		var authors = [];
		for (var i = 0; i < authorsHtml.length; i++){
			var name = authorsHtml[i].text;
			if (!authors.includes(name))
				authors.push(name);
		}
		
		var year = dom.getElementsByTagName('u')[0].innerText.split('|')[1].split(' ')[3];
		
		AddBookmarks(url, title, authors, year);
	});
}

function siamScraper(tab, url){
	if (url.indexOf('/pdf/') == -1)
		return;
	
	var pageUrl = url.replace('/pdf/', '/abs/');
	metaParser(url, pageUrl, {
		'titleName': 'dc.Title',
		'authorsName': 'dc.Creator',
		'yearName': 'dc.Date'});
}

function msrScraper(tab, url){
	if (!url.endsWith('.pdf'))
		return;
	var id = getPartFromEnd(url, '/', 1);
	var pageUrl = 'http://research.microsoft.com/apps/pubs/default.aspx?id=' + id;
	getDom(url, pageUrl, function(dom){
		var div = getElementByTagAndId(dom, 'div', 'pubDeTop');
		var title = div.children[0].innerText;
		var parts = div.children[1].innerText.split('\n');
		var authors = parts[0].replace(', and ',', ').replace(' and ',', ').split(', ');
		var year = getLastPart(parts[1], ' ');
		
		AddBookmarks(url, title, authors, year);
	});
}

function citeseerxScraper(tab, url){
	if (!url.endsWith('type=pdf'))
		return;
	var i = url.indexOf('doi=') + 4;
	var j = url.indexOf('&', i);
	var id = url.substr(i,j-i);
	var pageUrl = 'http://citeseerx.ist.psu.edu/viewdoc/summary?doi=' + id;
	
	metaParserSingleAuthor(url, pageUrl, {'yearName': 'citation_year'});
}

function sciencedirectScraper(tab, url){
	if (url.indexOf('main.pdf') == -1)
		return;
	//console.log('science');
	var id = url.split('/')[3];
	var pageUrl = 'http://www.sciencedirect.com/sdfe/export/[ID]/format?export-format=BIBTEX&export-content=cite';
	pageUrl = pageUrl.replace('[ID]', id);
	bibtexParser(url, pageUrl);
}

function springerScraper(tab, url){
	if (url.indexOf('.pdf') == -1)
		return;
	url = decodeURIComponent(url);
	var index = url.indexOf('.pdf');
	var index2 = url.indexOf('10.');
	var id = url.substr(index2, index-index2);
	var pageUrl = 'http://citation-needed.services.springer.com/v2/references/[ID]?format=bibtex&flavour=citation';
	pageUrl = pageUrl.replace('[ID]', id);
	bibtexParser(url, pageUrl);
}

function acmScraper(tab, url){
	if (url.indexOf('.pdf') == -1)
		return;
	
	var id = url.split('/')[5];
	var pageUrl = 'http://dl.acm.org/exportformats.cfm?id=[ID]&expformat=bibtex';
	pageUrl = pageUrl.replace('[ID]', id);
	bibtexParser(url, pageUrl);
}

function mlrScraper(tab, url){
	if (url.indexOf('.pdf') == -1)
		return;
	
	var pageUrl = url.replace('.pdf', '.html');
	getUrl(pageUrl, function(req){
		var parser = new DOMParser ();
		var responseDoc = parser.parseFromString (req.responseText, "text/html");
		var bibtexString = responseDoc.getElementById('bibtex').innerHTML;
		console.log(bibtexString);
		bibtexParserString(url, bibtexString);
	});
}

function apsScraper(tab, url){
	if (url.indexOf('/pdf/') == -1)
		return;
	//console.log('science');
	var pageUrl =  url.replace('/pdf/', '/export/');
	bibtexParser(url, pageUrl);
}


//////////////////////////////////////////////////////

function getUrl(url, callback){
	var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200) {
				callback(req);
            }
          }
        };
	req.send();
}

function getDom(pageUrl, callback){
	getUrl(pageUrl, function(req){
		var dom = document.createElement( 'html' );
		dom.innerHTML = req.responseText;
		callback(dom);
	});
}



function cleanSpaces(text){
	return text.replace(/ +(?= )/g,'');
}

function getInitials(authors){
	if (authors.length == 1){
		var lastName = getLastPart(authors[0], ' ');
		if (lastName.length >= 3)
			return lastName.substring(0,3);
		else
			return lastName;
	}
	
	var str = '';
	for (i = 0; i < authors.length; i++){
		var parts = authors[i].split(' ');
		var last = parts[parts.length-1];
		var letter = last.substring(0,1);
		str += letter;
	}
	return str;
}

function getLastPart(str, del){
	var parts = str.split(del);
	return parts[parts.length-1];
}

function getPartFromEnd(str, del, num){
	var parts = str.split(del);
	return parts[parts.length-1-num];
}

function getElementByName(dom, tag, name){
	var els = dom.getElementsByTagName(tag);
	var res = [];
	for (var i = 0; i < els.length; i++){
		if (els[i].name == name){
			res.push(els[i]);
		}
	}
	return res;
}

function getElementWithHref(dom, name){
	var els = dom.getElementsByTagName('a');
	var res = [];
	for (var i = 0; i < els.length; i++){
		if (els[i].href.indexOf(name) != -1){
			
			res.push(els[i]);
		}
	}
	return res;
}

function getElementByTagAndId(dom, tag, id){
	var els = dom.getElementsByTagName(tag);
	
	for (var i = 0; i < els.length; i++){
		if (els[i].id == id){
			return els[i];
		}
	}
	return null;
}