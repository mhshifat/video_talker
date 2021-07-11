import { useEffect } from "react";
import "./App.css";
import { socketIOConnection } from "./lib/socket";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StoreProvider, { useStore } from "./provider/StoreProvider";

export default function App() {
  const { dispatch, getState } = useStore();

  useEffect(() => {
    socketIOConnection(dispatch, getState);
  }, []);

  return (
    <Switch>
      <Route exact path="/" component={Login} />
      <Route exact path="/dashboard" component={Dashboard} />
    </Switch>
  )
}