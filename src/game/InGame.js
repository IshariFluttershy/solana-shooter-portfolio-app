import React from 'react';
import './InGame.css';
import { Unity, useUnityContext } from "react-unity-webgl";


const InGame = (props) => {
    const { unityProvider, isLoaded, sendMessage} = useUnityContext({
        loaderUrl: "build/build.loader.js",
        dataUrl: "build/build.data",
        frameworkUrl: "build/build.framework.js",
        codeUrl: "build/build.wasm",
      });
      
      if (isLoaded === true)
      {
        sendMessage('SingletonHolder', 'SetTotalEnemies', props.enemies)
      }

      return (
        
        <div>
      <Unity className="UnityCanvas" unityProvider={unityProvider} />   
    </div>);
      
}

export default InGame
