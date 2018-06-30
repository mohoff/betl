import React, { Component } from 'react'
import { Web3Context } from './Web3Wrapper'
import {
  HeadingSection,
  Button,
  ButtonPrimary,
  ButtonDelete,
  InputText,
  WelcomeHost
} from './generic'

class Host extends Component {

  constructor(props) {
    super(props)
    
    this.state = {
      hostId: props.match.params.hostId,
      hostName: '',
      hostAddress: '',
      rounds: [],
      
      stats: {
        numBetsFinished: 0,
        numBetsCancelled: 0,
        totalBetPool: 0,
        totalBetNum: 0
        // more here for stats?
      },

      linkInput: '',
      linkDismissed: false,
      isLoadingLink: false,
      isLoadingDeleteLink: false,
    }
  }

  componentDidMount = async () => {
    let hostAddress, hostName
    if (this.props.isAddress(this.state.hostId)) {
      hostAddress = this.state.hostId
      hostName = await this.props.getUserName(hostAddress)
    } else {
      hostName = this.state.hostId
      hostAddress = await this.props.getUserAddress(hostName)
    }
    this.setState({
      hostAddress: hostAddress.toLowerCase(),
      hostName: hostName
    })

    // TODO: if (hostAddress !== '') { try fetch round(s) for this host }
  }

  handleRefresh = () => {
    // async fetch again host rounds.
  }

  handleLinkNameChange = (event) => {
     this.setState({ linkInput: event.target.value })
  }

  handleLink = () => {
    this.setState({ isLoadingLink: true })

    const newName = this.state.linkInput
    this.props.betl.registerRecord(newName, this.props.getOptions()).then(r => {
      this.props.updateUserName()
      this.setState({
          hostName: newName,
          linkInput: ''
      }, () => {
        console.log('Success: Name linked')
        this.forceUpdate() // TODO: check if needed, if it changes anything at all
      })
    }).catch(err => {
      console.warn('Could\'nt link name')
      console.log(err)
    }).finally(() => {
      this.setState({ isLoadingLink: false })
    })
  }

  handleDeleteName = () => {
    this.setState({ isLoadingDeleteLink: true })

    this.props.betl.deleteRecord(this.props.getOptions()).then(r => {
      this.props.updateUserName()
      this.setState({
          hostName: '',
          linkInput: ''
      }, () => {
        console.log('Success: Name deleted')
      })
    }).catch(err => {
      console.error('Error: Couldn\'t delete name')
    }).finally(() => {
      this.setState({ isLoadingDeleteLink: false })
    })
  }

  handleLinkDismiss = () => {
    this.setState({ linkDismissed: true })
  }
  
  render() {
    const getWelcome = () => {
      // If a user visits a host's page
      if ((this.props.userAddress !== this.state.hostAddress) && this.state.hostName !== '') {
        return <HostName>{this.state.hostName}</HostName>
      }

      // If a host visits his own page
      if (this.props.userName === '') {
        return (
          <LinkName
            isDismissed={this.state.linkDismissed}
            isLoading={this.state.isLoadingLink}
            inputValue={this.state.linkInput}
            handleDismiss={this.handleLinkDismiss}
            handleChange={this.handleLinkNameChange}
            handleLink={this.handleLink} />
        )
      } else {
        return (
          <WelcomeHost
            isDeletable={true}
            isLoading={this.state.isLoadingDeleteLink}
            handleDelete={this.handleDeleteName}>
            {this.props.userName}
          </WelcomeHost>
        )
      }
    }


    return (
      <div>
        
        {getWelcome()}
      
        <HeadingSection>Open Rounds</HeadingSection>
        <Rounds rounds={this.state.rounds} />
        <ButtonPrimary
          isLoading={this.isLoading}
          isDisabled={this.isLoading}
          onClick={this.handleRefresh}>
            Refresh
        </ButtonPrimary>
    
        <HeadingSection>Stats</HeadingSection>
        <Stats stats={this.state.stats} />
  
      </div>
    );
  }
}

const HostName = ({ children }) => {
  return (
    <div>
      <div className="title has-text-centered">{children}</div>
      <hr />
    </div>
  )
}

const NoRounds = () => {
  return <div className="is-italic has-text-grey-light no-entries">Host has no bet rounds</div>
}

const Rounds = ({ rounds }) => {
  const getRounds = () => {
    let roundsArray = []
    for (let i=0; i<rounds.length; i++) {
      roundsArray.push(
        <div key={i}>round {i}</div>
      )
    }
    return roundsArray
  }

  return (
    <div className="has-text-centered">
      {(rounds.length === 0) 
        ? <NoRounds />
        : getRounds()
      }
    </div>
  )
}

const Stats = ({ stats }) => {
  return (
    <div className="level is-mobile">
      <div className="level-item has-text-centered">
        <div>
          <p className="heading">Rounds</p>
          <p className="title">{stats.numBetsFinished}</p>
        </div>
      </div>
      <div className="level-item has-text-centered">
        <div>
          <p className="heading">Total Pool</p>
          <span className="title">{stats.totalBetPool}</span> ETH
        </div>
      </div>
      <div className="level-item has-text-centered">
        <div>
          <p className="heading">Total Bets</p>
          <p className="title">{stats.totalBetNum}</p>
        </div>
      </div>
    </div>
  )
}

const LinkName = (props) => {
  if (props.isDismissed) {
    return null
  }

  return (
    <div className="message is-warning">
      <div className="message-header">
        Link your address to a username so your audience can find you easier!
        <ButtonDelete
          onClick={props.handleDismiss}>
        </ButtonDelete>
      </div>
      <div className="message-body field is-grouped is-fullwidth">  
        <p className="control is-expanded">
          <InputText
            placeholder="Your username"
            value={props.inputValue}
            onChange={props.handleChange} />
        </p>
        <p className="control">
          <Button
            isLoading={props.isLoading}
            isDisabled={props.isLoading || !props.inputValue}
            onClick={props.handleLink}>
            Link
          </Button>
        </p>
      </div>
    </div>
  )
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <Host {...props} {...context} />}
  </Web3Context.Consumer>
)