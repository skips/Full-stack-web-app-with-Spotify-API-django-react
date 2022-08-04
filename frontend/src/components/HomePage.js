import React, {useState, useEffect} from "react";
import RoomJoinPage from "./RoomJoinPage";
import CreateRoomPage from "./CreateRoomPage";
import Room from "./Room";
import { Grid, Button, ButtonGroup, Typography } from "@material-ui/core";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";

const HomePage = () =>  {

    const [roomCode, setRoomCode] = useState(null)

    useEffect(() => {
      const fetchData = async () => {
        const response = await fetch('/api/user-in-room');
        const data = await response.json();
        setRoomCode(data.code);
      }
      fetchData()
        .catch(console.error);
    }, [])

    const clearRoomCode = () => {
        setRoomCode(null)
    }

    const renderHomePage = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} align="center">
          <Typography variant="h3" compact="h3">
            House Party
          </Typography>
        </Grid>
        <Grid item xs={12} align="center">
          <ButtonGroup disableElevation variant="contained" color="primary">
            <Button color="primary" to="/join" component={Link}>
              Join a Room
            </Button>
            <Button color="secondary" to="/create" component={Link}>
              Create a Room
            </Button>
          </ButtonGroup>
        </Grid>
      </Grid>
      );
    }

    return (
      <Router>
        <Switch>
            <Route exact path="/" render={() => {
                return roomCode ? (<Redirect to={`/room/${roomCode}`} />) : (renderHomePage());
            }}
            />
            <Route path="/join" component={RoomJoinPage} />
            <Route path="/create" component={CreateRoomPage} />
            <Route path="/room/:roomCode" render={(props) => {
                return <Room {...props} leaveRoomCallback={clearRoomCode} />;
            }}
            />
        </Switch>
      </Router>
    );
}

export default HomePage