const { Socket } = require('dgram');
const express = require('express');
const fs = require('fs');
const path = require('path');
const users = require('./logindat.json');
const app = express();
const ss = require('socket.io-stream');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const history = [];
const ClientId = [];

exports.server = {
  run(port) {
    server.listen(port, () => {
      console.log('Server listening at port %d', port);
    });
  },
};

const users_in_server = new Set();
const rooms_in_server = new Set();

io.on('connection', function onConnection(socket) {
  console.log(`recived from: ${socket.id}`)
  let username;
  let id;
  socket.on('message', function onMessage(data) {
    //username = data.username;
    let text = data.text;
    let currentroom = data.cr;
    //io.emit('message', { username, text });
    io.in(currentroom).emit('message', {username, text, currentroom});
    console.log(currentroom + " " + username + " " + text);
    //history.push(data);
    //console.log(history);
    
  });
  
  // TODO: validate login!
  // TODO: check if user is already logged in!
  socket.on('login', function onLogin(data) {
    username = data.username;
    pass = data.pass;
    correctpass = data.corr;
    console.log(`1 ${correctpass}`)
    if(username != Array.from(users_in_server))  {
      var usrdatjson = {
        users: [
        ]
      };
      fs.readFile(__dirname+'/logindat.json', 'utf8', function readfilecallback(err, data){
        if(err) {
          console.log(err)
        } else {
          corr = true;
          usrdatjson = JSON.parse(data);
          //console.log(usrdatjson);
          usrdatjson.users.forEach(element => {
            if(username == element.username && pass == element.password) {
              correctpass = true;
              console.log('correct !');
            }
          });
          console.log(`username: ${username} and password: ${pass} and correct: ${correctpass}`);
          io.emit('loginreturn', correctpass);
          console.log(`2 ${correctpass}`)
          if(correctpass) {

            socket.emit('connectedtosever');
            let roomname = 'ogolny'
            socket.join(roomname);
            rooms_in_server.add(roomname);
            io.emit('currentRoom', {roomname, rooms: Array.from(rooms_in_server)});
            socket.emit('CurrentRoom_private_data', {roomname});
            console.log(`2 ${Array.from(rooms_in_server)}`)
            users_in_server.add(username);
            socket.emit('loginemit', { username});
            io.emit('loginemit_data', {users: Array.from(users_in_server)});
            io.emit('reciveRoomList', {rooms: Array.from(rooms_in_server)});
          }
        }
      });
  }
  /*
  socket.once('loginemit', function onLoginEmit(data) {
    let username = data.username;
    users_in_server.add(username);
    io.sockets.emit('loginemit', { username, users: Array.from(users_in_server)});

    //socket.emit('connecttoserver');
    console.log(`user: ${data.username} users in array ${Array.from(users_in_server)} from socket: ${socket.id}`)
    console.log('----------------')
    //for(var key in history) {
      //var value = history[key];
      //io.sockets.emit('message', { username: value.username, text: value.text });
    //}
  });
  */

  });
  socket.on('register', function onRegister(data) {
    console.log(`${data.username}; ${data.password}`);
    let username = data.username;
    let password = data.password;
    var usrdatjson = {
      users: [
      ]
    };
    console.log(username,password);
    //n = JSON.stringify(usrdat);
    //var rawdatau = fs.writeFile(__dirname+'/logindat.json', json, 'utf8');
    //var usersdatar = JSON.parse(rawdatau);
    //usersdatar.push({username, password});
    
    var corr = true;
    fs.readFile(__dirname+'/logindat.json', 'utf8', function readfilecallback(err, data){
      if(err) {
        console.log(err)
      } else {
        corr = true;
        usrdatjson = JSON.parse(data);
        usrdatjson.users.forEach(element => {
        if(username == element.username && password == element.password) {
          corr = false;
        }
        });
        socket.emit('registercallback', {corr});
        //socket.emit('registercallback', {corr});
        if(corr){
        usrdatjson.users.push({username, password});
        //users.push({username,password})
        json = JSON.stringify(usrdatjson);
        fs.writeFile(__dirname+'/logindat.json', json, 'utf8', function (err, result) {
          if(err) return console.log(err);
        });
      }
    }
    });
    //var newdata = JSON.stringify(worldlgmdt);

    //fs.writeFile(__dirname+'/logindat.json', JSON.stringify(usrdat), 'utf8', function(err) {
      //if (err) return console.log(err);
    //});
      //console.log(`new user has been added [${userdata}]`)
      //fs.writeFileSync(path.resolve(__dirname, 'logindat.json'), JSON.stringify(usrdat));
      //usrdat = {};
  });

  socket.on('createRoomandJoin', function(data) {
    roomname = data.roomname;
    rooms_in_server.add(roomname);
    //socket.join(roomname);
    //socket.emit('currentRoom', {roomname, rooms: Array.from(rooms_in_server)});
    // socket.emit('emitmessageRoom', {roomname});
    io.emit('reciveRoomList', {rooms: Array.from(rooms_in_server)});
    //io.emit('sendcurrentRoomsList', {roomname, rooms: Array.from(rooms_in_server)});
    
  });
  socket.on('JoinRoom', function(data) {
    socket.join(roomname);
    roomname = data.roomname;
    socket.emit('currentRoom', {roomname});
    socket.emit('emitmessageRoom', {roomname});
    //io.emit('reciveRoomList', {rooms: Array.from(rooms_in_server)});
  });

  socket.on('LeaveRoom', function(data) {
      let room = data.roomname;
      socket.leave(room);
      io.in(room).socketsLeave(room);
      rooms_in_server.delete(room);
      //rooms_in_server.delete(room);
      let roomname = 'ogolny';
      socket.join(roomname);
      socket.emit('LeaveRoom', {roomname, rooms: Array.from(rooms_in_server)});
      socket.emit('currentRoom', {roomname});
      io.emit('reciveRoomList', {rooms: Array.from(rooms_in_server)});
  });
  socket.on('typing', function onTyping() {
    socket.broadcast.emit('typing', { username });

  });

  socket.on('stop-typing', function onStopTyping() {
    socket.broadcast.emit('stop-typing', { username });
  });

  socket.on('disconnect', function onDisconnect() {
    users_in_server.delete(username);
    socket.broadcast.emit('logout', { username, users: Array.from(users_in_server) });
    //socket.emit('disconnected')
  });
  socket.on('commands', function onCommand(data) {

    if(data.text == '/admins') {
      let adminmessage = 'hi';
      socket.emit('commandreturn', { adminmessage });
    }
    
  });
});
