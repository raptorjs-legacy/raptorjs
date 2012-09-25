raptor.define(
    "components.jsdoc.Nav.NavTag",
    function(raptor) {
        
        var jsdocUtil = raptor.require("jsdoc-util");
        
        var Node = function(name, label, href, type) {
            this.children = [];
            this.name = name;
            this.label = label;
            this.href = href;
            this.type = type;
            this.childNodesByName = {};

             
            if (name) {
                this.liElId = "nav_" + name.replace(/\./g, '_');
                if (name === 'global') {
                    this.liClass = "global";
                }
                else if (!type) {
                    this.liClass = "folder";
                }
                else if (type.raptorType || type.hasCommentTag("raptor")) {
                    this.liClass = "raptor-" + (type.raptorType || "module");
                }
                else {
                    this.liClass = type.isClass() ? "class" : "object";    
                }

                this._sortType = this.liClass;

                if (type && type.extensionFor) {
                    this.liClass += " extension";
                    this._sortType = "extension";
                }    
            }
            else {
                this.liElId = "_root";
                this.liClass = "";
            }
            

        };
        
        Node.prototype = {
        };
        
        var navContent = null,
            nodesByName = {},
            templating = raptor.require('templating'),
            nameRegExp = /[\.\/]([^\.\/]*)$/,
            sortOrders = {
                "global": 1,
                "extension": 2,
                "raptor-module": 3,
                "module": 3,
                "folder": 3,
                "object": 4,
                "raptor-class": 4,
                "class": 4
            },
            getParentName = function(name, type) {
                if (type.extensionFor) {
                    return type.extensionFor;
                }

                nameRegExp.lastIndex = 0;
                var matches = nameRegExp.exec(name);
                if (matches) {
                    return name.substring(0, matches.index);
                }
                else {
                    return null;
                }
            },
            sortChildren = function(parentNode) {
                parentNode.children.sort(function(a, b) {

                    var sortA = sortOrders[a._sortType] || 10;
                    var sortB = sortOrders[b._sortType] || 10;

                    if (sortA !== sortB) {
                        a = sortA;
                        b = sortB;
                    }
                    else {
                        a = a.label.toLowerCase();
                        b = b.label.toLowerCase();    
                    }
                    
                    return a < b ? -1 : (a > b ? 1 : 0);
                });

                parentNode.children.forEach(function(childNode) {
                    sortChildren(childNode);
                });
            },

            getOrCreateNode = function(rootNode, name) {
                if (!name) {
                    return rootNode;
                }

                var currentNode = rootNode;
                var parts = name.split(/\./);
                var currentParts = [];

                parts.forEach(function(part) {
                    currentParts.push(part);

                    var childNode = currentNode.childNodesByName[part];
                    if (!childNode) {
                        childNode = new Node(currentParts.join("."), part, "javascript:;" + part, null); 
                        nodesByName[currentParts.join(".")] = childNode;
                        currentNode.childNodesByName[part] = childNode;
                        currentNode.children.push(childNode);
                        childNode.parentNode = currentNode;
                    }
                    currentNode = childNode;
                }, this);

                return currentNode;

            },

            buildTree = function(symbols, context) {
                
                var rootNode = new Node();
                rootNode.root = true;
                
                var symbolNames = symbols.getSymbolNames();
                symbolNames.sort();
                
                symbolNames.forEach(function(name, type) {
                    
                    var label,
                        type = symbols.getSymbolType(name),
                        href = jsdocUtil.symbolUrl(name);
                    

                    var parentName = getParentName(name, type);
                    var parentNode = getOrCreateNode(rootNode, parentName);
                    var label = type.extensionFor ? type.getExtension() + " Extension" : type.getShortLabel();
                    
                    var node = new Node(name, label, href, type);
                    nodesByName[name] = node;
                    node.parentNode = parentNode;
                    parentNode.childNodesByName[type.getShortName()] = node;
                    parentNode.children.push(node);
                }, this);

                sortChildren(rootNode);
                
                return rootNode;
            };
        
        var NavTag = function(config) {
            
        };
        
        
        NavTag.prototype = {
            
            process: function(input, context) {
                var symbols = jsdocUtil.context.symbols;
                var symbolName = jsdocUtil.context.currentSymbolName;
                
                if (!symbols) {
                    throw raptor.createError(new Error("Symbols are required"));
                }
                
                if (!navContent) { //Check if we have already generated the HTML for the left nav
                    /*
                     * If not, generate the nav content HTML and cache in the static variable
                     */
                    navContent = templating.renderToString('components/jsdoc/Nav/Nav-content', {
                        rootNode: buildTree(symbols, context)
                    });
                }
                
                var widgetConfig = {};
                
                if (symbolName != null) {
                    var activeNode = nodesByName[symbolName],
                        initiallyOpenId;

                    if (activeNode.children.length) {
                        initiallyOpenId = activeNode.liElId;
                    }
                    else if (activeNode.parentNode) {
                        initiallyOpenId = activeNode.parentNode.liElId;
                    }

                    widgetConfig.initiallyOpenId = initiallyOpenId;
                    widgetConfig.activeElId = activeNode.liElId;
                }
                
                templating.render("components/jsdoc/Nav", {
                    navContent: navContent,
                    widgetConfig: widgetConfig
                }, context);
            }
        };
        
        return NavTag;
    });