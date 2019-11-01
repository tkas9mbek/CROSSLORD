const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const request = require("request");

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// API calls
app.get('/api/service1', (req, res) => {

    // get html code of website
    request({
        uri: "https://www.nytimes.com/crosswords/game/mini",
    }, function (error, response, body) {

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
            request({uri: today_uri},
                (error, response, body) => {
                    let start_ind = body.indexOf("<div class=\"card results-card\">");
                    let end_index = body.indexOf("</div><!-- results-card -->");
                    let clues = body.substring(start_ind, end_index);
                    let answer_uris = [];
                    while (clues.indexOf("<h1>") !== -1) {
                        let start = clues.indexOf("<h1><a href") + 14;
                        let end = clues.indexOf(">", start) - 1;
                        let ans_uri = "https://nytimescrosswordanswers.com/" + clues.substring(start, end);
                        answer_uris.push(ans_uri);
                        /*request({uri: ans_uri},
                            (error, response, body) => {
                                let start_ind = body.indexOf("clue", body.indexOf("<p><strong>")) + 6;
                                let end_ind = body.indexOf("</a>", start_ind);
                                let clue = body.substring(start_ind, end_ind);
                                res.send({clue});
                            }
                        );*/
                        clues = clues.substring(end);
                    }
                    res.send({answer_uris});
                }
            );
        }
    );
    //res.send({answers: [{}, {},]});
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