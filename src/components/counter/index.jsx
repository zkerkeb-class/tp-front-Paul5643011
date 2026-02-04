import { useState, useEffect } from "react"

const Counter = () => {
    const [count, setCount] = useState(0)
    const [countTwo, setCountTwo] = useState(10)

    useEffect(() => {
        console.log("Le compteur a été mis à jour :", count);
        console.log("Le compteur 2 a été mis à jour :", countTwo);
        document.title = `Compteur: ${count}`
    }, [count])

    const decrement = () => {
        setCount(count - 1)
    }

    return (
        <div>
            <h1>Counter</h1>
            <h2>{count}</h2>
            <h2>{countTwo}</h2>
            <button onClick={() => setCountTwo(countTwo - 1)}>- 2</button>
            <button onClick={decrement}>-</button>
            <button onClick={() => setCount(count + 1)}>+</button>
        </div>
    )
}

export default Counter