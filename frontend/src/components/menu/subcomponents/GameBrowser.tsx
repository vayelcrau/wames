import React, { Component } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';

import { User } from '../../../../types';

import AnagramStore from 'state/AnagramStore';
import RootNavigator from 'state/RootNavigator';
import Anagram  from 'lib/Anagram';


type State = {
    games: Anagram[]
}

export default class GameBrowser extends Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            games: []
        };
    }

    componentDidMount() {
        this.setState({
            games: AnagramStore.getGamesList()
        });

        AnagramStore.onUpdateGamesList((games_list: Anagram[]) => {
            this.setState({
                games: games_list
            });
        });
    }

    render() {
        return (
            <View style={styles.view_games}>
                <Text style={styles.title}> Games </Text>
                <FlatList
                    style={styles.list}
                    data={this.state.games.reverse()}
                    extraData={this.state}
                    keyExtractor={(item) => item.getID()}
                    renderItem={({item}) =>
                        <View style={styles.game_row}>
                            <TouchableOpacity
                                style={ [styles.button, { backgroundColor: item.getLocalState().stage === 'NOT-STARTED' ? 'lime' : 'gray'} ] }
                                onPress={ () => { RootNavigator.navigateToAnagramInfo(item) } }
                            >
                                <Text style={styles.button_text}>
                                    {
                                        item.getPlayers().map((user: User, iidx: number) => user.username + (item.getPlayers().length - 1 !== iidx ? ' vs. ' : ' ')
                                        )
                                    }
                                </Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            </View>
        )
    }
}

const height = Dimensions.get('window').height;

const styles = StyleSheet.create({
    view_games: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginVertical: 50,
    },

    game_row: {
        marginVertical: 5,
        flexDirection: 'row'
    },

    title: {
        marginBottom: 10,
        fontSize: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },

    button: {
        borderRadius: 5,
    },

    button_text: {
        padding: 5
    },

    list: {
        flexGrow: 0,
        height: height * 0.4
    }
});


