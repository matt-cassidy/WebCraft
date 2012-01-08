define('App/vector',[],
function(){
	console.log('Vector')
	// ==========================================
	// Helpers
	//
	// This file contains helper classes and functions.
	// ==========================================
	
	// ==========================================
	// Vector class
	// ==========================================
	
	function Vector( x, y, z )
	{
		this.x = x;
		this.y = y;
		this.z = z;
	}
	
	Vector.prototype.add = function( vec )
	{
		return new Vector( this.x + vec.x, this.y + vec.y, this.z + vec.z );
	}
	
	Vector.prototype.sub = function( vec )
	{
		return new Vector( this.x - vec.x, this.y - vec.y, this.z - vec.z );
	}
	
	Vector.prototype.mul = function( n )
	{
		return new Vector( this.x*n, this.y*n, this.z*n );
	}
	
	Vector.prototype.length = function()
	{
		return Math.sqrt( this.x*this.x + this.y*this.y + this.z*this.z );
	}
	
	Vector.prototype.distance = function( vec )
	{
		return this.sub( vec ).length();
	}
	
	Vector.prototype.normal = function()
	{
		if ( this.x == 0 && this.y == 0 && this.z == 0 ) return new Vector( 0, 0, 0 );
		var l = this.length();
		return new Vector( this.x/l, this.y/l, this.z/l );
	}
	
	Vector.prototype.dot = function( vec )
	{
		return this.x * vec.x + this.y * vec.y + this.z * vec.z;
	}
	
	Vector.prototype.toArray = function()
	{
		return [ this.x, this.y, this.z ];
	}
	
	Vector.prototype.toString = function()
	{
		return "( " + this.x + ", " + this.y + ", " + this.z + " )";
	}
		
	// Export to node.js
	if ( typeof( exports ) != "undefined" )
	{
		exports.Vector = Vector;
	}
	
	return Vector;
});