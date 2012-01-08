/**
 * @author matthew
 */
(function(document,World,Render,Physics,Player){

window.addEventListener('load', function (){
	var render, world;	
	
   // HTML elements
	var page = {};
	page.renderSurface = document.getElementById( "renderSurface" );
	page.materialSelector = document.getElementById( "materialSelector" );
	page.chatbox = document.getElementById( "chatbox" );
	page.chatboxText = document.getElementById( "chatbox_text" );
	page.chatboxEntry= document.getElementById( "chatbox_entry" );
	page.nickname = document.getElementById( "nickname" );
	page.nicknameInput = document.getElementById( "nickname_input" );
	page.joinInfo = document.getElementById( "joininfo" );
	page.joinInfoText = document.getElementById( "joininfo_text" );
	
	// Focus on username field
	page.nicknameInput.focus();
	
	page.nicknameInput.addEventListener('keypress',onNicknameEnter,false)
	page.chatboxEntry.addEventListener('keypress',onChatEnter,false)
	
	var client, player;
	
	
	// Respond to username entry
	function onNicknameEnter( keyEvent )
	{
		var nickname = this.value.trim();
		
		if ( keyEvent.keyCode != 13 ) return;
		if ( nickname.length == 0 ) return;
		
		this.blur();
		
		joinGame( nickname );
	}
	
	// Respond to chat message entry
	function onChatEnter( keyEvent )
	{
		
		var msg = this.value.trim();
		
		if ( keyEvent.keyCode != 13 ) return;
		this.blur();
		this.style.height = null;
		if ( msg.length == 0 ) return;
		
		client.sendMessage( msg );
		
		this.value = "";
	}
	
	// Join game
	function joinGame( nickname )
	{
		// Show join info
		page.nickname.style.visibility = "hidden";
		page.joinInfo.style.visibility = null;
		page.joinInfoText.innerHTML = "Connecting to server...";
		
		// Create client and attempt connection
		client = new Client( io );
		client.connect( "http://" + location.hostname + ":3000", nickname );
		
		// Update connection status
		client.on( "connect", function()
		{
			page.joinInfoText.innerHTML = "Receiving world...";
		} );
		
		// Initialise world
		client.on( "world", function( w )
		{
			page.joinInfoText.innerHTML = "Building chunks...";
			
			// Set up world
			world = w;
			
			// Set up renderer and build level chunks
			render = new Renderer( "renderSurface" );
			render.setWorld( world, 8 );
			render.setPerspective( 60, 0.01, 200 );
			
			// Build all world chunks
			render.buildChunks( 999 );
			
			page.joinInfoText.innerHTML = "Spawning...";
		} );
		
		// Spawn local player
		client.on( "spawn", function()
		{
			// Set up local player
			player = new Player();
			player.setWorld( world );
			player.setClient( client );
			player.setInputCanvas( "renderSurface" );
			player.setMaterialSelector( "materialSelector" );
			
			// Handle open chat on 't' event
			player.on( "openChat", function()
			{
				page.chatboxEntry.focus();
				page.chatbox.style.height = ( render.gl.viewportHeight - 145 ) + "px";
			} );
			
			// Open game view
			page.joinInfo.style.visibility = "hidden";
			page.renderSurface.style.visibility = null;
			page.materialSelector.style.display = null;
			page.chatbox.style.visibility = null;
			page.chatboxEntry.style.visibility = null;
			
			// Render loop
			var lastUpdate = +new Date() / 1000.0;
			
			requestAnimationFrame(function loop() {

						var time = +new Date() / 1000.0;

						// Update local player
						player.update();

						// Update networked player
						if ( time - lastUpdate > 0.033 ) {
							client.updatePlayer();
							lastUpdate = time;
						}

						// Build chunks
						render.buildChunks( 5 );

						// Draw world
						render.setCamera( player.getEyePos().toArray(), player.angles );
						render.draw();

						requestAnimationFrame(loop, page.renderSurface);

						//while ( new Date().getTime() / 1000 - time < 0.016 );
			}, page.renderSurface );
		} );
		
		// Display chat messages
		client.on( "chat", function( username, message )
		{
			page.chatboxText.innerHTML += "&lt;<span class='chatMessage' >" + username + "</span>&gt " + message + "<br />";
		} );
		
		client.on( "message", function( message )
		{
			page.chatboxText.innerHTML += "<span class='chatBroadcast'  >" + message + "</span><br />";
		} );
		
		// Handle kicking
		client.on( "kick", function( message )
		{
			page.joinInfo.style.visibility = null;
			page.renderSurface.style.visibility = "hidden";
			page.materialSelector.style.display = "none";
			page.chatbox.style.visibility = "hidden";
			page.chatboxEntry.style.visibility = "hidden";
			
			page.joinInfoText.innerHTML = "<span class='serverMessage' >Kicked:</span> " + message;
		} );
		
		// Handle being disconnected
		client.on( "disconnect", function( kicked )
		{
			if ( !kicked ) {
				page.joinInfo.style.visibility = null;
				page.renderSurface.style.visibility = "hidden";
				page.materialSelector.style.display = "none";
				page.chatbox.style.visibility = "hidden";
				page.chatboxEntry.style.visibility = "hidden";
				
				page.joinInfoText.innerHTML = "<span class='serverMessage'> Connection Problem:</span> Lost connection to server!";
			}
		} );
	}
},'false');

document.body.addEventListener('contextmenu',function(event){ 
		event.preventDefault(); 
		return false;
},false);
})(document,World,Renderer,Physics,Player);
