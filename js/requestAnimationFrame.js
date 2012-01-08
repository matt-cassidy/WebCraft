/**
 * @author matthew
 */
define('requestAnimationFrame',[],function(){
	console.log('requestAnimation')
	return window.requestAnimationFrame || window.mozRequestAnimationFrame ||  
                        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame 
                        || function(func) {
                        	setTimeout(func, 16);
                        }	
})
