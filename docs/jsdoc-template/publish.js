LOG.verbose = true;

/** Called automatically by JsDoc Toolkit. */
function publish(symbolSet) {
	publish.conf = {  // trailing slash expected for dirs
		ext:         ".html",
		outDir:      JSDOC.opt.d || SYS.pwd+"../out/jsdoc/",
		templatesDir: JSDOC.opt.t || SYS.pwd+"../templates/jsdoc/",
		symbolsDir:  "symbols/",
		srcDir:      "symbols/src/"
	};
	
	// is source output is suppressed, just display the links to the source file
	if (JSDOC.opt.s && defined(Link) && Link.prototype._makeSrcLink) {
		Link.prototype._makeSrcLink = function(srcFilePath) {
			return "&lt;"+srcFilePath+"&gt;";
		}
	}
	
	publish.RaptorJSVersion = extractRaptorJSVersion();
	
	// create the folders and subfolders to hold the output
	IO.mkPath((publish.conf.outDir+"symbols/src").split("/"));
	
	copyDir(publish.conf.templatesDir+"static", publish.conf.outDir + "static/");
	//copyDir(publish.conf.templatesDir+"static", publish.conf.outDir+"symbols/");
	
	
	
	// used to allow Link to check the details of things being linked to
	Link.symbolSet = symbolSet;
	
//	for (var i=0; i<symbolSet._index._keys.length; i++) {
//	    LOG.inform('Symbol: ' + symbolSet._index._keys[i]);
//	}

	    
	// create the required templates
	try {
		var classTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"class.tmpl");
		var classesTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"allclasses.tmpl");
		var headIncludesTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"headIncludes.tmpl");
		var headerTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"header.tmpl");
		var autocompleteSymbolsJSTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"autocompleteSymbols.js.tmpl");
		publish.classesTreeTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"allclassesTree.tmpl");
		publish.modifiersTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"modifiers.tmpl");
		publish.methodTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"method.tmpl");
		publish.manifestTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"manifest.tmpl");
		publish.manifestIncludeTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"manifestInclude.tmpl");
	}
	catch(e) {
		print("Couldn't create the required templates: "+e);
		quit();
	}
	
	
	
	// some ustility filters
	function hasNoParent($) {return ($.memberOf == "")}
	function isaFile($) {return ($.is("FILE"))}
	function isaClass($) {return ($.is("CONSTRUCTOR") || $.isNamespace || $.isExtension || $.isMixin || $.isObject)}
	
	// get an array version of the symbolset, useful for filtering
	var symbols = symbolSet.toArray().concat([]).filter(function(symbol) {	    
	    if (symbol.alias == "_global_") return false;
	    return true;
	});
	
	
	var len = symbols.length;
