import React, { Component } from 'react';

import './App.css';
import {Button, Dimmer, Grid, Icon, Image, Loader, Message, Segment, Table} from "semantic-ui-react";

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
        cluesSize: 7
    };

    constructor(props) {
        super(props);

        let initialInputs = new Array(25).fill('');

        let newMsg = this.state.message;

        this.callApi('/api/service1?time')
            .then(res => this.setState({
                message: newMsg.splice(1, 1),
                table: res.table,
                clues: res.clues,
                inputs: initialInputs,
                cluesSize: Object.keys(res.clues.across).length + Object.keys(res.clues.down).length
            }))
            .catch(err => console.log(err));

        this.callApi('/api/service2?time=5000')
            .then(res =>{

                    if(res.answers.length < this.state.cluesSize){

                        newMsg[0].content = "No result returned in 5 seconds. Resending request with 18 seconds time-limit.";

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
    }


    normalizeString(string) {
        for(let i = 0; i < string.length; i++){
            string = string.replace('"', '').replace(',', '').replace("'", '');
        }
        return string;
    }

    buildAnswers( answers) {

        const {clues, table, message} = this.state;

        if (answers.length < this.state.cluesSize) {

            message[0].content = "No result returned in 15 seconds. Please check internet connection and" +
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

        // console.log(down);
        // console.log(across);

        for (let i = 0; i < answers.length; i++) {
            if (down.includes(answers[i].clue)) {
                down[down.findIndex(element => element === answers[i].clue)] = answers[i].ans;
            }
            if (across.includes(answers[i].clue)) {
                across[across.findIndex(element => element === answers[i].clue)] = answers[i].ans;
            }
        }

        console.log(down);
        console.log(across);

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

        this.setState({
            inputs: tableAnswers,
            downAns: down,
            acrossAns: across,
            message: message
        })

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

        const {table, clues, inputs, date, message} = this.state;

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
                        <Table celled padded style={{width: 500, height: 500, marginLeft: 50}}>
                            <Table.Body>

                                {table.map(row => (
                                        <Table.Row>
                                            {row.map(col => (
                                                <Table.Cell
                                                    style={{backgroundColor: col.color}}>

                                                    {col.no >= '0' && col.no <= '9' ?
                                                        <label className="sub-text">{col.no}</label>
                                                        : null}

                                                    <br/>

                                                    {col.no !== '*' ?
                                                        <input
                                                            style={{backgroundColor: col.color}}
                                                            type="text"
                                                            className="input-text main-text"
                                                            maxLength="1"
                                                            autoCapitalize={true}
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

                        <Table key='black' className="borderless">

                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell colSpan='3'>Across</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
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

                    </Grid.Column>

                    <Grid.Column width={4}>

                        <Table key='black' className="borderless">

                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell colSpan='3'>Down</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
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

                    </Grid.Column>

                    <Grid.Column width={1}/>

                </Grid.Row>

            </Grid>
        );
    }
}

export default App;