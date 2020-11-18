document.addEventListener('DOMContentLoaded', function() {

    // Checkmarks in installation
    [].slice.call(document.querySelectorAll('#installation a')).map(el => {
        console.log(el);
        el.addEventListener("click", () => {
            if(el.innerHTML.indexOf('✅') == -1) el.innerHTML += ' ✅';
        });
    });

    // Copy install code
    let installCode;
    fetch('install.js').then(res => res.text()).then((source) => installCode = source);
    document.querySelector('#copyInstaller').addEventListener("click", function(event) {
        Clipboard.copy(installCode);
        alert('The installation code has been copied to your pasteboard.');
        event.preventDefault();
    });

    // Installation page
    if(document.location.search) {
        [].slice.call(document.querySelectorAll('[x-hide-install]')).map(el => el.style.display = 'none');
        query = parseQuery(document.location.search);
        document.querySelector('#scriptName').innerText = query.name;
        document.querySelector('#scriptdudeInstaller').href += '&' + document.location.search.substr(1);
    } else {
        [].slice.call(document.querySelectorAll('[x-hide-home]')).map(el => el.style.display = 'none');
    }

}, false);

// Code from https://stackoverflow.com/a/13419367
function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent((pair[1] || '').replaceAll('+', '%20'));
    }
    return query;
}

// Code from https://gist.github.com/rproenca/64781c6a1329b48a455b645d361a9aa3
window.Clipboard = (function(window, document, navigator) {
    var textArea, copy;

    function isOS() {
        return navigator.userAgent.match(/ipad|iphone/i);
    }

    function createTextArea(text) {
        textArea = document.createElement('textArea');
        textArea.value = text;
        document.body.appendChild(textArea);
    }

    function selectText() {
        var range, selection;
        if (isOS()) {
            range = document.createRange();
            range.selectNodeContents(textArea);
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            textArea.setSelectionRange(0, 999999);
        } else {
            textArea.select();
        }
    }

    function copyToClipboard() {        
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    copy = function(text) {
        createTextArea(text);
        selectText();
        copyToClipboard();
    };

    return {
        copy: copy
    };
})(window, document, navigator);