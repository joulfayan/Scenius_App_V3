import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { FloatingAssistant } from "@/components/assistant/FloatingAssistant"

function App() {
  return (
    <>
      <Pages />
      <Toaster />
      <FloatingAssistant projectId="scenius-app" />
    </>
  )
}

export default App 