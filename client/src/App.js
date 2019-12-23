import React, { Component } from 'react';

import './App.css';
import {Grid, Icon, Message,Table} from "semantic-ui-react";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import { trainModel, getOKChance } from "./clue-predictor-ai/model";

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class App extends Component {
    state = {
        inputs: [],
        message: [
            {
                header: "Getting the table and the clues from https://www.nytimes.com/crosswords/game/mini",
            },
            {
                header: "Getting answers of the clues from https://nytimescrosswordanswers.com/",
            }
        ],
        table: [],
        downAns: [],
        acrossAns: [],
        loader: true,
        clues: {
            across: [],
            down: []
        },
        cluesSize: 7,
        possibleClues: {}
    };

    constructor(props) {
        super(props);

        let initialInputs = new Array(25).fill('');
        let newMsg = this.state.message;

        this.callApi('/api/service1')
            .then(res => {
                this.setState({
                    message: newMsg.splice(1, 1),
                    table: res.table,
                    clues: res.clues,
                    inputs: initialInputs,
                    cluesSize: Object.keys(res.clues.across).length + Object.keys(res.clues.down).length
                });

                this.callApi('/api/service2?time=5000')
                    .then(res =>{

                            if(res.answers.length < this.state.cluesSize){

                                newMsg[1].content = "No result returned in 5 seconds. Resending request with 18 seconds time-limit.";

                                // long time request
                                this.setState({
                                    message: newMsg
                                });

                                this.callApi('/api/service2?time=18000')
                                    .then(res =>{
                                            this.buildAnswers(res.answers);
                                        }
                                    )
                                    .catch(err => console.log(err));

                            } else {
                                this.buildAnswers(res.answers);
                            }
                        }
                    )
                    .catch(err => console.log(err));

            })
            .catch(err => console.log(err));
    }

    normalizeString(string) {
        for(let i = 0; i < string.length; i++){
            string = string.replace('"', '').replace(',', '').replace("'", '');
        }
        return string;
    }

    async buildAnswers( answers) {

        const {clues, table, message} = this.state;

        if (answers.length < this.state.cluesSize) {

            message[1].content = "No result returned in 15 seconds. Please check internet connection and" +
                " whether https://nytimescrosswordanswers.com/ is working!"

            this.setState({
                message: message
            });

            return;
        }

        let tableAnswers = new Array(25).fill('');
        let across = [];
        let down = [];

        let acrossKeys = Object.keys(clues.across);
        let downKeys = Object.keys(clues.down);

        for (let i = 0; i < acrossKeys.length; i++) {
            across.push(acrossKeys[i], this.normalizeString(clues.across[acrossKeys[i]]));
        }

        for (let i = 0; i < downKeys.length; i++) {
            down.push(downKeys[i], this.normalizeString(clues.down[downKeys[i]]));
        }

        for (let i = 0; i < answers.length; i++) {
            if (down.includes(answers[i].clue)) {
                down[down.findIndex(element => element === answers[i].clue)] = answers[i].ans;
            }
            if (across.includes(answers[i].clue)) {
                across[across.findIndex(element => element === answers[i].clue)] = answers[i].ans;
            }
        }

        for (let i = 0; i < table.length; i++) {
            for (let j = 0; j < table[i].length; j++) {
                if (table[i][j].no !== '') {

                    if (down.includes(table[i][j].no)) {
                        let word = down[down.findIndex(element => element === table[i][j].no) + 1];
                        for (let k = 0; k < word.length; k++) {

                            if (tableAnswers[table[i][j].index + k * 5] === '') {
                                tableAnswers[table[i][j].index + k * 5] = word.charAt(k);
                            }

                        }
                    }

                }
            }
        }


        for (let i = 0; i < table.length; i++) {
            for (let j = 0; j < table[i].length; j++) {
                if (table[i][j].no !== '') {

                    if (across.includes(table[i][j].no)) {
                        let word = across[across.findIndex(element => element === table[i][j].no) + 1];
                        for (let k = 0; k < word.length; k++) {

                            if (tableAnswers[table[i][j].index + k * 5] === '') {
                                tableAnswers[table[i][j].index + k * 5] = word.charAt(k);
                            }

                        }
                    }

                }
            }
        }

        message.splice(0, 1);

        for (let i = 0; i < down.length / 2; i++) {
            down[i] = down[2 * i] + ". " + down[2 * i + 1];
        }
        down.length = down.length / 2;

        for (let i = 0; i < across.length / 2; i++) {
            across[i] = across[2 * i] + ". " + across[2 * i + 1];
        }
        across.length = across.length / 2;

        this.setState({
            inputs: tableAnswers,
            message: message
        });

        this.setState({
            message: [{
                header: "Loading clue-ranker model"
            }]
        });

        const sentenceEncoder = await use.load();
        const trainedModel = await trainModel(sentenceEncoder);

        this.generateClues(down, "downAns", message, sentenceEncoder, trainedModel);
        this.generateClues(across, "acrossAns", message, sentenceEncoder, trainedModel);
    }

    async generateClues(down, side, message, sentenceEncoder, trainedModel) {

        let newDownClues = [];
        const possibleClues = this.state.possibleClues;

        for (let i = 0; i < down.length; i++) {

            const element = down[i];
            const answer = element.substr(3);
            let maxRank = -1;
            let newClue = element;
            let posString = "";

            possibleClues[answer] = {};

            message.push({
                header: "Generating new clue for : " + answer,
                content: "Searching Searching Merriam-Webster's Learner's Dictionary"
            });

            this.setState({
                message: message
            });

            await this.callApi('/api/merriam?ans=' + answer)
                .then( async res => {
                        const rank = await getOKChance(
                            trainedModel,
                            sentenceEncoder,
                            res.clue
                        );

                        // /*********************
                        possibleClues[answer].merriam = {clue: res.clue, rank: rank};
                        // /*****************

                        if(rank >= maxRank) {
                            maxRank = rank;
                            newClue = element.substr(0, 3) + res.clue;
                        }
                        message[i].content = "Searching UrbanDictionary.com";
                        posString = posString + rank + "%: (merriam) " + res.clue + ";   ";

                        this.setState({
                            message: message
                        });
                    }
                ).catch(err => console.log(err));

            await this.callApi('/api/urban?ans=' + answer)
                .then( async res => {
                        const rank = await getOKChance(
                            trainedModel,
                            sentenceEncoder,
                            res.clue
                        );

                        // /*********************
                        possibleClues[answer].urban = {clue: res.clue, rank: rank};
                        // /*****************

                        if(rank >= maxRank) {
                            maxRank = rank;
                            newClue = element.substr(0, 3) + res.clue;
                        }
                        message[i].content = "Searching Dictionary.com";
                        posString = posString + rank + "%: (urban) " + res.clue + ";   ";

                        this.setState({
                            message: message
                        });
                    }
                ).catch(err => console.log(err));

            await this.callApi('/api/dictionary?ans=' + answer)
                .then( async res => {
                        const rank = await getOKChance(
                            trainedModel,
                            sentenceEncoder,
                            res.clue
                        );

                        // /*********************
                        possibleClues[answer].dictionary = {clue: res.clue, rank: rank};
                        // /*****************

                        if(rank >= maxRank) {
                            maxRank = rank;
                            newClue = element.substr(0, 3) + res.clue;
                        }
                        message[i].content = "Searching The Online Slang Dictionary";
                        posString = posString + rank + "%: (dictionary) " + res.clue + ";   ";

                        this.setState({
                            message: message
                        });
                    }
                ).catch(err => console.log(err));

            await this.callApi('/api/slang?ans=' + answer)
                .then( async res => {
                        const rank = await getOKChance(
                            trainedModel,
                            sentenceEncoder,
                            res.clue
                        );

                        // /*********************
                        possibleClues[answer].slang = {clue: res.clue, rank: rank};
                        // /*****************

                        if(rank >= maxRank) {
                            maxRank = rank;
                            newClue = element.substr(0, 3) + res.clue;
                        }
                        message[i].content = "Searching wiki dictionary";
                        posString = posString + rank + "%: (slang) " + res.clue + ";   ";

                        this.setState({
                            message: message
                        });
                    }
                ).catch(err => console.log(err));

            await this.callApi('/api/wiki?ans=' + answer)
                .then( async res => {
                        const rank = await getOKChance(
                            trainedModel,
                            sentenceEncoder,
                            res.clue
                        );

                        // /*********************
                        possibleClues[answer].wiki = {clue: res.clue, rank: rank};
                        // /*****************
                        posString = posString + rank + "%: (wiki) " + res.clue + ";  ";

                        if(rank >= maxRank) {
                            maxRank = rank;
                            newClue = element.substr(0, 3) + res.clue;
                        }
                    }
                ).catch(err => console.log(err));

            // finalize
            newDownClues[element.substr(0, 1)] =
                newClue.substr(0,4).toUpperCase() + newClue.substr(4);

            message.splice(0, 1);

            console.log(possibleClues[answer]);

            this.setState({
                [side]: newDownClues,
                possibleClues: possibleClues,
                message: message,
            });
        }
    }

    componentDidMount() {
        const today = new Date();
        const todayDate = months[today.getMonth()] + " " + today.getDate() + ", " + today.getFullYear();

        this.setState({
            date: todayDate
        })
    }

    handleInputChange = (e) => {
        const target = e.target;
        const value = target.value;
        const name = target.name;

        let newInputs = this.state.inputs;
        newInputs[name] = value.toUpperCase();


        this.setState({
            inputs: newInputs
        });
    };

    callApi = async (uri) => {
        const response = await fetch(uri);
        const body = await response.json();
        if (response.status !== 200) throw Error(body.message);

        return body;
    };

    render() {

        const {table, clues, inputs, date, message,  downAns, acrossAns} = this.state;

        return (
            <Grid columns='equal'>

                <Grid.Row style={{marginTop: 15, marginLeft:50, marginRight:50}}>
                    <Grid.Column>
                        {
                            message.map( msg => (
                                <Message icon info floating>
                                    <Icon name='circle notched' loading/>
                                    <Message.Content>
                                        <Message.Header>{msg.header}</Message.Header>
                                        {msg.content}
                                    </Message.Content>
                                </Message>
                            ))
                        }
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>

                    <Grid.Column width={7}>
                        <Table celled padded className="square-table">
                            <Table.Body>

                                {table.map(row => (
                                        <Table.Row>
                                            {row.map(col => (
                                                <Table.Cell className="inner-cell"
                                                            style={{backgroundColor: col.color}}>

                                                    {col.no >= '0' && col.no <= '9' ?
                                                        <label className="sub-text">{col.no}</label>
                                                        : null}

                                                    <br/>

                                                    {col.no !== '*' ?
                                                        <input
                                                            style={{backgroundColor: col.color}}
                                                            type="text"
                                                            className="input-bar main-text"
                                                            maxLength="1"
                                                            name={col.index}
                                                            placeholder={inputs[col.index]}
                                                            value={inputs[col.index]}
                                                            onChange={this.handleInputChange}
                                                        />
                                                        : null}

                                                </Table.Cell>
                                            ))}
                                        </Table.Row>
                                    )
                                )}

                            </Table.Body>
                        </Table>

                        <br/>

                        <label className="date-text">
                            {date}
                        </label>

                        <br/><br/>

                        <label className="header-text">
                            CROSSLORD
                        </label>

                    </Grid.Column>

                    <Grid.Column width={4}>

                        <Table className="borderless">

                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell colSpan='3' className="clue-header">Across</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body className="clue-text">
                                {Object.keys(clues.across).map(datum =>
                                    (
                                        <Table.Row>
                                            <Table.Cell>
                                                {datum + ". " + clues.across[datum]}
                                            </Table.Cell>
                                        </Table.Row>
                                    )
                                )}
                            </Table.Body>
                        </Table>

                        <Table className="borderless">

                            <Table.Header className="clue-header">
                                <Table.Row>
                                    <Table.HeaderCell colSpan='3' className="clue-header">New Across Clues</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body className="clue-text">
                                {acrossAns.map(datum =>
                                    <Table.Row>
                                        <Table.Cell>
                                            {datum}
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>

                    </Grid.Column>

                    <Grid.Column width={4}>

                        <Table className="borderless">

                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell colSpan='3' className="clue-header">Down</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body className="clue-text">
                                {Object.keys(clues.down).map(datum =>
                                    (
                                        <Table.Row>
                                            <Table.Cell>
                                                {datum + ".  " + clues.down[datum]}
                                            </Table.Cell>
                                        </Table.Row>
                                    )
                                )}
                            </Table.Body>
                        </Table>

                        <Table className="borderless">

                            <Table.Header >
                                <Table.Row>
                                    <Table.HeaderCell colSpan='3' className="clue-header">New Down Clues</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body className="clue-text">
                                {downAns.map(datum => (
                                    <Table.Row>
                                        <Table.Cell>
                                            {datum}
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>

                    </Grid.Column>

                    <Grid.Column width={1}/>

                </Grid.Row>
            </Grid>
        );
    }
}

export default App;