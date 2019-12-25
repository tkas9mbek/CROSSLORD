const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const request = require("request");

const app = express();

const port = process.env.PORT || 5000;
const MAX_LENGTH = 160;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

async function replaceWord( word, sentence) {

    let startAns = sentence.toUpperCase().indexOf( word.toUpperCase());

    if (startAns !== -1) {
        if( ( startAns === 0 ||sentence.charAt(startAns - 1) === ' ' )
            && (sentence.charAt(startAns + word.length) === ' ' || sentence.charAt(startAns + word.length) === ','
                || sentence.charAt(startAns + word.length) === ',' || startAns + word.length >= sentence.length)) {
            sentence = sentence.substr(0, startAns) + "___" + sentence.substr(startAns + word.length, sentence.length);
        }
    }

    startAns = sentence.toUpperCase().indexOf(word.toUpperCase().substr(0, word.length - 1));
    if (startAns !== -1) {
        if( ( startAns === 0 || sentence.charAt(startAns - 1) === ' ' )
            &&  (sentence.charAt(startAns + word.length) === ' ' || sentence.charAt(startAns + word.length) === ','
                || sentence.charAt(startAns + word.length) === ',' || startAns + word.length >= sentence.length)) {
            sentence = sentence.substr(0, startAns) + "___" + sentence.substr(startAns + word.length, sentence.length);
        }
    }

    word = word.concat('s');
    startAns = sentence.toUpperCase().indexOf(word.toUpperCase());
    if (startAns !== -1) {
        if( ( startAns === 0 ||sentence.charAt(startAns - 1) === ' ' )
            && (sentence.charAt(startAns + word.length) === ' ' || sentence.charAt(startAns + word.length) === ','
                || sentence.charAt(startAns + word.length) === ',' || startAns + word.length >= sentence.length)) {
            sentence = sentence.substr(0, startAns) + "___" + sentence.substr(startAns + word.length, sentence.length);
        }
    }

    if(sentence.toLowerCase().includes("fuck") || sentence.toLowerCase().includes("ass") ||
        sentence.toLowerCase().includes("bitch") || sentence.toLowerCase().includes("nigga") ||
        sentence.toLowerCase().includes("sex") || sentence.toLowerCase().includes("pussy") ||
        sentence.toLowerCase().includes("marijuana") || sentence.toLowerCase().includes("weed") ||
        sentence.toLowerCase().includes("buttocks")) {
        return ({
            clue: "Not Found"
        });
    }

    return ({
        clue: sentence
    });
}

async function normalizeString( given, definition, additional) {

    for(let i = 0; i < definition.length; i++){
        definition = await definition.replace('&apos;', "'")
            .replace('&#39;', "'")
            .replace('&lt;', "<")
            .replace('&gt;', ">")
            .replace('&apos;', "'")
            .replace(':D', "")
            .replace('\n', "")
            .replace('&quot;', '"');

        additional.forEach( key => {
            definition = definition.replace(key, "");
        });
    }

    definition = definition.substr(
        definition.substr(0, 7).indexOf("(") === -1 ? 0 : definition.indexOf(")") + 2
    );

    if(definition.indexOf("1.") !== -1 && definition.indexOf("2.") !== -1 ) {
        definition = definition.substr(
            definition.indexOf("1.") + 3,  definition.indexOf("2") - 4
        );
    }

    if(definition.toLowerCase().indexOf("b.") !== -1 && definition.toLowerCase().indexOf("a.") !== -1 ) {
        definition = definition.substr(
            definition.indexOf("a.") + 3,  definition.indexOf("b.") - 4
        );
    }

    if(definition.toLowerCase().indexOf("b)") !== -1 && definition.toLowerCase().indexOf("a)") !== -1 ) {
        definition = definition.substr(
            definition.indexOf("a)") + 3,  definition.indexOf("b)") - 4
        );
    }

    while(definition.indexOf('<') !== -1 && definition.indexOf('>') !== -1) {
        definition = await definition.substr(0, definition.indexOf('<') )
            + definition.substr(definition.indexOf('>') + 1);
    }

    definition = definition.substr(
        definition.indexOf("1.") === -1 ? 0 : definition.indexOf("1.") + 3
    );

    definition = definition.substr(
        definition.indexOf("a.") === -1 ? 0 : definition.indexOf("a.") + 3
    );

    definition = definition.substr(
        definition.indexOf("a)") === -1 ? 0 : definition.indexOf("a)") + 3
    );

    definition = definition.substr(
        0,definition.indexOf(":", 12) === -1 ? definition.length : definition.indexOf(":", 18)
    );

    definition = definition.substr(
        0,definition.indexOf(";", 12) === -1 ? definition.length : definition.indexOf(";", 18)
    );

    definition = definition.substr(
        0,definition.indexOf(".", 18) === -1 ? definition.length : definition.indexOf(".",18)
    );

    definition = definition.substr(
        0,
        definition.indexOf("(", 25) === -1 ? definition.length : definition.indexOf("(", 30)
    );

    if( definition.length > 45){
         if( definition.indexOf(",", 35) !== -1 ) {
            definition = definition.substr(
                0,
                definition.indexOf(",", 35)
            );
        } else if( definition.indexOf(" is", 40) !== -1 ) {
            definition = definition.substr(
                0,
                definition.indexOf(" is", 40)
            );
        } else if( definition.indexOf(" and", 40) !== -1 ) {
            definition = definition.substr(
                0,
                definition.indexOf(" and", 40)
            );
        } else if( definition.indexOf(" in", 40) !== -1 ) {
             definition = definition.substr(
                 0,
                 definition.indexOf(" in", 40)
             );
         } else if( definition.indexOf(" from", 40) !== -1 ) {
             definition = definition.substr(
                 0,
                 definition.indexOf(" from", 40)
             );
         }  else if( definition.indexOf(" ", 80) !== -1 ) {
            definition = definition.substr(
                0,
                definition.indexOf(" ", 90)
            ) + " ...";
        }
    }

    return replaceWord(given, definition);
}

