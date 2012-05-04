$(function () {
    var defaultSearchValue = "Search API docs";
    
    $("#searchInput").focus(function() {
        if ($(this).val() == defaultSearchValue) {
            $(this).val("");
        }
    }).blur(function() {
        if ($(this).val() == "") {
            $(this).val(defaultSearchValue);
        }
    }).autocomplete(autocompleteSymbols, {
      formatItem: function(item) {
        return '<span class="ac-icon ac-icon-' + item.type + '"></span> ' + item.text;
      },
      matchContains: true,
      max: 50,
      width: 350
    }).result(function(event, item) {
      location.href = window.symbolsBase + item.url;
    });
    
    
    var win = $(window);
    
    var updateIndexHeight = function() {
        var winHeight = win.height();
        var headerHeight = $('#header').outerHeight();
        var indexHeight = winHeight - headerHeight;
        
        $("#index").height(indexHeight);
    }
    
    win.resize(function() {
        updateIndexHeight();
    });
    updateIndexHeight();
    
    
    
    
    var initially_open = [];
    
    
    if (window.alias) {
        var initiallyOpenId = window.classNavId;
        
        var hasChildren = window.classHasChildren;
        
        if (window.parentNavId && !hasChildren) {
            initially_open = [parentNavId];
        }
        else if (initiallyOpenId) {
            
            initially_open = [initiallyOpenId];
        }
    }
    
    $("#classListNav").jstree({
        "core" : { 
            "initially_open" : initially_open
        },
        "themes" : {
            "theme" : "classic",
            "dots" : false,
            "icons" : true
        },
        "plugins" : ["themes","html_data","crrm"]
    }).bind("select_node.jstree", function (event, data) {
        //debugger;
    });
    
    setTimeout(function() {
        $("#classListNavContainer").show();
    }, 0);
    
    var expanded = {};
    
    var toggleMore = function(moreAlias) {
        if (!moreAlias) return;
        
        expanded[moreAlias] = !expanded[moreAlias]; 
        $("#moreTarget_" + moreAlias).slideToggle();
        $("#moreLink_" + moreAlias).toggleClass("expanded")
    };
    
    $("body").on("click", ".expand-collapse-bar", function(event){
        toggleMore(this.getAttribute("data-moreAlias"));
    });
    
    $("#showPrivate").prop("checked", false);
    
    $("#showPrivate").click(function() {
        $("body").toggleClass("show-private");
    });
    
    $("#showProtected").prop("checked", false);
    
    $("#showProtected").click(function() {
        $("body").toggleClass("show-protected");
    });
    
    $("#expandAll").click(function() {
        $("DIV.expand-collapse-bar").each(function() {
            if (!expanded[this.getAttribute("data-moreAlias")]) {
                toggleMore(this.getAttribute("data-moreAlias"));
            }
             
        });
    });
    
    $("#collapseAll").click(function() {
        $("DIV.expand-collapse-bar").each(function() {
            if (expanded[this.getAttribute("data-moreAlias")]) {
                toggleMore(this.getAttribute("data-moreAlias"));
            }
             
        });
    });
    
    var manifestSourceVisible = false;
    $("#viewManifestSourceLink").click(function() {
        manifestSourceVisible = !manifestSourceVisible;
        
        $(this).html(manifestSourceVisible ? "Hide package.json" : "Show package.json");
        
        
        $("#manifestSourceDiv").slideToggle();
        return false;
    });
    
    var manifestVisible = false;
    $("#viewManifestLink").click(function() {
        manifestVisible = !manifestVisible;
        
        $(this).html(manifestVisible ? "Hide Module Manifest" : "Show Module Manifest");
        
        
        $("#manifestDiv").slideToggle();
        return false;
    });
    
    if (window.sh_highlightDocument) {
        sh_highlightDocument();
    }
});