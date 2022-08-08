import React, { Component } from "react";
import { Grid, Button, Typography } from "@material-ui/core";
import CreateRoomPage from "./CreateRoomPage";
import MusicPlayer from "./MusicPlayer";

class Room extends Component {
  constructor(props) {
    super(props);
    this.state = {
      votesToSkip: 2,
      guestCanPause: false,
      isHost: false,
      // Нам нужна переменная состояния, которая отслеживает,
      // находится ли страница в режиме настроек или режиме отображения, чтобы мы могли лучше отображать то, что нам нужно
      showSettings: false,
      // переменная состояния, которая проверяет, аутентифицирован ли Spotify или нет
      spotifyAuthenticated: false,
      song: {},
    };
    // роутер по умолчанию код комнаты в реквизите match
    this.roomCode = this.props.match.params.roomCode;
    this.leaveButtonPressed = this.leaveButtonPressed.bind(this);
    this.updateShowSettings = this.updateShowSettings.bind(this);
    this.renderSettingsButton = this.renderSettingsButton.bind(this);
    this.renderSettings = this.renderSettings.bind(this);
    this.getRoomDetails = this.getRoomDetails.bind(this);
    this.authenticateSpotify = this.authenticateSpotify.bind(this);
    this.getCurrentSong = this.getCurrentSong.bind(this);
    this.getRoomDetails();
  }

   // Каждую секунду мы запрашиваем обновление текущей воспроизводимой песни.
   // Итак, каждый раз, когда каждый пользователь в комнате делает запрос на Spotify
   // Spotify не поддерживает WebSockets, но для ~50000 пользователей все эти запросы должны выполняться нормально
  componentDidMount() {
    this.interval = setInterval(this.getCurrentSong, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  getRoomDetails() {
    return fetch("/api/get-room" + "?code=" + this.roomCode)
      .then((response) => {
        if (!response.ok) {
          this.props.leaveRoomCallback();
          this.props.history.push("/");
        }
        return response.json();
      })
      .then((data) => {
        this.setState({
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          isHost: data.is_host,
        });
        if (this.state.isHost) {
          this.authenticateSpotify();
        }
      });
  }

  // Запрашиваем серверную часть, если Spotify аутентифицирован. НЕОБХОДИМО ЖДАТЬ getRoomDetails
  authenticateSpotify() {
    fetch("/spotify/is-authenticated")
      .then((response) => response.json())
      .then((data) => {
        // изменить состояние на если пользователь аутентифицирован
        this.setState({ spotifyAuthenticated: data.status });
        console.log(data.status);
        // если пользователь не аутентифицирован, нам нужно его аутентифицировать
        if (!data.status) {
          fetch("/spotify/get-auth-url")
            .then((response) => response.json())
            .then((data) => {
              // перейти по URL-адресу для аутентификации пользователя в его учетной записи Spotify
              // window.location.replace для перенаправления на чужую страницу
              window.location.replace(data.url);
              // затем мы будем перенаправлены на функцию spotify_callback для сохранения токена
              // затем в интерфейс
              // затем в нужную комнату, в которой мы были
            });
        }
      });
  }

  getCurrentSong() {
    fetch("/spotify/current-song")
      .then((response) => {
        if (!response.ok) {
          return {};
        } else {
          return response.json();
        }
      })
      .then((data) => {
        this.setState({ song: data });
        console.log(data);
      });
  }

  // Прежде чем мы запустим комнату, нам нужно удалить код комнаты из нашего сеанса.
  // Проверьте представления в API для получения дополнительной информации.
  leaveButtonPressed() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/api/leave-room", requestOptions).then((_response) => {
      this.props.leaveRoomCallback();
      this.props.history.push("/");
    });
  }

  updateShowSettings(value) {
    this.setState({
      showSettings: value,
    });
  }

  renderSettings() {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <CreateRoomPage
            update={true}
            votesToSkip={this.state.votesToSkip}
            guestCanPause={this.state.guestCanPause}
            roomCode={this.roomCode}
            // эта функция будет вызываться при обновлении комнаты. Когда мы покидаем обновленную комнату,
            // мы хотим видеть изменения и на странице комнаты
            updateCallback={this.getRoomDetails}
          />
        </Grid>
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => this.updateShowSettings(false)}
          >
            Close
          </Button>
        </Grid>
      </Grid>
    );
  }

  // Метод возвращает html для отображения кнопки настроек.
  // Создано, потому что мы хотим отображать кнопку настроек только в том случае, если пользователь является хостом
  renderSettingsButton() {
    return (
      <Grid item xs={12} align="center">
        <Button
          variant="contained"
          color="primary"
          onClick={() => this.updateShowSettings(true)}
        >
          Settings
        </Button>
      </Grid>
    );
  }

  render() {
    if (this.state.showSettings) {
      return this.renderSettings();
    }
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography variant="h4" component="h4">
            Code: {this.roomCode}
          </Typography>
        </Grid>
        <MusicPlayer {...this.state.song} />
        {this.state.isHost ? this.renderSettingsButton() : null}
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={this.leaveButtonPressed}
          >
            Leave Room
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default Room