// API calls
app.get('/api/slang', function(req, res){

    const given = req.query.ans;

    // get html code of website
    request({
        uri: "http://onlineslangdictionary.com/search/?q=" + given + "&sa=Search",
    }, async function (error, response, body) {

        let startTitle = body.indexOf("/meaning-definition-of/");
        let endTitle = body.indexOf("\"", startTitle);

        let url = "http://onlineslangdictionary.com" + body.substring(
            startTitle,
            endTitle
        );

        if( startTitle === -1 || url.length > MAX_LENGTH || url.includes("/>") || url.includes(">")) {
            res.send(
                {
                    clue: "Not found"
                });
        }

        request({
            uri: url,
        }, async function (error, response, body) {

            if(body === undefined) {
                res.send(
                    {
                        clue: "Not found"
                    });
            }

            let startTitle = body.indexOf("<li>") + 4;
            let endTitle = body.indexOf(".", startTitle);

            let definition = body.substring(
                startTitle,
                endTitle
            );

            if(definition.indexOf(";", 70) !== -1){
                definition = definition.substring(0, definition.indexOf(";", 70));
            }

            if(definition.indexOf("\r") !== -1){
                definition = definition.substring(0, definition.indexOf("\r"));
            }

            if( startTitle === -1 || url.length > MAX_LENGTH || url.includes("/>") || url.includes(">")) {
                res.send(
                    {
                        clue: "Not found"
                    });
            }

            res.send(
                await normalizeString(given, definition, [])
            );

        });
    });
});

app.get('/api/merriam', function(req, res){

    const given = req.query.ans;

    // get html code of website
    request({
        uri: "https://www.merriam-webster.com/dictionary/" + given,
    }, async function (error, response, body) {

        if(body === undefined) {
            res.send(
                {
                    clue: "Not found"
                });
        }

        let startTitle = body.indexOf("definition is -") + 16;
        let endTitle = body.indexOf(".", startTitle + 40) > body.indexOf("\"", startTitle) ?
            body.indexOf("\"", startTitle + 40) : body.indexOf(".", startTitle);

        let definition = body.substring(
            startTitle,
            endTitle
        );

        if( startTitle === -1 || definition.length > MAX_LENGTH || definition.includes("/>") || definition.includes(">")) {
            res.send(
                {
                    clue: "Not found"
                });
        }

        res.send(
            await normalizeString(given, definition, ['—'])
        );

    });
});

