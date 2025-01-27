import SignUpPage from "./page/SignUpPage"
import { axiosApiService } from "./services/apiService";

function App() {
  return (
    <SignUpPage apiService={axiosApiService}/>
  )
}

export default App
