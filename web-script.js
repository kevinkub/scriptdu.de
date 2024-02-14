document.addEventListener('DOMContentLoaded', async function() {

    // Checkmarks in installation
    addCheckmarkToLinks('#installation a')

    // Copy install code
    let installCode;
    await fetch('install.js').then(res => res.text()).then((source) => installCode = source);
    setupCopyListener('#copyInstaller', installCode, "The installation code has been copied to your pasteboard.");
    
    // Installation page
    if(document.location.search) {
        [].slice.call(document.querySelectorAll('[x-hide-install]')).map(el => el.style.display = 'none');
        query = parseQuery(document.location.search);
        
        document.querySelector('#scriptName').innerText = query.name;

        const pageOrigin = new URL(document.location.href).origin;
        const pageUrl = appendParamsToUrl(pageOrigin, query);

        const pageQuery = pageUrl.replace(`${pageOrigin}?`, '');
        document.querySelector('#scriptdudeInstaller').href += '&' + pageQuery;

        const directLink = (document.querySelector('#link').innerText = pageUrl);
        setupCopyListener('#copyLinkToDirectLink', directLink, "The link has been copied to your pasteboard.");
        addCheckmarkToLinks('#copyLinkToDirectLink')

        const markdown = `[![Download with ScriptDude](https://scriptdu.de/download.svg)](${pageUrl})`;
        document.querySelector('#markdown').innerText = markdown;
        setupCopyListener('#copyLinkToButtonMarkdown', markdown, "Markdown has been copied to your pasteboard.");
        addCheckmarkToLinks('#copyLinkToButtonMarkdown')
        
        const html = `<a href="${pageUrl}"><img alt="Download with ScriptDude" src="https://scriptdu.de/download.svg"></a>`;
        const safeHtml = '<a href="#" target="_blank"><img alt="Download with ScriptDude" src="https://scriptdu.de/download.svg"></a>';
        document.querySelector('#html').innerText = html;
        setupCopyListener('#copyLinkToButtonHtml', html, "HTML link has been copied to your pasteboard.");
        addCheckmarkToLinks('#copyLinkToButtonHtml')

        document.querySelector('#markdown-preview').innerHTML = safeHtml;
        document.querySelector('#html-preview').innerHTML = safeHtml;
    } else {
        [].slice.call(document.querySelectorAll('[x-hide-home]')).map(el => el.style.display = 'none');
    }

}, false);

function addCheckmarkToLinks(selector) {
    const links = document.querySelectorAll(selector);
    links.forEach(function (el) {
        el.addEventListener('click', function () {
            if (el.innerHTML.indexOf('✅') === -1) {
                el.innerHTML += ' ✅';
            }
        });
    });
}

function setupCopyListener(selector, copyValue, alertMessage) {
    document.querySelector(selector).addEventListener('click', (event) => {
        Clipboard.copy(copyValue);
        if (alertMessage) alert(alertMessage);
        event.preventDefault();
    });
}

function appendParamsToUrl(baseUrl, queryParameters) {
    const queryString = Object.entries(queryParameters)
        .map((parameter) => {
            const [key, value] = parameter;
            let encodedValue = encodeURIComponent(value);
            if (key === "name") encodedValue.replace("+", "%20");
            return `${encodeURIComponent(key)}=${encodedValue}`;
        })
        .join("&");
    return `${baseUrl}?${queryString}`;
}

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