app.get('/api/wiki', function(req, res){

    const given = req.query.ans;

    // console.log(given);
    //
    // if(given.toLowerCase() === "sarah") {
    //     res.send({
    //         clue: "The wife of Abraham and mother of Isaac in the Bible"
    //     });
    // }

    // get html code of website
    request({
        uri: "https://www.google.com/search?sort=relevance&q=" + given + "&title=Special%3ASearch&profile=advanced&fulltext=1&searchengineselect=google&as_sitesearch=en.wiktionary.org&advancedSearch-current=%7B%7D&ns0=1",
    }, async function (error, response, body) {

        let startTitle = body.indexOf("https://en.wiktionary.org/wiki/");
        let endTitle = body.indexOf("ping", startTitle) - 2;
        endTitle = body.indexOf("&", startTitle) < endTitle ? body.indexOf("&", startTitle) : endTitle;
        endTitle = body.indexOf("\"", startTitle) < endTitle ? body.indexOf("\"", startTitle) : endTitle;

        let url = body.substring(
            startTitle,
            endTitle
        );

        if( startTitle === -1 || url.length > 250 || url.includes("/>") || url.includes(">")) {
            res.send(
                {
                    clue: "Not found"
                });
        }

        request({
            uri: url,
        }, async function (error, response, body) {

            if(body === undefined) {
                res.send(
                    {
                        clue: "Not found"
                    });
            }

            let startTitle = body.indexOf("<span class=\"ib-brac\">)</span>") + 31;
            let endTitle = body.indexOf("</span>", startTitle);

            let definition = body.substring(
                startTitle,
                endTitle
            );

            let counter = 0;
            while(definition.indexOf('<') !== -1 && definition.indexOf('>') !== -1) {
                counter++;
                definition = await definition.substr(0, definition.indexOf('<'))
                    + definition.substr(definition.indexOf('>') + 1);
                if(counter > 20) {
                    res.send(
                        {
                            clue: "Not found"
                        });
                }
            }

            if(definition.indexOf(".") !== -1){
                definition = definition.substring(0, definition.indexOf("."));
            }

            if(definition.indexOf(":", 50) !== -1){
                definition = definition.substring(0, definition.indexOf(":", 50));
            }

            if(definition.indexOf(",", 20) !== -1){
                definition = definition.substring(0, definition.indexOf(",", 20));
            }

            if( startTitle === -1 || url.length > MAX_LENGTH || url.includes("/>") || url.includes(">")) {
                res.send(
                    {
                        clue: "Not found"
                    });
            }

            res.send(
                await normalizeString(given, definition, [])
            );

        });
    });
});

app.get('/api/dictionary', function(req, res){

    const given = req.query.ans;

    // get html code of website
    request({
        uri: "https://www.dictionary.com/browse/" + given,
    }, async function (error, response, body) {

        if(body === undefined) {
            res.send(
                {
                    clue: "Not found"
                });
        }

        let startTitle = body.indexOf("definition, ") + 12;
        let endTitle = body.indexOf(";", startTitle) > body.indexOf(":", startTitle) ?
            body.indexOf(":", startTitle) : body.indexOf(";", startTitle);

        endTitle = body.indexOf(".", startTitle + 30) > endTitle ?
            endTitle : body.indexOf(".", startTitle + 30);

        let definition = body.substring(
            startTitle,
            endTitle
        );

        if( startTitle === -1 || definition.length > MAX_LENGTH || definition.includes("/>") || definition.includes(">")) {
            res.send(
                {
                    clue: "Not found"
                });
        }

        res.send(
            await normalizeString( given, definition, ["(def 1)"])
        );

    })
});

app.get('/api/urban', function(req, res){

    const given = req.query.ans;

    request({
        uri: "https://www.urbandictionary.com/define.php?term=" + given,
    }, async function (error, response, body) {

        if(body === undefined) {
            res.send(
                {
                    clue: "Not found"
                });
        }

        let startTitle = body.indexOf("property=\"fb:app_id\"><meta content=\"") + 36;
        let endTitle = body.indexOf(".", startTitle + 25) > body.indexOf(",", startTitle + 30) ?
            body.indexOf(",", startTitle + 30) : body.indexOf(".", startTitle + 25);

        endTitle = endTitle < body.indexOf("\"", startTitle) ?
            endTitle : body.indexOf("\"", startTitle);

        let title = body.substring(
            startTitle,
            endTitle
        );

        if( startTitle === -1 || title.length > MAX_LENGTH || title.includes("/>") || title.includes(">") || title === "harset=") {
            res.send(
                {
                    clue: "Not found"
                });
        }

        res.send(
            await normalizeString(given, title, [])
        );
    });
});

