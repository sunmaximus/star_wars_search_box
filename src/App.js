import React, { Component } from 'react';
import axios from 'axios';
import './app.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isError: false,
      loading: false,
      results: [],
      counter: 0,
      cacheSearch: {},
      characterWorld: {},
      cacheWorld: {},
    };

    this.search = this.search.bind(this);
    this.renderSearchResults = this.renderSearchResults.bind(this);
  }

  search(text) {
    const self = this;
    const { cacheSearch, characterWorld } = this.state;
    // if search result cached then don't do rest call
    if (cacheSearch.hasOwnProperty(text)) {
      return this.setState({
        loading: false,
        isError: false,
        results: cacheSearch[text].data.results,
      })
    }
    this.setState({ loading: true, isError: false });
    return axios.get(`https://swapi.co/api/people/?search=${text}`).then((response) => {
      const { results } = response.data
      
      // Loop each character then REST call and cache character planet
      results && results.length > 0 && results.forEach(character => {
        // Skip rest call if character is already cached
        !characterWorld.hasOwnProperty(character.url) && axios.get(character.homeworld).then(res => {
          this.setState(prevState => {
            return {
              characterWorld: {...prevState.characterWorld, [character.url]: character.homeworld },
              cacheWorld: {...prevState.cacheWorld, [character.homeworld]: res.data },
              counter: prevState.counter + 1,
            }
          })
        })
        .catch((error) => {
          self.setState({ isError: true, loading: false });
        });
      });
      
      this.setState(prevState => {
        return {
          results,
          loading: false,
          counter: prevState.counter + 1,
          cacheSearch: {
            ...prevState.cacheSearch,
            [text]: response,
          }
        }
      })
    })
    .catch((error) => {
      self.setState({ isError: true, loading: false  });
    });
  }

  renderLabels() {
    const { loading, isError, counter } = this.state
    return (
      <div className='label-container'>
        {loading && <div className='search-action'>loading...</div>}
        {isError && <div className='search-action'>error searching</div>}
        {counter > 0 && <div className="totalRequests">({counter} requests executed so far)</div>}
      </div>
    )
  }

  renderSearchResults() {
    const { results, characterWorld, cacheWorld } = this.state;
    return results.length > 0 && (
      <div className='search-results__container'>
        {results.map(character => {
          let characterWorldUrl = characterWorld[character.url]
          let world =  characterWorldUrl && cacheWorld[characterWorldUrl]
          return (
            <div key={character.url}>
              <h2>{`${character.name} (born ${character.birth_year})`}</h2>
              {world && 
              <div>
                <h3>{world.name}</h3>
                <p>
                  {world.name} is <strong>{world.climate}</strong>, with a population of <strong>{world.population}</strong>.
                </p>
              </div>}
              <hr />
            </div>
        )})}
      </div>
    )
  }

  render() {
    return (
      <div className="app-container">
        <input
          className='search-box'
          placeholder='Search Star Wars Characters'
          onChange={(event) => this.search(event.target.value)}
          autoFocus={true}
        />

        {this.renderLabels()}
        {this.renderSearchResults()}

      </div>
    );
  }
}

export default App;
