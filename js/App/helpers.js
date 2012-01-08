define('App/helpers',[],function(){
	console.log('helpers');
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
	
	// lineRectCollide( line, rect )
	//
	// Checks if an axis-aligned line and a bounding box overlap.
	// line = { y, x1, x2 } or line = { x, y1, y2 }
	// rect = { x, y, size }
	
	function lineRectCollide( line, rect )
	{
		if ( line.y != null )
			return rect.y > line.y - rect.size/2 && rect.y < line.y + rect.size/2 && rect.x > line.x1 - rect.size/2 && rect.x < line.x2 + rect.size/2;
		else
			return rect.x > line.x - rect.size/2 && rect.x < line.x + rect.size/2 && rect.y > line.y1 - rect.size/2 && rect.y < line.y2 + rect.size/2;
	}
	
	// rectRectCollide( r1, r2 )
	//
	// Checks if two rectangles (x1, y1, x2, y2) overlap.
	
	function rectRectCollide( r1, r2 )
	{
		if ( r2.x1 > r1.x1 && r2.x1 < r1.x2 && r2.y1 > r1.y1 && r2.y1 < r1.y2 ) return true;
		if ( r2.x2 > r1.x1 && r2.x2 < r1.x2 && r2.y1 > r1.y1 && r2.y1 < r1.y2 ) return true;
		if ( r2.x2 > r1.x1 && r2.x2 < r1.x2 && r2.y2 > r1.y1 && r2.y2 < r1.y2 ) return true;
		if ( r2.x1 > r1.x1 && r2.x1 < r1.x2 && r2.y2 > r1.y1 && r2.y2 < r1.y2 ) return true;
		return false;
	}
	
	function pushQuad( v, p1, p2, p3, p4 )
		{
			v.push( p1[0], p1[1], p1[2], p1[3], p1[4], p1[5], p1[6], p1[7], p1[8] );
			v.push( p2[0], p2[1], p2[2], p2[3], p2[4], p2[5], p2[6], p2[7], p2[8] );
			v.push( p3[0], p3[1], p3[2], p3[3], p3[4], p3[5], p3[6], p3[7], p3[8] );
			
			v.push( p3[0], p3[1], p3[2], p3[3], p3[4], p3[5], p3[6], p3[7], p3[8] );
			v.push( p4[0], p4[1], p4[2], p4[3], p4[4], p4[5], p4[6], p4[7], p4[8] );
			v.push( p1[0], p1[1], p1[2], p1[3], p1[4], p1[5], p1[6], p1[7], p1[8] );
		}
	
	return {
		'pushQuad': pushQuad,
		'rectRectCollide':rectRectCollide,
		'lineRectCollide':lineRectCollide,		
	};
});