app.get('/api/service1', (req, res) => {

    // get html code of website
    request({
        uri: "https://www.nytimes.com/crosswords/game/mini",
    }, function (error, response, body) {

        console.log("Retrieving data from https://www.nytimes.com/crosswords/game/mini");

        let table = [
            [{no: ''}, {no: ''}, {no: ''}, {no: ''}, {no: ''}],
            [{no: ''}, {no: ''}, {no: ''}, {no: ''}, {no: ''}],
            [{no: ''}, {no: ''}, {no: ''}, {no: ''}, {no: ''}],
            [{no: ''}, {no: ''}, {no: ''}, {no: ''}, {no: ''}],
            [{no: ''}, {no: ''}, {no: ''}, {no: ''}, {no: ''}],
        ];

        for (let i = 0; i < 25; i++) {
            let cell;
            if (i === 24) {
                cell = body.substring(
                    body.indexOf("id=\"cell-id-" + i + "\"") + 1,
                    body.indexOf("</g><g data-group=\"grid\">")
                );
            } else {
                cell = body.substring(
                    body.indexOf("id=\"cell-id-" + i + "\"") + 1,
                    body.indexOf("id=\"cell-id-" + (i + 1) + "\"")
                );
            }
            table[Math.floor(i / 5)][i % 5].index = i;
            if (cell.includes("class=\"Cell-block--1oNaD")) {
                table[Math.floor(i / 5)][i % 5].no = '*';
                table[Math.floor(i / 5)][i % 5].color = 'black';
            } else {
                const c = cell.charAt(cell.indexOf('</text>') + 7 );
                console.log(cell + " \n");
                console.log(c + " " + i + " \n");
                if (c >= '0' && c <= '9') {
                    table[Math.floor(i / 5)][i % 5].no = c;
                }
            }
        }

        console.log("Table structure:");
        console.log(table);

        const clues = {
            across: {},
            down: {}
        };
        const acrossClues = body.substring(
            body.indexOf(">Across</h3>") + 1,
            body.indexOf(">Down</h3>")
        );

        let i = 0;
        while (acrossClues.indexOf("<span class=\"Clue-label--2IdMY\">", i) !== -1) {
            const no = acrossClues.charAt(acrossClues.indexOf("<span class=\"Clue-label--2IdMY\">", i) + 32);
            const clue = acrossClues.substring(
                acrossClues.indexOf("<span class=\"Clue-text--3lZl7\">", i) + 31,
                acrossClues.indexOf("</span></li>", i)
            );
            i++;
            clues.across[no] = clue;
        }

        console.log("Across clues:");
        console.log(clues.across);

        const downClues = body.substring(
            body.indexOf(">Down</h3>") + 1,
            body.indexOf(">Sitemap</a>")
        );
        i = 0;

        while (downClues.indexOf("<span class=\"Clue-label--2IdMY\">", i) !== -1) {
            const no = downClues.charAt(downClues.indexOf("<span class=\"Clue-label--2IdMY\">", i) + 32);
            const clue = downClues.substring(
                downClues.indexOf("<span class=\"Clue-text--3lZl7\">", i) + 31,
                downClues.indexOf("</span></li>", i)
            );
            i++;
            clues.down[no] = clue;
        }

        console.log("Down clues:");
        console.log(clues.down);

        res.send({
            table: table,
            clues: clues
        });
    });
});

app.get('/api/service2', (req, res) => {

    request({uri: "https://nytimescrosswordanswers.com/new-york-times-the-mini-crossword-answers"},
        (error, response, body) => {

            let start_ind = body.indexOf("<h1><a href=\"") + 14;
            let end_ind = body.indexOf(">", start_ind) - 1;
            let today_uri = "https://nytimescrosswordanswers.com/" + body.substring(start_ind, end_ind);

            let answers = [];

            console.log("Retrieving data from " + today_uri);
            console.log("Time-limit : " + req.query.time + " milliseconds\n");

            request({uri: today_uri},
                async (error, response, body) => {

                    let start_ind = body.indexOf("<div class=\"card results-card\">");
                    let end_index = body.indexOf("</div><!-- results-card -->");
                    let clues_uri = body.substring(start_ind, end_index);

                    let start = 0;

                    while (clues_uri.indexOf("<h1><a href=", start) !== -1) {

                        start = clues_uri.indexOf("<h1><a href", start) + 14;
                        let end = clues_uri.indexOf(">", start) - 1;
                        let ans_uri = "https://nytimescrosswordanswers.com/" + clues_uri.substring(start, end);

                        await request({uri: ans_uri},
                            (error, response, body) => {

                                const clue = body.substring(
                                    body.indexOf(">", body.indexOf("<strong><a href=") + 16) + 1,
                                    body.indexOf("</a></strong>")
                                );

                                let ans = "";

                                const possibleAns = body.substring(
                                    body.indexOf("<h2>Possible Answer</h2>"),
                                    body.indexOf("<br>", body.indexOf("<h2>Possible Answer</h2>"))
                                );

                                let spanStart = 0;

                                while (possibleAns.indexOf("<span class=\"l\">", spanStart) !== -1) {
                                    spanStart = possibleAns.indexOf("<span class=\"l\">", spanStart) + 16;
                                    ans = ans + possibleAns.substring(
                                        spanStart,
                                        possibleAns.indexOf("</span>", spanStart)
                                    );
                                }

                                answers.push({
                                        clue: clue,
                                        ans: ans
                                    }
                                );

                                console.log({
                                    clue: clue,
                                    ans: ans
                                })

                            });

                    }

                    await setTimeout(function(){

                        console.log(answers);

                        res.send({
                            answers: answers,
                        });

                    }, req.query.time);
                });
        });
});

if (process.env.NODE_ENV === 'production') {
    // Serve any static files
    app.use(express.static(path.join(__dirname, 'client/build')));
    // Handle React routing, return all requests to React app
    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
}

app.listen(port, () => console.log(`listening on port ${port}`));