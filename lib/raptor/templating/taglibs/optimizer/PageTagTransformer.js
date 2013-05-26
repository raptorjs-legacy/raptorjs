define(
    'raptor/templating/taglibs/optimizer/PageTagTransformer',
    function(require, exports, module) {
        "use strict";
        
        

        return {
            process: function(node, compiler, template) {
                var templatePath = template.makeExpression(JSON.stringify(template.getPath()));
                node.setProperty("templatePath", templatePath);
                
                function convertDependencyTags(parent) {
                    parent.forEachChild(function(child) {
                        if (child.isElementNode() && !child.uri) {
                            // Convert unnamespaced element nodes to "DependencyTag" nodes

                            child.tag = compiler.taglibs.getTag('optimizer', 'dependency');


                            child.setProperty('type', child.localName);

                            child.forEachAttributeNS('', function(attr) {
                                var value = attr.value;
                                if (value === 'true') {
                                    value = true;
                                }
                                else if (value === 'false') {
                                    value = false;
                                }
                                else {
                                    value = compiler.convertType(value, 'string', true /* allow expressins */);
                                }

                                child.setProperty(attr.localName, value);
                            }, this);

                            child.removeAttributesNS('');
                        }
                        else {
                            convertDependencyTags(child);
                        }
                    }, this);
                }

                node.forEachChild(function(child) {
                    if (!child.uri && (child.tagName === 'dependencies' || child.tagName === 'includes')) {
                        child.tag = compiler.taglibs.getTag('optimizer', 'dependencies');
                        convertDependencyTags(child);
                    }
                }, this);
            }
        };
    });