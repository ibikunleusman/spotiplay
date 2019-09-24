import React from 'react';
import './SearchBar.css';

export class SearchBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            term: ''
        }

        this.search = this.search.bind(this);
        this.handleTermChange = this.handleTermChange.bind(this);
    }

    search(e) {
        this.props.onSearch(this.state.term);
    }

    handleTermChange(e) {
        this.setState({
            term: e.target.value
        });
    }

    render() {
        return (
            <div className="SearchBar">
                <input placeholder="Artists, Songs, Albums, or podcasts" onChange={this.handleTermChange} />
                <a onClick={this.search}>Insert Search icon here</a>
            </div>
        );
    }
}
