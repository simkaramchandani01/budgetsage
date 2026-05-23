import { TransactionsProvider } from './context/TransactionsContext'
import Layout from './components/Layout'
import Dashboard from './views/Dashboard'

const views: Record<string, React.FC> = {
  '/':             Dashboard,
  '/transactions': () => null,
  '/categories':   () => null,
}

function App() {
  const View = views[window.location.pathname] ?? Dashboard
  return (
    <TransactionsProvider>
      <Layout>
        <View />
      </Layout>
    </TransactionsProvider>
  )
}

export default App