//	LOG.inform('----');
//	for (var i=0; i<symbols.length; i++) {
//	    LOG.inform('Symbol: ' + symbols[i].alias);
//	}
	
	var classes = symbols.filter(isaClass).sort(publish.sortByDisplayName);
	var allClasses = processAllClasses(classes);

	allClasses = allClasses.filter(function(symbol) {
	    return symbol.ignore ? false : true;
	});
	
	LOG.inform('----');
	
	for (var i=0; i<symbols.length; i++) {
        var symbol = symbols[i];
        
        symbol.autocompleteText = publish.getAutocompleteText(symbol);
        symbol.linkText = symbol.autocompleteText; 
    }
	
	LOG.inform('----');
    
	
	var autocompleteSymbolsJS = autocompleteSymbolsJSTemplate.process(
        symbols.filter(function(symbol) {
            if (symbol.ignore) return false;
    	    if (!symbol.comment || !symbol.comment.isUserComment) return false;
    	    return true;
    	}).sort(function(a, b) {
    	    a = a.autocompleteText;
    	    b = b.autocompleteText;
    	    a = a.toLowerCase();
    	    b = b.toLowerCase();
    	    
    	    return a < b ? -1 : (a > b ? 1 : 0);
    	}));
	
	// create the hilited source code files
	var files = JSDOC.opt.srcFiles;
 	for (var i = 0, l = files.length; i < l; i++) {
 		var file = files[i];
 		var srcDir = publish.conf.outDir + "symbols/src/";
		makeSrcFile(file, srcDir);
 	}
 	
 	// get a list of all the classes in the symbolset
 	
	
	// create a filemap in which outfiles must be to be named uniquely, ignoring case
	if (JSDOC.opt.u) {
		var filemapCounts = {};
		Link.filemap = {};
		for (var i = 0, l = classes.length; i < l; i++) {
			var lcAlias = classes[i].alias.toLowerCase();
			
			if (!filemapCounts[lcAlias]) filemapCounts[lcAlias] = 1;
			else filemapCounts[lcAlias]++;
			
			Link.filemap[classes[i].alias] = 
				(filemapCounts[lcAlias] > 1)?
				lcAlias+"_"+filemapCounts[lcAlias] : lcAlias;
		}
	}
	
	for (var i=0; i<classes.length; i++) {
        LOG.inform('Class: ' + classes[i].alias + (classes[i].parentAlias ? " (parent=" + classes[i].parentAlias + ")" : ""));
    }
	
    IO.saveFile(publish.conf.outDir, "autocompleteSymbols.js", autocompleteSymbolsJS);
	
	// create a class index, displayed in the left-hand column of every class page
	Link.base = "../";
 	publish.classesIndex = classesTemplate.process(allClasses); // kept in memory
 	publish.headIncludes = headIncludesTemplate.process();  ; // kept in memory
 	publish.header = headerTemplate.process();  ; // kept in memory
	
 	
	// create each of the class pages
	for (var i = 0, l = classes.length; i < l; i++) {
		var symbol = classes[i];
		
		symbol.events = symbol.getEvents();   // 1 order matters
		symbol.methods = symbol.getMethods(); // 2
		
		Link.currentSymbol= symbol;
		var output = "";
		output = classTemplate.process(symbol);
		var dirname = publish.conf.outDir+"symbols/";
		var filename = ((JSDOC.opt.u)? Link.filemap[symbol.alias] : symbol.alias) + publish.conf.ext;
		LOG.inform('Generating file: ' + dirname + filename);
		IO.saveFile(dirname, filename, output);
	}
	
	// regenerate the index with different relative links, used in the index pages
	Link.base = "";
	publish.classesIndex = classesTemplate.process(allClasses);
	publish.headIncludes = headIncludesTemplate.process();  ; // kept in memory
	publish.header = headerTemplate.process();  ; // kept in memory
	
	// create the class index page
	try {
		var classesindexTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"index.tmpl");
	}
	catch(e) { print(e.message); quit(); }
	
	var classesIndex = classesindexTemplate.process(allClasses);
	IO.saveFile(publish.conf.outDir, "index"+publish.conf.ext, classesIndex);
	classesindexTemplate = classesIndex = classes = null;
	
	// create the file index page
	try {
		var fileindexTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"allfiles.tmpl");
	}
	catch(e) { print(e.message); quit(); }
	
	var documentedFiles = symbols.filter(isaFile); // files that have file-level docs
	var allFiles = []; // not all files have file-level docs, but we need to list every one
	
	for (var i = 0; i < files.length; i++) {
		allFiles.push(new JSDOC.Symbol(files[i], [], "FILE", new JSDOC.DocComment("/** */")));
	}
	
	for (var i = 0; i < documentedFiles.length; i++) {
		var offset = files.indexOf(documentedFiles[i].alias);
		allFiles[offset] = documentedFiles[i];
	}
		
	allFiles = allFiles.sort(makeSortby("name"));

	// output the file index page
	var filesIndex = fileindexTemplate.process(allFiles);
	IO.saveFile(publish.conf.outDir, "files"+publish.conf.ext, filesIndex);
	fileindexTemplate = filesIndex = files = null;
	
	LOG.inform('API documentation written to "' + publish.conf.outDir + '"');
}

publish.sortByDisplayName = function(a, b) {
    a = a.displayName || a.alias;
    b = b.displayName || b.alias;
    a = a.toLowerCase();
    b = b.toLowerCase();
    
    return a < b ? -1 : (a > b ? 1 : 0);
};

publish.sortByName = function(a, b) {
    a = a.name || a.alias;
    b = b.name || b.alias;
    a = a.toLowerCase();
    b = b.toLowerCase();
    
    return a < b ? -1 : (a > b ? 1 : 0);
};

function classesTree(symbols) {
    return publish.classesTreeTemplate.process(symbols);
}

