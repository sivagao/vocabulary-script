function addLink(href) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }
    style = document.createElement('link');
    style.type = 'text/css';
    style.rel = "stylesheet";
    style.href = href;
    head.appendChild(style);
}

function addScript(src) {
    var head, script;
    head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }
    script = document.createElement('script');
    script.src = src;
    head.appendChild(script);
}
// addLink('http://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.1.1/css/bootstrap.min.css');
addLink(location.protocol + '//cdnjs.cloudflare.com/ajax/libs/uikit/2.6.0/css/uikit.almost-flat.css');
// addScript(location.protocol + '//cdnjs.cloudflare.com/ajax/libs/uikit/2.6.0/js/uikit.js');

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}
addGlobalStyle('.OUTFOX_NANCI_TIPS {color: #008000;}.OUTFOX_NANCI_WRAPPER {color: #F00;}#newwordTable .word{color: red;}#newwordTable{position: absolute;background: #808080;z-index: 100000;left: 50%;margin-left: -480px;width: 960px;line-height: 24px;font-size: 16px;}#newwordTable .sentence b{color: green;}body .uk-form-horizontal .uk-form-label {width: 100px;}body .uk-form-horizontal .uk-form-controls {margin-left: 115px;}');

var _bodyMarginTop;

function activeYDictBookmarklet() {
    if (!$('#OUTFOX_BAR_WRAPPER').length) {
        void((function() {
            var element = document.createElement('script');
            element.id = 'outfox_seed_js';
            element.charset = 'utf-8', element.setAttribute('src', location.protocol + '//fanyi.youdao.com/web2/seed.js?' + Date.parse(new Date()));
            document.body.appendChild(element);
        })())
        return;
    }
    if ($('#OUTFOX_BAR_WRAPPER').css('display') === 'none') {
        $('#OUTFOX_BAR_WRAPPER').show();
        $('body').css('marginTop', bodyMarginTop);
    } else {
        bodyMarginTop = $('body').css('marginTop');
        $('body').css('marginTop', '');
        $('#OUTFOX_BAR_WRAPPER').hide();
    }
}
key('d', activeYDictBookmarklet);

key('t', activeNewWordTable);

key('f', toggleAddWordModal);

function activeNewWordTable() {
    if ((!$('#newwordTable').length) || ($('#newwordTable').css('display') === 'none')) {
        var hasExtractWords = [];

        function extractWordSentence($word) {
            $word = $($word);
            var paraStr = $word.parent().text();
            var wordStr = $word.text();
            if (hasExtractWords.indexOf(wordStr) > -1) {
                return;
            }
            hasExtractWords.push(wordStr);
            var a = eval('/[^“.!?]*?WORD\\([^“.!?]*/'.replace('WORD', wordStr));
            // console.log(a.exec(paraStr)[0].replace(/\n/g,'').replace(/\s{2,}/g,''));
            return {
                word: wordStr,
                sentence: a.exec(paraStr)[0].replace(/\n/g, '').replace(/\s{2,}/g, '').replace(wordStr, '<b>' + wordStr + '</b>')
            }
            // todo- annote current word using font[color=red] etc
        }

        var extractedDict = _.map($('.OUTFOX_NANCI_WRAPPER'), function(w) {
            return extractWordSentence(w);
        });

        extractedDict = _.filter(extractedDict, function(i) {
            // cleanup none item
            if (i) {
                return i;
            }
        });

        postBackend(extractedDict);

        var TrList = "<% _.each(extractedDict, function(i) { %> <tr><td class='word'><%= i.word %></td><td class='sentence'><%= i.sentence %></td></tr> <% }); %>";

        var wordSentenceTableHtml = _.template(TrList, {
            extractedDict: extractedDict
        });

        // $('body').html($('<table />').html(wordSentenceTableHtml).html())
        if (!$('#newwordTable').length) {
            $('<table class="table" id="newwordTable" />').html('<tbody>' + wordSentenceTableHtml + '</tbody>').prependTo('body');
        } else {
            $('#newwordTable').html('<tbody>' + wordSentenceTableHtml + '</tbody>').show();
        }
    } else {
        $('#newwordTable').hide();
    }
}

var hasPostBackend = false;

function postBackend(wordArray) {
    if (hasPostBackend) return;
    // update wordDict suitable for backend api interface
    var data = _.map(wordArray, function(item) {
        var sentences = [];
        sentences.push(item.sentence);
        return {
            word: item.word,
            sentences: sentences
        };
    });
    $.ajax({
        url: 'http://localhost:3000/batch/word',
        type: "POST",
        contentType: 'application/json',
        success: function(resp) {
            console.log(resp);
        },
        data: JSON.stringify({
            title: document.title,
            url: location.href,
            batchWords: data
        })
    });
    hasPostBackend = true;
}

function getSelectionText() {
    var selection = window.getSelection();
    var range = selection.getRangeAt(0);
    if (range) {
        return range.cloneContents().textContent;
    } else {
        return '';
    }
}


var modal;

function toggleAddWordModal() {
    modal = new $.UIkit.modal.Modal("#newWordModal"); // using $data of element
    if (modal.isActive()) {
        modal.hide();
    } else {
        $('#newWordSentence').val(getSelectionText());
        modal.show();
    }
}

function newWordSubmitHandler(e) {
    e.preventDefault();
    var $form = $('#newWordModal');
    var newWordInput = $form.find('#newWordInput').val();
    var newWordSentence = $form.find('#newWordSentence').val();
    if (newWordInput && newWordSentence) {
        var sentences = [];
        sentences.push(newWordSentence);
        $.ajax({
            url: 'http://localhost:3000/word/' + newWordInput,
            type: "POST",
            contentType: 'application/json',
            success: function(resp) {
                modal.hide();
            },
            data: JSON.stringify({
                sentences: sentences
            })
        });
    }
}

function initNewWordModal() {
    var htmlStr = [
        '<div id="newWordModal" class="uk-modal">',
        '<div class="uk-modal-dialog"><a class="uk-modal-close uk-close"></a>',
        '<form class="uk-form uk-form-horizontal">',
        '<div class="uk-form-row"><div class="uk-form-label">Word</div><div class="uk-form-controls" style="text-align: left;"><input type="text" class="uk-form-width-medium" id="newWordInput"></div></div>',
        '<div class="uk-form-row"><div class="uk-form-label">Sentence</div><div class="uk-form-controls"><textarea rows="10" class="uk-form-width-large" id="newWordSentence"></textarea></div></div>',
        '<div class="uk-form-row"><div class="uk-form-controls"><button class="uk-button" id="newWordSubmit">保存</button></div></div>',
        '</div></div>'
    ].join('');
    $('body').append($(htmlStr));
    $('#newWordSubmit').click(newWordSubmitHandler);
}
initNewWordModal();