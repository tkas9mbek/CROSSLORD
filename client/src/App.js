import React, { Component } from 'react';

import './App.css';
import {Button, Grid, Icon, Table} from "semantic-ui-react";

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class App extends Component {
    state = {
        inputs: [],
        table: [],
        answers: [],
        clues: {
            across: [],
            down: []
        }
    };

    constructor(props) {
        super(props);

        let initialAnswers = new Array(25).fill('S');
        let initialInputs = new Array(25).fill('');

        this.callApi()
            .then(res => this.setState({
                table: res.table,
                clues: res.clues,
                answers: initialAnswers,
                inputs: initialInputs
            }))
            .catch(err => console.log(err));
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

        this.unCheck();

        this.setState({
            inputs: newInputs
        });
    };

    reveal() {

        const {answers, inputs} = this.state;

        this.unCheck();

        for(let i = 0; i < 25; i++){
            inputs[i] = answers[i];
        }

        this.setState({
            inputs: inputs
        });
    }

    reset() {

        let initialInputs = new Array(25).fill('');

        this.unCheck();

        this.setState({
            inputs: initialInputs
        });
    }

    check() {

        const {answers, inputs, table} = this.state;

        let inc = 0;
        for(let i = 0; i < 25; i++){
            if(table[ Math.floor(i / 5) ][i % 5].color !== 'black'){
                if(inputs[i] === answers[i]){
                    table[ Math.floor(i / 5) ][i % 5].color = '#42b883';
                } else {
                    table[ Math.floor(i / 5) ][i % 5].color = '#d35656';
                    inc++;
                }
            }
        }

        this.setState({
            table: table
        });

        if(inc === 0) {
            alert("Congratulations! You won")
        }
    }

    unCheck() {
        const {table} = this.state;

        for(let i = 0; i < 25; i++){
            if(table[ Math.floor(i / 5) ][i % 5].color !== 'black'){
                    table[ Math.floor(i / 5) ][i % 5].color = 'white';
            }
        }

        this.setState({
            table: table
        });
    }

    callApi = async () => {
        const response = await fetch('/api/service1');
        const body = await response.json();
        if (response.status !== 200) throw Error(body.message);

        return body;
    };

    render() {

        const {table, clues, inputs, date} = this.state;

        return (
            <Grid columns='equal'>

                <Grid.Row>
                    <Grid.Column width={1}/>

                    <Grid.Column width={6}>
                        <Table celled columns={5}>
                            <Table.Body>

                                {table.map(row => (
                                        <Table.Row>
                                            {row.map( col => (
                                                <Table.Cell className="square-cell" style={{backgroundColor: col.color}}>

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
                                                            onChange={  this.handleInputChange}
                                                            onClick={ () => this.unCheck()}
                                                        />
                                                        : null}

                                                </Table.Cell>
                                            ))}
                                        </Table.Row>
                                    )
                                )}

                            </Table.Body>
                        </Table>

                        <Button
                            positive
                            className="btn"
                            onClick={ () => this.check()}
                        >
                            <Icon name="check"/>
                            Check
                        </Button>
                        <Button
                            primary
                            className="btn"
                            onClick={ () => this.reveal()}
                        >
                            <Icon name="eye"/>
                            Reveal
                        </Button>
                        <Button
                            color="google plus"
                            className="btn"
                            onClick={ () => this.reset()}
                        >
                            <Icon name="redo"/>
                            Reset
                        </Button>

                        <br/>

                        <label className="date-text">
                            {date}
                        </label>

                        <br/>
                        <br/>

                        <label className="header-text">
                            CROSSLORD
                        </label>

                    </Grid.Column>

                    <Grid.Column width={4}>

                        <Table key='black' className="borderless">

                            <Table.Header>
                                <Table.Row  >
                                    <Table.HeaderCell colSpan='3'>Across</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {Object.keys(clues.across).map( datum =>
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
                                <Table.Row  >
                                    <Table.HeaderCell colSpan='3'>Down</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {Object.keys(clues.down).map( datum =>
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