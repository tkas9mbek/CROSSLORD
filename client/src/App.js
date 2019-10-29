import React, { Component } from 'react';

import './App.css';
import {Grid, Table} from "semantic-ui-react";

class App extends Component {
    state = {
        inputs: [],
        table: [],
        clues: {
            across: [],
            down: []
        }
    };

    constructor(props) {
        super(props);
        let initialInputs = new Array(25).fill('');

        this.callApi()
            .then(res => this.setState({
                table: res.table,
                clues: res.clues,
                inputs: initialInputs
            }))
            .catch(err => console.log(err));
    }

    handleInputChange = (e) => {
        const target = e.target;
        const value = target.value;
        const name = target.name;

        let newInputs = this.state.inputs;
        newInputs[name] = value.toUpperCase();

        this.setState({
            [name]: newInputs
        });
    }

    callApi = async () => {
        const response = await fetch('/api/service1');
        const body = await response.json();
        if (response.status !== 200) throw Error(body.message);

        return body;
    };

    render() {

        const {table, clues, inputs} = this.state;

        return (
            <Grid columns='equal'>

                <Grid.Row>

                    <Grid.Column width={5}/>

                    <Grid.Column width={6}>
                        <br/>
                        <br/>
                        <label className="header-text">
                            CROSSLORD
                        </label>
                    </Grid.Column>

                    <Grid.Column width={5}/>

                </Grid.Row>

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
                                                        : <br/>}

                                                    {col.no !== '*' ?
                                                        <input
                                                            type="text"
                                                            className="input-text main-text"
                                                            maxLength="1"
                                                            autoCapitalize={true}
                                                            name={col.index}
                                                            placeholder={inputs[col.index]}
                                                            value={inputs[col.index]}
                                                            onChange={  this.handleInputChange}
                                                        />
                                                        : null}

                                                </Table.Cell>
                                            ))}
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