/** Just the first sentence (up to a full stop). Should not break on dotted variable names. */
function summarize(desc) {
    if (!desc) return desc;
    
    var summary = desc;
    var remaining = null;
//    if (desc.indexOf("SUMMARIZE_TEST") != -1) {
//        LOG.inform("\n\n" + JSON.stringify(desc));
//    }
    var parts = desc.match(/^\s*((?:\n|\r|.)*?)(\.[ ]*?[\n\r]|[ ]*?[\n\r][\n\r]|$)/i); //Summary is ended by a perioed+newline or a newline followed by one or more spaces
    if (parts) {
        if (parts[2] && parts[2].charAt(0) == '.') {
            summary = parts[1] + '.'; //Keep the period in the summary
        }
        else {
            summary = parts[1];
        }
        
        remaining = desc.substring(summary.length);
//        if (desc.indexOf("SUMMARIZE_TEST") != -1) {
//            LOG.inform(JSON.stringify(desc));
//            LOG.inform("summary:\n" + summary);
//            LOG.inform("\n\nremaining: " + remaining);
//            throw new Error();
//        }
        
    }
    
    return {
        summary: summary,
        remaining: remaining
    };
}

/** Make a symbol sorter by some attribute. */
function makeSortby(attribute) {
	return function(a, b) {
		if (a[attribute] != undefined && b[attribute] != undefined) {
			a = a[attribute].toLowerCase();
			b = b[attribute].toLowerCase();
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		}
	}
}

/** Pull in the contents of an external file at the given path. */
function include(path) {
	var path = publish.conf.templatesDir+path;
	return IO.readFile(path);
}

/** Turn a raw source file into a code-hilited page in the docs. */
function makeSrcFile(path, srcDir, name) {
	if (JSDOC.opt.s) return;
	
	if (!name) {
		name = path.replace(/\.\.?[\\\/]/g, "").replace(/[\\\/]/g, "_");
		name = name.replace(/\:/g, "_");
	}
	
	var src = {path: path, name:name, charset: IO.encoding, hilited: ""};
	
	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onPublishSrc", src);
	}

	if (src.hilited) {
		IO.saveFile(srcDir, name+publish.conf.ext, src.hilited);
	}
}

/** Build output for displaying function parameters. */
function makeSignature(params) {
	if (!params) return "()";
	var signature = "("
	+
	params.filter(
		function($) {
			return $.name.indexOf(".") == -1; // don't show config params in signature
		}
	).map(
		function($) {
			return $.name;
		}
	).join(", ")
	+
	")";
	return signature;
}

