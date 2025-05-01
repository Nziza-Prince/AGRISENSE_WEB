import { useState } from 'react'
import Navbar from './landingPage/Navbar'
import Hero from './landingPage/Hero'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
<Navbar/>
<Hero/>
    </>
  )
}

export default App
