define(
    'raptor/templating/taglibs/optimizer/PageTagTransformer',
    function(require, exports, module) {
        "use strict";
        
        return {
            process: function(node, compiler, template) {
                var templatePath = template.makeExpression(JSON.stringify(template.getPath()));
                node.setProperty("templatePath", templatePath);
                

                var manifest = this.buildManifest(node, templatePath);
                if (manifest) {
                    node.setProperty("package-manifest", manifest);
                }
            },

            buildManifest: function(node, templatePath) {

                var manifest = null;

                node.forEachChild(function(child) {
                    if (child.tagName === 'dependencies' || child.tagName === 'includes') {
                        manifest = {};

                        var dependencies;

                        manifest.dependencies = dependencies = [];

                        child.forEachChild(function(child) {
                            if (child.isElementNode()) {
                                var dependency = {
                                    type: child.tagName
                                };

                                child.forEachAttributeAnyNS(function(attr) {
                                    var value = attr.value;
                                    if (value === 'true') {
                                        value = true;
                                    }
                                    else if (value === 'false') {
                                        value = false;
                                    }
                                    
                                    if (!attr.uri) {
                                        dependency[attr.localName] = value;
                                    }
                                }, this);

                                dependencies.push(dependency);
                            }
                        }, this);

                        return manifest;
                    }
                }, this);
                
                while(node.firstChild) {
                    node.firstChild.detach();
                }
                return manifest;
            }
        };
    });