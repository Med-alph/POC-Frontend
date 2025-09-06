// src/App.jsx
import React from "react"
import { useSelector, useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { increment, decrement } from "./features/counter/counterSlice"

function App() {
  const count = useSelector((state) => state.counter.value)
  const dispatch = useDispatch()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">Redux Counter Example</h1>

      <div className="flex items-center gap-4">
        <Button onClick={() => dispatch(decrement())}>-</Button>
        <span className="text-xl font-mono">{count}</span>
        <Button onClick={() => dispatch(increment())}>+</Button>
      </div>
    </div>
  )
}

export default App
