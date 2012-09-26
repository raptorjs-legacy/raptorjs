raptor.define(
    "components.jsdoc.Nav.NavTag",
    function(raptor) {
        
        var jsdocUtil = raptor.require("jsdoc-util"),
            strings = raptor.require('strings');
        
        var Node = function(props) {
            this.children = [];
            this.name = props.name;
            this.label = props.label;
            this.href = props.href;
            this.type = props.type;
            this.childNodesByName = {};

            var name = props.name;
            var type = props.type;
            var nodeType = props.nodeType;
             
            if (name) {
                this.liElId = "nav_" + name.replace(/^\//, '').replace(/[\.\/]/g, '_');
                if (name === 'global') {
                    this.liClass = "global";
                }
                else if (nodeType === 'folder') {
                    this.liClass = "folder";
                }
                else if (nodeType === 'package') {
                    this.liClass = "package";
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
                "package": 5,
                "extension": 10,
                "raptor-module": 20,
                "module": 20,
                "folder": 20,
                "object": 40,
                "raptor-class": 40,
                "class": 40,
                "raptor-mixin": 40,
                "mixin": 40,
                "raptor-enum": 40,
                "enum": 40,
                "global": 50
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

            addChildNode = function(parentNode, props) {
                var childNode = new Node(props); 
                nodesByName[props.name] = childNode;
                parentNode.childNodesByName[props.shortName] = childNode;
                parentNode.children.push(childNode);
                childNode.parentNode = parentNode;
                return childNode;
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
                        childNode = addChildNode(currentNode, {
                            name: currentParts.join("."),
                            shortName: part,
                            label: part,
                            href: "#",
                            nodeType: "folder",
                            type: null
                        });
                    }
                    currentNode = childNode;
                }, this);

                return currentNode;

            },

            buildTree = function(symbols, context) {
                
                var rootNode = new Node({});
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
                    
                    addChildNode(parentNode, {
                            name: name,
                            shortName: type.getShortName(),
                            label: label,
                            href: href,
                            nodeType: null,
                            type: type
                        });
                }, this);

                jsdocUtil.context.env.forEachSourceFile(function(source) {
                    var file = source.file;
                    if (file.isFile() && strings.endsWith(file.getName(), "package.json")) {
                        var relativeDir = source.relativeDir;
                        //Convert the relative path into a tree node path
                        
                        var treePath = relativeDir.replace(/^\//g, '').replace(/\//g, '.');
                        var parentNode = getOrCreateNode(rootNode, treePath);

                        addChildNode(parentNode, {
                            name: source.relativePath,
                            shortName: file.getName(),
                            label: file.getName(),
                            href: jsdocUtil.sourceLink(file).href,
                            nodeType: "package",
                            type: null
                        });
                    }
                    
                }, this);


                sortChildren(rootNode);
                
                return rootNode;
            };
        
        var NavTag = function(config) {
            
        };
        
        
        NavTag.prototype = {
            
            process: function(input, context) {
                var symbols = jsdocUtil.context.symbols;
                var nodeName = jsdocUtil.context.currentSymbolName || jsdocUtil.context.currentSourcePath;
                
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
                
                if (nodeName != null) {
                    var activeNode = nodesByName[nodeName],
                        initiallyOpenId;

                    if (activeNode) {
                        if (activeNode.children.length) {
                            initiallyOpenId = activeNode.liElId;
                        }
                        else if (activeNode.parentNode) {
                            initiallyOpenId = activeNode.parentNode.liElId;
                        }

                        widgetConfig.initiallyOpenId = initiallyOpenId;
                        widgetConfig.activeElId = activeNode.liElId;
                    }
                }
                
                templating.render("components/jsdoc/Nav", {
                    navContent: navContent,
                    widgetConfig: widgetConfig
                }, context);
            }
        };
        
        return NavTag;
    });