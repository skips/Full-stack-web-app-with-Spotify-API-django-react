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
    /* Этот метод вызывается после рендеринга страницы.
       Запрашиваем в API, есть ли у пользователя код комнаты в его сессии.
       Если у пользователя есть, мы обновляем состояние.
       При обновлении состояния компоненты будут перерендерены и в методе рендеринга
       пользователь будет перенаправлен в комнату, потому что мы установили новый код комнаты.*/
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
                // мы возвращаем Room с реквизитом, но также и с реквизитом обратного вызова.
                // с обратным вызовом дочерний компонент может изменить родительский
                return <Room {...props} leaveRoomCallback={clearRoomCode} />;
            }}
            />
        </Switch>
      </Router>
    );
}

export default HomePage