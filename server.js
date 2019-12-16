const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const request = require("request");

const app = express();

require('express-async-await')(app);

const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

function replaceWord(rank, word, sentence) {

    let startAns = sentence.toUpperCase().indexOf( word.toUpperCase());

    if( startAns !== -1){
        sentence = sentence.substr(0, startAns) + "___ " + sentence.substr(startAns + word.length, sentence.length);
        rank = rank - 75;
    } else {
        startAns = sentence.toUpperCase().indexOf(word.toUpperCase().substr(0, word.length - 1) );
        if( startAns !== -1){
            sentence = sentence.substr(0, startAns) + "___ " + sentence.substr(startAns + word.length, sentence.length);
            rank = rank - 44;
        }
    }

    return ({
        rank: rank,
        clue: sentence
    });
}

async function normalizeString(rank, given, definition, additional) {

    definition = definition.substr(
        definition.substr(0, 2).indexOf("(") === -1 ? 0 : definition.indexOf(")") + 1
    );

    definition = definition.substr(
        definition.substr(0, 2).indexOf("2.") === -1 ? 0 : definition.indexOf("2.")
    );

    definition = definition.substr(
        definition.substr(0, 2).toLowerCase().indexOf("b.") === -1 ? 0 : definition.indexOf("b.")
    );

    definition = definition.substr(
        0,
        definition.indexOf("(", 30) === -1 ? definition.length : definition.indexOf("(", 30)
    );

    if( definition.length > 120){
        definition = definition.substr(
            0,
            definition.indexOf(" ", 120)
        ) + " ...";
    }

    for(let i = 0; i < definition.length; i++){
        definition = await definition.replace('&apos;', "'")
            .replace('&#39;', "'")
            .replace('&quot;', '"');

        additional.forEach( key => {
            definition = definition.replace(key, "");
        });

        // cursing words replacer
        if(definition.toUpperCase().includes("FUCK") || definition.toUpperCase().includes("DICK") ||
            definition.toUpperCase().includes("COCK") || definition.toUpperCase().includes("PUSSY") ||
            definition.toUpperCase().includes("NIGGA") || definition.toUpperCase().includes("PENIS") ||
            definition.toUpperCase().includes("ASS") || definition.toUpperCase().includes("SEX") ||
            definition.toUpperCase().includes("SHIT") || definition.toUpperCase().includes("PISS") ||
            definition.toUpperCase().includes("NIGGER") || definition.toUpperCase().includes("BITCH") )
        {
            rank = -1;
        }
    }

    return replaceWord(rank, given, definition);
}

// API calls
app.get('/api/merriam', function(req, res){

    const given = req.query.ans;
    let rank = 280;

    // get html code of website
    request({
        uri: "https://www.merriam-webster.com/dictionary/" + given,
    }, async function (error, response, body) {


        let startTitle = body.indexOf("definition is -") + 16;
        let endTitle = body.indexOf(".", startTitle + 40) > body.indexOf("\"", startTitle) ?
            body.indexOf("\"", startTitlestartTitle + 40) : body.indexOf(".", startTitle);

        let definition = body.substring(
            startTitle,
            endTitle
        );

        if( startTitle === -1 || definition.length > 250 || definition.includes("/>") || definition.includes(">")) {
            res.send(
                {
                    rank: -1,
                    clue: "Not found"
                });
        }

        res.send(
            await normalizeString(rank, given, definition, [])
        );

    });
});

app.get('/api/dictionary', function(req, res){

    const given = req.query.ans;
    let rank = 320;

    // get html code of website
    request({
        uri: "https://www.dictionary.com/browse/" + given,
    }, async function (error, response, body) {

        let startTitle = body.indexOf("definition, ") + 12;
        let endTitle = body.indexOf(";", startTitle) > body.indexOf(":", startTitle) ?
            body.indexOf(":", startTitle) : body.indexOf(";", startTitle);

        endTitle = body.indexOf(".", startTitle + 30) > endTitle ?
            endTitle : body.indexOf(".", startTitle + 30);

        let definition = body.substring(
            startTitle,
            endTitle
        );

        if( startTitle === -1 || definition.length > 250 || definition.includes("/>") || definition.includes(">")) {
            res.send(
                {
                    rank: -1,
                    clue: "Not found"
                });
        }

        res.send(
            await normalizeString(rank, given, definition, ["(def 1)"])
        );

    })
});

app.get('/api/urban', function(req, res){

    const given = req.query.ans;
    let rank = 350;

    request({
        uri: "https://www.urbandictionary.com/define.php?term=" + given,
    }, async function (error, response, body) {


        let startTitle = body.indexOf("property=\"fb:app_id\"><meta content=\"") + 36;
        let endTitle = body.indexOf(".", startTitle + 40) > body.indexOf("\"", startTitle) ?
            body.indexOf("\"", startTitle) : body.indexOf(".", startTitle + 40);

        let title = body.substring(
            startTitle,
            endTitle
        );

        if(title.indexOf(",", 60) !== -1) {
            title = title.substr(0, title.indexOf(",", 60));
        }

        if( startTitle === -1 || title.length > 250 || title.includes("/>") || title.includes(">")) {
            res.send(
                {
                    rank: -1,
                    clue: "Not found"
                });
        }

        res.send(
            await normalizeString(rank, given, title, [])
        );
    });
});

app.get('/api/youtube', function(req, res){

    const given = req.query.ans;

    // get html code of website
    request({
        uri: "https://www.youtube.com/results?search_query=" + given,
    }, async function (error, response, body) {

        let startTitle = body.indexOf(" dir=\"ltr\">", body.indexOf(" dir=\"ltr\">") + 1000) + 10;

        let title = body.substring(
            startTitle,
            body.indexOf("</a>", startTitle)
        );

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

        if( startTitle === -1 || title.length > 300 || title.includes("/>") || title.includes("<")) {
            res.send(
                {
                    rank: -1,
                    clue: "Not found"
                });
        }

        res.send(
            await normalizeString(Math.ceil(views / 1000000) + 90, given, title, ['.', '>'])
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