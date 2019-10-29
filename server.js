const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const request = require("request");

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API calls
app.get('/api/service1', (req, res) => {

    // get html code of website
    request({
        uri: "https://www.nytimes.com/crosswords/game/mini",
    }, function(error, response, body) {

        let table = [
            [{no: ''}, {no: ''}, {no: ''}, {no: ''}, {no: ''}],
            [{no: ''}, {no: ''}, {no: ''}, {no: ''}, {no: ''}],
            [{no: ''}, {no: ''}, {no: ''}, {no: ''}, {no: ''}],
            [{no: ''}, {no: ''}, {no: ''}, {no: ''}, {no: ''}],
            [{no: ''}, {no: ''}, {no: ''}, {no: ''}, {no: ''}],
        ];

        for(let i = 0; i < 25; i++){
            let cell;

            if( i === 24) {
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

            table[ Math.floor(i / 5) ][i % 5].index = i;

            if( cell.includes( "class=\"Cell-block--1oNaD\"")){
                table[ Math.floor(i / 5) ][i % 5].no = '*';
                table[ Math.floor(i / 5) ][i % 5].color = 'black';
            } else {

                const c = cell.charAt( cell.indexOf('</text>') - 1);

                if (c >= '0' && c <= '9') {
                    table[ Math.floor(i / 5) ][i % 5].no = c;
                    table[ Math.floor(i / 5) ][i % 5].color = 'white';
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

        // </span></li>
        let i = 0;
        while ( acrossClues.indexOf("<span class=\"Clue-label--2IdMY\">", i) !== -1){

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

        while ( downClues.indexOf("<span class=\"Clue-label--2IdMY\">", i) !== -1){

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



    // res.send(
    //     {
    //         table: [
    //             ['*', '1', '2', '3', '4']
    //         ],
    //         clues: {
    //             across: {
    //                 1: "clue1",
    //                 3: "clue2"
    //             },
    //             down: {
    //                 2: "clue1",
    //                 3: "clue2"
    //             }
    //         }
    //     });
});

app.get('/api/service2', (req, res) => {
    res.send(
        {
            answers: [
                {
                    clue: "peace of cake",
                    ans: "easy"
                },
                {
                    clue: "the best guy from Tajikistan",
                    ans: "islom"
                },
            ]

        });
});

if (process.env.NODE_ENV === 'production') {
    // Serve any static files
    app.use(express.static(path.join(__dirname, 'client/build')));

    // Handle React routing, return all requests to React app
    app.get('*', function(req, res) {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
}

app.listen(port, () => console.log(`listening on port ${port}`));