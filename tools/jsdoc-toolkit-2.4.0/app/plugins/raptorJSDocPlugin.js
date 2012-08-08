JSDOC.PluginManager.registerPlugin(
	"JSDOC.raptor",
	{

	    onReturn: function(returnStatement) {
	        var ts = returnStatement.tokenStream;
	        var parentScope = returnStatement.parentScope;
	        var parentAlias = parentScope ? parentScope.alias : null;
	        if (!parentAlias) return;
	        
	        if (parentAlias.endsWith('#')) {
	            parentAlias = parentAlias.substring(0, parentAlias.length-1);
	        }
	        
	        //LOG.warn('onReturn parent: ' + parentAlias);
	        
	        var parentSymbol = JSDOC.Parser.symbols.getSymbol(parentAlias);
	        if (!parentSymbol || !parentSymbol.isRaptorObject) {
	            return;
	        }
	        
	        //LOG.warn('onReturn parentSymbol: ' + parentSymbol.alias);
	        
	        //We are inside what we think is the prototype
	        
	        var returnVarName = null;
	        var cursor = ts.cursor;
	        
	        var nextToken = ts.next();
	        if (nextToken.is("NAME")) {
	            returnVarName = nextToken.data;
	        }
	        
//	        if (returnVarName) {
//	            LOG.warn(parentAlias + ' - return ' + returnVarName);
//	        }
	        
	        ts.cursor = cursor;
	        
	        if (returnVarName) {
	            //Let's figure out what the variable is referring to
	            var varAlias = parentScope.alias + '-' + returnVarName;
	            var localVarSymbol = JSDOC.Parser.symbols.getSymbol(varAlias);
	            if (!localVarSymbol) {
	                LOG.warn('Local variable not found in parent scope: ' + varAlias);
	                return;
	            }
	            parentSymbol.ignore = true;
	            parentSymbol.replacedBy = localVarSymbol;
	            parentSymbol.isInner = false;
	            
	            
	            localVarSymbol.isa = "CONSTRUCTOR";
	            //LOG.warn(varAlias + ' -!!!!!- ' + parentSymbol.comment.src);
	            var oldName = localVarSymbol.name;
	            localVarSymbol.comment = parentSymbol.comment;
	            localVarSymbol.replaces = parentSymbol;
	            localVarSymbol.setTags();
	            localVarSymbol.comment.isUserComment = true;
	            localVarSymbol.name = oldName;
	            localVarSymbol.parentAlias = parentSymbol.parentAlias;
	            localVarSymbol.shortName = parentSymbol.shortName;
	            
	            localVarSymbol.isInner = false;
	            localVarSymbol.isStatic = false;
	            localVarSymbol.isPrivate = false;
	            JSDOC.Parser.symbols.replaceSymbol(parentAlias, localVarSymbol);
	        }
	        
	    },
	    
	    onDocCommentTags: function(comment) {
	        //Encode HTML characters inside HTML source code blocks
	        
	        var descTags = comment.getTag('desc');
	        
	        var codeTags = {
	                "html": "sh_html",
	                "xml": "sh_xml",
	                "javascript": "sh_javascript_dom",
	                "js": "sh_javascript_dom"
	        };
	        
	        if (descTags.length) {
	            var desc = descTags[0].desc;
	            desc = desc.replace(/<(html|javascript|js|xml)>((?:.|\n|\r|\t)*?)<\/(html|javascript|js|xml)>/g, function(match, tagBegin, body, tagEnd) {
	                var targetClass = codeTags[tagBegin];
	                if (targetClass && (tagBegin == tagEnd)) {
	                    return '<pre class="code ' + targetClass + '">' + body.replace(/</g, '&lt;') + "</pre>";
	                }
	                else {
	                    return match;
	                }
	            });
	            
	            descTags[0].desc = desc;
	        }
	    },
	    
	    onBorrowSymbol: function(clone, borrowed) {
	        clone.see.push(borrowed.alias);
	        clone.displayName = clone.alias;
	    },
	    
	    onSetTags: function(symbol) {
	        if (symbol.isNamespace || symbol.isClass || symbol.isMixin || symbol.isExtension) {
	            var desc = symbol.comment.getTag("desc");
	            if (desc.length) {
	                
	                symbol.classDesc = desc[0].desc;
	            }
	        }
	        
	        
	        
	        var isAnonymous = false;
	        
	        if (symbol.comment.getTag('anonymous').length) {
	            symbol.isAnonymous = true;
	        }
	        
	        if (!symbol.replaces) {
    	        var childSeparator = symbol.alias.lastIndexOf('$');
    	        if (childSeparator == -1) {
    	            childSeparator = symbol.alias.lastIndexOf('-');
    	            if (childSeparator != -1) {
    	                symbol.isAnonymous = true;
    	            }
    	        }
	        }
	        
	        
	        
	        
	        if (symbol.comment.getTag('mixin').length) {
	            symbol.isMixin = true;
	        }
	        if (symbol.comment.getTag('raptor').length) {
                symbol.isRaptorObject = true;
            }
	        if (symbol.comment.getTag('field').length) {
                symbol.isProperty = true;
            }
	        if (symbol.comment.getTag('extension').length) {
                symbol.isExtension = true;
                symbol.extensionName = symbol.comment.getTag('extension')[0].desc;
                symbol.shortName = symbol.extensionName + " Extension";
            }
	        if (symbol.comment.getTag('extensionFor').length) {
                symbol.extensionFor = symbol.comment.getTag('extensionFor')[0].desc;
                symbol.parentAlias = symbol.extensionFor;
            }
	        if (symbol.comment.getTag('parent').length) {
                symbol.parentAlias = symbol.comment.getTag('parent')[0].desc;
            }
	        if (symbol.comment.getTag('constructor').length) {
                symbol.desc = symbol.comment.getTag('constructor')[0].desc;
            }
	        
	        
	        if (symbol.comment.getTag('displayName').length) {
                symbol.displayName = symbol.comment.getTag('displayName')[0].desc;
                
            }
	        
	        if (childSeparator != -1) {
	            if (!symbol.parentAlias) {
	                symbol.parentAlias = symbol.alias.substring(0, childSeparator);    
	            }
                
//	            if (!symbol.shortName) {
//	                symbol.shortName = symbol.alias.substring(childSeparator+1);    
//	            }
//                
//	            
                if (!symbol.displayName && symbol.isAnonymous) {
                    symbol.displayName = symbol.shortName;
                }
            }
	    },
	    
		onFunctionCall: function(functionCall) {
		    
		    var functionName = functionCall.name;
		    var raptorDefineFunctions = {
	            "raptor.defineModule": true,
	            "raptor.define": true,
	            "raptor.defineCore": true,
	            "raptor.defineClass": true,
	            "raptor.defineMixin": true,
	            "raptor.extendCore": true,
	            "raptor.extend": true
		    };
		    
		    if (!(functionName in raptorDefineFunctions)) {
		        return;
		    }
		    
		    
		    var firstArg = functionCall.arg1;
		    
		    var tags = [],
		        ts = functionCall.tokenStream,
		        parentScope = functionCall.parentScope,
		        name,
                displayName,
                alias,
                parentAlias,
                isAnonymous = false;
            
		    if (firstArg) 
		    {
		        if (firstArg.tokens.length == 1 && firstArg.tokens[0].is("STRING")) {
		            name = eval(firstArg.tokens[0].data);
		        }
		        else {
		            //Anonymous class... using the preceding name
		            if (parentScope) {
		                var nameToken = ts.look(-2); //Skip the ASSIGN token
		                var varToken = ts.look(-3);
		                
		                var parentScopeAlias = parentScope.alias;
		                if (parentScopeAlias.endsWith('#')) {
		                    parentScopeAlias = parentScopeAlias.substring(0, parentScopeAlias.length-1);
		                }
		                
		                
		                var parentSymbol = JSDOC.Parser.symbols.getSymbol(parentScopeAlias);
		                if (parentSymbol) {
		                    if (parentSymbol.isExtension) {
		                        parentSymbol = JSDOC.Parser.symbols.getSymbol(parentSymbol.extensionFor);
		                    }
		                }
		                
		                if (nameToken.is("NAME") && varToken.is("VAR")) {
		                    
		                    alias = parentScopeAlias + '-' + nameToken.data;
		                    name = (parentSymbol ? parentSymbol.displayName : parentScopeAlias) + "." + nameToken.data;
		                    parentAlias = parentSymbol ? parentSymbol.alias : null;
		                    
		                    isAnonymous = true;
		                }
		            }
		        }
		        
		    }
		    else {
		        return;
		    }
		    
		    if (!name) {
		        return;
		    }
	        

	        var getClassInfo = function(name, isAnonymous) {
	            var lastDot = name.lastIndexOf('.'),
                    lastPart = name;
                
                if (lastDot != -1) {
                    lastPart = name.substring(lastDot+1);
                }
                
                if (lastPart.charAt(0) == lastPart.charAt(0).toUpperCase()) {
                    var parentAlias = name.substring(0, lastDot);

                    return {
                        alias: parentAlias + (isAnonymous === true ? "-" : "$")  + lastPart,
                        parent: parentAlias
                    };
                }
                
                return {
                    alias: name,
                    parent: null
                };
	        };
	        
	        var getSuperclass = function() {
	            var superclass = null;
	            var modifiersArg = null;
	            if (functionCall.params.length == 3) {
	                modifiersArg = functionCall.arg2;
	            }
	            else if (functionCall.params.length == 2) {
	                if (functionCall.arg1.tokenType === 'OBJECT') {
	                    modifiersArg = functionCall.arg1;
	                }
	            }
	            
	            if (!modifiersArg) return null;
	            
	            if (modifiersArg.tokens.length == 1){
	                var firstToken = modifiersArg.tokens[0];
	                
	                if (firstToken.is('STRING')) {
	                    superclass = eval(modifiersArg.tokens[0].data);
	                }
	                else if (firstToken.is('OBJECT')) {
	                    
	                    var tokens = firstToken.data.tokens;
	                    
	                    for (var i=0; i<tokens.length; i++) {
	                        var token = tokens[i];
	                        if ((token.is("NAME") && token.data == "superclass") || 
	                            (token.is("STRING") && eval(token.data) == "superclass")) {

	                            //We found the superclass property
	                            //There should be two more tokens... a COLON and a string
	                            if (i+2 < tokens.length) {
	                                if (tokens[i+1].is("COLON") && tokens[i+2].is("STRN")) {
	                                    superclass = eval(tokens[i+2].data);
	                                }
	                            }
	                            else {
	                                //LOG.warn("** Not a superclass: " + tokens.length + ' - ' + i);
	                            }
	                        }
	                    }
	                }
	            }
	            
	            
	            if (superclass) {
	                superclass = getClassInfo(superclass).alias;
	            }
	            return superclass;
	        };
	        
	        var lends = null;
	        var lendsProto = false;
	        
	        var lastDoc = functionCall.lastDoc;
	        var lastSymbol = lastDoc ? lastDoc.symbol : null;
	        
	        var isExtension = lastDoc ? lastDoc.getTag('extension').length != 0 : false;
	        
	        var printFunc = function() {
                //LOG.inform('\n\n' + functionCall.name + '("' + JSON.stringify(functionCall.arg1.tokens) + '", ...) - isExtension=' + isExtension);
            };
            
            printFunc();
            
	        if (!isExtension && (functionCall.name == "raptor.defineModule" || functionCall.name == "raptor.define" || functionCall.name == "raptor.defineCore")) {
	            

	            if (lastSymbol && lastSymbol.isExtension) {
	                return;
	            }
	            else {
	                tags.push("@namespace");
	            }
	            
	        } 
	        else if (!isExtension && (functionCall.name == "raptor.defineClass" || functionCall.name == "raptor.defineMixin")) {
                tags.push("@class");
                if (functionCall.name == "raptor.defineMixin") {
                    tags.push("@mixin");
                }
                var superclass = getSuperclass();
                if (superclass) {
                    tags.push("@augments " + superclass);
                }
                
                if (!isAnonymous) {
                    var classInfo = getClassInfo(name, isAnonymous);
                    alias = classInfo.alias;
                    parentAlias = classInfo.parent;    
                }
                
                lendsProto = true;
            } 
	        else if (isExtension || functionCall.name == "raptor.extendCore" || functionCall.name == "raptor.extend") {

                //The alias is not the first parameter (the first parameter refers to what is being extended)
                //Instead, we should base the extension on the doc attached to this function call
	            
	            if (lastDoc) {
	                if (lastDoc.getTag('extension').length) {
                        var extensionName = lastDoc.getTag('extension')[0].desc;
                        if (!extensionName) {
                            LOG.warn('Missing extension name for ' + functionCall.name + '("' + name + '", ...)');
                            return;
                        }
                        
                        
                        displayName = extensionName + " Extension";
                        
                        var classInfo = getClassInfo(name);
                        alias = classInfo.alias + "_" + extensionName.replace(/[ ]/g, "_");
                        parentAlias = classInfo.alias;
                        
                        lends = alias;
                        
                        tags.push("@class");
                        tags.push("@extension " + extensionName);
                        tags.push("@extensionFor " + parentAlias);
                    }
	            }
	            
            }
	        else {
	            name = null;
	        }
	        
	        if (name) {
	            if (!alias) {
	                alias = name;
	            }
	            
	            if (!displayName) {
	                displayName = name;
	            }
	            
	            
	            tags.push("@displayName " + displayName);
	            if (parentAlias) {
                    
                    tags.push("@parent " + parentAlias);
                }
	            if (isAnonymous) {
                    
                    tags.push("@anonymous");
                }
	            tags.push("@raptor");
                tags.push("@name " + alias);
                //LOG.warn('Found raptor define symbol: ' + alias);
                if (!lends) {
                    lends = alias + (lendsProto ? ".prototype" : "");
                }
                
                var existingSymbol = JSDOC.Parser.symbols.getSymbol(alias);
                if (existingSymbol) {
                    tags = [];
                }
	        }
	            
	        if (tags.length) {
	            
	            var userComment = "";
	            
	            if (functionCall.lastDoc) {
	                //throw 'last comment found: ' + functionCall.lastDoc;
	                userComment = functionCall.lastDoc.src;
                }
	            
	            var comment = "/**\n * " +
	                userComment + "\n * " + 
	                tags.join("\n * ") +
	                "\n" +
	                
	                "*/";
	            
	            //LOG.warn(comment);
                functionCall.doc = comment;
	        }
	        
	        if (lends) {
                //LOG.warn('@lends ' + lends);
                var params = functionCall.params;
                var lastParam = params[params.length-1];
                var leftCurly = null;
                
                if (lastParam.tokens.length == 1) {
                    var firstToken = lastParam.tokens[0];
                    
                    //LOG.warn('lastParam: ' + JSON.stringify(firstToken));
                    
                    if (firstToken.is("FUNCTION")) {
                        leftCurly = firstToken.data.bodyTokens[0];
                    }
                    else if (firstToken.is("OBJECT")) {
                        leftCurly = firstToken.data.tokens[0];
                    }
                }
                
                if (leftCurly) {
                    var cursor = functionCall.tokenStream.cursor,
                        curToken;
                    
                    
                    while((curToken = functionCall.tokenStream.look())) {
                        
                        if (curToken == leftCurly) {
                            //LOG.warn('*** Found starting token for @lends ' + lends);
                            functionCall.tokenStream.insertAhead(new JSDOC.Token("/** @lends " + lends + " */", "COMM", "JSDOC"), 0);
                            
                            break;
                        }
                        functionCall.tokenStream.next();
                    }
                    
                    functionCall.tokenStream.cursor = cursor;
                }
                
            }


		}
	}
);