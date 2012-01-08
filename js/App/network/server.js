define('App/network/server',['App/vector', 'App/world','App/blocks'],
function(Vector,World,BLOCK){	
	console.log('Network-Server');
		
	// ==========================================
	// Server
	// ==========================================
	
	// Constructor( socketio, slots )
	//
	// Creates a new server listening for clients using the specified
	// socket interface. Slots is an optional maximum amount of clients.
	
	function Server( socketioServer, slots )
	{
		var io = this.io = socketioServer;
		var s = this;
		
		io.set( "log level", 1 );
		io.sockets.on( "connection", function( socket ) { s.onConnection( socket ); } );
		
		this.eventHandlers = {};
		this.activeNicknames = {};
		this.activeAddresses = {};
		
		this.maxSlots = slots;
		this.usedSlots = 0;
		
		this.oneUserPerIp = true;
	}
	
	// setWorld( world )
	//
	// Assign a world to be networked.
	
	Server.prototype.setWorld = function( world )
	{
		this.world = world;
	}
	
	// setLogger( fn )
	//
	// Assign a log function to output activity to.
	
	Server.prototype.setLogger = function( fn )
	{
		this.log = fn;
	}
	
	// setOneUserPerIp( enabled )
	//
	// Enable/disable the one user per ip rule.
	
	Server.prototype.setOneUserPerIp = function( enabled )
	{
		this.oneUserPerIp = enabled;
	}
	
	// on( event, callback )
	//
	// Hooks an event.
	
	Server.prototype.on = function( event, callback )
	{
		this.eventHandlers[event] = callback;
	}
	
	// sendMessage( msg[, socket] )
	//
	// Send a generic message to a certain client or everyone.
	
	Server.prototype.sendMessage = function( msg, socket )
	{
		var obj = socket ? socket : this.io.sockets;
		obj.emit( "msg", {
			type: "generic",
			msg: msg
		} );
	}
	
	// broadcastMessage( msg, socket )
	//
	// Send a generic message to everyone except for the
	// specified client.
	
	Server.prototype.broadcastMessage = function( msg, socket )
	{
		socket.broadcast.emit( "msg", {
			type: "generic",
			msg: msg
		} );
	}
	
	// kick( socket, msg )
	//
	// Kick a client with the specified message.
	
	Server.prototype.kick = function( socket, msg )
	{
		if ( this.log ) this.log( "Client " + socket.handshake.address.address + " was kicked (" + msg + ")." );
		
		var s = this;
		socket.get( "nickname", function( err, name )
		{
			s.sendMessage( name + " was kicked (" + msg + ")." );
			
			socket.emit( "kick", {
				msg: msg
			} );
			socket.disconnect();
		} );
	}
	
	// setPos( socket, x, y, z )
	//
	// Request a client to change their position.
	
	Server.prototype.setPos = function( socket, x, y, z )
	{
		socket.emit( "setpos", {
			x: x,
			y: y,
			z: z
		} );
	}
	
	// findPlayerByName( name )
	//
	// Attempts to find a player by their nickname.
	
	Server.prototype.findPlayerByName = function( name )
	{
		for ( var p in this.world.players )
			if ( p.toLowerCase().indexOf( name.toLowerCase() ) != -1 ) return this.world.players[p];
		return null;
	}
	
	// onConnection( socket )
	//
	// Called when a new client has connected.
	
	Server.prototype.onConnection = function( socket )
	{
		var ip = socket.handshake.address.address;
		
		if ( this.log ) this.log( "Client " + ip + " connected to the server." );
		
		// Check if a slot limit is active
		if ( this.maxSlots != null && this.usedSlots == this.maxSlots ) {
			this.kick( socket, "The server is full!" );
			return;
		}
		
		// Prevent people from blocking the server with multiple open clients
		if ( this.activeAddresses[ip] && this.oneUserPerIp )
		{
			this.kick( socket, "Multiple clients connecting from the same IP address!" );
			return;
		}
		this.activeAddresses[ip] = true;
		this.usedSlots++;
		
		// Hook events
		var s = this;
		socket.on( "nickname", function( data ) { s.onNickname( socket, data ); } );
		socket.on( "setblock", function( data ) { s.onBlockUpdate( socket, data ); } );
		socket.on( "chat", function( data ) { s.onChatMessage( socket, data ); } );
		socket.on( "player", function( data ) { s.onPlayerUpdate( socket, data ); } );
		socket.on( "disconnect", function() { s.onDisconnect( socket ); } );
	}
	
	// onNickname( socket, nickname )
	//
	// Called when a client has sent their nickname.
	
	Server.prototype.onNickname = function( socket, data )
	{
		if ( data.nickname.length == 0 || data.nickname.length > 15 ) return false;
		
		// Prevent people from changing their username
		var s = this;
		socket.get( "nickname", function( err, name )
		{
			if ( name == null )
			{
				var nickname = s.sanitiseInput( data.nickname );
				
				if ( s.activeNicknames[nickname] )
				{
					s.kick( socket, "That username is already in use!" );
					return;
				}
				
				if ( s.log ) s.log( "Client " + socket.handshake.address.address + " is now known as " + nickname + "." );
				if ( s.eventHandlers["join"] ) s.eventHandlers.join( socket, nickname );
				s.activeNicknames[data.nickname] = true;
				
				// Associate nickname with socket
				socket.set( "nickname", nickname );
				
				// Send world to client
				var world = s.world;
				
				socket.emit( "world", {
					sx: world.sx,
					sy: world.sy,
					sz: world.sz,
					blocks: world.toNetworkString()
				} );
				
				// Spawn client
				socket.emit( "spawn", {
					x: world.spawnPoint.x,
					y: world.spawnPoint.y,
					z: world.spawnPoint.z,
				} );
				
				// Tell client about other players
				for ( var p in s.world.players )
				{
					var pl = s.world.players[p];
					
					socket.emit( "join", {
						nick: p,
						x: pl.x,
						y: pl.y,
						z: pl.z,
						pitch: pl.pitch,
						yaw: pl.yaw
					} );
				}
				
				// Inform other players
				socket.broadcast.emit( "join", {
					nick: nickname,
					x: world.spawnPoint.x,
					y: world.spawnPoint.y,
					z: world.spawnPoint.z,
					pitch: 0,
					yaw: 0
				} );
				
				// Add player to world
				world.players[nickname] = {
					socket: socket,
					nick: nickname,
					lastBlockCheck: +new Date(),
					blocks: 0,
					x: world.spawnPoint.x,
					y: world.spawnPoint.y,
					z: world.spawnPoint.z,
					pitch: 0,
					yaw: 0
				};
			}
		} );
	}
	
	// onBlockUpdate( socket, data )
	//
	// Called when a client wants to change a block.
	
	Server.prototype.onBlockUpdate = function( socket, data )
	{
		var world = this.world;
		
		if ( typeof( data.x ) != "number" || typeof( data.y ) != "number" || typeof( data.z ) != "number" || typeof( data.mat ) != "number" ) return false;
		if ( data.x < 0 || data.y < 0 || data.z < 0 || data.x >= world.sx || data.y >= world.sy || data.z >= world.sz ) return false;
		if ( Math.sqrt( (data.x-world.spawnPoint.x)*(data.x-world.spawnPoint.x) + (data.y-world.spawnPoint.y)*(data.y-world.spawnPoint.y) + (data.z-world.spawnPoint.z)*(data.z-world.spawnPoint.z)  ) < 10 ) return false;
		
		var material = BLOCK.fromId( data.mat );
		if ( material == null || ( !material.spawnable && data.mat != 0 ) ) return false;
		
		// Check if the user has authenticated themselves before allowing them to set blocks
		var s = this;
		socket.get( "nickname", function( err, name )
		{
			if ( name != null  )
			{
				try {
					world.setBlock( data.x, data.y, data.z, material );
					
					var pl = s.world.players[name];
					pl.blocks++;
					if ( +new Date() > pl.lastBlockCheck + 1000 ) {
						if ( pl.blocks > 20 ) {
							s.kick( socket, "Block spamming." );
							return;
						}
						
						pl.lastBlockCheck = +new Date();
						pl.blocks = 0;
					}
					
					s.io.sockets.emit( "setblock", {
						x: data.x,
						y: data.y,
						z: data.z,
						mat: data.mat
					} );
				} catch ( e ) {
					console.log( "Error setting block at ( " + data.x + ", " + data.y + ", " + data.z + " ): " + e );
				}
			}
		} );
	}
	
	// onChatMessage( socket, data )
	//
	// Called when a client sends a chat message.
	
	Server.prototype.onChatMessage = function( socket, data )
	{
		if ( typeof( data.msg ) != "string" || data.msg.trim().length == 0 || data.msg.length > 100 ) return false;
		var msg = this.sanitiseInput( data.msg );
		
		// Check if the user has authenticated themselves before allowing them to send messages
		var s = this;
		socket.get( "nickname", function( err, name )
		{
			if ( name != null  )
			{
				if ( s.log ) s.log( "<" + name + "> " + msg );
				
				var callback = false;
				if  ( s.eventHandlers["chat"] ) callback = s.eventHandlers.chat( socket, name, msg );
				
				if ( !callback )
				{
					s.io.sockets.emit( "msg", {
						type: "chat",
						user: name,
						msg: msg
					} );
				}
			}
		} );
	}
	
	// onPlayerUpdate( socket, data )
	//
	// Called when a client sends a position/orientation update.
	
	Server.prototype.onPlayerUpdate = function( socket, data )
	{
		if ( typeof( data.x ) != "number" || typeof( data.y ) != "number" || typeof( data.z ) != "number" ) return false;
		if ( typeof( data.pitch ) != "number" || typeof( data.yaw ) != "number" ) return false;
		
		// Check if the user has authenticated themselves before allowing them to send updates
		var s = this;
		socket.get( "nickname", function( err, name )
		{
			if ( name != null  )
			{
				var pl = s.world.players[name];
				pl.x = data.x;
				pl.y = data.y;
				pl.z = data.z;
				pl.pitch = data.pitch;
				pl.yaw = data.yaw;
				
				// Forward update to other players
				socket.volatile.broadcast.emit( "player", {
					nick: name,
					x: pl.x,
					y: pl.y,
					z: pl.z,
					pitch: pl.pitch,
					yaw: pl.yaw
				} );
			}
		} );
	}
	
	// onDisconnect( socket, data )
	//
	// Called when a client has disconnected.
	
	Server.prototype.onDisconnect = function( socket )
	{
		if ( this.log ) this.log( "Client " + socket.handshake.address.address + " disconnected." );
		
		this.usedSlots--;	
		delete this.activeAddresses[socket.handshake.address.address];
		
		var s = this;
		socket.get( "nickname", function( err, name )
		{
			delete s.activeNicknames[name];
			delete s.world.players[name];
			
			// Inform other players
			socket.broadcast.emit( "leave", {
				nick: name
			} );
			
			if ( s.eventHandlers["leave"] )
				s.eventHandlers.leave( name );
		} );
	}
	
	// sanitiseInput( str )
	//
	// Prevents XSS exploits and other bad things.
	
	Server.prototype.sanitiseInput = function( str )
	{
		return str.trim().replace( /</g, "&lt;" ).replace( />/g, "&gt;" ).replace( /\\/g, "&quot" );
	}
	return Server;
});