function resolveLink(symbolName, currentSymbol) {
    var targetSymbol = Link.getSymbol(symbolName);
    var targetAlias;
    
    if (currentSymbol) {
        if (!targetSymbol) {
            var symbolMatch = symbolName.match(/(^[#-.])(.*)/); 
            if (symbolMatch) {
                //This links is referring to a symbol in the current class... prepend the current class name
                if (currentSymbol) {
                    targetAlias = currentSymbol.alias + symbolName;
                    
                    
                    if (!targetSymbol) {
                        //Maybe they meant prototype property instead of reguar property (or vice-versa)?
                        if (symbolMatch[1] == '#') {
                            targetAlias = currentSymbol.alias + '.' + symbolMatch[2];
                        }
                        else if (symbolMatch[1] == '.') {
                            targetAlias = currentSymbol.alias + '#' + symbolMatch[2];
                        }
                    }
                    targetSymbol = Link.getSymbol(targetAlias);
                    
                    
                }
            }
            else {
                //Maybe they just gave us a method name?
                targetSymbol = Link.getSymbol(currentSymbol.alias + '#' + symbolName);
                if (!targetSymbol) {
                    targetSymbol = Link.getSymbol(currentSymbol.alias + '.' + symbolName);
                }
            }
        }
    }
//    
//    if (targetSymbol) {
//        LOG.warn('@link: ' + symbolName + ' -> ' + new Link().toSymbol(targetSymbol.alias).toString());
//    }
//    
    return targetSymbol ? new Link().toSymbol(targetSymbol.alias).toString() : null;
}

/** Find symbol {@link ...} strings in text and turn into html links */
function resolveLinks(str, currentSymbol) {
    if (!str) return str;
    
	str = str.replace(/\{@link\s*([^}]+)\s*\}/gi,
		function(match, symbolName) {
	    
	        return resolveLink(symbolName, currentSymbol) || symbolName;
		}
	);
	
	return str;
}

function symbolType(symbol) {
    if (symbol.isa == "FUNCTION") {
        return "function";
    }
    
    if (symbol.isExtension) {
        return "extension";
    }
    else if (symbol.comment.getTag('mixin').length) {
        return "mixin";
    }
    else if (symbol.isNamespace) {
        return "module";
    }
    else if (symbol.isa == "CONSTRUCTOR") {
        return "class";
    }
    else if (symbol.isObject) {
        return "object";
    }
    else if (symbol.isProperty) {
        return "property";
    }
    else if (symbol.isa == "OBJECT") {
        return "var";
    }
    else {
        return "class";
    }
    
}

function symbolStyleClass(symbol) {
    if (symbol.isExtension) {
        return "extension";
    }
    else if (symbol.comment.getTag('mixin').length) {
        return "mixin";
    }
    else if (symbol.isNamespace) {
        return "module";
    }
    else {
        return "class";
    }
    
}

function copyDir(srcDir, targetDir) {
    var srcDirFile = new Packages.java.io.File(srcDir);
    var targetDirFile = new Packages.java.io.File(targetDir);
    targetDirFile.mkdir();
    
    var files = srcDirFile.listFiles();
    for (var i=0; i<files.length; i++) {
        var file = files[i];
        
        if ("" + file.getName().charAt(0) == ".") continue;
        if (file.isDirectory() == true) {
            var newTargetDirFile = new Packages.java.io.File(targetDir, file.getName());
            copyDir(file.getAbsolutePath(), newTargetDirFile.getAbsolutePath());
        }
        else {
            try
            {
            IO.copyFile(file.getAbsolutePath(), targetDir);
            }
            catch(e) {
                LOG.warn("Unable to copy file '"+file.getAbsolutePath() + "'. Exception: " + e);
            }
        }
        
    }
}

JSDOC.Symbol.prototype.addExtension = function(extSymbol) {
    if (!this.isNamespace) {
        throw new Error('Only namespaces can have extensions. Symbol: ' + this.alias);
    }
    
    if (!this.extensions) {
        this.extensions = [];
    }
    this.extensions.push(extSymbol);
    extSymbol.extendsSymbol = this; //Link back to the parent
    extSymbol.isExtension = true;
};


function extractRaptorJSVersion() {
    var pomXmlPath = SYS.pwd + "../../../pom.xml";
    var pomXmlSource = IO.readFile(pomXmlPath);
    
    var versionRegEx = /\<artifactId\>raptorjs\<\/artifactId\>\s*\<version\>([\.0-9a-zA-Z-]*)\s*\<\/version\>/g;
    var match = versionRegEx.exec(pomXmlSource);
    if (match) {
        var version = match[1];
        return version;
    }
    else {
        LOG.warn('RaptorJS version not found in ' + pomXmlPath);
        return "(unknown version)";
    }
    
}

Link.prototype.getSymbolHref = function() {
    var linkBase = Link.base+publish.conf.symbolsDir;
    var linkTo = Link.getSymbol(this.alias);
    if (!linkTo) {
        throw new Error('Target symbol not found for ' + this.alias);
    }
    if (linkTo.alias != this.alias) {
        throw new Error(linkTo.alias + " does not equal " + this.alias);
    }
    var linkPath;
    
    if (!linkTo.is("CONSTRUCTOR") && !linkTo.isNamespace) { // it's a method or property
        linkPath= (Link.filemap) ? Link.filemap[linkTo.memberOf] :
                  escape(linkTo.memberOf) || "_global_";
            linkPath += publish.conf.ext + "#" + Link.symbolNameToLinkName(linkTo);
    }
    else {
        linkPath = (Link.filemap)? Link.filemap[linkTo.alias] : escape(linkTo.alias);
        linkPath += publish.conf.ext;// + (this.classLink? "":"#" + Link.hashPrefix + "constructor");
    }
    linkPath = linkBase + linkPath;
    return linkPath;
};

publish.getAutocompleteText = function(symbol) {
    var type = symbolType(symbol);
    var parentAlias;
    
    if (symbol.parentScope) {
        parentAlias = symbol.parentScope.alias;
    }
    else if (symbol.memberOf) {
        parentAlias = symbol.memberOf;

    }
    
    var extensionFor = null,
        prototypeMember = false,
        classAlias,
        className,
        extensionName,
        memberName;
    
    if (type === 'function' || type === 'object') {

        if (parentAlias) {
            
            memberName = symbol.name;
            
            if (parentAlias.charAt(parentAlias.length-1) == '#') {
                //Part of the function prototype
                prototypeMember = true;
                classAlias = parentAlias.substring(0, parentAlias.length - 1);
            }
            else {
                classAlias = parentAlias;
            }
            
//            LOG.warn('function: ' + symbol.alias + " - " + parentAlias + " - " + (symbol.parentScope ? symbol.parentScope.alias : "no parent scope"));
//            //if (symbol.alias.indexOf('#'))
//            
//            LOG.warn(memberName + ' member of: ' + classAlias);
        }
    }
    else if (type === 'extension') {
        classAlias = symbol.extensionFor;
        extensionName = symbol.displayName;
    }
    else if (type === 'class') {
        className = symbol.displayName || symbol.alias;
    }
    
    if (classAlias) {
        classSymbol = Link.getSymbol(classAlias); 
        if (classSymbol) {
            if (classSymbol.isExtension && !extensionName) {
                extensionName = classSymbol.displayName;
                
                var extensionFor = classSymbol.extensionFor;
                if (extensionFor) {
                    var extensionForSymbol = Link.getSymbol(extensionFor);
                    if (extensionForSymbol) {
                        className = extensionForSymbol.displayName;
                        
                    }
                    else {
                        className = extensionFor;
                    }
                }
                
            }
            else {
                className = classSymbol.displayName || classSymbol.alias;
            }
        }else {
            className = classAlias;
            LOG.warn("Class symbol not found: " + classAlias);
        }
    }
    if (className) {
        return className + (prototypeMember ? ".prototype" : "") +  (memberName ? "." + memberName : "") + (extensionName ? " (" + extensionName + ")" : "");
    }
    else {
        return symbol.displayName || symbol.alias;
    }
    
}


function processAllClasses(symbols) {
    var outClasses = [];
    var len=symbols.length;
    
    
    publish.classesByAlias = {};
    for (var i=0; i<len; i++) {
        var symbol = symbols[i];
        if (symbol.alias === "_global_") continue;
        if (symbol.replacedBy) continue;
        
        var symbol = symbols[i];
        var classInfo = publish.getClassInfo(symbol);
        publish.classesByAlias[symbol.alias] = classInfo;
        if (symbol.replaces) {
            publish.classesByAlias[symbol.replaces.alias] = classInfo;
        }
        
        
    }
    
    for (var k in publish.classesByAlias) {
        if (publish.classesByAlias.hasOwnProperty(k)) {
            var classInfo = publish.classesByAlias[k];
            if (classInfo._processed) continue;
            classInfo._processed = true;
            
            if (classInfo.isPrivate) continue;
            
            if (classInfo.parentAlias) {
                var parentAlias = classInfo.parentAlias;
                var targetClass = publish.classesByAlias[parentAlias];
                
                if (targetClass)
                {
                    if (!targetClass.isPrivate) { //Don't show private classes in the tree
                        targetClass._addChildClass(classInfo);
                    }
                    
                    continue;
                }
                else {
                    LOG.warn('Parent class not found: ' + parentAlias + " for " + classInfo.alias);
                }
                
            }
            
            if (!classInfo.isPrivate) {
                outClasses.push(classInfo);
            }
        }
    }
    
    return outClasses;
}

publish.readModuleManifest = function(symbol) {
    var manifest = null;
    
    if (symbol.srcFile) {
       
        var packageJsonPath = symbol.srcFile.replace(/[\\]/g, "/");
        packageJsonPath = FilePath.dir(symbol.srcFile) + "/package.json";
        try
        {
            var packageJSON = IO.readFile(packageJsonPath);
            return {
                json: packageJSON,
                object: JSON.parse(packageJSON)
            };
        }
        catch(e) {
            
        }
        return null;
    }
};

publish.getClassInfo = function(symbol) {
    var info = publish.classesByAlias[symbol.alias];
    if (info) {
        return info;
    }
    
    var type = symbolType(symbol);
    var typeLabel = type.substring(0, 1).toUpperCase() + type.substring(1);
    
    var extensionForSymbol = null;
    if (symbol.isExtension) {
        extensionForSymbol = Link.getSymbol(symbol.extensionFor);
    }
    
    var hasConstructor = symbol.is('CONSTRUCTOR') && !symbol.isBuiltin() && !symbol.isExtension && !symbol.isMixin && !symbol.isNamespace;
    var modifiersLookup = {};
    var modifiers = [];
    var manifest = null;
    
    if (type === 'module') {
        manifest = publish.readModuleManifest(symbol);
    }
    
    ///////
    if (!symbol.displayName) {
        
        if (symbol.parentAlias && symbol.shortName) {
            var parentSymbol = Link.getSymbol(symbol.parentAlias);
            
            var parentName = null;
            
            if (parentSymbol) {
                
                if (parentSymbol.isExtension && parentSymbol.extensionFor) {
                    var extensionFor = parentSymbol.extensionFor;
                    parentSymbol = Link.getSymbol(extensionFor);
                    if (parentSymbol) {
                        parentName = parentSymbol.displayName;
                    }
                    else {
                        parentName = extensionFor;
                    }
                }
                else {
                    parentName = parentSymbol.displayName;
                }
            }
            else {
                parentName = symbol.parentAlias;
            }
            
            symbol.displayName = parentName + "." + symbol.shortName;
        }            
    }
    
    if (!symbol.displayName) {
        symbol.displayName = symbol.isInner || symbol.isInner.isAnonymous ? (symbol.shortName || symbol.alias) : symbol.alias;
    }
    
    if (!symbol.shortName) {
        symbol.shortName = symbol.displayName || symbol.alias;
        
        var parts = symbol.shortName.split(/[$.]/);
        if (parts.length > 1) {
            symbol.shortName = parts[parts.length-1];
        }
    }
    
    
    
    ///////
    info = {
        hasDesc: symbol.classDesc || symbol.desc,
        desc: function() {
            return publish.resolveConfigs(resolveLinks(symbol.classDesc || symbol.desc, symbol));
        },
        definedInLink: !symbol.isBuiltin() ? new Link().toSrc(symbol.srcFile) : null,
        typeLabel: typeLabel,
        pageTitle: typeLabel + ": " + ((symbol.isInner || symbol.isAnonymous) ? symbol.shortName : symbol.displayName),
        type: type,
        linkText: symbol.linkText,
        shortName: symbol.shortName,
        isDeprecated: symbol.isDeprecated,
        modifiers: modifiers,
        manifest: manifest,
        hasModifier: function(name) {
            return modifiersLookup[name];
        },
        childClasses: [],
        parentClass: null,
        _addChildClass: function(childClass) {
            this.childClasses.push(childClass);
            
            childClass.parentClass = this; //Link back to the parent
            childClass.isChildClass = true;
        },
        getTreeLink: function() {
            return new Link().toClass(symbol.alias).withText(this.parentClass ? symbol.shortName : symbol.displayName);
        },
        symbolStyleClass: symbolStyleClass(symbol),
        alias: symbol.alias,
        isPrivate: symbol.isPrivate,
        parentAlias: symbol.parentAlias || (symbol.parentSymbol ? symbol.parentSymbol.alias : ''),
        displayName: extensionForSymbol ? symbol.displayName + " for " + extensionForSymbol.displayName : symbol.displayName,
        navId: "nav_" + symbol.alias.replace(/[$.#]/g, '-'),
        events: this.getMembers(symbol, 'events'),
        methods: this.getMembers(symbol, 'methods'),
        properties: this.getMembers(symbol, 'properties'),
        ctor: hasConstructor ? this.getMembers(symbol, 'constructors')[0] : null
    };
    
    var addModifier = function(name) {
        modifiers.push(name);
        modifiersLookup[name] = true;
    };
    
    if (symbol.isPrivate) addModifier("private");
    if (symbol.isProtected) addModifier("protected");
    if (symbol.isRaptorObject ? symbol.isAnonymous : symbol.isInner) {
        info.isInner = true;
        if (symbol.parentAlias) {
            info.parentLink = new Link().toSymbol(symbol.parentAlias);
        }
        addModifier("inner");
    }
    
    
    if (symbol.isDeprecated) {
        addModifier("deprecated");
        info.deprecatedReason = function() {
            return resolveLinks(symbol.deprecated, symbol);
        };
    }
    
    if (symbol.isExtension) {
        info.pageTitle = symbol.displayName + " for " + (new Link().toClass(symbol.extensionFor));
    }
    
    info.hasPrivate = symbol.isPrivate || info.events.hasPrivate || info.methods.hasPrivate || info.properties.hasPrivate || (info.ctor && info.ctor.hasPrivate);
    info.hasProtected = symbol.isProtected || info.events.hasProtected || info.methods.hasProtected || info.properties.hasProtected || (info.ctor && info.ctor.hasProtected);
    
    return info;
}

publish.getMembers = function(symbol, memberType) {
    
    var members = memberType === 'constructors' ?
            [symbol] :
            symbol[memberType];
    
    var result = [];
    
    var hasPrivate = false;
    var hasProtected = false;
    
    if (members) {
        var inherited = [];
        var owned = [];
            
        
        members.forEach(function(member) {
//            if (symbol.alias == 'resources$DirSearchPathEntry') {
//                LOG.warn('member: ' + symbol.alias + ' - ' + member.name + ' - ' + member.memberOf);
//            }
//            
            if (member.memberOf && member.memberOf != symbol.alias && member.isa !== "CONSTRUCTOR") {
                inherited.push(member);
            }
            else {
                owned.push(member);
            }
        });
        
        var addedMembersLookup = {};
        
        
        
        //Add all of the owned methods first
        var addMembers = function(members, inherited) {
            
            
            members.forEach(function(member) {
                
                if (addedMembersLookup[member.name] === true) return;
                addedMembersLookup[member.name] = true; //Only allow a member to be added once
            
                
                
                var summarized = summarize(member.desc);
                var descSummary = summarized.summary ? publish.resolveConfigs(summarized.summary) : "";
                var descRemaining = summarized.remaining ? publish.resolveConfigs(summarized.remaining) : "";
                
                var modifiersLookup = {};
                var memberInfo = {
                        name: (memberType === 'constructors') ? member.shortName : member.name,
                        alias: member.alias,
                        definedInLink: member.srcFile != symbol.srcFile ? new Link().toSrc(member.srcFile) : null,
                        hasDescSummary: summarized.summary,
                        hasDescRemaining: summarized.remaining,
                        descSummary: function() {
                            return resolveLinks(descSummary, symbol);
                        },
                        descRemaining: function() {
                            return resolveLinks(descRemaining, symbol);
                        },
                        inheritedFromLink: inherited ? new Link().toSymbol(member.memberOf) : null,
                        borrowedFromLink: null,
                        elId: member.alias.replace(/[$.#]/g, '-'),
                        modifiers: [],
                        isDeprecated: member.isDeprecated,
                        deprecatedReason: null,
                        hasModifier: function(name) {
                            return modifiersLookup[name];
                        },
                        params: [],
                        linkName: Link.symbolNameToLinkName(member),
                        hasType: false,
                        typeHtml: function() {
                            return "";
                        },
                        returnInfo: {
                            type: "",
                            desc: null,
                            hasType: false,
                            typeHtml: function() {
                                return "";
                            },
                            empty: true
                        }
                    };
                
                var params = memberInfo.params;
                var modifiers = memberInfo.modifiers;
                
                
                
                result.push(memberInfo);
                
                var addModifier = function(name) {
                    modifiers.push(name);
                    modifiersLookup[name] = true;
                };
                
                if (inherited) {
                    addModifier("inherited");
                }
                
                if (member.isPrivate) {
                    hasPrivate = true;
                    addModifier("private");
                }
                if (member.isProtected) {
                    hasProtected = true;
                    addModifier("protected");
                }
                if (member.isRaptorObject ? member.isAnonymous : member.isInner) addModifier("inner");
                if (memberType !== 'constructors' && member.isStatic && !symbol.isNamespace && !symbol.isExtension) addModifier("static");
                if (member.isConstant) addModifier("constant");
                if (member.isDeprecated) {
                    addModifier("deprecated");
                    memberInfo.deprecatedReason = function() {
                        return resolveLinks(member.deprecated, symbol);
                    };
                }
                if (member.isBorrowed) {
                    addModifier("borrowed");
                    
                    var parts = member.borrowedFrom.match(/^(.+)([.#-])([^.#-]+)$/);
                    var borrowedText = null;
                    if (parts) {
                        var memberOf = parts[1];
                        var borrowedParent = Link.getSymbol(memberOf);
                        if (borrowedParent) {
                            borrowedText = borrowedParent.displayName;
                        }
                                 
                    }
                    
                    memberInfo.borrowedFromLink = borrowedText ? new Link().toSymbol(member.borrowedFrom).withText(borrowedText) : new Link().toSymbol(member.borrowedFrom);
                }
                
                if (member.see.length) {
                    var seeList = [];
                    member.see.forEach(function(curSee) {
                        seeList.push({
                            html: function() {
                                return resolveLink(curSee, symbol) || resolveLinks(curSee, symbol);
                            }
                        });
                    
                    });
                    memberInfo.seeList = seeList;
                }

                if (memberType === 'methods' || memberType === 'constructors') {
                    if (member.params) {
                        member.params.forEach(function(param) {
                            params.push({
                                name: param.name,
                                hasDesc: param.desc != null,
                                desc: function() {
                                    return resolveLinks(param.desc, symbol);
                                },
                                hasType: param.type != null,
                                typeHtml: function() {
                                    return param.type ? new Link().toSymbol(param.type).toString() : "";
                                }
                            });
                        });
                    }
                    
                    if (member.returns && member.returns.length) {
                        var type = member.returns[0].type;
                        memberInfo.returnInfo = {
                            type: type,
                            hasDesc: member.returns[0].desc != null,
                            desc: function() {
                                return resolveLinks(member.returns[0].desc, symbol);
                            },
                            hasType: type != null,
                            typeHtml: function() {
                                return type ? new Link().toSymbol(type).toString() : "";
                            }
                        };
                        if (!memberInfo.descSummary && memberInfo.returnInfo.desc && memberInfo.returnInfo.desc.toLowerCase().startsWith("returns")) {
                            memberInfo.hasDescSummary = memberInfo.returnInfo.desc != null;
                            memberInfo.descSummary = function() {
                                return resolveLinks(memberInfo.returnInfo.desc, symbol);
                            };
                        }
                    }
                }
                else if (memberType === 'properties') {
                    memberInfo.hasType = member.type != null;
                    memberInfo.typeHtml = function() {
                        return member.type ? new Link().toSymbol(member.type).toString() : "";
                    }
                }
            });
        };
        
        addMembers(owned, false);
        addMembers(inherited, true);
    }
    result.sort(publish.sortByName);
    
    result.hasPrivate = hasPrivate;
    result.hasProtected = hasProtected;
    
    return result;
}

publish.modifiersHTML = function(member) {
    return publish.modifiersTemplate.process(member);
}

publish.methodHTML = function(method) {
    return publish.methodTemplate.process(method);
}

publish.manifestHTML = function(manifest) {
    return publish.manifestTemplate.process(manifest);
};

publish.manifestIncludeHTML = function(manifestInclude) {
    return publish.manifestIncludeTemplate.process(manifestInclude);
};

publish.resolveConfigs = function(desc) {
    desc = desc.replace(/<config(?:\s+label="([^"]*)")?>/gi, function(match, label) {
        return (label ? '<div class="config"><div class="config-title">' + label + '</div>' : '') + '<ul>';
    });
    
    desc = desc.replace(/<prop\s+name="([a-z]*)"\s*(?:type="([a-z$0-9_#.:^\-\<\>]*)")>?/gi, function(match, name, type) {
        return '<li><span class="param-name">' + name + '</span>' + (type ? " : " + new Link().toSymbol(type).toString() : "") + " - ";
    });
    
    desc = desc.replace(/<\/prop\s*>/gi, function(match, name) {
        return "</li>";
    });
    
    desc = desc.replace(/<\/config\s*>/gi, function(match, name) {
        return "</ul></div>";
    });
    
    return desc;
}

publish.entries = function(o) {
    var k;
    var entries = [];
    for (k in o)
    {
        if (o.hasOwnProperty(k))
        {
            entries.push({key: k, value: o[k]});
        }
    }

    return entries;
}