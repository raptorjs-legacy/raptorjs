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
             
            if (name) {
                this.liElId = "nav_" + name;
                if (type.raptorType) {
                    this.liClass = "raptor-" + type.raptorType;
                }
                else {
                    this.liClass = type.isClass() ? "class" : "module";    
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
            templating = raptor.require('templating'),
            nameRegExp = /[\.\/]([^\.\/]*)$/,
            getParentName = function(name) {
                nameRegExp.lastIndex = 0;
                var matches = nameRegExp.exec(name);
                if (matches) {
                    return name.substring(0, matches.index);
                }
                else {
                    return name;
                }
            },
            buildTree = function(symbols, context) {
                
                var rootNode = new Node();
                rootNode.root = true;
                
                var symbolNames = symbols.getSymbolNames();
                symbolNames.sort();
                
                var nodesByName = {};
                
                symbolNames.forEach(function(name) {
                    
                    var label,
                        type = symbols.getSymbolType(name),
                        href = jsdocUtil.symbolUrl(name, context);
                    
                    var parentName = getParentName(name);
                    if (parentName) {
                        parentNode = nodesByName[parentName];
                    }
                    
                    if (parentNode) {
                        label = type.getShortLabel();
                    }
                    else {
                        label = type.getLabel();
                        parentNode = rootNode;
                    }
                    
                    var node = new Node(name, label, href, type);
                    nodesByName[name] = node;
                    parentNode.children.push(node);
                }, this);
                
                return rootNode;
            };
        
        var NavTag = function(config) {
            
        };
        
        
        NavTag.prototype = {
            
            process: function(input, context) {
                var symbols = input.allSymbols;
                var symbolName = input.symbolName;
                
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
                    widgetConfig.initiallyOpenId = "nav_" + symbolName;
                }
                
                templating.render("components/jsdoc/Nav", {
                    navContent: navContent,
                    widgetConfig: widgetConfig
                }, context);
            }
        };
        
        return NavTag;
    });