
import WebcamCapture from './WebcamCapture';
import './Styles.css'

function App() {
  

  return (
    <div className='container' >
      <h1>PhotoBooth</h1>
      
      <WebcamCapture />
      <footer>
        <span style={{color:'pink'}}>by ryll </span>
      </footer>
    </div>
  )
}

export default App
