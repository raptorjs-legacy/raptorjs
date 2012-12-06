var Type = require("raptor/jsdoc/Type");
var logger = require('raptor/logging').logger('resolver-define.extend');

module.exports = function(methodName, node, walker) {
    "use strict";
    
    var extensionFor = null,
        args = node['arguments'],
        comment = node.comment,
        targetType = null,
        mixinType = null;

    if (args.length !== 2) {
        logger.debug('WARNING: Invalid number of arguments to "' + methodName + "'. Argument count: " + args.length);
    }
    
    var nameNode = args[0];
    var defNode = args[1];
    
    if (nameNode.type === 'Literal') {
        extensionFor = nameNode.value;
    }
    else {
        targetType = walker.resolveType(nameNode);
        if (!targetType) {
            return;
        }
    }

    if (defNode.type === 'FunctionExpression') {
        var targetArgType = new Type();

        var scope = walker.invokeFunctionExpression(defNode, {
            "raptor": walker.resolveVar("raptor"),
            "target": targetArgType
        });

        mixinType = scope.returnType || new Type();
        targetArgType.forEachProperty(function(mixinProp) {
            mixinType.setProperty(mixinProp);
        });
    }
    else if (defNode.type === 'ObjectExpression') {
        mixinType = walker.resolveType(defNode);       
    }

    if (comment && comment.hasTag("extensionFor")) {
        extensionFor = comment.getTagValue("extensionFor");
    }

    

    if (extensionFor && mixinType && comment && comment.hasTag("extension")) {
        if (node.comment) {
            mixinType.setComment(node.comment);    
        }
        
        mixinType.extensionFor = extensionFor;
        mixinType.label = extensionFor; //The extension suffix will be added by the getLabel() method
        walker.getSymbols().addSymbol(extensionFor + "_" + comment.getTag("extension").getValue().replace(/ /g, '_'), mixinType);
    }
    
    return targetType;
};