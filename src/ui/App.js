import React, { Component } from 'react';
import search from './spotify';
import path from 'path';
import { ipcRenderer } from 'electron';

const KEY_UP = 'ArrowUp';
const KEY_DN = 'ArrowDown';
const KEY_EN = 'Enter';
const KEY_ESC = 'Escape';

class Searcher extends Component {
  constructor(props) {
    super(props);
    this.updateSearch = this.updateSearch.bind(this);
  }

  updateSearch(evt) {
    this.props.searchFn(evt.target.value);
  }

  render() {
    return (
      <div className='searcher'>
        <input value={this.props.search} className='searcher__input' onChange={this.updateSearch} placeholder="Let's listen to…"/>
      </div>
    );
  }
}

class Result extends Component {
  render() {
    return (
      <div className={'result ' + (this.props.selected ? 'result__state-selected' : '')}>
        <img role='presentation' className='result__image' src={this.props.result.albumURL}/>
        <div className='result__text'>
          {this.props.result.name}
          <div className='result__text__sub'>
            {this.props.result.artists.join(' • ')}
          </div>
        </div>
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {tracks: [], selected: -1, term: ''};
    this.setState = this.setState.bind(this);
    this.search = this.search.bind(this);
    this._handleKeyEvt = this._handleKeyEvt.bind(this);
    this._reset = this._reset.bind(this);
    ipcRenderer.on('asynchronous-reply', (event, arg) => {
      if (arg.type === 'search-reset') {
        this._reset();
      }
    })
  }

  _reset() {
    this.setState({tracks: [], selected: -1, term: ''});
    ipcRenderer.send('asynchronous-message', {type: 'search-results', qty: 0})
  }

  _handleKeyEvt(evt) {
    if (KEY_ESC === evt.code) {
      ipcRenderer.send('asynchronous-message',{type: 'search-abort'});
    } else if (this.state.tracks.length > 0) {
      if (KEY_DN === evt.code) {
        this.setState({selected: ((this.state.selected + 1) % this.state.tracks.length)});
      } else if (KEY_UP === evt.code) {
        if (this.state.selected === 0) {
          this.setState({selected: this.state.tracks.length - 1});
        } else {
          this.setState({selected: this.state.selected - 1});
        }
      } else if (KEY_EN === evt.code && this.state.selected > -1) {
        ipcRenderer.send(
          'asynchronous-message',
          {
            type: 'search-selected',
            id: this.state.tracks[this.state.selected].spotifyID
          }
        );
      }
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this._handleKeyEvt);
  }

  componenWillUnmount() {
    document.removeEventListener('keydown', this._handleKeyEvt, false);
  }

  search(term) {
    this.setState({term: term});
    search(term)
      .then(d => {
        this.setState({tracks: d, selected: 0});
        ipcRenderer.send('asynchronous-message', {type: 'search-results', qty: d.length});
      })
      .catch((err) => {
        this._reset();
        ipcRenderer.send('asynchronous-message', {type: 'search-results', qty: 0})
      });
  }

  render() {
    return (
      <div className="App">
        <Searcher search={this.state.term} searchFn={this.search}/>
        {this.state['tracks'].map((item, idx) =>
          <Result selected={this.state.selected === idx} key={'r'+item.spotifyID} result={item}/>
        )}
      </div>
    );
  }
}

export default App;
