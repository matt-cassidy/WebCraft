define('singlePlayer',['App/world','App/render','App/physics','App/player','poly/requestAnimationFrame'],
function(World,Renderer,Physics,Player,requestAnimationFrame){
	document.body.addEventListener('contextmenu',function(event){ 
			event.preventDefault(); 
			return false;
	},false)
	
	var renderCanvas = document.getElementById("renderSurface");
	
	// Create a new flat world
	var world = new World( 16, 16, 16 );
	world.createFlatWorld( 6 );
	
	// Set up renderer
	var render = new Renderer( "renderSurface" );
	render.setWorld( world, 8 );
	render.setPerspective( 60, 0.01, 200 );
	
	// Create physics simulator
	var physics = new Physics();
	physics.setWorld( world );
	
	// Create new local player
	var player = new Player();
	player.setWorld( world );
	player.setInputCanvas( "renderSurface" );
	player.setMaterialSelector( "materialSelector" );
	
	// Render loop			
	requestAnimationFrame( function loop()
	{
		var time = new Date().getTime() / 1000.0;
	
		// Simulate physics
		physics.simulate();
	
		// Update local player
		player.update();
	
		// Build a chunk
		render.buildChunks( 1 );
	
		// Draw world
		render.setCamera( player.getEyePos().toArray(), player.angles );
		render.draw();
	
		//while ( new Date().getTime() / 1000 - time < 0.016 );
		requestAnimationFrame(loop, renderCanvas);
	}, renderCanvas );
});
