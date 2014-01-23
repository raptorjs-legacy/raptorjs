define('raptor/jsdoc/raptor-plugin', function (require, exports, module) {
    'use strict';
    var Type = require('raptor/jsdoc/Type'), resolveDefine = require('./resolver-define.js'), resolveExtend = require('./resolver-define.extend.js');
    return {
        load: function (env) {
            var createTypeForComment = function (comment) {
                var resolvedType;
                if (comment.hasTag('function')) {
                    resolvedType = new Type('function');
                    resolvedType.setComment(comment);
                    var paramTags = comment.getTags('param');
                    paramTags.forEach(function (paramTag) {
                        resolvedType.addFunctionParam({ name: paramTag.paramName });
                    }, this);
                    return resolvedType;
                }
                return null;
            };
            env.addHandlers({
                'property': function (eventArgs) {
                    var comment = eventArgs.comment;
                    if (comment) {
                        var resolvedType = createTypeForComment(comment);
                        if (resolvedType) {
                            eventArgs.setType(resolvedType);
                        }
                    }
                },
                'ReturnStatement': function (eventArgs) {
                    var comment = eventArgs.comment;
                    if (comment) {
                        var nameTag = comment.getTag('name');
                        if (nameTag) {
                            if (!eventArgs.node.resolvedReturnType) {
                            } else {
                                eventArgs.symbols.addSymbol(nameTag.getValue(), eventArgs.node.resolvedReturnType);
                            }
                        }
                    }
                },
                'assignment': function (eventArgs) {
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
                            var nameTag = comment.getTag('name');
                            resolvedType.setComment(comment);
                            if (nameTag && !comment.hasTag('memberOf')) {
                                var name = nameTag.getValue();
                                eventArgs.symbols.addSymbol(name, resolvedType);
                            }
                        }
                    }
                },
                'JSDocComment': function (eventArgs) {
                    var comment = eventArgs.node;
                    var memberOfTag = comment.getTag('memberOf');
                    var nameTag = comment.getTag('name');
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
                'require': function (node, walker) {
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
                'define': {
                    __function: function (node, walker) {
                        return resolveDefine('define', node, walker, false, false, false);
                    },
                    'Class': function (node, walker) {
                        return resolveDefine('define.Class', node, walker, true, false, false);
                    },
                    'extend': function (node, walker) {
                        return resolveExtend('define.extend', node, walker, false, true, false);
                    }
                }
            });
        }
    };
});