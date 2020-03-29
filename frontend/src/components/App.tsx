import React, { Component, Fragment } from 'react';
import { StyleSheet, View, Text } from 'react-native';

import MenuContainer from './menu/MenuContainer';
import AnagramContainer from './anagram/AnagramContainer';

import SuperStore, { SuperState } from '../state/SuperStore';

type State = {
    panel: SuperState;
}

export default class App extends Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            panel: SuperState.LOADING,
        }
    }

    componentDidMount() {
        for (const state of Object.values(SuperState)) {
            SuperStore.onSetState(state, () => {
               this.setState({
                   panel: state
               });
            });
        }
    }

    componentWillUnmount() {
        SuperStore.closeAllListeners();
    }

    render() {
        return (
            <Fragment>
                { this.state.panel === SuperState.LOADING && <View style={styles.container}><Text>Connecting to Server...</Text></View>}
                    { this.state.panel === SuperState.MENU && <MenuContainer style={styles.container}/> }
                    { this.state.panel === SuperState.ANAGRAM_GAME && <AnagramContainer style={styles.container}/> }
            </Fragment>

        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
