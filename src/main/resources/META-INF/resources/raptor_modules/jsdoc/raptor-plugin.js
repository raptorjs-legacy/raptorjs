raptor.define(
    "jsdoc.raptor-plugin",
    function(raptor) {
        "use strict";
        
        var Type = raptor.require("jsdoc.Type"),
            resolveDefine = require("./resolver-raptor.define.js"),
            resolveExtend = require("./resolver-raptor.extend.js");
            
        return {
            load: function(env) {
                
                var createTypeForComment = function(comment) {
                    var resolvedType;
                    if (comment.hasTag("function")) {
                        resolvedType = new Type("function");
                        resolvedType.setComment(comment);
                        var paramTags = comment.getTags("param");
                        paramTags.forEach(function(paramTag) {
                            resolvedType.addFunctionParam({name: paramTag.paramName});
                        }, this);

                        return resolvedType;
                    }

                    return null;
                };

                env.addHandlers({
                    "property": function(eventArgs) {

                        var comment = eventArgs.comment;
                        

                        if (comment) {
                            var resolvedType = createTypeForComment(comment);
                            if (resolvedType) {
                                eventArgs.setType(resolvedType);
                            }
                        }
                    },

                    "ReturnStatement": function(eventArgs) {

                        var comment = eventArgs.comment;
                        if (comment) {
                            var nameTag = comment.getTag("name");
                            
                            if (nameTag) {
                                if (!eventArgs.node.resolvedReturnType) {
                                    
                                }
                                else {
                                    eventArgs.symbols.addSymbol(nameTag.getValue(), eventArgs.node.resolvedReturnType);        
                                }
                            }
                        }
                    },



                    "assignment": function(eventArgs) {
                        var comment = eventArgs.comment;
                        var resolvedType = eventArgs.type;
                        
                        if (comment) {

                            if (!resolvedType) {
                                resolvedType = createTypeForComment(comment);
                                if (resolvedType) {
                                    eventArgs.setType(resolvedType);
                                }
                            }
                            
                            if (resolvedType) {
                                var nameTag = comment.getTag("name");
                                resolvedType.setComment(comment);

                                
                                
                                if (nameTag && !comment.hasTag("memberOf")) {

                                    var name = nameTag.getValue();

                                    /*
                                     * The below code is a hack to correct the following;
                                     * Old: locale.formatting.numbers-NumberFormatter
                                     * New: locale.formatting.numbers.NumberFormatter
                                     */
                                    var lastDot = name.lastIndexOf('.');
                                    if (lastDot != -1) {
                                        var shortName = name.substring(lastDot+1);
                                        if (shortName.charAt(0) === shortName.charAt(0).toLowerCase()) {
                                            var dashIndex = shortName.indexOf('-')
                                            if (dashIndex+1 < shortName.length && shortName.charAt(dashIndex+1) === shortName.charAt(dashIndex+1).toUpperCase()) {
                                                shortName = shortName.replace(/\-/g, '.');
                                                name = name.substring(0, lastDot+1) + shortName;
                                            }
                                        }
                                    }

                                    eventArgs.symbols.addSymbol(name, resolvedType);    
                                }
                            }
                        }              
                    },

                    "JSDocComment": function(eventArgs) {
                        var comment = eventArgs.node;
                        var memberOfTag = comment.getTag("memberOf");
                        var nameTag = comment.getTag("name");

                        if (memberOfTag && nameTag) {
                            

                            var targetType = eventArgs.symbols.resolveSymbolType(memberOfTag.getValue());
                            
                            if (targetType) {
                                var resolvedType = createTypeForComment(comment);
                                if (resolvedType) {
                                    targetType.setProperty({
                                        name: nameTag.getValue(),
                                        type: resolvedType,
                                        comment: comment
                                    });
                                }
                            }
                        }
                    }
                
                }, this);
                
                env.getGlobal().addProperties({
                    "raptor": {
                        "require": function(node, walker) {
                            var args = node['arguments'];
                            if (args && args.length === 1) {
                                var nameArg = args[0];
                                if (nameArg.type === 'Literal') {
                                    var name = nameArg.value;
                                    var requiredType = walker.symbols.getSymbolType(name);
                                    return requiredType;
                                }
                            }
                        },
                        
                        "define": function(node, walker) {
                            return resolveDefine("raptor.define", node, walker);
                        },
                        
                        "defineClass": function(node, walker) {
                            return resolveDefine("raptor.defineClass", node, walker, true);
                        },
                        
                        "defineModule": function(node, walker) {
                            return resolveDefine("raptor.defineModule", node, walker);
                        },
                        
                        "extendCore": function(node, walker) {
                            return resolveExtend("raptor.extendCore", node, walker);
                        },
                        
                        "extend": function(node, walker) {
                            return resolveExtend("raptor.extend", node, walker);
                        }     
                    }
                });
            }
        };
    });