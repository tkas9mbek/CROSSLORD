const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const request = require("request");

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

function replaceWord(word, sentence) {

    let startAns = sentence.toUpperCase().indexOf( word.toUpperCase() );

    if( startAns !== -1){
        sentence = sentence.substr(0, startAns) + "___ " + sentence.substr(startAns + word.length, sentence.length)
    } else {
        startAns = sentence.toUpperCase().indexOf( word.toUpperCase().substr(0, word.length - 1) );
        if( startAns !== -1){
            sentence = sentence.substr(0, startAns) + "___ " + sentence.substr(startAns + word.length, sentence.length)
        }
    }

    return sentence;
}

function normalizeString(string, additional) {
    for(let i = 0; i < string.length; i++){
        string = string.replace('&apos;', "'")
            .replace('&#39;', "'")
            .replace('&quot;', '"');
        additional.forEach( key => {
            string = string.replace(key, "");
        })
    }
    console.log(string);
    return string;
}

// API calls
app.get('/api/vocabulary', (req, res) => {

    const given = req.query.ans;
    // get html code of website
    request({
        uri: "https://www.vocabulary.com/dictionary/" + given,
    }, function (error, response, body) {

        let rank = 225;

        let startTitle = body.indexOf("<h3 class=\"definition\">") + 120;
        let endTitle = body.indexOf("</h3>", startTitle);

        let definition = body.substring(
            startTitle,
            endTitle
        );

        if( startTitle === -1 || definition.length > 300) {
            res.send({
                ans: req.query.ans,
                rank: -1,
                clue: "Not found"
            });

            return;
        }

        definition = normalizeString(definition, ["  ", "\t", "\n", "\r"]);
        const newDef = replaceWord(given, definition);

        if( newDef !== definition){
            rank = rank - 76;
        }

        res.send({
            ans: req.query.ans,
            rank: rank,
            clue: newDef
        });
    });
});

app.get('/api/merriam', (req, res) => {

    const given = req.query.ans;
    // get html code of website
    request({
        uri: "https://www.merriam-webster.com/dictionary/" + given,
    }, function (error, response, body) {

        let rank = 225;

        let startTitle = body.indexOf("definition is -") + 16;
        let endTitle = body.indexOf(".", startTitle) > body.indexOf("\"", startTitle) ?
            body.indexOf("\"", startTitle) : body.indexOf(".", startTitle);

        let definition = body.substring(
            startTitle,
            endTitle
        );

        if( startTitle === -1 || definition.length > 300) {
            res.send({
                ans: req.query.ans,
                rank: -1,
                clue: "Not found"
            });

            return;
        }

        if(definition.indexOf(",", 45) !== -1) {
            definition = definition.substr(0, definition.indexOf(",", 45));
        }

        definition = normalizeString(definition, []);
        const newDef = replaceWord(given, definition);

        if( newDef !== definition){
            rank = rank - 76;
        }

        res.send({
            ans: req.query.ans,
            rank: rank,
            clue: newDef
        });
    });
});

app.get('/api/dictionary', (req, res) => {

    const given = req.query.ans;
    // get html code of website
    request({
        uri: "https://www.dictionary.com/browse/" + given,
    }, function (error, response, body) {

        let rank = 225;

        let startTitle = body.indexOf("definition, ") + 12;
        let endTitle = body.indexOf(";", startTitle) > body.indexOf(":", startTitle) ?
            body.indexOf(":", startTitle) : body.indexOf(";", startTitle);

        endTitle = body.indexOf(".", startTitle) > endTitle ?
            endTitle : body.indexOf(".", startTitle);

        let definition = body.substring(
            startTitle,
            endTitle
        );

        if( startTitle === -1 || definition.length > 300) {
            res.send({
                ans: req.query.ans,
                rank: -1,
                clue: "Not found"
            });

            return;
        }

        if(definition.indexOf(",", 45) !== -1) {
            definition = definition.substr(0, definition.indexOf(",", 45));
        }

        definition = normalizeString(definition, []);
        const newDef = replaceWord(given, definition);

        if( newDef !== definition){
            rank = rank - 76;
        }

        res.send({
            ans: req.query.ans,
            rank: rank,
            clue: newDef
        });
    });
});

app.get('/api/urban', (req, res) => {

    const given = req.query.ans;
    // get html code of website
    request({
        uri: "https://www.urbandictionary.com/define.php?term=" + given,
    }, function (error, response, body) {

        let rank = 300;

        let startTitle = body.indexOf("property=\"fb:app_id\"><meta content=\"") + 36;
        let endTitle = body.indexOf(".", startTitle) > body.indexOf("\"", startTitle) ?
            body.indexOf("\"", startTitle) : body.indexOf(".", startTitle);

        let title = body.substring(
            startTitle,
            endTitle
        );

        if(title.indexOf(",", 45) !== -1) {
            title = title.substr(0, title.indexOf(",", 45));
        }

        title = normalizeString(title, []);
        const newTitle = replaceWord(given, title);

        if(newTitle !== title){
            rank = rank - 76;
        }

        res.send({
            ans: req.query.ans,
            rank: rank,
            clue: newTitle
        });
    });
});

app.get('/api/youtube', (req, res) => {

    const given = req.query.ans;
    // get html code of website
    request({
        uri: "https://www.youtube.com/results?search_query=" + given,
    }, function (error, response, body) {

        let startTitle = body.indexOf(" dir=\"ltr\">", body.indexOf(" dir=\"ltr\">") + 1000) + 10;

        let title = body.substring(
            startTitle,
            body.indexOf("</a>", startTitle)
        );

        title = normalizeString(title, ['.']);
        title = replaceWord(given, title);

        if(title.indexOf("[", 10) !== -1) {
            title = title.substr(0, title.indexOf("[", 10));
        }

        if(title.indexOf("(", 15) !== -1) {
            title = title.substr(0, title.indexOf("(", 15));
        }

        const views = body.substring(
            body.indexOf("önce</li><li>") + 13,
            body.indexOf("görüntüleme</li>")
        ).replace('.', '').replace('.', '').replace('.', '');

        res.send({
            ans: req.query.ans,
            rank: Math.ceil(views / 1000000),
            clue: title
        });
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
            if (cell.includes("class=\"Cell-block--1oNaD\"")) {
                table[Math.floor(i / 5)][i % 5].no = '*';
                table[Math.floor(i / 5)][i % 5].color = 'black';
            } else {
                const c = cell.charAt(cell.indexOf('</text>') - 1);
                if (c >= '0' && c <= '9') {
                    table[Math.floor(i / 5)][i % 5].no = c;
                    table[Math.floor(i / 5)][i % 5].color = 'white';
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