/**
 * Defines a class. This is identical to identical to "define" except that it supports a short-hand notation for classes
 * 
 * Multiple signatures supported:
 * <ul>
 * <li>defineClass(name, modifiers, factory)
 * <li>defineClass(name, superclassName, factory)
 * <li>defineClass(name, factory)
 * <li>defineClass(modifiers, factory)
 * <li>defineClass(factory)
 * </ul>
 * 
 * Supported modifiers:
 * <ul>
 * <li>superclass: The name of the super class
 * <li>mixins: An array of names of mixins
 * </ul>
 * 
 * In addition, the "modifiers" parameter can be a string that specifies the name of the superclass
 *
 * <h2>Examples: Class with prototype</h2>
 * <js>
 * raptor.defineClass(
 *     'some.namespace.MyClass',
 *     function() {
 *         return {
 *             init: function() {
 *                 //Constructor 
 *             },
 *             
 *             //Prototype methods:
 *             someMethod: function() { ... }
 *         }
 *     });
 * </js>
 * 
 * @param name The name of the class (if not provided then class is built is an anonymous class and immediately returned
 * @param modifiers Optional modifiers (see above)
 * @param factory A factory function that returns either the class constructory function (with prototype)
 *                or just the prototype
 * 
 * @returns {void|function} Returns the class constructor function if the class is anonymous, otherwise nothing is returned
 */