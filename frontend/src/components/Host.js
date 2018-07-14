import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { Web3Context } from './Web3Wrapper'
import {
  HeadingSection,
  Button,
  ButtonPrimary,
  ButtonDelete,
  InputText,
  WelcomeHost
} from './generic'
import * as TimeUtils from '../utils/TimeUtils.js'

import './Host.scss'

class Host extends Component {

  constructor(props) {
    super(props)
    
    this.state = {
      hostId: props.match.params.hostId,
      hostName: '',
      hostAddress: '',
      nextRoundNumber: 0,
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
    if(this.props.isAddress(this.state.hostId)) {
      this.setState({ hostAddress: this.state.hostId })
      this.props.getUserName(this.state.hostId).then(hostName => {
        this.setState({ hostName: hostName })
      })
    } else {
      this.setState({ hostName: this.state.hostId })
      const hostAddress = await this.props.getUserAddress(this.state.hostId)
      this.setState({ hostAddress: hostAddress })
    }
  }

  getNextRoundNumber = () => {
    this.props.betl.getNextRoundNumber(this.getOptions()).then(r => {
      this.setState({ nextRoundNumber: Number(r) })
    }).catch(err => {
      console.error('Failed to fetch next round number! ', err)
    })
  }

  handleMore = async () => {
    const numCurrentlyShown = this.state.rounds.length
    const numNextShown = Math.min(numCurrentlyShown+5, this.state.nextRoundNumber)
    const numToAdd = numNextShown - numCurrentlyShown
    
    if (!numToAdd) return // should not be the case

    // Compute relevant roundNumbers and convert to roundIds
    const roundIds = Array
      .from({length: numToAdd}, (v, k) => k+numCurrentlyShown)
      .map(roundNumber => {
        const roundId = null // TODO: computeRRoundId
        return roundId
      })

    // Fetch round for every roundId
    const rounds = await Promise.all(
      roundIds.map(roundId => {
        return this.getRoundInfo(this.state.hostAddress, roundId)
      })
    )
    
    // Append new rounds to existing rounds
    this.setState(prevState => {
      rounds: [...prevState.rounds, rounds]
    })
  }

  getRoundInfo = (hostAddress, roundId) => {
    return new Promise((resolve, reject) => {
      this.props.betl.getRoundInfo(this.state.hostAddress, roundId).then(r => {
        console.log(r)
        resolve({
          roundId: roundId,
          createdAt: r.createdAt,
          endedAt: r.endedAt,
          question: r.question,
          poolSize: r.poolSize,
          numBets: r.numBets
        })
      }).catch(err => {
        console.error('Failed to fetch round! ', err)
        reject()
      })
    })
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
      
        <HeadingSection>Stats</HeadingSection>
        <Stats
          stats={this.state.stats} />

        <HeadingSection>Bets</HeadingSection>

        <Rounds
          rounds={this.state.rounds}
          numExistingRounds={this.state.nextRoundNumber} />

        
        {this.state.rounds.length < this.state.nextRoundNumber &&
          <ButtonPrimary
            isLoading={this.isLoading}
            isDisabled={this.isLoading}
            onClick={this.handleMore}>
              More
          </ButtonPrimary>
        }
      </div>
    )
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
  return <div className="is-italic has-text-grey-light no-entries has-text-centered">Host has no bet rounds</div>
}

const Rounds = ({ rounds, numExistingRounds, hostId }) => {
  hostId = 'moo'
  rounds = [
    {
      id: 'deadbeef1234',
      status: 0,
      createdAt: 1234454545,
      endedAt: 1534234344,
      question: 'Helloooo?',
      poolSize: 5788873,
      numBets: 145
    },
    {
      id: 'deadbeef1234',
      status: 1,
      createdAt: 1234454545,
      endedAt: 1534234344,
      question: 'Helloooo?',
      poolSize: 5788873,
      numBets: 145
    },
    {
      id: 'deadbeef1234',
      status: 2,
      createdAt: 1234454545,
      endedAt: 1534234344,
      question: 'Helloooo?',
      poolSize: 5788873,
      numBets: 145
    },
    {
      id: 'deadbeef1234',
      status: 3,
      createdAt: 1234454545,
      endedAt: 1534234344,
      question: 'Helloooo?',
      poolSize: 5788873,
      numBets: 145
    },
    {
      id: 'deadbeef1234',
      status: 4,
      createdAt: 1234454545,
      endedAt: 1534234344,
      question: 'Helloooo?',
      poolSize: 5788873,
      numBets: 145
    },
    {
      id: 'deadbeef1234',
      status: 5,
      createdAt: 1234454545,
      endedAt: 1534234344,
      question: 'Helloooo?',
      poolSize: 5788873,
      numBets: 145
    },
    {
      id: 'deadbeef1234',
      status: 6,
      createdAt: 1234454545,
      endedAt: 1534234344,
      question: 'Helloooo?',
      poolSize: 5788873,
      numBets: 145
    },
  ]

  if (!rounds || rounds.length === 0) {
    return <NoRounds />
  }

  return (
    <div>
    { 
      rounds.map((round, i) => {
        const roundLink = '/' + hostId + '/' + round.id
        return (
          <div className="preview-container">
            <Link key={i} to={roundLink}>
              <RoundPreview
                status={round.status}
                createdAt={round.createdAt}
                endedAt={round.endedAt}
                question={round.question}
                poolSize={round.poolSize}
                numBets={round.numBets} />
            </Link>
          </div>
        )
      })
    }
    </div>
  )
}

const RoundPreview = ({ status, createdAt, endedAt, question, poolSize, numBets }) => {
  return (
    <div className="columns has-color-text preview">
      <div className="column is-9 is-vertical">
        <div className="is-size-3 is-italic is-semi-bold has-text-primary preview-question">
          "{question}"
        </div>
        <div className="has-text-grey is-italic is-vertical-top-last preview-times">
          created {TimeUtils.getRelativeTime(createdAt)}<br />
        </div>
        <RoundStatusSmall status={status} endedAt={endedAt} />
      </div>
      <div className="column is-3 is-vertical-even preview-right">
        <div className="is-vertical-center">
          <div>
            <p className="is-size-6 is-bold has-text-grey-light">
              POOL
            </p>
            <p className="is-size-3 is-bold is-monospace">
              {poolSize}
            </p>
          </div>
        </div>
        <div className="is-vertical-center">
          <div>
            <p className="is-size-6 is-bold has-text-grey-light">
              #PLAYERS
            </p>
            <p className="is-size-3 is-bold is-monospace">
              {numBets}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const RoundStatusSmall = ({ status, endedAt }) => {
  return (
    <div>
      <RoundStatus status={status} className="is-medium" />
      <RoundStatusSmallTime status={status} endedAt={endedAt} />
    </div>
  )
}

const RoundStatusSmallTime = ({ status, endedAt, timeoutAt }) => {
  if (status < 3) return null

  return (
    <span className="has-text-grey is-italic preview-time-ended">
      {
        status === 6
          ? TimeUtils.getRelativeTime(timeoutAt)
          : TimeUtils.getRelativeTime(endedAt)
      }
    </span>
  )
}

const RoundStatus = ({ status, className }) => {
  return (
    <span
      class={[
        'tag',
        className,
        getStatusColor(status)
      ].join(' ')}>

      {getStatusText(status)}
    </span>
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

const getStatusColor = (status) => {
  switch (status) {
    case 1:
      return 'is-scheduled'
    case 2:
      return 'is-open'
    case 3:
      return 'is-closed'
    case 4:
      return 'is-ended'
    case 5:
      return 'is-cancelled'
    case 6:
      return 'is-timeout'
    default:
      return 'is-invalid'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 1:
      return 'SCHEDULED'
    case 2:
      return 'OPEN'
    case 3:
      return 'CLOSED'
    case 4:
      return 'ENDED'
    case 5:
      return 'CANCELLED'
    case 6:
      return 'TIMEOUT'
    default:
      return 'INVALID'
  }
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <Host {...props} {...context} />}
  </Web3Context.Consumer>
)