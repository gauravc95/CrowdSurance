import React, { Component } from 'react';
import './App.css';
import {
  Arc,
  DAO,
  IProposalOutcome,
  Input,
} from "@daostack/client";
import { first } from 'rxjs/operators';
import { ethers as eth } from 'ethers';
import {
  Button,
  Grid,
  Typography,
  AppBar,
  Toolbar,
  IconButton
} from '@material-ui/core';
import TextField from '@material-ui/core/TextField';

const settings = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
  }, 
  testnet: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "testnet-url",
    ipfsProvider: "localhost",
  }
};

const getMetaMask = () => {
  const ethereum = (window).ethereum;
  return ethereum;
}

async function initializeArc() {
  const metamask = getMetaMask()
  // TODO: change dev - testnet or mainnet as per your project need
  if (metamask) settings.dev.web3Provider = metamask
  const arc = new Arc(settings.dev);
  const contractInfo = await arc.fetchContractInfos();
  return arc;
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      arcIsInitialized: false,
      arc: null,
      dao: null,
      daos: null,
      proposals: [],
      proposalCreateOptionsCR: {
        description: "Please provide Sample proposal description",
        title: "Sample Proposal",
        url: "#",
        scheme: "",
        beneficiary: (window).ethereum.selectedAddress,
        nativeTokenReward: "",
        reputationReward: eth.utils.parseEther('100').toString(),
        ethReward: eth.utils.parseEther('1').toString(),
        externalTokenReward: "",
        externalTokenAddress: "",
        periodLength: "",
        periods: ""
      },
      stakeAmount: '100',
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleCreateProposal = this.handleCreateProposal.bind(this);
    this.handleStake = this.handleStake.bind(this);
  }

  async componentWillMount() {
    const arc = await initializeArc()
    const daos = await arc.daos({where: {name: 'DevTest'}}).first()
    const dao = new DAO(daos[0].id, arc)
    const schemes = await dao.schemes({ where: { name: 'ContributionReward'}}).first()
    const schemeState = await schemes[0].state().first()
    this.handleChange({ target: {name: 'scheme', value: schemeState.address}})
    await dao.proposals().subscribe((proposals) => {
      this.setState({
        arcIsInitialized: true,
        arc,
        dao,
        daos,
        proposals
      })
    })
  }

  async handleCreateProposal(event){
    const { dao, proposalCreateOptionsCR } = this.state
    try {
      await dao.createProposal({
        ...proposalCreateOptionsCR,
        dao: dao.address
      }).send()
    } catch (e) {
      console.log("Error: ", e)
    }
  }

  handleChange(event) {
    let proposalCreateOptionsCR = { ...this.state.proposalCreateOptionsCR}
    proposalCreateOptionsCR[event.target.name] = event.target.value
    this.setState({proposalCreateOptionsCR})
  }

  async handleStake(proposal, outcome) {
    const stakingToken = await proposal.stakingToken()
    const amount = eth.utils.parseEther(this.state.stakeAmount)
    try {
      const votingMachine = await proposal.votingMachine()
      await stakingToken.approveForStaking(votingMachine.options.address, amount).send()
      proposal.stake(outcome, amount).send() 
    } catch (e) {
      console.log(e)
    }
  }

  async handleRedeem(proposal) {
    proposal.state().subscribe((state) => proposal.claimRewards(state.beneficiary).send())
  }

  render() {
    if (!this.state.arcIsInitialized) return (<div> Loading </div>)
    return (
      <div className="App">

        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start"  color="inherit" aria-label="menu">
            </IconButton>
            <Typography variant="h6" >
              CrowdSurance
            </Typography>
            <Button color="inherit">| About us |</Button>
            <Button color="inherit">How it works? |</Button>

          </Toolbar>
          </AppBar>

          <Grid container spacing={1} style={{padding:"30px",height:"10px",fontWeight:"bold"}} >
            <Grid container item xs={12}style={{marginBottom: "23px",color:"blue",fontWeight:"bold"}} >
              CrowdSurance DAO Address: {this.state.dao.id}

            </Grid>
            <Grid container item xs={6} spacing={3} style={{border: '4px solid black',height:"314 x",width:"500",marginRight:"34px"}}>
              <Grid xs={12} style={{color:"blue",fontWeight:"bold",fontSize:"15px"}}>
                Claims Dashboard
              </Grid>
              <Grid container style={{color:"blue",fontWeight:"bold",fontSize:"15px",padding:"4px"}}>
              {
                this.state.proposals.map( (proposal) => {
                  return (
                    <Grid container style={{border: '1px solid black'}}  >
                      <Grid xs={12} style={{color:"blue",fontWeight:"bold",fontSize:"15px"}}>
                        <Typography variant="body1" style={{align:"center",color:"blue",fontWeight:"bold",fontSize:"15px"}}>
                        Claim Id:{proposal.id}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={2}>
                        <Typography variant="body1">
                          <Button color="primary" style={{border: '1px solid black'}} onClick={() => { proposal.vote(IProposalOutcome.Pass).send() } }>
                            Vote up
                          </Button>
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body1">
                          <Button color="primary" style={{border: '1px solid black'}} onClick={() => { proposal.vote(IProposalOutcome.Fail).send() } }>
                            Vote down
                          </Button>
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body1">
                          <Button color="primary" style={{border: '1px solid black'}} onClick={() => this.handleStake(proposal, IProposalOutcome.Pass) }>
                            Stake up
                          </Button>
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body1">
                          <Button color="primary" style={{border: '1px solid black'}} onClick={() => this.handleStake(proposal, IProposalOutcome.Fail)}>
                            Stake down
                          </Button>
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          type="text"
                          placeholder="Staked Amount"
                          color="primary"
                          onChange={(event) => this.setState({stakeAmount: event.target.value})}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          <Button color="primary" style={{border: '1px solid black'}} onClick={() => this.handleRedeem(proposal) }>
                            Claim Reward
                          </Button>
                        </Typography>
                      </Grid>
                    </Grid>
                  )})
              }
              </Grid>
            </Grid>
            <Grid container item xs={6} spacing={3} style={{border: '4px solid black',width:"500"}}>
              <Grid container  component="span" m={1} style={{align:"center"}} >
             
           <div style={{align:"center",marginLeft:"30%",color:"blue",fontWeight:"bold"}} >
            Claim Insurance
            <br /><br />

            Claim Subject      :
            <TextField type="text" style={{marginLeft:"5px"}} placeholder={this.state.proposalCreateOptionsCR.title} name="title" onInput={this.handleChange}/>
            <br /><br />
            Description      :
            <TextField type="text" placeholder={this.state.proposalCreateOptionsCR.description} name="description" onInput={this.handleChange}/>
            <br /><br />
            Proofs      :
            <TextField type="text" placeholder={this.state.proposalCreateOptionsCR.url} name="url" onInput={this.handleChange}/>
            <br /><br />
            Beneficiary      :
            <TextField type="text" placeholder={this.state.proposalCreateOptionsCR.beneficiary} name="beneficiary" onInput={this.handleChange}/>
            <br /><br />
            EthReward      :
            <TextField type="text" placeholder={this.state.proposalCreateOptionsCR.ethReward} name="ethReward" onInput={this.handleChange}/>
            <br /><br />
            ReputationReward      :
            <TextField type="text" placeholder={this.state.proposalCreateOptionsCR.reputationReward} name="reputationReward" onInput={this.handleChange}/>
            <br /><br />
            <Typography variant="body1">
              <Button  color="primary" style={{border: '1px solid black'}} onClick={this.handleCreateProposal}>
                Claim
              </Button>
            </Typography>

           </div>

         </Grid>
            </Grid>
          </Grid>
       </div>
    )}
  }

export default App;
