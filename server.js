var requirejs = require('./js/vendor/r.js');

requirejs.config({
	baseUrl:'js',
	nodeRequire: require
});

requirejs(['App/helpers','App/blocks','App/world_server','App/network/server','socket.io','util'],
function (helpers,blocks,World,Server,socketio,util) {
	var log = util.log;
	// ==========================================
	// Server
	//
	// This file contains all of the code necessary for managing a
	// WebCraft server on the Node.js platform.
	// ==========================================
	
	// Parameters
	var WORLD_SX = 128;
	var WORLD_SY = 128;
	var WORLD_SZ = 32;
	var WORLD_GROUNDHEIGHT = 16;
	var SECONDS_BETWEEN_SAVES = 60;
	var ADMIN_IP = "127.0.0.1";
	
	// Create new empty world or load one from file
	var world = new World( WORLD_SX, WORLD_SY, WORLD_SZ );
	log( "Creating world..." );
	if ( world.loadFromFile( "world" ) ) {
		log( "Loaded the world from file." );
	} else {
		log( "Creating a new empty world." );
		world.createFlatWorld( WORLD_GROUNDHEIGHT );
		world.saveToFile( "world" );
	}
	
	// Start server
	var server = new Server( {
		'socketServer': socketio.listen( 3000 ), 
		'slots' :16,
		'world': world,
		'setOneUserPerIp':false,
		'log':log
	});
	
	log( "Waiting for clients..." );
	
	// Chat commands
	server.on( "chat", function( client, nickname, msg ){
        var command = msg.substr(0,(msg.indexOf(" ") === -1)? msg.length :msg.indexOf(" "));
		var target = server.findPlayerByName( msg.substr(command.length).trim());
		var playerlist = nickname + ". ";
		
		if ( command == "/spawn" ) {
			server.setPos( client, world.spawnPoint.x, world.spawnPoint.y, world.spawnPoint.z );
			return true;
		} else if ( command == "/tp" ) {
			if ( target != null ) {
					server.setPos( client, target.x, target.y, target.z );
					server.sendMessage( nickname + " was teleported to " + target.nick + "." );
					return true;
			} else {
				server.sendMessage( "Couldn't find that player!", client );
				return false;
			}
		} else if ( command == "/kick" && client.handshake.address.address == ADMIN_IP ) {
			if ( target != null ) {
					server.kick( target.socket, "Kicked by Matt" );
					return true;
			} else {
				server.sendMessage( "Couldn't find that player!", client );
				return false;
			}
		} else if ( command == "/list" ) {
			
			for ( var p in world.players ){
				if (world.players.hasOwnProperty(p) && p !== nickname){
					playerlist += p + ", ";
				}
			}
			
			playerlist = playerlist.substring( 0, playerlist.length - 2 );
			server.sendMessage( "Players: " + playerlist, client );
			return true;
		} else if ( command.substr( 0, 1 ) == "/" ) {
			server.sendMessage( "Unknown command!", client );
			return false;
		}
	} );
	
	// Send a welcome message to new clients
	server.on( "join", function( client, nickname )	{
		server.sendMessage( "Welcome! Enjoy your stay, " + nickname + "!", client );
		server.broadcastMessage( nickname + " joined the game.", client );
	} );
	
	// And let players know of a disconnecting user
	server.on( "leave", function( nickname )	{
		server.sendMessage( nickname + " left the game." );
	} );
	
	// Periodical saves
	setInterval( function()	{
		world.saveToFile( "world" );
		log( "Saved world to file." );
	}, SECONDS_BETWEEN_SAVES * 1000 );
		
});