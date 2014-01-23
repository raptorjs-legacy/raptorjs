var raptor = require('raptor');
var Type = require('raptor/jsdoc/Type');
module.exports = function (methodName, node, walker) {
    'use strict';
    var extensionFor = null, args = node['arguments'], comment = node.comment, targetType = null, mixinType = null, nameNode, defNode;
    var factoryArgs = [];
    args.forEach(function (arg, i) {
        if (arg.type === 'FunctionExpression') {
            defNode = arg;
        } else if (arg.type === 'Literal') {
            nameNode = arg;
        } else if (arg.type === 'ArrayExpression') {
            arg.elements.forEach(function (dependency) {
                if (dependency.value === 'require') {
                    var type = new Type('function');
                    type.resolver = function (id) {
                    };
                } else {
                    factoryArgs.push(new Type('object'));
                }
            }, this);
        }
    });
    if (!nameNode) {
        console.error('Invalid call to define.extend. Node: ', node);
        return;
    }
    if (nameNode.type === 'Literal') {
        extensionFor = raptor.normalize(nameNode.value);
    } else {
        targetType = walker.resolveType(nameNode);
        if (!targetType) {
            return;
        }
    }
    if (defNode.type === 'FunctionExpression') {
        var targetArgType = new Type();
        var scope = walker.invokeFunctionExpression(defNode, {
                'raptor': walker.resolveVar('raptor'),
                'target': targetArgType
            });
        mixinType = scope.returnType || new Type();
        targetArgType.forEachProperty(function (mixinProp) {
            mixinType.setProperty(mixinProp);
        });
    } else if (defNode.type === 'ObjectExpression') {
        mixinType = walker.resolveType(defNode);
    }
    if (comment && comment.hasTag('extensionFor')) {
        extensionFor = comment.getTagValue('extensionFor');
    }
    if (extensionFor && mixinType && comment && comment.hasTag('extension')) {
        if (node.comment) {
            mixinType.setComment(node.comment);
        }
        mixinType.extensionFor = extensionFor;
        mixinType.label = extensionFor;
        //The extension suffix will be added by the getLabel() method
        walker.getSymbols().addSymbol(extensionFor + '_' + comment.getTag('extension').getValue().replace(/ /g, '_'), mixinType);
    }
    return targetType;
};