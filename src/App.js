import React, { Route, useEffect, useState } from 'react';
import portfolioshooterIdl from './portfolioshooterIdl.json';
import playerdatasIdl from './playerdatasIdl.json';
import { Connection, PublicKey, clusterApiUrl, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import kp from './keypair.json'
import './App.css';
import * as buffer from "buffer";
import InGame from './game/InGame';
import { SystemStateCoder } from '@project-serum/anchor/dist/cjs/coder/system/state';
const anchor = require('@project-serum/anchor');

window.Buffer = buffer.Buffer;

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Create a keypair every compilation to test purposes
//const baseAccount = Keypair.generate();


// Get our program's id from the IDL file.
const portfolioshooterProgramID = new PublicKey(portfolioshooterIdl.metadata.address);
const playerdatasProgramID = new PublicKey(playerdatasIdl.metadata.address);


// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [baseAccountInitialized, setBaseAccountInitialized] = useState(false);
  const [userAccountInitialized, setUserAccountInitialized] = useState(false);
  const [addedEnemies, setAddedEnemies] = useState(0);
  const [totalEnemies, setTotalEnemies] = useState(1);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          setWalletAddress(response.publicKey.toString());
          await getBaseAccountInitialized();
          await getUserAccountInitialized();
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
  
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());

      await getBaseAccountInitialized();
      await getUserAccountInitialized();
    } 
  };

  const addEnemy = async () => {
    try {
      const provider = getProvider();
      const program = new Program(portfolioshooterIdl, portfolioshooterProgramID, provider);
      const playerProgram = new Program(playerdatasIdl, playerdatasProgramID, provider);


      const [userAccountPDA, _] = await PublicKey
      .findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("user_account"),
          provider.wallet.publicKey.toBuffer()
        ],
        playerProgram.programId
      );

      await program.methods.addEnemy(1).accounts({
          baseAccount: baseAccount.publicKey,
          userAccount: userAccountPDA,
          playerDatasProgram: playerProgram.programId,
          authority: provider.wallet.publicKey,
      }).rpc();

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      const useraccount = await playerProgram.account.userAccount.fetch(userAccountPDA);

      setTotalEnemies(account.enemies)
      setAddedEnemies(useraccount.enemiesAdded)
      console.log("Total enemies : " + account.enemies)
      console.log("This accounts added " + useraccount.enemiesAdded + " enemies")

    } catch (error) {
      console.log("Error adding enemy: ", error);
    }
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }
  
  const createMainAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(portfolioshooterIdl, portfolioshooterProgramID, provider);
      console.log("ping")
      await program.rpc.initBaseAccount({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getBaseAccountInitialized();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const createUserAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(playerdatasIdl, playerdatasProgramID, provider);
      const [userAccountPDA, _] = await PublicKey
      .findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("user_account"),
          provider.wallet.publicKey.toBuffer()
        ],
        program.programId
      );

      await program.methods.initUserAccount().accounts({
        userAccount: userAccountPDA,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }).rpc();
      console.log("Ca passe jusque la2")

      console.log("Created a new UserAccount w/ address:", provider.wallet.publicKey.toString())
      await getUserAccountInitialized();
  
    } catch(error) {
      console.log("Error creating UserAccount account:", error)
    }
  }

  const getBaseAccountInitialized = async() => {
    try {
      const provider = getProvider();
      const program = new Program(portfolioshooterIdl, portfolioshooterProgramID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the base account", account)
      console.log(account.enemies)
      if (account.enemies != 0)
      {
        setBaseAccountInitialized(true)
      }
      else
      {
        setBaseAccountInitialized(false)
      }

      setTotalEnemies(account.enemies)

    } catch (error) {
      console.log("Error in getBaseAccount: ", error)
      setBaseAccountInitialized(false);
    }
  }

  const getUserAccountInitialized = async() => {
    try {
      const provider = getProvider();
      const program = new Program(playerdatasIdl, playerdatasProgramID, provider);
      const [userAccountPDA, _] = await PublicKey
      .findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("user_account"),
          provider.wallet.publicKey.toBuffer()
        ],
        program.programId
      );
      const account = await program.account.userAccount.fetch(userAccountPDA);
      
      console.log("Got the user account", account)
      console.log(account.enemiesAdded)
      setAddedEnemies(account.enemiesAdded)
      setUserAccountInitialized(true)
    } catch (error) {
      console.log("Error in getUserAccount: ", error)
      setUserAccountInitialized(false);
    }
  }

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
      if (baseAccountInitialized === false) {
        return (
          <div className="connected-container">
            <button className="cta-button submit-gif-button" onClick={createMainAccount}>
              Do One-Time Initialization For Program Account
            </button>
          </div>
        )
      } 
      else if (userAccountInitialized === false) {
        return (
          <div className="connected-container">
          <text className="sub-text">
            Don't forget to switch to devnet <br/>
          </text>
          <text className="sub-text">
            If you don't have Devnet SOL tokens, 
            <a href="https://solfaucet.com/"> claim free SOL devnet tokens here </a>  <br/><br/>
            Once you have Devnet SOL Tokens, you can click on the button below <br/> <br/>
          </text>
            <button className="cta-button submit-gif-button" onClick={createUserAccount}>
              Do One-Time Initialization For User Account
            </button>
          </div>
        )
      } 
      else {
        return(
          <div className="connected-container">
            <text className="sub-text">
            W A S D : Moving spaceship <br/>
            Spacebar : Fire <br/>
            Left mouse button : Fire <br/><br/>
          </text>
            <text className="address-info-text"> Connected with address : {walletAddress}</text> <br/>
            <text className="address-info-text"> Enemies added with this address : {addedEnemies}</text> <br/>
            <button
              className="cta-button connect-wallet-button"
              onClick={addEnemy}
            >
                Add enemy
            </button>
            <InGame enemies={totalEnemies}></InGame> 
          </div>
        )
      }
  }

  // UseEffects
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">Solana Devnet Collaborative Space Shooter</p>

          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}

          <br/>
          <text className="credit-text">
            Created with ❤️ by  <a href="https://www.tanguygamedev.com/">Tanguy MORVANT</a> 
          </text>
          
        </div>
      </div>
    </div>
  );
};

export default App;